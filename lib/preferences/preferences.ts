// 学习偏好 —— 轻量版用户 Skills。
// 这些偏好会注入 LearningContext,在 mentor system prompt 里被引用,影响导师怎么跟用户对话。
import { lsGet, lsSet } from "@/lib/utils";

export const PREFERENCES_LS_KEY = "als:learning-preferences";

export type LearningStyle = "example_first" | "abstract_first" | "balanced";
export type ExplanationDepth = "minimal" | "balanced" | "deep";
export type EncouragementLevel = "minimal" | "balanced" | "warm";

export type LearningPreferences = {
  // 学新概念时:先看具体例子还是先听抽象框架?
  learningStyle: LearningStyle;

  // 导师讲解的深度:精简到位 / 平衡 / 深挖细节
  explanationDepth: ExplanationDepth;

  // 鼓励 / 温度:克制专业 / 平衡 / 温暖陪伴
  encouragementLevel: EncouragementLevel;

  // 用户自定义的额外指令（自由文本,塞进 mentor prompt）
  customInstructions: string;

  updatedAt?: string;
};

export const DEFAULT_PREFERENCES: LearningPreferences = {
  learningStyle: "balanced",
  explanationDepth: "balanced",
  encouragementLevel: "balanced",
  customInstructions: "",
};

export function getLearningPreferences(): LearningPreferences {
  return lsGet<LearningPreferences>(PREFERENCES_LS_KEY) || DEFAULT_PREFERENCES;
}

export function saveLearningPreferences(prefs: LearningPreferences): void {
  lsSet(PREFERENCES_LS_KEY, { ...prefs, updatedAt: new Date().toISOString() });
}

// 把偏好渲染成 mentor system prompt 可读的片段
export function preferencesToPromptSegment(prefs: LearningPreferences): string {
  const lines: string[] = ["=== 用户学习偏好（请遵守） ==="];

  if (prefs.learningStyle === "example_first") {
    lines.push("- 学新概念时,**先给一个具体例子或类比,再讲抽象**。用户喜欢从具象进入。");
  } else if (prefs.learningStyle === "abstract_first") {
    lines.push("- 学新概念时,**先给抽象框架或定义,再举例**。用户喜欢从结构进入。");
  }

  if (prefs.explanationDepth === "minimal") {
    lines.push("- 讲解尽量精简,只点核心。用户不喜欢被讲细节淹没。");
  } else if (prefs.explanationDepth === "deep") {
    lines.push("- 讲解可以深挖细节、推导、边界条件。用户希望弄透。");
  }

  if (prefs.encouragementLevel === "minimal") {
    lines.push("- 不需要鼓励 / 共情 / 调节情绪。直接、克制、专业即可。");
  } else if (prefs.encouragementLevel === "warm") {
    lines.push("- 用户喜欢温暖陪伴感。每隔几轮可以给一个简短的认可（不夸张）。");
  }

  if (prefs.customInstructions.trim()) {
    lines.push("- 用户额外指令:");
    lines.push(prefs.customInstructions.trim().split("\n").map(l => "  " + l).join("\n"));
  }

  if (lines.length === 1) return ""; // 全默认时不输出段
  lines.push("=== 偏好结束 ===");
  return lines.join("\n");
}
