"use client";

// /profile —— 学习中心首页(v0.4 v2.0 重做)
// v0.x 错误:chat 占首页 C 位 → 用户感觉是 chat 工具
// v2.0 正确:学习路径占 C 位
//   - 欢迎语 + Lv.X + 沉淀计数
//   - 接着上次 / 今日推荐
//   - 4 大学习线卡片
//   - 持续学习区入口
//   - 资产区
//
// chat 退到学习线内部(/learn?source=textbook&id=...)
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { lsGet, LS_KEYS } from "@/lib/utils";
import type { TestResult } from "@/types/profile";
import { MENTOR_NAMES } from "@/types/mentor";
import { getCurrentUser, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { LearningLineCard } from "@/components/learning-line-card";
import { getCurrentSession, getOutputHistory } from "@/lib/records/records";
import type { LearningSession } from "@/lib/langgraph/state";
import {
  LEARNING_LINES,
  recommendLines,
  type LearningLineId,
} from "@/lib/learning-lines/registry";
import {
  computeLineProgress,
  type LineProgress,
} from "@/lib/learning-lines/progress";
import { getOutline } from "@/lib/textbooks/registry";

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [lineProgresses, setLineProgresses] = useState<Record<LearningLineId, LineProgress | undefined>>({
    ai: undefined,
    aipm: undefined,
    tools: undefined,
    "aipm-job": undefined,
  });
  const [outputCount, setOutputCount] = useState(0);
  const [feynmanPassCount, setFeynmanPassCount] = useState(0);
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

      // 当前在跑的会话(用于「接着上次」)
      setCurrentSession(getCurrentSession());

      // 4 条线的进度
      setLineProgresses({
        ai: computeLineProgress("ai"),
        aipm: computeLineProgress("aipm"),
        tools: computeLineProgress("tools"),
        "aipm-job": computeLineProgress("aipm-job"),
      });

      // 沉淀计数
      const outputs = getOutputHistory();
      setOutputCount(outputs.length);
      setFeynmanPassCount(
        outputs.filter(
          (o) => o.type === "feynman" && o.feynman?.result === "passed"
        ).length
      );

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

  // 推荐高亮的学习线(基于等级)
  const recommendedLineIds = recommendLines(result.aiLevel.level);
  const primaryRecommendation = recommendedLineIds[0];

  // 时段问候
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "夜里好" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";

  // 「接着上次」信息
  const continuingFromSession = currentSession && !currentSession.endedAt && currentSession.messages.length > 0;

  return (
    <LearningCenterShell current="home" userEmail={userEmail}>
      <section className="space-y-6">
        {/* sync 状态 */}
        {syncStatus === "done" && (
          <div className="rounded-lg border border-moss/40 bg-moss/5 px-3 py-2 text-xs text-moss">
            ✓ {syncMsg}
          </div>
        )}
        {syncStatus === "error" && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-ink-soft">
            同步出错：{syncMsg}
          </div>
        )}
        {!userEmail && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2 text-xs text-ink-soft">
            <span>数据只存在这个浏览器 —— 换设备就丢</span>
            <Link href="/login" className="text-accent hover:underline">
              保存进度 →
            </Link>
          </div>
        )}

        {/* 顶部欢迎语 */}
        <div className="space-y-1">
          <p className="text-sm text-ink-mute">{greeting} ☀️</p>
          <h1 className="text-2xl font-medium leading-snug">
            Lv.{result.aiLevel.level} · {result.aiLevel.levelName}
          </h1>
          <p className="text-sm text-ink-soft">
            你是「{result.learningProfile.type}」 · 已沉淀 {outputCount} 条
            {feynmanPassCount > 0 && (
              <span className="text-moss"> · 费曼通过 {feynmanPassCount}</span>
            )}
          </p>
        </div>

        {/* 接着上次 / 今日推荐 */}
        <ContinueAndRecommendation
          session={continuingFromSession ? currentSession : null}
          recommendedLineId={primaryRecommendation}
          userLevel={result.aiLevel.level}
        />

        {/* 你的 4 条学习线 */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-ink-soft">你的 4 条学习线</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(["ai", "aipm", "tools", "aipm-job"] as LearningLineId[]).map((id) => (
              <LearningLineCard
                key={id}
                line={LEARNING_LINES[id]}
                progress={lineProgresses[id]}
                highlighted={id === primaryRecommendation}
              />
            ))}
          </div>
        </div>

        {/* 持续学习区 */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-ink-soft">🌊 持续学习</h2>
          <p className="text-xs text-ink-mute">老手不走教材也行 —— 在这里看正在发生什么</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FeedLink href="/hot" emoji="🔥" label="AI 热点" badge="新" />
            <FeedLink href="/papers" emoji="📄" label="论文导读" badge="15 篇" />
            <FeedLink href="#" emoji="📊" label="GitHub 周榜" badge="soon" disabled />
            <FeedLink href="#" emoji="📝" label="博客 / 访谈" badge="soon" disabled />
          </div>
        </div>

        {/* 资产 */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-ink-soft">💎 你的资产</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <AssetCard
              href="/records"
              emoji="📝"
              label="原子笔记"
              value={`${outputCount} 条`}
            />
            <AssetCard
              href="/records"
              emoji="🎯"
              label="费曼笔记"
              value={`${feynmanPassCount} 条通过`}
              accent={feynmanPassCount > 0}
            />
            <AssetCard
              href="/materials"
              emoji="📤"
              label="上传资料"
              value="管理"
            />
          </div>
        </div>
      </section>
    </LearningCenterShell>
  );
}

