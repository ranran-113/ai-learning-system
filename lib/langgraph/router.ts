// route_mentor —— 系统决定每轮由谁回应。详见 MENTORS.md §6 + TECH.md §8.3。
import type { MentorKey } from "@/types/mentor";
import type { LearningContext } from "./state";

// 阿德勒触发关键词（情绪信号）
const ADLER_KEYWORDS = [
  "累", "不想", "学不下去", "太差", "放弃", "焦虑", "压力",
  "跟不上", "糟糕", "算了", "还是不会", "好难", "搞不懂", "不会",
  "崩溃", "绝望", "想哭", "没用", "蠢", "笨",
];

// 钱学森触发关键词（落地 / 系统类）
const QIAN_KEYWORDS = [
  "做", "搭", "设计", "怎么开始", "怎么落地", "下一步",
  "项目", "产品", "PRD", "Agent", "工作流", "拆解", "路径",
  "应该选哪个", "决策", "评估",
];

export type RouteDecision = {
  mentor: MentorKey;
  reason: string;          // 路由原因（debug 用）
};

export function routeMentor(ctx: LearningContext, latestUserMessage: string): RouteDecision {
  const text = latestUserMessage.toLowerCase();

  // 优先级 0：首次会话且 evidenceConflict → 阿德勒（一次性）
  if (
    ctx.isFirstTurnOfSession &&
    ctx.testResult.aiLevel.evidenceConflict
  ) {
    return {
      mentor: "adler",
      reason: "evidenceConflict_first_turn",
    };
  }

  // 优先级 1：阿德勒（情绪信号即时切）
  const hitAdler = ADLER_KEYWORDS.some((k) => latestUserMessage.includes(k));
  if (hitAdler) {
    return { mentor: "adler", reason: "emotion_signal" };
  }

  // 连续性保护：当前导师 < 2 轮，且没有强信号，继续保持
  if (ctx.activeMentor && ctx.mentorTurnCount < 2 && ctx.mentorTurnCount > 0) {
    return {
      mentor: ctx.activeMentor,
      reason: `continuity (turn ${ctx.mentorTurnCount + 1})`,
    };
  }

  // 优先级 2：钱学森（落地 / 系统类）
  const hitQian = QIAN_KEYWORDS.some((k) => latestUserMessage.includes(k));
  if (hitQian) return { mentor: "qian", reason: "action_signal" };

  // 优先级 3：卡帕西（默认，技术 / 概念）
  // 也参考当前课程的默认导师
  const lesson = ctx.currentLesson;
  const defaultMentor = Array.isArray(lesson.defaultMentor)
    ? lesson.defaultMentor[0]
    : lesson.defaultMentor;

  // 第一轮，没有具体信号 → 用课程默认导师
  if (ctx.messages.length <= 1) {
    return { mentor: defaultMentor, reason: "lesson_default_first_turn" };
  }

  // 按学习内容类别兜底
  if (lesson.category === "aipm" || lesson.category === "ai_level" && lesson.targetLevelMin >= 4) {
    return { mentor: "qian", reason: "category_aipm_fallback" };
  }

  return { mentor: "karpathy", reason: "default_karpathy" };
}
