// 三导师 prompt builder —— 把 LearningContext 翻译成给 LLM 的 messages 数组。
// Harness #6: prompt 结构按"稳定前缀"组织,让 DeepSeek 自动 prefix caching 生效。
//
// v0.4.5 重大调整:删除所有字数硬上限校验。
// 质量校验改为结构性检查(卡帕西必须有钩子等),不查字数。
import type { LearningContext } from "@/lib/langgraph/state";
import type { MentorKey } from "@/types/mentor";
import { MENTOR_NAMES } from "@/types/mentor";
import {
  KARPATHY_SYSTEM_PROMPT,
  QIAN_SYSTEM_PROMPT,
  ADLER_SYSTEM_PROMPT,
  ADLER_EVIDENCE_CONFLICT_OPENING,
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
  // 顺序：[最静态] persona → [次静态] lesson → [次静态] profile + preferences → [动态] outputs + turn
  const systemContent = [
    MENTOR_PROMPTS[mentor],
    buildLessonSegment(ctx),
    buildUserProfileSegment(ctx),
    ctx.userPreferences || "",  // 学习偏好（v0.1.6 加入,可选）
    buildDynamicSegment(ctx),
  ].filter(Boolean).join("\n\n");

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

// ============= Harness #1: 输出校验规则 (v0.4.5 重构) =============
// 删除字数硬上限。改为「结构性质量检查」:
//   - 卡帕西: 必须留下让用户参与的钩子(包含 ? / ？ 或反问 / 邀请性短语)
//   - 钱学森: 必须落到具体下一步(包含「下一步」「先做」「接下来」「你来」等动作词)
//   - 阿德勒: 第一句必须是接住情绪,不能立刻谈学习任务
//
// 这些检查在 valid=false 时触发 buildRewriteRequest 让 LLM 重写。
// 不再有「字数超了就重写」。
export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

// 卡帕西的「参与钩子」检测:除了问号,还能用反问 / 邀请性语气结尾
function hasEngagementHook(content: string): boolean {
  if (content.includes("？") || content.includes("?")) return true;
  // 反问 / 邀请性短语
  const invitationCues = [
    "你看",
    "你试试",
    "你说",
    "你觉得",
    "你想想",
    "你怎么看",
    "看一下",
    "想一下",
    "你来",
    "再说说",
  ];
  return invitationCues.some((cue) => content.includes(cue));
}

// 钱学森的「下一步」检测:回复里要有具体动作
function hasActionableNext(content: string): boolean {
  const actionCues = [
    "下一步",
    "先做",
    "接下来",
    "你来",
    "你先",
    "试试",
    "写一个",
    "画一个",
    "列一个",
    "做一件",
  ];
  return actionCues.some((cue) => content.includes(cue));
}

// 阿德勒的「先接情绪」检测:首句不能直接谈任务/技术
function startsWithTaskTalk(content: string): boolean {
  const taskOpeners = [
    "你要",
    "我们要",
    "先把",
    "首先",
    "我们来",
    "开始",
    "学习",
    "理解",
  ];
  const firstSentence = content.split(/[。!?！？\n]/, 1)[0] || "";
  return taskOpeners.some((opener) => firstSentence.startsWith(opener));
}

export function validateMentorReply(
  mentor: MentorKey,
  content: string,
  _isFirstTurn: boolean = false
): ValidationResult {
  const trimmed = content.trim();

  // 全部 0 字 / 极短的 = 无效
  if (trimmed.length < 5) {
    return { valid: false, reason: "回复太短,几乎没有内容" };
  }

  // 卡帕西: 必须留参与钩子
  if (mentor === "karpathy" && !hasEngagementHook(trimmed)) {
    return {
      valid: false,
      reason: "卡帕西的回复必须留一个让用户参与的钩子(提问 / 反问 / 邀请)",
    };
  }

  // 钱学森: 后续轮必须有具体下一步(首轮锚定可以不需要)
  if (mentor === "qian" && !_isFirstTurn && !hasActionableNext(trimmed) && !hasEngagementHook(trimmed)) {
    return {
      valid: false,
      reason: "钱学森的回复要么给具体下一步,要么留参与钩子,不能两个都没有",
    };
  }

  // 阿德勒: 不能首句就谈学习任务
  if (mentor === "adler" && startsWithTaskTalk(trimmed)) {
    return {
      valid: false,
      reason: "阿德勒第一句应该是接住情绪 / 状态,不能立刻谈学习任务",
    };
  }

  return { valid: true };
}

// 重写指令: 当校验失败时用更明确的指令重写一次
export function buildRewriteRequest(
  mentor: MentorKey,
  originalReply: string,
  reason: string
): LLMMessage[] {
  return [
    { role: "assistant", content: originalReply },
    {
      role: "user",
      content: `[系统校验] 你刚才的回复:${reason}。请重新说一遍。${
        mentor === "karpathy"
          ? "记住:必须留一个让我参与的钩子(提问 / 反问 / 邀请)。质量优先,不限字数,但不要写废话。"
          : mentor === "qian"
          ? "记住:要么给具体下一步动作,要么留参与钩子。质量优先,不限字数,但要结构化清晰。"
          : "记住:第一句先接住我的情绪 / 状态,不要立刻谈学习任务。节奏慢一点,多用短句。"
      }只回新版本,不要解释。`,
    },
  ];
}

// v0.4.5 废弃:旧的 checkReplyLength API。
// 保留空壳函数避免外部 import 报错,但永远返回 valid 状态。
export function checkReplyLength(_mentor: MentorKey, reply: string): {
  withinLimit: boolean;
  softLimit: number;
  hardLimit: number;
  actualLength: number;
} {
  return {
    withinLimit: true,
    softLimit: Infinity,
    hardLimit: Infinity,
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
