"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEST_QUESTIONS, TOTAL_QUESTIONS } from "@/lib/profile/test-questions";
import { generateTestResult, detectConflicts } from "@/lib/profile/scoring";
import { cn, lsGet, lsSet, LS_KEYS } from "@/lib/utils";
import type { TestAnswersMap } from "@/types/test";

type Phase = "intro" | "test" | "conflict_confirm" | "computing";

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<TestAnswersMap>({});
  const [startAt, setStartAt] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ low: string; high: string }>>([]);

  // 恢复进度
  useEffect(() => {
    const savedAnswers = lsGet<TestAnswersMap>(LS_KEYS.TEST_ANSWERS);
    const savedStart = lsGet<number>(LS_KEYS.TEST_START_AT);
    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
      setAnswers(savedAnswers);
    }
    if (savedStart) setStartAt(savedStart);
  }, []);

  // 答案持久化
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      lsSet(LS_KEYS.TEST_ANSWERS, answers);
    }
  }, [answers]);

  const currentQuestion = TEST_QUESTIONS[currentIdx];

  const handleStart = () => {
    const now = Date.now();
    setStartAt(now);
    lsSet(LS_KEYS.TEST_START_AT, now);
    setPhase("test");
  };

  const handleSelect = (optionId: string) => {
    const q = currentQuestion;
    if (q.questionType === "single") {
      setAnswers((prev) => ({ ...prev, [q.id]: [optionId] }));
    } else {
      // multiple
      setAnswers((prev) => {
        const current = prev[q.id] || [];
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [q.id]: next };
      });
    }
  };

  const isAnswered = (answers[currentQuestion.id] || []).length > 0;

  const handleNext = () => {
    if (currentIdx < TOTAL_QUESTIONS - 1) {
      setCurrentIdx((i) => i + 1);
      return;
    }
    // 最后一题：检查冲突
    const detected = detectConflicts(answers);
    if (detected.length > 0) {
      setConflicts(detected);
      setPhase("conflict_confirm");
      return;
    }
    computeAndGo();
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  };

  const computeAndGo = () => {
    setPhase("computing");
    const duration = startAt ? Math.floor((Date.now() - startAt) / 1000) : 0;
    const result = generateTestResult(answers, duration);
    lsSet(LS_KEYS.TEST_RESULT, result);
    // 跳到结果页
    setTimeout(() => router.push("/profile"), 400);
  };

  // ============= 渲染 =============
  if (phase === "intro") {
    return <IntroScreen onStart={handleStart} hasProgress={Object.keys(answers).length > 0} onResume={() => setPhase("test")} />;
  }

  if (phase === "computing") {
    return <ComputingScreen />;
  }

  if (phase === "conflict_confirm") {
    return (
      <ConflictConfirmScreen
        conflicts={conflicts}
        onKeep={() => computeAndGo()}
        onAdjustToLow={() => {
          // 简化处理：去掉高等级选项
          const q6 = (answers["Q6"] || []).filter(
            (id) => !["Q6-H", "Q6-I", "Q6-J", "Q6-K"].includes(id)
          );
          setAnswers((prev) => ({ ...prev, Q6: q6 }));
          setConflicts([]);
          setTimeout(() => computeAndGo(), 100);
        }}
        onAdjustToHigh={() => {
          // 简化处理：去掉低等级选项
          const q6 = (answers["Q6"] || []).filter((id) => id !== "Q6-A");
          setAnswers((prev) => ({ ...prev, Q6: q6 }));
          setConflicts([]);
          setTimeout(() => computeAndGo(), 100);
        }}
      />
    );
  }

  // phase === "test"
  return (
    <main className="container-narrow flex min-h-screen flex-col py-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-ink-mute">
          <span>
            {currentIdx + 1} / {TOTAL_QUESTIONS}
          </span>
          <Link href="/" className="hover:text-ink-soft">
            退出（进度会保留）
          </Link>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-bg-warm">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          {currentQuestion.questionType === "multiple" && (
            <p className="text-xs uppercase tracking-wider text-accent">多选 · 可选多个</p>
          )}
          <h2 className="text-xl font-medium leading-relaxed sm:text-2xl">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const selected = (answers[currentQuestion.id] || []).includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "option-card w-full text-left",
                  selected && "option-card-selected"
                )}
              >
                <span className="block text-sm leading-relaxed sm:text-base">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-10 flex items-center justify-between">
        <button onClick={handlePrev} disabled={currentIdx === 0} className="btn-ghost">
          上一题
        </button>
        <button onClick={handleNext} disabled={!isAnswered} className="btn-primary">
          {currentIdx === TOTAL_QUESTIONS - 1 ? "看看我的结果" : "下一题"}
        </button>
      </div>
    </main>
  );
}

