"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { lsGet, lsSet, lsRemove, LS_KEYS, cn } from "@/lib/utils";
import { MENTOR_NAMES } from "@/types/mentor";
import { LEVEL_NAMES } from "@/types/profile";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";
import { getCurrentUser, signOut, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";

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
        // 登录后自动从云端拉取（覆盖 localStorage）
        const justLoggedIn = searchParams.get("just_logged_in") === "1";
        if (justLoggedIn) {
          setSyncStatus("syncing");
          // 第一次登录：先推本地到云,再拉云回本地（合并策略：先推后拉）
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
          // 把 just_logged_in 参数清掉
          router.replace("/profile");
        } else {
          // 已登录的回访：直接拉云
          const pullResult = await syncSupabaseToLocal();
          if (pullResult.pulled.profile) {
            // 重新加载 result
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

  const handleSignOut = async () => {
    if (!confirm("退出登录吗？你的数据已存在云端,下次登录还会回来。")) return;
    await signOut();
    setUserEmail(null);
    router.refresh();
  };

  const handleManualSync = async () => {
    setSyncStatus("syncing");
    const result = await syncLocalToSupabase();
    if (result.errors.length > 0) {
      setSyncStatus("error");
      setSyncMsg(result.errors.join("；"));
    } else {
      setSyncStatus("done");
      setSyncMsg(`已同步：${result.pushed.outputs} 条沉淀, ${result.pushed.sessions} 个会话`);
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  if (!result) {
    return (
      <main className="container-narrow flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-mute">加载中…</p>
      </main>
    );
  }

  const effectiveLevel = Math.max(0, Math.min(10, result.aiLevel.level + adjustedDelta));
  const effectiveLevelName = LEVEL_NAMES[effectiveLevel];

  const recommendedLessonId = recommendFirstLesson(effectiveLevel, result.recommendedPath);
  const recommendedLesson = getLessonById(recommendedLessonId);

  const handleAdjust = (delta: number) => {
    if (hasAdjusted) return;
    setAdjustedDelta(delta);
    setHasAdjusted(true);
    lsSet(LS_KEYS.USER_LEVEL_ADJUSTED, true);
    const newResult = { ...result, aiLevel: { ...result.aiLevel, level: effectiveLevel + delta - adjustedDelta } };
    setResult(newResult);
    lsSet(LS_KEYS.TEST_RESULT, newResult);
  };

  const handleRetake = () => {
    if (!confirm("确定重新测试吗？当前结果会被覆盖。")) return;
    lsRemove(LS_KEYS.TEST_ANSWERS);
    lsRemove(LS_KEYS.TEST_START_AT);
    lsRemove(LS_KEYS.TEST_RESULT);
    lsRemove(LS_KEYS.USER_LEVEL_ADJUSTED);
    router.push("/onboarding");
  };

  return (
    <main className="container-narrow py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 回首页
        </Link>
        <div className="flex items-center gap-3 text-sm text-ink-mute">
          {userEmail ? (
            <>
              <span title={userEmail} className="hidden sm:inline max-w-[160px] truncate">{userEmail}</span>
              <button onClick={handleManualSync} className="hover:text-ink-soft" disabled={syncStatus === "syncing"}>
                {syncStatus === "syncing" ? "同步中…" : "同步"}
              </button>
              <button onClick={handleSignOut} className="hover:text-ink-soft">
                退出
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded border border-accent/40 px-2.5 py-1 text-xs text-accent hover:bg-accent/10">
              邮箱登录 / 保存进度
            </Link>
          )}
          <button onClick={handleRetake} className="hover:text-ink-soft">
            重新测试
          </button>
        </div>
      </header>

      {/* sync 状态横条 */}
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

      {/* 未登录时的轻量提示 */}
      {!userEmail && result && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
          <p className="leading-relaxed">
            <span className="font-medium">你的数据还只存在这个浏览器里</span> ——
            换设备 / 清缓存 就会丢。
          </p>
          <Link href="/login" className="mt-2 inline-block text-xs text-accent hover:underline">
            留个邮箱保存 →
          </Link>
        </div>
      )}

      <section className="space-y-6">
        {/* 标题 */}
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">你的学习中心</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            你是「{result.learningProfile.type}」
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            这不是标签，是你现在的状态。状态会变，地图会更新。
          </p>
        </div>

        {/* 学习中心入口 —— dashboard 核心区 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {recommendedLesson && (
            <DashboardTile
              href={`/learn?lesson=${recommendedLessonId}`}
              icon="▶"
              title="继续学习"
              subtitle={recommendedLesson.title}
              accent
            />
          )}
          <DashboardTile
            href="/courses"
            icon="📚"
            title="课程中心"
            subtitle="12 节微课 · 4 条主线"
          />
          <DashboardTile
            href="/hot"
            icon="🔥"
            title="AI 热点学习舱"
            subtitle="精选热点 · 帮我讲解"
          />
          <DashboardTile
            href="/materials"
            icon="📄"
            title="上传资料"
            subtitle="把你的资料拆成微课"
          />
          <DashboardTile
            href="/records"
            icon="🌱"
            title="学习记录"
            subtitle="你做过的会话和沉淀"
          />
          <DashboardTile
            href="/levels"
            icon="🗺"
            title="能力地图"
            subtitle="Lv.0 - Lv.10"
          />
        </div>

        {/* AI 等级卡 */}
        <div className="card space-y-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-ink-mute">你的位置</p>
            {result.aiLevel.suspiciousAnswer && (
              <span className="text-xs text-accent">答题速度很快，建议复看一下</span>
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-medium">
              Lv.{effectiveLevel} · {effectiveLevelName}
            </h2>
            <p className="text-sm text-ink-soft">
              置信度 {Math.round(result.aiLevel.confidence * 100)}% · 可能在 Lv.{result.aiLevel.rangeMin} - Lv.{result.aiLevel.rangeMax} 之间
            </p>
          </div>

          <div className="border-t border-bg-warm/60 pt-4">
            <p className="text-sm text-ink-mute">下一站</p>
            <p className="mt-1 text-base font-medium">
              Lv.{result.aiLevel.nextLevelTarget.level} · {result.aiLevel.nextLevelTarget.levelName}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              要解锁：{result.aiLevel.nextLevelTarget.requiredCapability}
            </p>
          </div>

          {/* ±1 微调 */}
          <div className="border-t border-bg-warm/60 pt-4">
            {hasAdjusted ? (
              <p className="text-xs text-ink-mute">
                你已经做过一次微调（{adjustedDelta > 0 ? `+${adjustedDelta}` : adjustedDelta}）。等级算法把它和原始结果都保留了。
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-ink-mute">觉得不准？可以微调一次：</p>
                <button onClick={() => handleAdjust(-1)} className="rounded border border-ink-mute/30 px-3 py-1 text-xs hover:bg-bg-subtle">
                  算高了 -1
                </button>
                <button onClick={() => handleAdjust(1)} className="rounded border border-ink-mute/30 px-3 py-1 text-xs hover:bg-bg-subtle">
                  算低了 +1
                </button>
              </div>
            )}
          </div>

          {result.aiLevel.evidenceConflict && (
            <div className="rounded border border-accent/30 bg-accent/5 p-3 text-xs text-ink-soft">
              你的回答里有一些不同方向的信号 —— 第一次进入学习时阿德勒会先跟你聊一下，再开始正式学习。
            </div>
          )}
        </div>

        {/* 三导师陪伴比例 */}
        <div className="card space-y-4">
          <p className="text-sm text-ink-mute">三位导师陪你的比例</p>
          <MentorMixBar mix={result.mentorMix} />
          <p className="text-xs leading-relaxed text-ink-soft">
            系统会根据你每次的状态自动切换导师，比例只是参考。卡住时阿德勒会先出来。
          </p>
        </div>

        {/* 节奏 + 下一步 */}
        <div className="card space-y-3">
          <p className="text-sm text-ink-mute">推荐节奏</p>
          <p className="text-base font-medium">{result.paceRecommendation}</p>
          <div className="border-t border-bg-warm/60 pt-3">
            <p className="text-sm text-ink-mute">今天的第一步（5 分钟内能做完）</p>
            <p className="mt-1 text-base leading-relaxed">{result.nextAction}</p>
          </div>
        </div>

        {/* 调试信息（折叠） */}
        <details className="mt-8 text-xs text-ink-mute">
          <summary className="cursor-pointer">查看评分细节（开发用）</summary>
          <pre className="mt-3 overflow-auto rounded bg-bg-subtle p-3 text-xs">
{JSON.stringify(
  {
    profile: result.learningProfile,
    aiLevel: {
      level: result.aiLevel.level,
      confidence: result.aiLevel.confidence,
      centerOfMass: result.aiLevel.centerOfMass,
      evidenceProfile: result.aiLevel.evidenceProfile,
    },
    currentBlocker: result.currentBlocker,
    recommendedPath: result.recommendedPath,
    durationSeconds: result.durationSeconds,
  },
  null,
  2
)}
          </pre>
        </details>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="container-narrow flex min-h-screen items-center justify-center">
          <p className="text-sm text-ink-mute">加载中…</p>
        </main>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}

function DashboardTile({
  href,
  icon,
  title,
  subtitle,
  accent,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border p-4 transition hover:shadow-sm",
        accent
          ? "border-accent bg-accent/10 hover:bg-accent/20"
          : "border-bg-warm/70 bg-white/40 hover:border-accent/40 hover:bg-bg-subtle/70"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none">{icon}</span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className={cn("text-sm font-medium leading-tight", accent && "text-accent-deep")}>
            {title}
          </p>
          <p className="line-clamp-2 text-xs leading-tight text-ink-soft">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function MentorMixBar({ mix }: { mix: { karpathy: number; qian: number; adler: number } }) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-bg-warm">
        <div className="bg-accent" style={{ width: `${mix.karpathy}%` }} title={`卡帕西 ${mix.karpathy}%`} />
        <div className="bg-moss" style={{ width: `${mix.qian}%` }} title={`钱学森 ${mix.qian}%`} />
        <div className="bg-accent-soft" style={{ width: `${mix.adler}%` }} title={`阿德勒 ${mix.adler}%`} />
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
