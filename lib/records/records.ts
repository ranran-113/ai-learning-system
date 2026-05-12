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

// ============= 输出沉淀（跨会话） =============
export function getOutputHistory(): OutputRecord[] {
  return lsGet<OutputRecord[]>(SESSION_LS_KEYS.OUTPUT_HISTORY) || [];
}

export function appendOutput(record: OutputRecord): void {
  const history = getOutputHistory();
  history.push(record);
  lsSet(SESSION_LS_KEYS.OUTPUT_HISTORY, history);
}
