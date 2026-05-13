"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { lsGet, lsSet, lsRemove, LS_KEYS, cn } from "@/lib/utils";
import { MENTOR_NAMES } from "@/types/mentor";
import { LEVEL_NAMES } from "@/types/profile";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";
import { getCurrentUser, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";
import { LearningCenterShell } from "@/components/learning-center-shell";

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [adjustedDelta, setAdjustedDelta] = useState<number>(0);
  const [hasAdjusted, setHasAdjusted] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    const adjusted = lsGet<boolean>(LS_KEYS.USER_LEVEL_ADJUSTED);
    setHasAdjusted(adjusted === true);

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
            setSyncMsg(`同步完成：推 ${pushResult.pushed.outputs} 条沉淀, 拉 ${pullResult.pulled.outputs} 条`);
            setTimeout(() => setSyncStatus("idle"), 4000);
          }
          router.replace("/profile");
        } else {
          const pullResult = await syncSupabaseToLocal();
          if (pullResult.pulled.profile) {
            const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
            if (stored) setResult(stored);
          }
        }
      }

      const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
      if (!stored) {
        router.replace("/onboarding");
        return;
      }
      setResult(stored);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-mute">加载中…</p>
      </main>
    );
  }

  const effectiveLevel = Math.max(0, Math.min(10, result.aiLevel.level + adjustedDelta));
  const effectiveLevelName = LEVEL_NAMES[effectiveLevel];
  const recommendedLessonId = recommendFirstLesson(effectiveLevel, result.recommendedPath);
  const recommendedLesson = getLessonById(recommendedLessonId);
  const mentorName = recommendedLesson
    ? Array.isArray(recommendedLesson.defaultMentor)
      ? recommendedLesson.defaultMentor.map(m => MENTOR_NAMES[m]).join(" / ")
      : MENTOR_NAMES[recommendedLesson.defaultMentor]
    : "";

  const handleAdjust = (delta: number) => {
    if (hasAdjusted) return;
    setAdjustedDelta(delta);
    setHasAdjusted(true);
    lsSet(LS_KEYS.USER_LEVEL_ADJUSTED, true);
    const newResult = { ...result, aiLevel: { ...result.aiLevel, level: effectiveLevel + delta - adjustedDelta } };
    setResult(newResult);
    lsSet(LS_KEYS.TEST_RESULT, newResult);
  };

  return (
    <LearningCenterShell current="home" userEmail={userEmail}>
      {/* 同步状态条 */}
      {syncStatus === "done" && (
        <div className="mb-4 rounded-lg border border-moss/40 bg-moss/5 px-3 py-2 text-xs text-moss">
          ✓ {syncMsg}
        </div>
      )}
      {syncStatus === "error" && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-ink-soft">
          同步出错：{syncMsg}
        </div>
      )}

      {/* 未登录提示（轻量） */}
      {!userEmail && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5 text-xs text-ink-soft">
          <span>
            <strong className="font-medium">你的数据还只存在这个浏览器</strong> —— 换设备就丢
          </span>
          <Link href="/login" className="flex-shrink-0 text-accent hover:underline">
            保存进度 →
          </Link>
        </div>
      )}

      {/* 欢迎 + 状态 */}
      <header className="mb-6 space-y-2">
        <p className="text-sm tracking-wide text-ink-mute">
          {userEmail ? "欢迎回来" : "学习中心"}
        </p>
        <h1 className="text-3xl font-medium leading-snug">
          你是「{result.learningProfile.type}」
        </h1>
      </header>

      {/* 继续学习 —— 主 CTA */}
      {recommendedLesson && (
        <div className="card mb-6 space-y-3 border-accent/40 bg-accent/5">
          <p className="text-xs uppercase tracking-wider text-accent">继续学习</p>
          <h2 className="text-lg font-medium leading-snug">{recommendedLesson.title}</h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {recommendedLesson.summary}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-mute">
            <span>Lv.{recommendedLesson.targetLevelMin}-{recommendedLesson.targetLevelMax}</span>
            <span>·</span>
            <span>和 {mentorName}</span>
          </div>
          <div className="pt-2">
            <Link
              href={`/learn?lesson=${recommendedLessonId}`}
              className="btn-primary inline-block"
            >
              进入学习
            </Link>
          </div>
        </div>
      )}

      {/* AI 等级 + 下一站（紧凑版） */}
      <div className="card mb-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wider text-ink-mute">你的位置</p>
          {result.aiLevel.suspiciousAnswer && (
            <span className="text-xs text-accent">答题速度较快</span>
          )}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-2xl font-medium">Lv.{effectiveLevel}</span>
          <span className="text-base text-ink-soft">{effectiveLevelName}</span>
          <span className="text-xs text-ink-mute">
            置信度 {Math.round(result.aiLevel.confidence * 100)}%
          </span>
        </div>
        {/* 横向进度条 */}
        <div className="space-y-1">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-bg-warm">
            <div
              className="h-full bg-gradient-to-r from-accent-soft to-accent"
              style={{ width: `${((effectiveLevel + 1) / 11) * 100}%` }}
            />
          </div>
        </div>
        <div className="border-t border-bg-warm/60 pt-3">
          <p className="text-xs text-ink-mute">下一站</p>
          <p className="mt-0.5 text-sm font-medium">
            Lv.{result.aiLevel.nextLevelTarget.level} · {result.aiLevel.nextLevelTarget.levelName}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            要解锁：{result.aiLevel.nextLevelTarget.requiredCapability}
          </p>
        </div>

        {/* ±1 微调 */}
        <div className="border-t border-bg-warm/60 pt-3">
          {hasAdjusted ? (
            <p className="text-xs text-ink-mute">
              已微调（{adjustedDelta > 0 ? `+${adjustedDelta}` : adjustedDelta}）。原始 + 微调都已保留。
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-ink-mute">觉得不准？微调一次：</p>
              <button onClick={() => handleAdjust(-1)} className="rounded border border-ink-mute/30 px-2 py-0.5 text-xs hover:bg-bg-subtle">
                算高了 -1
              </button>
              <button onClick={() => handleAdjust(1)} className="rounded border border-ink-mute/30 px-2 py-0.5 text-xs hover:bg-bg-subtle">
                算低了 +1
              </button>
            </div>
          )}
        </div>

        {result.aiLevel.evidenceConflict && (
          <div className="rounded border border-accent/30 bg-accent/5 p-2.5 text-xs text-ink-soft">
            你回答里有不同方向信号 —— 首次学习时阿德勒会先跟你聊一下。
          </div>
        )}
      </div>

      {/* 节奏 + 下一步 */}
      <div className="card mb-6 space-y-2">
        <p className="text-xs uppercase tracking-wider text-ink-mute">推荐节奏</p>
        <p className="text-base font-medium">{result.paceRecommendation}</p>
        <div className="border-t border-bg-warm/60 pt-3">
          <p className="text-xs text-ink-mute">今天的第一步</p>
          <p className="mt-0.5 text-sm leading-relaxed">{result.nextAction}</p>
        </div>
      </div>

      {/* 三导师比例 */}
      <div className="card mb-6 space-y-3">
        <p className="text-xs uppercase tracking-wider text-ink-mute">三位导师陪你的比例</p>
        <MentorMixBar mix={result.mentorMix} />
        <p className="text-xs leading-relaxed text-ink-soft">
          系统会根据你每次的状态自动切换导师，比例只是参考。卡住时阿德勒会先出来。
        </p>
      </div>
    </LearningCenterShell>
  );
}

function MentorMixBar({ mix }: { mix: { karpathy: number; qian: number; adler: number } }) {
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-warm">
        <div className="bg-accent" style={{ width: `${mix.karpathy}%` }} />
        <div className="bg-moss" style={{ width: `${mix.qian}%` }} />
        <div className="bg-accent-soft" style={{ width: `${mix.adler}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> 卡帕西 {mix.karpathy}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-moss" /> 钱学森 {mix.qian}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-soft" /> 阿德勒 {mix.adler}%
        </span>
      </div>
    </div>
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
