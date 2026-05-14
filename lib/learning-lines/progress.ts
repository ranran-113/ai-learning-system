// 学习线进度计算 —— 每章 4 动作完成状态汇总成线进度
//
// 4 动作: read / chat / note / feynman
// 章完成度 = 4 动作有 ≥1 个完成
// 章「真懂」 = 4 动作全部完成
// 线进度 = 章完成数 / 总章数

import { lsGet } from "@/lib/utils";
import { SESSION_LS_KEYS } from "@/lib/langgraph/state";
import type { LearningSession, OutputRecord } from "@/lib/langgraph/state";
import { AI_CHAPTERS, AIPM_CHAPTERS } from "@/lib/textbooks/registry";
import type { ChapterOutline } from "@/lib/textbooks/types";
import { LEARNING_LINES, type LearningLineId } from "./registry";

// 4 动作完成状态(单章)
export type ChapterActions = {
  read: boolean;       // 是否读过(简化:有读完事件 / 有 chat 历史关联)
  chat: boolean;       // 是否聊过(本章 lessonId 有 session)
  note: boolean;       // 是否沉淀过(本章 lessonId 有 OutputRecord)
  feynman: boolean;    // 是否做过费曼挑战(feynman 类型 record 关联本章)
};

export type ChapterProgress = {
  chapterId: string;        // c01, c02, ...
  bookId: string;           // ai, aipm
  title: string;
  actions: ChapterActions;
  completedActionCount: number;  // 0-4
  isStarted: boolean;            // ≥1 动作完成
  isFullyUnderstood: boolean;    // 全部 4 动作完成
};

export type LineProgress = {
  lineId: LearningLineId;
  totalChapters: number;
  startedChapters: number;
  fullyUnderstoodChapters: number;
  percentage: number;       // 0-100,按 startedChapters 计算(给用户感)
  nextRecommendedChapter?: ChapterProgress;
};

// 已存的所有 sessions(归档 + 当前)
function getAllSessions(): LearningSession[] {
  const archived = lsGet<LearningSession[]>(SESSION_LS_KEYS.LEARNING_SESSIONS) || [];
  const current = lsGet<LearningSession>(SESSION_LS_KEYS.CURRENT_SESSION);
  return current ? [...archived, current] : archived;
}

function getOutputs(): OutputRecord[] {
  return lsGet<OutputRecord[]>(SESSION_LS_KEYS.OUTPUT_HISTORY) || [];
}

// 教材章节 → lessonId 的映射约定:
// 教材章节 id 形如 "c05",对应的 lesson id 是 "{bookId}-{chapterId}",
// 例如 AI 通识 C5 = "ai-c05",AIPM C5 = "aipm-c05"
// 这个 lesson id 在 /learn?source=textbook 时已经在用(见 app/learn/page.tsx)
export function chapterLessonId(bookId: string, chapterId: string): string {
  return `${bookId}-${chapterId}`;
}

export function computeChapterActions(
  bookId: string,
  chapterId: string,
  sessions: LearningSession[],
  outputs: OutputRecord[]
): ChapterActions {
  const lessonId = chapterLessonId(bookId, chapterId);
  // 兼容老的 lessonId 格式(直接是 L1 / c01 等)
  const altLessonId = chapterId;

  const sessionsForChapter = sessions.filter(
    (s) => s.lessonId === lessonId || s.lessonId === altLessonId
  );
  const outputsForChapter = outputs.filter(
    (o) => o.lessonId === lessonId || o.lessonId === altLessonId
  );

  // read: 假设进过章节就算 read。本字段在 Step 1 简化判断:有任意 session 或 output 即视为读过。
  //       未来 Step 1 末尾可以在阅读页打一个 read event,精确化。
  const read = sessionsForChapter.length > 0 || outputsForChapter.length > 0;

  // chat: 有任意 session 且 session 有 mentor 回复
  const chat = sessionsForChapter.some(
    (s) => s.messages && s.messages.some((m) => m.role === "mentor")
  );

  // note: 有任意 OutputRecord(除 feynman 外都算沉淀笔记)
  const note = outputsForChapter.some((o) => o.type !== "feynman");

  // feynman: 有 type=feynman 的 record
  const feynman = outputsForChapter.some((o) => o.type === ("feynman" as const));

  return { read, chat, note, feynman };
}

export function computeChapterProgress(
  chapter: ChapterOutline,
  sessions: LearningSession[],
  outputs: OutputRecord[]
): ChapterProgress {
  const actions = computeChapterActions(chapter.bookId, chapter.id, sessions, outputs);
  const completedActionCount =
    (actions.read ? 1 : 0) + (actions.chat ? 1 : 0) + (actions.note ? 1 : 0) + (actions.feynman ? 1 : 0);
  return {
    chapterId: chapter.id,
    bookId: chapter.bookId,
    title: chapter.title,
    actions,
    completedActionCount,
    isStarted: completedActionCount > 0,
    isFullyUnderstood: completedActionCount === 4,
  };
}

export function computeLineProgress(lineId: LearningLineId): LineProgress {
  const line = LEARNING_LINES[lineId];
  const sessions = getAllSessions();
  const outputs = getOutputs();

  // 拿到这条线的章节列表
  let chapters: ChapterOutline[] = [];
  if (line.textbookId === "ai") chapters = AI_CHAPTERS;
  else if (line.textbookId === "aipm") chapters = AIPM_CHAPTERS;
  // tools / aipm-job 暂时没内容(coming-soon)

  if (chapters.length === 0) {
    return {
      lineId,
      totalChapters: 0,
      startedChapters: 0,
      fullyUnderstoodChapters: 0,
      percentage: 0,
    };
  }

  const chapterProgresses = chapters.map((c) => computeChapterProgress(c, sessions, outputs));
  const startedChapters = chapterProgresses.filter((c) => c.isStarted).length;
  const fullyUnderstoodChapters = chapterProgresses.filter((c) => c.isFullyUnderstood).length;
  const percentage = Math.round((startedChapters / chapters.length) * 100);

  // 推荐下一章:第一个未开始的章节
  const nextRecommendedChapter = chapterProgresses.find((c) => !c.isStarted);

  return {
    lineId,
    totalChapters: chapters.length,
    startedChapters,
    fullyUnderstoodChapters,
    percentage,
    nextRecommendedChapter,
  };
}

// 给某条线返回所有章节的进度(用于 /learn/[direction] 页)
export function computeLineChapterProgresses(lineId: LearningLineId): ChapterProgress[] {
  const line = LEARNING_LINES[lineId];
  const sessions = getAllSessions();
  const outputs = getOutputs();

  let chapters: ChapterOutline[] = [];
  if (line.textbookId === "ai") chapters = AI_CHAPTERS;
  else if (line.textbookId === "aipm") chapters = AIPM_CHAPTERS;

  return chapters.map((c) => computeChapterProgress(c, sessions, outputs));
}
