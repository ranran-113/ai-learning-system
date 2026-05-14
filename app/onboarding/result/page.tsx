"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { lsGet, LS_KEYS, cn } from "@/lib/utils";
import { LEVEL_NAMES } from "@/types/profile";
import { MENTOR_NAMES } from "@/types/mentor";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";

export default function OnboardingResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setResult(stored);
    // 渐入动画
    setTimeout(() => setShow(true), 100);
  }, [router]);

  if (!result) {
    return (
      <main className="container-narrow flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-mute">加载中…</p>
      </main>
    );
  }

  const recommendedLessonId = recommendFirstLesson(result.aiLevel.level, result.recommendedPath);
  const recommendedLesson = getLessonById(recommendedLessonId);
  const mentorNames = recommendedLesson
    ? Array.isArray(recommendedLesson.defaultMentor)
      ? recommendedLesson.defaultMentor.map((m) => MENTOR_NAMES[m]).join(" / ")
      : MENTOR_NAMES[recommendedLesson.defaultMentor]
    : "";

  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center py-12 sm:py-16">
      <div
        className={cn(
          "space-y-8 transition-all duration-700",
          show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {/* 揭晓 */}
        <div className="space-y-3 text-center">
          <p className="text-sm tracking-wide text-ink-mute">你的成长档案</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            你是「{result.learningProfile.type}」
          </h1>
        </div>

        {/* 等级 + 地图位置 */}
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <p className="text-5xl font-medium tracking-tight text-accent sm:text-6xl">
              Lv.{result.aiLevel.level}
            </p>
            <p className="text-lg text-ink-soft">{result.aiLevel.levelName}</p>
            <p className="text-xs text-ink-mute">
              置信度 {Math.round(result.aiLevel.confidence * 100)}% · 可能在 Lv.{result.aiLevel.rangeMin} - Lv.{result.aiLevel.rangeMax} 之间
            </p>
          </div>

          {/* 等级地图横向进度条 */}
          <div className="space-y-2">
            <div className="relative mx-auto h-2 max-w-md overflow-hidden rounded-full bg-bg-warm">
              <div
                className="h-full bg-gradient-to-r from-accent-soft to-accent transition-all duration-1000"
                style={{ width: `${((result.aiLevel.level + 1) / 11) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-mute mx-auto max-w-md">
              <span>Lv.0</span>
              <span>Lv.5</span>
              <span>Lv.10</span>
            </div>
          </div>
        </div>

        {/* 下一站 */}
        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">下一站</p>
          <p className="text-lg font-medium">
            Lv.{result.aiLevel.nextLevelTarget.level} · {result.aiLevel.nextLevelTarget.levelName}
          </p>
          <p className="text-sm leading-relaxed text-ink-soft">
            要解锁：{result.aiLevel.nextLevelTarget.requiredCapability}
          </p>
        </div>

        {/* 推荐节奏 */}
        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">推荐节奏</p>
          <p className="text-base font-medium">{result.paceRecommendation}</p>
          <p className="text-sm text-ink-soft">
            推荐你的第一节：
            <span className="font-medium text-ink">{recommendedLesson?.title || "AI 入门"}</span>
            {mentorNames && (
              <span className="text-ink-mute"> · 和 {mentorNames} 一起</span>
            )}
          </p>
        </div>

        {/* 大按钮 CTA —— v0.4 改:不直接进 chat,而是进首页看 4 条学习线 */}
        <div className="space-y-3 pt-2 text-center">
          <Link
            href="/profile"
            className="inline-block w-full rounded-xl bg-accent px-8 py-4 text-base font-medium text-white shadow-sm transition hover:bg-accent-deep sm:w-auto sm:min-w-[300px]"
          >
            进入学习中心
          </Link>
          <p className="text-xs text-ink-mute">
            首页会根据你的等级和画像,推荐你该走哪条学习线
          </p>
          <div className="pt-1">
            <Link href="/levels" className="text-xs text-ink-mute hover:text-ink-soft">
              先看看 AI 能力 0-10 级地图 →
            </Link>
          </div>
        </div>

        <p className="pt-4 text-center text-xs leading-relaxed text-ink-mute">
          等级不是评判，是你在地图上的位置。
          <br />
          状态会变，地图会更新。
        </p>
      </div>
    </main>
  );
}