// ============= 子组件 =============
function IntroScreen({
  onStart,
  hasProgress,
  onResume,
}: {
  onStart: () => void;
  hasProgress: boolean;
  onResume: () => void;
}) {
  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center py-16">
      <div className="space-y-6">
        <p className="text-sm tracking-wide text-ink-mute">联合测试</p>
        <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
          这 15 道题不是考试，
          <br />
          是帮我们了解你。
        </h1>
        <p className="text-base leading-relaxed text-ink-soft">
          答完之后你会得到：
        </p>
        <ul className="space-y-1.5 text-sm leading-relaxed text-ink-soft">
          <li>· 你的学习人格画像</li>
          <li>· 你当前的 AI 能力等级（Lv.0–Lv.10）+ 置信度</li>
          <li>· 三位导师陪你的比例建议</li>
          <li>· 学习节奏与第一节课的具体推荐</li>
        </ul>
        <p className="text-sm text-ink-mute">
          等级不是评判，是你在地图上的位置。中途可以随时退出，进度会保留。
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {hasProgress ? (
            <>
              <button onClick={onResume} className="btn-primary">
                继续上次
              </button>
              <button onClick={onStart} className="btn-ghost">
                重新开始
              </button>
            </>
          ) : (
            <button onClick={onStart} className="btn-primary">
              开始
            </button>
          )}
          <Link href="/" className="btn-ghost">
            回首页
          </Link>
        </div>
      </div>
    </main>
  );
}

function ComputingScreen() {
  return (
    <main className="container-narrow flex min-h-screen flex-col items-center justify-center py-16">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-bg-warm border-t-accent" />
        <p className="text-sm text-ink-soft">在为你生成成长档案…</p>
      </div>
    </main>
  );
}

function ConflictConfirmScreen({
  conflicts,
  onKeep,
  onAdjustToLow,
  onAdjustToHigh,
}: {
  conflicts: Array<{ low: string; high: string }>;
  onKeep: () => void;
  onAdjustToLow: () => void;
  onAdjustToHigh: () => void;
}) {
  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center py-16">
      <div className="card space-y-5">
        <h2 className="text-xl font-medium leading-snug">想跟你确认一下</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          你在 Q6 里既选了「没怎么用过 AI」，又选了「我有完整的 AI 方法论 / 工具链 / 知识库体系」。
          这两个看起来不太一样。
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          这两个其实都可能是真的，只是不同时刻的你。你想怎么处理？
        </p>
        <div className="flex flex-col gap-2.5 pt-2">
          <button onClick={onAdjustToLow} className="option-card text-left">
            更接近「没怎么用过 AI」—— 帮我去掉高等级的选项
          </button>
          <button onClick={onAdjustToHigh} className="option-card text-left">
            更接近「有完整方法论」—— 帮我去掉「没怎么用过」
          </button>
          <button onClick={onKeep} className="option-card text-left">
            两个都对，保留 —— 阿德勒会在你第一次进入学习时跟你聊一下
          </button>
        </div>
      </div>
    </main>
  );
}
