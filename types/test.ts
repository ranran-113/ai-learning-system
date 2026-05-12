// 联合测试题目类型定义。详见 TECH.md §20 + QUESTIONS.md。
import type {
  PacePreference,
  BlockerType,
  SourceType,
  ProfileDimensions,
} from "./profile";

export type LevelIndicator = {
  level: number;
  weight: number;
};

export type ProfileDimensionKey = keyof Omit<ProfileDimensions, "pacePreference">;

export type ProfileDimensionImpact = {
  dimension: ProfileDimensionKey;
  delta: number;
};

export type TestOption = {
  id: string;
  text: string;
  levelIndicators?: LevelIndicator[];
  profileImpacts?: ProfileDimensionImpact[];
  paceValue?: PacePreference;
  pathRecommendation?: string;
  sourceTypePreference?: SourceType;
  blockerValue?: BlockerType;
};

export type QuestionCategory = "profile" | "level" | "path" | "blocker";

export type TestQuestion = {
  id: string;
  questionType: "single" | "multiple";
  questionCategory: QuestionCategory;
  text: string;
  options: TestOption[];
  designIntent?: string;
};

// 用户答案：题 id → 选中的 option id 数组（单选数组长度 = 1，多选 >= 0）
export type TestAnswer = {
  questionId: string;
  selectedOptionIds: string[];
};

export type TestAnswersMap = Record<string, string[]>;
