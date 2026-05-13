"use client";

// /profile —— chat-first 学习中心。
// v0.1.6 重构:左侧 sidebar 不变,右侧主区 = 当前学习的对话框（LearningChat）。
// 没在学习时,右侧显示状态卡 + 推荐第一节入口。
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { lsGet, lsSet, LS_KEYS } from "@/lib/utils";
import { MENTOR_NAMES } from "@/types/mentor";
import { LEVEL_NAMES } from "@/types/profile";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";
import { getCurrentUser, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { LearningChat, type SourceInfo } from "@/components/learning-chat";
import { getCurrentSession } from "@/lib/records/records";

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserEmail(user.email || null);
        const justLoggedIn = searchParams.get("just_logged_in") === "1";
        if (justLoggedIn) {
          setSyncStatus("syncing");
          const pushResult = await syncLocalToSupabase();
          const pullResult = await syncSupabaseToLocal();
          if (pushResult.errors.length || pullResult.errors.length) {
            setSyncStatus("error");
            setSyncMsg([...pushResult.errors, ...pullResult.errors].join("；"));
          } else {
            setSyncStatus("done");
            setSyncMsg(`同步完成：推 ${pushResult.pushed.outputs} 条 · 拉 ${pullResult.pulled.outputs} 条`);
            setTimeout(() => setSyncStatus("idle"), 4000);
          }
          router.replace("/profile");
        } else {
          await syncSupabaseToLocal();
        }
      }

      const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
      if (!stored) {
        router.replace("/onboarding");
        return;
      }
      setResult(stored);

      // 决定 chat 加载哪节课:优先看当前进行中的会话,再看推荐
      const current = getCurrentSession();
      let lessonId: string | null = null;
      if (current && !current.endedAt) {
        lessonId = current.lessonId;
      } else {
        lessonId = recommendFirstLesson(stored.aiLevel.level, stored.recommendedPath);
      }
      if (lessonId) {
        const lesson = getLessonById(lessonId);
        if (lesson) {
          setSourceInfo({
            lesson,
            sourceLabel: lesson.category === "hot" ? "热点" : "课程",
            backHref: "/profile",
            backLabel: "学习中心",
          });
        }
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!loaded || !result) {
    return (
      <LearningCenterShell current="home" userEmail={userEmail}>
        <p className="text-sm text-ink-mute">加载中…</p>
      </LearningCenterShell>
    );
  }

  return (
    <LearningCenterShell current="home" userEmail={userEmail}>
      {/* sync 状态 */}
      {syncStatus === "done" && (
        <div className="mb-3 rounded-lg border border-moss/40 bg-moss/5 px-3 py-2 text-xs text-moss">
          ✓ {syncMsg}
        </div>
      )}
      {syncStatus === "error" && (
        <div className="mb-3 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-ink-soft">
          同步出错：{syncMsg}
        </div>
      )}
      {!userEmail && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2 text-xs text-ink-soft">
          <span>数据只存在这个浏览器 —— 换设备就丢</span>
          <Link href="/login" className="text-accent hover:underline">保存进度 →</Link>
        </div>
      )}

      {/* chat-first 主体 */}
      {sourceInfo ? (
        <LearningChat
          testResult={result}
          sourceInfo={sourceInfo}
          onSessionEnd={() => {
            // 暂停后刷新 sourceInfo
            const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
            if (stored) {
              const lessonId = recommendFirstLesson(stored.aiLevel.level, stored.recommendedPath);
              const lesson = getLessonById(lessonId);
              if (lesson) {
                setSourceInfo({
                  lesson,
                  sourceLabel: "课程",
                  backHref: "/profile",
                  backLabel: "学习中心",
                });
              }
            }
          }}
        />
      ) : (
        <IdleStateCards result={result} />
      )}
    </LearningCenterShell>
  );
}

// 没在学习时显示的入口卡（状态摘要 + 选课入口）
function IdleStateCards({ result }: { result: TestResult }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm tracking-wide text-ink-mute">学习中心</p>
        <h1 className="text-2xl font-medium leading-snug">你是「{result.learningProfile.type}」</h1>
        <p className="text-sm text-ink-soft">
          Lv.{result.aiLevel.level} · {result.aiLevel.levelName} · 推荐节奏:{result.paceRecommendation}
        </p>
      </div>
      <div className="card space-y-2">
        <p className="text-xs text-ink-mute">从这里开始</p>
        <p className="text-sm text-ink-soft">选一节课开始学习，或者去 AI 热点学习舱看精选热点。</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/courses" className="btn-primary text-sm">看课程</Link>
          <Link href="/hot" className="btn-ghost text-sm">AI 热点</Link>
          <Link href="/materials" className="btn-ghost text-sm">上传资料</Link>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-ink-mute">加载中…</p>
        </main>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
