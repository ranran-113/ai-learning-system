// LearningContext —— 三导师共享的全量上下文。
// 详见 TECH.md §8.1 + MENTORS.md §2。
//
// 注：MVP 阶段未使用 LangGraph 框架本身，用纯 TypeScript 实现等价的流程。
// 文件路径保留 lib/langgraph/ 是为了和 TECH.md 文档一致，后续如需引入 LangGraph 可平迁。
import type { BuiltInLesson } from "@/types/lesson";
import type { MentorKey } from "@/types/mentor";
import type { TestResult } from "@/types/profile";

// 对话消息（用户 + 导师）
export type ChatMessage = {
  id: string;                  // 唯一 id（用于 React key 和后续编辑/删除）
  role: "user" | "mentor";
  mentor?: MentorKey;          // role=mentor 时填
  content: string;
  createdAt: string;
};

// 用户的输出沉淀
export type OutputRecord = {
  id: string;
  lessonId: string;
  type: "one_sentence" | "note" | "prompt" | "social_post" | "speech_summary";
  content: string;
  createdAt: string;
};

// 一次学习会话
export type LearningSession = {
  id: string;
  lessonId: string;
  startedAt: string;
  endedAt?: string;
  messages: ChatMessage[];
  outputs: OutputRecord[];
  activeMentor: MentorKey;     // 当前轮次的导师
  mentorTurnCount: number;     // 当前导师已连续发言轮数（路由连续性用）
};

// 全量上下文 —— 服务端每轮路由和生成都基于这个
export type LearningContext = {
  testResult: TestResult;             // 用户画像 + 等级 + 卡点
  currentLesson: BuiltInLesson;       // 本节课内容
  messages: ChatMessage[];            // 本会话完整对话历史
  outputHistory: OutputRecord[];      // 用户全部历史输出沉淀（跨会话）
  activeMentor: MentorKey;            // 上一轮的导师
  mentorTurnCount: number;            // 当前导师已连续发言轮数
  isFirstTurnOfSession: boolean;      // 是否本会话第一轮
};

// localStorage key 命名
export const SESSION_LS_KEYS = {
  CURRENT_SESSION: "als:current-session",
  OUTPUT_HISTORY: "als:output-history",
  LEARNING_SESSIONS: "als:learning-sessions",  // 所有会话归档
} as const;
