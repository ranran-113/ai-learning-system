// 三导师 prompt builder —— 把 LearningContext 翻译成给 LLM 的 messages 数组。
// Harness #6: prompt 结构按"稳定前缀"组织,让 DeepSeek 自动 prefix caching 生效。
import type { LearningContext } from "@/lib/langgraph/state";
import type { MentorKey } from "@/types/mentor";
import { MENTOR_NAMES } from "@/types/mentor";
import {
  KARPATHY_SYSTEM_PROMPT,
  QIAN_SYSTEM_PROMPT,
  ADLER_SYSTEM_PROMPT,
  ADLER_EVIDENCE_CONFLICT_OPENING,
  MENTOR_REPLY_LIMITS,
  MENTOR_OPENING_LIMITS,
} from "@/lib/prompts/mentor-personas";
import type { LLMMessage } from "@/lib/llm/client";

const MENTOR_PROMPTS: Record<MentorKey, string> = {
  karpathy: KARPATHY_SYSTEM_PROMPT,
  qian: QIAN_SYSTEM_PROMPT,
  adler: ADLER_SYSTEM_PROMPT,
};

// 把课程信息构造成 system 段尾的"准静态"内容
// （在同一节课内不变,跨课时才变 —— prefix caching 友好）
function buildLessonSegment(ctx: LearningContext): string {
  const lesson = ctx.currentLesson;
  return `
=== 本节课内容 ===
- 标题: ${lesson.title}
- 目标等级: Lv.${lesson.targetLevelMin}-Lv.${lesson.targetLevelMax}
- 课程摘要: ${lesson.summary}
- 核心概念（每节只推进这几个）: ${lesson.keyConcepts.join(" / ")}
- 苏格拉底起点问题（可参考但不要逐字复读）:
${lesson.socraticQuestions.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}
- 本节最终输出任务: ${lesson.outputTask}
=== 课程内容结束 ===
`.trim();
}

// 用户画像（在整个学习周期内变化很少 —— prefix caching 友好）
function buildUserProfileSegment(ctx: LearningContext): string {
  const tr = ctx.testResult;
  return `
=== 用户画像 ===
- 学习人格类型: ${tr.learningProfile.type}
- 当前 AI 能力等级: Lv.${tr.aiLevel.level} (${tr.aiLevel.levelName})
- 主要卡点: ${tr.currentBlocker}
- 推荐节奏: ${tr.paceRecommendation}
=== 用户画像结束 ===
`.trim();
}

// 动态段：每轮都可能变（输出沉淀历史、本会话轮数）—— 放最后，不影响前缀缓存
function buildDynamicSegment(ctx: LearningContext): string {
  const outputDigest = ctx.outputHistory.length === 0
    ? "（暂无）"
    : ctx.outputHistory
        .slice(-5)
        .map((o) => `- [${o.lessonId} · ${o.type}] ${o.content}`)
        .join("\n");

  return `
=== 当轮动态信息 ===
- 用户最近 5 条输出沉淀:
${outputDigest}
- 本会话已经进行的轮数: ${ctx.messages.length}（你是这一轮的回应者）
=== 动态信息结束 ===
`.trim();
}

export function buildLLMMessages(
  mentor: MentorKey,
  ctx: LearningContext
): LLMMessage[] {
  // === Prompt caching 友好的结构 ===
  // 顺序：[最静态] persona → [次静态] lesson → [次静态] profile → [动态] outputs + turn
  // DeepSeek 自动缓存最长公共前缀。同一会话内,persona + lesson 不变,会被命中。
  const systemContent = [
    MENTOR_PROMPTS[mentor],
    buildLessonSegment(ctx),
    buildUserProfileSegment(ctx),
    buildDynamicSegment(ctx),
  ].join("\n\n");

  const messages: LLMMessage[] = [
    { role: "system", content: systemContent },
  ];

  // 历史消息
  for (const msg of ctx.messages) {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content });
    } else {
      const speakerName = msg.mentor ? MENTOR_NAMES[msg.mentor] : "导师";
      const prefix = msg.mentor && msg.mentor !== mentor ? `[${speakerName} 上一轮说]:\n` : "";
      messages.push({ role: "assistant", content: `${prefix}${msg.content}` });
    }
  }

  return messages;
}

