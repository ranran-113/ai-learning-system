// 三导师 prompt builder —— 把 LearningContext 翻译成给 LLM 的 messages 数组。
import type { LearningContext } from "@/lib/langgraph/state";
import type { MentorKey } from "@/types/mentor";
import { MENTOR_NAMES } from "@/types/mentor";
import {
  KARPATHY_SYSTEM_PROMPT,
  QIAN_SYSTEM_PROMPT,
  ADLER_SYSTEM_PROMPT,
  ADLER_EVIDENCE_CONFLICT_OPENING,
  MENTOR_REPLY_LIMITS,
} from "@/lib/prompts/mentor-personas";
import type { LLMMessage } from "@/lib/llm/client";

const MENTOR_PROMPTS: Record<MentorKey, string> = {
  karpathy: KARPATHY_SYSTEM_PROMPT,
  qian: QIAN_SYSTEM_PROMPT,
  adler: ADLER_SYSTEM_PROMPT,
};

// 把全量上下文构建成 system prompt 末尾的"运行时上下文段"
function buildContextSegment(ctx: LearningContext): string {
  const tr = ctx.testResult;
  const lesson = ctx.currentLesson;

  const outputDigest = ctx.outputHistory.length === 0
    ? "（暂无）"
    : ctx.outputHistory
        .slice(-5) // 最近 5 条
        .map((o) => `- [${o.lessonId} · ${o.type}] ${o.content}`)
        .join("\n");

  return `
=== 当前学习上下文（你必须基于此回应） ===

[用户画像]
- 学习人格类型: ${tr.learningProfile.type}
- 当前 AI 能力等级: Lv.${tr.aiLevel.level} (${tr.aiLevel.levelName})
- 主要卡点: ${tr.currentBlocker}
- 推荐节奏: ${tr.paceRecommendation}

[本节课]
- 标题: ${lesson.title}
- 目标等级: Lv.${lesson.targetLevelMin}-Lv.${lesson.targetLevelMax}
- 课程摘要: ${lesson.summary}
- 核心概念（每节只推进这几个）: ${lesson.keyConcepts.join(" / ")}
- 苏格拉底起点问题（可参考但不要逐字复读）:
${lesson.socraticQuestions.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}
- 本节最终输出任务: ${lesson.outputTask}

[用户最近 5 条输出沉淀]
${outputDigest}

[本会话已有的轮数]
${ctx.messages.length} 轮（你是这一轮的回应者）

=== 上下文段结束 ===
`.trim();
}

// 主函数：根据当前 mentor + ctx 构建 LLM messages
export function buildLLMMessages(
  mentor: MentorKey,
  ctx: LearningContext
): LLMMessage[] {
  const systemPrompt = MENTOR_PROMPTS[mentor];
  const contextSegment = buildContextSegment(ctx);

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n${contextSegment}`,
    },
  ];

  // 把对话历史平铺成 user/assistant turn
  for (const msg of ctx.messages) {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content });
    } else {
      const speakerName = msg.mentor ? MENTOR_NAMES[msg.mentor] : "导师";
      // 把上一位导师的发言作为 assistant，但加上 [前置导师标记] 让当前导师知道接力
      const prefix = msg.mentor && msg.mentor !== mentor ? `[${speakerName} 上一轮说]:\n` : "";
      messages.push({ role: "assistant", content: `${prefix}${msg.content}` });
    }
  }

  return messages;
}

// 字数检查：如果导师回复超出 hard limit，添加截断标记
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

// 生成第一轮开场（不调用 LLM,本地构造）
export function buildOpeningMessage(
  mentor: MentorKey,
  ctx: LearningContext
): string {
  // 特殊场景：evidenceConflict 首次会话
  if (ctx.isFirstTurnOfSession && ctx.testResult.aiLevel.evidenceConflict && mentor === "adler") {
    return ADLER_EVIDENCE_CONFLICT_OPENING;
  }

  // 默认：用课程的第一个苏格拉底问题作为开场
  const lesson = ctx.currentLesson;
  const firstQ = lesson.socraticQuestions[0];

  // 不同导师有不同开场风格
  if (mentor === "adler") {
    return `开始之前——你今天状态怎么样？\n\n如果还行，我们一起看一个问题：${firstQ}`;
  }
  if (mentor === "qian") {
    return `这一节我们要弄清楚的：${lesson.title}。\n\n先问你一个：${firstQ}`;
  }
  // karpathy 默认
  return firstQ;
}
