// 教材数据类型 —— 两本 v0.2 教材的内容承载
import type { MentorKey } from "@/types/mentor";

export type TextbookId = "ai" | "aipm";

// 章节大纲（registry 中静态定义，用于生成 prompt + UI 索引）
export type ChapterOutline = {
  id: string;                  // c01, c02, ...
  bookId: TextbookId;
  index: number;               // 1-16
  part: string;                // "Part I · 看清 AI 这件事"
  title: string;
  shortTitle?: string;         // 侧边目录用简称
  description: string;         // 一句话说本章弄清楚什么
  detailedOutline: string;     // 详细大纲（多段,LLM 生成时用）
  linkedLessonId?: string;     // 对应的 12 节互动课（如果有）
  targetLevelMin: number;
  targetLevelMax: number;
  recommendedMentor: MentorKey;
};

// 章节正文 + 互动配置（v0 由 LLM 生成,后续 v1/v2 由用户审）
export type ChapterContent = {
  id: string;
  bookId: TextbookId;
  title: string;
  markdown: string;             // 教程正文
  version: "v0_draft" | "v0_self" | "v1_user_edited" | "v2_locked";
  generatedAt: string;

  // 互动配置（用于对话模式）
  keyConcepts: string[];
  socraticQuestions: string[];
  outputTask: string;
  defaultMentor: MentorKey;
};

export type Textbook = {
  id: TextbookId;
  title: string;
  subtitle: string;
  audience: string;
  totalChapters: number;
  styleGuide: string;
};