// ============= Harness #1: 输出校验规则 =============
export type ValidationResult = {
  valid: boolean;
  reason?: string;
  hardLimit: number;
};

// 注：第一轮（含 5E 锚定段）用 MENTOR_OPENING_LIMITS,后续用 MENTOR_REPLY_LIMITS
export function validateMentorReply(
  mentor: MentorKey,
  content: string,
  isFirstTurn: boolean = false
): ValidationResult {
  const limits = isFirstTurn ? MENTOR_OPENING_LIMITS[mentor] : MENTOR_REPLY_LIMITS[mentor];
  const len = content.length;

  // 字数硬上限
  if (len > limits.hard) {
    return {
      valid: false,
      reason: `回复 ${len} 字超过${isFirstTurn ? "开场" : "硬"}上限 ${limits.hard} 字`,
      hardLimit: limits.hard,
    };
  }

  // 卡帕西必须提问
  if (mentor === "karpathy" && !content.includes("？") && !content.includes("?")) {
    return {
      valid: false,
      reason: "卡帕西的回复必须包含一个问题",
      hardLimit: limits.hard,
    };
  }

  return { valid: true, hardLimit: limits.hard };
}

// 重写指令：让 LLM 用更紧的约束重写一次
export function buildRewriteRequest(
  mentor: MentorKey,
  originalReply: string,
  reason: string
): LLMMessage[] {
  const limits = MENTOR_REPLY_LIMITS[mentor];
  return [
    { role: "assistant", content: originalReply },
    {
      role: "user",
      content: `[系统校验] 你刚才的回复${reason}。请用更符合规则的方式重新说一遍：${
        mentor === "karpathy"
          ? `≤ ${limits.soft} 字,必须包含一个问题。`
          : mentor === "qian"
          ? `≤ ${limits.soft} 字,要落到「你下一步具体做什么」。`
          : `${limits.soft} 字内,先接情绪再说事。`
      }只回新版本,不要解释。`,
    },
  ];
}

// 兼容老 API
export function checkReplyLength(mentor: MentorKey, reply: string): {
  withinLimit: boolean;
  softLimit: number;
  hardLimit: number;
  actualLength: number;
} {
  const limits = MENTOR_REPLY_LIMITS[mentor];
  return {
    withinLimit: reply.length <= limits.hard,
    softLimit: limits.soft,
    hardLimit: limits.hard,
    actualLength: reply.length,
  };
}

// 5E 教学法的开场：锚定段 (Engage) + 第一个苏格拉底问题 (Explore 入口)
export function buildOpeningMessage(
  mentor: MentorKey,
  ctx: LearningContext
): string {
  // 特殊场景：evidenceConflict 首次会话由阿德勒接,跳过锚定
  if (ctx.isFirstTurnOfSession && ctx.testResult.aiLevel.evidenceConflict && mentor === "adler") {
    return ADLER_EVIDENCE_CONFLICT_OPENING;
  }

  const lesson = ctx.currentLesson;
  const firstQ = lesson.socraticQuestions[0];
  // 取课程摘要作为锚定主体（已经写得很简洁）
  const anchor = lesson.summary;
  // 等级跨段提示
  const levelHint = `（Lv.${lesson.targetLevelMin}-${lesson.targetLevelMax} 跨度,你现在 Lv.${ctx.testResult.aiLevel.level}）`;

  if (mentor === "adler") {
    // 阿德勒不走纯 5E,先接情绪
    return `开始之前——你今天状态怎么样？\n\n如果还行,我们一起看：${anchor}\n\n先问你一个：${firstQ}`;
  }

  if (mentor === "qian") {
    // 钱学森：锚定 = 这一节在系统里的位置 + 目标
    return `这一节要弄清楚的：${anchor}\n\n它在你成长地图上的位置：${levelHint}\n\n先确认下：${firstQ}`;
  }

  // 卡帕西：锚定 = 今天要拆穿的具体疑惑 + 它为什么重要
  return `今天我们要拆穿的：${anchor}\n\n${levelHint}\n\n先问你一个具体的：${firstQ}`;
}
