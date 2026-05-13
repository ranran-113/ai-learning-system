// 学习记录的 localStorage 持久化。第二阶段先用 localStorage，第三阶段迁 Supabase。
import { lsGet, lsSet } from "@/lib/utils";
import type { ChatMessage, LearningSession, OutputRecord } from "@/lib/langgraph/state";
import { SESSION_LS_KEYS } from "@/lib/langgraph/state";

// ============= 当前进行中的会话 =============
export function getCurrentSession(): LearningSession | null {
  return lsGet<LearningSession>(SESSION_LS_KEYS.CURRENT_SESSION);
}

export function setCurrentSession(session: LearningSession): void {
  lsSet(SESSION_LS_KEYS.CURRENT_SESSION, session);
}

export function startNewSession(lessonId: string, defaultMentor: ChatMessage["mentor"]): LearningSession {
  const session: LearningSession = {
    id: `s-${Date.now()}`,
    lessonId,
    startedAt: new Date().toISOString(),
    messages: [],
    outputs: [],
    activeMentor: defaultMentor || "karpathy",
    mentorTurnCount: 0,
  };
  setCurrentSession(session);
  return session;
}

export function endCurrentSession(): void {
  const current = getCurrentSession();
  if (!current) return;
  current.endedAt = new Date().toISOString();
  // 归档
  const archive = lsGet<LearningSession[]>(SESSION_LS_KEYS.LEARNING_SESSIONS) || [];
  archive.push(current);
  lsSet(SESSION_LS_KEYS.LEARNING_SESSIONS, archive);
  // 清空当前
  lsSet(SESSION_LS_KEYS.CURRENT_SESSION, null);
}

// ============= 所有历史会话 =============
export function getAllArchivedSessions(): LearningSession[] {
  return lsGet<LearningSession[]>(SESSION_LS_KEYS.LEARNING_SESSIONS) || [];
}

// 拿到某节课的所有历史会话（用于累积深度感）
export function getArchivedSessionsForLesson(lessonId: string): LearningSession[] {
  return getAllArchivedSessions().filter((s) => s.lessonId === lessonId);
}

// 把归档会话恢复为当前会话(用于"继续学习同一节")
// 注意:把它从归档中移除,避免一节课在两边都出现
export function resumeArchivedSession(sessionId: string): LearningSession | null {
  const archived = getAllArchivedSessions();
  const target = archived.find((s) => s.id === sessionId);
  if (!target) return null;
  // 从归档中移除
  const remaining = archived.filter((s) => s.id !== sessionId);
  lsSet(SESSION_LS_KEYS.LEARNING_SESSIONS, remaining);
  // 移除 ended_at,变回进行中
  const resumed: LearningSession = { ...target, endedAt: undefined };
  setCurrentSession(resumed);
  return resumed;
}

// ============= 输出沉淀（跨会话） =============
export function getOutputHistory(): OutputRecord[] {
  return lsGet<OutputRecord[]>(SESSION_LS_KEYS.OUTPUT_HISTORY) || [];
}

export function appendOutput(record: OutputRecord): void {
  const history = getOutputHistory();
  history.push(record);
  lsSet(SESSION_LS_KEYS.OUTPUT_HISTORY, history);
}