// =========== 子组件 ===========

function ContinueAndRecommendation({
  session,
  recommendedLineId,
  userLevel,
}: {
  session: LearningSession | null;
  recommendedLineId: LearningLineId;
  userLevel: number;
}) {
  if (session) {
    // 接着上次模式
    // 从 lessonId 反推章节信息(lessonId 格式 "ai-c05" 或老的 "L5")
    const parts = session.lessonId.split("-");
    let title = session.lessonId;
    let lineHref = "/profile";
    if (parts.length === 2) {
      const [bookId, chapterId] = parts;
      const outline = getOutline(bookId as "ai" | "aipm", chapterId);
      if (outline) {
        title = `${outline.title}`;
        lineHref = `/learn/${bookId}`;
      }
    }
    // 拿最后一条 mentor 消息的导师
    let mentorKey = session.activeMentor;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const m = session.messages[i];
      if (m.role === "mentor" && m.mentor) {
        mentorKey = m.mentor;
        break;
      }
    }
    const mentorName = MENTOR_NAMES[mentorKey];
    const turnCount = Math.ceil(session.messages.length / 2);

    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <p className="text-xs text-ink-mute mb-1">🔄 接着上次</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            <span className="font-medium text-ink">{mentorName}</span>
            <span className="text-ink-mute"> · {title} · 第 {turnCount} 轮</span>
          </p>
          <Link
            href={`/learn?source=textbook&id=${session.lessonId}`}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-deep"
          >
            继续 →
          </Link>
        </div>
        <Link href={lineHref} className="mt-2 inline-block text-xs text-ink-mute hover:text-ink-soft">
          返回 {LEARNING_LINES[recommendedLineId].title} 学习线 →
        </Link>
      </div>
    );
  }

  // 今日推荐模式
  const line = LEARNING_LINES[recommendedLineId];
  return (
    <div className="rounded-xl border border-bg-warm/60 bg-bg-subtle/40 p-4">
      <p className="text-xs text-ink-mute mb-1">📅 今日推荐(基于你的 Lv.{userLevel})</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-medium text-ink">
            {line.emoji} {line.title} 学习线
          </span>
          <span className="text-ink-mute"> · {line.subtitle}</span>
        </p>
        <Link
          href={`/learn/${line.id}`}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-deep"
        >
          进入
        </Link>
      </div>
      <p className="mt-1.5 text-xs text-ink-mute">{line.oneLineGoal}</p>
    </div>
  );
}

function FeedLink({
  href,
  emoji,
  label,
  badge,
  disabled,
}: {
  href: string;
  emoji: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div
        title="即将上线"
        className="flex items-center gap-2 rounded-lg border border-bg-warm/60 bg-bg-subtle/30 px-3 py-2 text-sm text-ink-mute opacity-60"
      >
        <span>{emoji}</span>
        <span className="flex-1 truncate">{label}</span>
        {badge && <span className="text-[10px]">{badge}</span>}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-bg-warm/60 bg-white/40 px-3 py-2 text-sm text-ink-soft transition hover:border-accent/40 hover:bg-bg-subtle/40"
    >
      <span>{emoji}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="text-[10px] text-accent">{badge}</span>}
    </Link>
  );
}

function AssetCard({
  href,
  emoji,
  label,
  value,
  accent,
}: {
  href: string;
  emoji: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border px-3 py-2.5 text-sm transition ${
        accent
          ? "border-moss/40 bg-moss/5 hover:bg-moss/10"
          : "border-bg-warm/60 bg-white/40 hover:border-accent/40 hover:bg-bg-subtle/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-ink-soft">{label}</span>
      </div>
      <p className={`mt-0.5 text-xs ${accent ? "text-moss" : "text-ink-mute"}`}>{value}</p>
    </Link>
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
