"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lsGet, lsSet, lsRemove, LS_KEYS, cn } from "@/lib/utils";
import { MENTOR_NAMES } from "@/types/mentor";
import { LEVEL_NAMES } from "@/types/profile";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [adjustedDelta, setAdjustedDelta] = useState<number>(0);
  const [hasAdjusted, setHasAdjusted] = useState<boolean>(false);

  useEffect(() => {
    const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    const adjusted = lsGet<boolean>(LS_KEYS.USER_LEVEL_ADJUSTED);
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setResult(stored);
    setHasAdjusted(adjusted === true);
  }, [router]);

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
    // 同时把生效等级写回 result
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
    <main className="container-narrow py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 回首页
        </Link>
        <button onClick={handleRetake} className="text-sm text-ink-mute hover:text-ink-soft">
          重新测试
        </button>
      </header>

      <section className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm tracking-wide text-ink-mute">你的成长档案</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            你是「{result.learningProfile.type}」
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            这不是标签，是你现在的状态。状态会变，地图会更新。
          </p>
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

        {/* 第一节推荐课 */}
        {recommendedLesson && (
          <div className="card space-y-3">
            <p className="text-sm text-ink-mute">为你推荐的第一节</p>
            <h3 className="text-lg font-medium leading-snug">{recommendedLesson.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{recommendedLesson.summary}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-mute">
              <span>默认导师：{
                Array.isArray(recommendedLesson.defaultMentor)
                  ? recommendedLesson.defaultMentor.map(m => MENTOR_NAMES[m]).join(" → ")
                  : MENTOR_NAMES[recommendedLesson.defaultMentor]
              }</span>
              <span>·</span>
              <span>目标等级：Lv.{recommendedLesson.targetLevelMin}–Lv.{recommendedLesson.targetLevelMax}</span>
            </div>
            <div className="pt-2">
              <Link
                href={`/learn?lesson=${recommendedLessonId}`}
                className="btn-primary inline-block"
              >
                开始第一节学习
              </Link>
              <p className="mt-2 text-xs text-ink-mute">
                和 {Array.isArray(recommendedLesson.defaultMentor)
                  ? recommendedLesson.defaultMentor.map(m => MENTOR_NAMES[m]).join(" / ")
                  : MENTOR_NAMES[recommendedLesson.defaultMentor]} 一起跑这一节。
              </p>
            </div>
          </div>
        )}

        {/* AI 能力地图 + 其他入口 */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/levels" className="btn-ghost">
            查看完整 AI 能力 0-10 级地图
          </Link>
        </div>

        {/* 调试信息（折叠） */}
        <details className="mt-12 text-xs text-ink-mute">
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
