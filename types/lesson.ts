// MVP 12 节微课类型定义。详见 LESSONS.md。
import type { MentorKey } from "./mentor";

export type LessonCategory = "aipm" | "ai_tech" | "ai_level" | "paper" | "hot";

export type ExtensionRoadmapItem = {
  title: string;
  status: "phase_2_planned" | "phase_2_in_progress" | "released";
  releasedLessonId?: string;
};

export type BuiltInLesson = {
  id: string;                                // "L1" - "L12"
  courseId: string;
  title: string;
  category: LessonCategory;
  targetLevelMin: number;
  targetLevelMax: number;
  defaultMentor: MentorKey | MentorKey[];
  summary: string;
  keyConcepts: string[];
  socraticQuestions: string[];
  outputTask: string;

  // 延伸架构（MVP 埋钩子,Phase 2 启用）
  extendsConceptId?: string;
  nextRecommendedLessonIds?: string[];
  extensionRoadmap: ExtensionRoadmapItem[];

  // v0.2 教材模式:章节正文内容（markdown）。互动课没有此字段
  tutorialContent?: string;
};
