// localStorage ↔ Supabase 数据同步。
// 策略：登录后,把本地数据 push 到云;之后云为主,localStorage 当本地缓存。
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { lsGet, lsSet, LS_KEYS } from "@/lib/utils";
import {
  getOutputHistory,
  getAllArchivedSessions,
  getCurrentSession,
} from "@/lib/records/records";
import type { TestResult } from "@/types/profile";

// ============= 推送本地数据到云端 =============
export async function syncLocalToSupabase(): Promise<{ pushed: { profile: number; outputs: number; sessions: number }; errors: string[] }> {
  const supabase = createSupabaseBrowserClient();
  const errors: string[] = [];
  const pushed = { profile: 0, outputs: 0, sessions: 0 };

  // 当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    errors.push("没登录,无法同步");
    return { pushed, errors };
  }

  // 1. 推 profile（测试结果）
  const testResult = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
  if (testResult) {
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        email: user.email,
        learning_profile_type: testResult.learningProfile.type,
        ai_level: testResult.aiLevel.level,
        ai_level_name: testResult.aiLevel.levelName,
        ai_level_confidence: testResult.aiLevel.confidence,
        ai_level_algorithm: testResult.aiLevel.level,
        main_blocker: testResult.currentBlocker,
        preferred_pace: testResult.learningProfile.dimensions.pacePreference,
        pace_recommendation: testResult.paceRecommendation,
        recommended_path: testResult.recommendedPath,
        mentor_mix: testResult.mentorMix,
        test_result_full: testResult,
      });
      if (error) throw error;
      pushed.profile = 1;
    } catch (e) {
      errors.push("profile: " + (e instanceof Error ? e.message : "未知"));
    }
  }

  // 2. 推 outputs（增量,避免重复）
  const localOutputs = getOutputHistory();
  if (localOutputs.length > 0) {
    try {
      // 拿已有的 cloud outputs
      const { data: cloudOutputs } = await supabase
        .from("outputs")
        .select("created_at, lesson_id, content")
        .eq("user_id", user.id);
      const cloudKeys = new Set(
        (cloudOutputs || []).map((o: any) => `${o.lesson_id}|${o.content}`)
      );
      const toInsert = localOutputs
        .filter((o) => !cloudKeys.has(`${o.lessonId}|${o.content}`))
        .map((o) => ({
          user_id: user.id,
          lesson_id: o.lessonId,
          type: o.type,
          content: o.content,
          created_at: o.createdAt,
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("outputs").insert(toInsert);
        if (error) throw error;
        pushed.outputs = toInsert.length;
      }
    } catch (e) {
      errors.push("outputs: " + (e instanceof Error ? e.message : "未知"));
    }
  }

  // 3. 推 sessions（归档的 + 当前的）
  const archived = getAllArchivedSessions();
  const current = getCurrentSession();
  const allSessions = [...archived, ...(current ? [current] : [])];
  if (allSessions.length > 0) {
    try {
      const { data: cloudSessions } = await supabase
        .from("learning_sessions")
        .select("started_at, lesson_id")
        .eq("user_id", user.id);
      const cloudKeys = new Set(
        (cloudSessions || []).map((s: any) => `${s.lesson_id}|${s.started_at}`)
      );
      const toInsert = allSessions
        .filter((s) => !cloudKeys.has(`${s.lessonId}|${s.startedAt}`))
        .map((s) => ({
          user_id: user.id,
          lesson_id: s.lessonId,
          source_type: "built_in_course",
          started_at: s.startedAt,
          ended_at: s.endedAt || null,
          messages: s.messages,
          active_mentor: s.activeMentor,
          mentor_turn_count: s.mentorTurnCount,
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("learning_sessions").insert(toInsert);
        if (error) throw error;
        pushed.sessions = toInsert.length;
      }
    } catch (e) {
      errors.push("sessions: " + (e instanceof Error ? e.message : "未知"));
    }
  }

  // 标记已同步
  lsSet("als:last-synced-at", new Date().toISOString());

  return { pushed, errors };
}

// ============= 从云端拉取数据回 localStorage =============
export async function syncSupabaseToLocal(): Promise<{ pulled: { profile: boolean; outputs: number; sessions: number }; errors: string[] }> {
  const supabase = createSupabaseBrowserClient();
  const errors: string[] = [];
  const pulled = { profile: false, outputs: 0, sessions: 0 };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    errors.push("没登录");
    return { pulled, errors };
  }

  // 1. 拉 profile
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("test_result_full")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (data?.test_result_full) {
      lsSet(LS_KEYS.TEST_RESULT, data.test_result_full);
      pulled.profile = true;
    }
  } catch (e) {
    errors.push("profile: " + (e instanceof Error ? e.message : "未知"));
  }

  // 2. 拉 outputs
  try {
    const { data, error } = await supabase
      .from("outputs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const records = (data || []).map((o: any) => ({
      id: o.id,
      lessonId: o.lesson_id,
      type: o.type,
      content: o.content,
      createdAt: o.created_at,
    }));
    lsSet("als:output-history", records);
    pulled.outputs = records.length;
  } catch (e) {
    errors.push("outputs: " + (e instanceof Error ? e.message : "未知"));
  }

  return { pulled, errors };
}

// ============= 用户当前是否已登录（客户端用）=============
export async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}
