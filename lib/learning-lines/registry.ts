// 4 大学习线 registry —— v2.0 框架的核心元数据
// 学习线 = 用户的学习方向。每个用户根据等级和兴趣选一条或多条主线推进。
//
// 学习线和教材的关系:
// - "ai" 线 = AI 通识教材 16 章(已完成 v0.3.0)
// - "aipm" 线 = AIPM 教材 16 章(已完成 v0.3.0)
// - "tools" 线 = AI 工具教材(Claude Code 8 节,v0.5 写)
// - "aipm-job" 线 = AIPM 求职(简历 / 模拟面试 / 入职,v0.5 写)

import type { TextbookId } from "@/lib/textbooks/types";

export type LearningLineId = "ai" | "aipm" | "tools" | "aipm-job";

export type LearningLine = {
  id: LearningLineId;
  // 显示信息
  title: string;          // 卡片标题
  subtitle: string;       // 一行副标题
  emoji: string;          // 卡片图标
  oneLineGoal: string;    // 「这条线带你...」一句话目标

  // 入口定位
  audience: string;       // 适合谁
  entryPoint: string;     // 入口入口入口 (小白入口 / 转岗入口 ...)

  // 内容关联
  textbookId?: TextbookId;   // 关联的教材 id(ai / aipm 才有,tools / aipm-job 是独立内容)
  toolsChapters?: string[];  // tools 线特有:8 节列表 (t01-t08)
  jobModules?: string[];     // aipm-job 线特有:resume / interview / onboarding

  // 状态
  status: "ready" | "coming-soon"; // ready = 有内容可用,coming-soon = 还在写
  recommendedForLevel: { min: number; max: number };  // 推荐什么等级用户
};

export const LEARNING_LINES: Record<LearningLineId, LearningLine> = {
  ai: {
    id: "ai",
    title: "AI 通识",
    subtitle: "看懂 AI 这件事",
    emoji: "🧠",
    oneLineGoal: "从 0 看穿 AI,到 Lv.10 个人 AI 系统构建者",
    audience: "AI 小白 / AI 爱好者 / 所有想真正理解 AI 的人",
    entryPoint: "小白入口",
    textbookId: "ai",
    status: "ready",
    recommendedForLevel: { min: 0, max: 10 },
  },
  aipm: {
    id: "aipm",
    title: "AIPM",
    subtitle: "做 AI 产品",
    emoji: "💼",
    oneLineGoal: "从理解 AI 产品到能定义新品类的 AIPM",
    audience: "AIPM / 想转 AIPM / 做 AI 产品的工程师设计师",
    entryPoint: "转岗入口",
    textbookId: "aipm",
    status: "ready",
    recommendedForLevel: { min: 2, max: 10 },
  },
  tools: {
    id: "tools",
    title: "AI 工具",
    subtitle: "真正会用 Claude Code 等",
    emoji: "🛠",
    oneLineGoal: "让你真正会用 AI 工具,不停留在「听说过」",
    audience: "想动手用 AI 工具的所有人",
    entryPoint: "工具入口",
    toolsChapters: ["t01", "t02", "t03", "t04", "t05", "t06", "t07", "t08"],
    status: "coming-soon", // v0.5 写
    recommendedForLevel: { min: 0, max: 8 },
  },
  "aipm-job": {
    id: "aipm-job",
    title: "AIPM 求职",
    subtitle: "简历 + 面试 + 入职",
    emoji: "🎯",
    oneLineGoal: "让想做 AIPM 的人真正能上岗",
    audience: "想转 AIPM / 求职中的 AIPM",
    entryPoint: "求职入口",
    jobModules: ["resume", "interview", "onboarding"],
    status: "coming-soon", // v0.5 写
    recommendedForLevel: { min: 3, max: 9 },
  },
};

export function getLine(id: LearningLineId): LearningLine {
  return LEARNING_LINES[id];
}

export function getAllLines(): LearningLine[] {
  return Object.values(LEARNING_LINES);
}

// 根据用户等级推荐学习线(简单规则,后续 Step 5 升级)
export function recommendLines(userLevel: number): LearningLineId[] {
  if (userLevel <= 2) return ["ai"];                      // 小白先打基础
  if (userLevel <= 4) return ["ai", "aipm", "tools"];     // 中段全方位
  return ["aipm", "tools", "aipm-job", "ai"];             // 老手优先深入
}
