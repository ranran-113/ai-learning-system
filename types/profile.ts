// 学习人格画像 + AI 等级类型。详见 TECH.md §19-20 + QUESTIONS.md。

export type ProfileType =
  | "信息过载型"
  | "完美主义自责型"
  | "断更型"
  | "稳定成长型";

export type PacePreference =
  | "daily_micro"
  | "weekly_medium"
  | "weekend_burst"
  | "interest_driven"
  | "uncertain";

export type BlockerType =
  | "information_overload"
  | "knowledge_application"
  | "persistence"
  | "output_fear"
  | "anxiety"
  | "motivation";

export type SourceType = "built_in_course" | "material" | "hot_item" | "mixed";

export type ProfileDimensions = {
  anxiety: number;
  selfBlame: number;
  outputWillingness: number;
  persistence: number;
  pacePreference: PacePreference;
};

export type LearningProfile = {
  type: ProfileType;
  dimensions: ProfileDimensions;
};

// AI 等级评分结果（TECH.md §19）
export type LevelResult = {
  level: number;                    // 0-10
  levelName: string;                // "AI 控制者"
  confidence: number;               // 0..1
  rangeMin: number;
  rangeMax: number;
  centerOfMass: number;
  evidenceProfile: Record<number, number>;
  nextLevelTarget: {
    level: number;
    levelName: string;
    requiredCapability: string;
  };
  evidenceConflict?: boolean;
  conflictPairs?: Array<{ low: string; high: string }>;
  suspiciousAnswer?: boolean;
};

export type TestResult = {
  learningProfile: LearningProfile;
  aiLevel: LevelResult;
  currentBlocker: BlockerType;
  recommendedPath: string;
  preferredSourceType: SourceType;
  mentorMix: { karpathy: number; qian: number; adler: number };
  paceRecommendation: string;
  nextAction: string;
  answeredAt: string;
  durationSeconds: number;
};

// 等级名映射（来自 PRD.md §8.1）
export const LEVEL_NAMES: Record<number, string> = {
  0: "AI 旁观者",
  1: "AI 初用者",
  2: "AI 对话者",
  3: "AI 控制者",
  4: "AI 跨场景使用者",
  5: "AI 工作流搭建者",
  6: "AI Agent 使用者",
  7: "AI Agent 设计者",
  8: "AI 产品创造者",
  9: "AI 原生工作者",
  10: "个人 AI 系统构建者",
};

// 下一等级要解锁的能力（结果页用）
export const LEVEL_NEXT_CAPABILITY: Record<number, string> = {
  0: "开始让 AI 帮你写一封邮件、总结一篇文章",
  1: "学会追问 AI，给它充足背景信息",
  2: "学会写带格式、语气、范围要求的结构化 Prompt",
  3: "开始在 ≥ 3 类不同任务里用 AI（写作、调研、产品、设计…）",
  4: "把重复任务沉淀成「模板 + 资料库 + 固定流程」",
  5: "开始使用 Claude Code / Cursor / Agent 工具让 AI 多步执行",
  6: "自己设计 Agent / Skill / 项目规则 / 自动化流程",
  7: "用 AI 做出一个真实可用的产品或作品",
  8: "让 AI 默认融入你每天的工作流",
  9: "形成你自己的 AI 方法论、工具链与个人 AI 系统",
  10: "继续迭代你的体系，并开始把它分享出去",
};
