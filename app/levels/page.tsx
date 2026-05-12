"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LEVEL_NAMES, LEVEL_NEXT_CAPABILITY, type TestResult } from "@/types/profile";
import { lsGet, LS_KEYS, cn } from "@/lib/utils";

// 等级简介
const LEVEL_DESCRIPTIONS: Record<number, string> = {
  0: "听说过 AI，但还没真正开始用",
  1: "会让 AI 写点东西、总结内容，但基本是一次性使用",
  2: "会追问、补充背景，知道「怎么问」会影响结果",
  3: "会写结构化 Prompt，能控制格式、语气、范围，减少 AI 胡说",
  4: "开始用 AI 做写作、调研、学习、产品、数据、设计等不同任务",
  5: "有自己的 Prompt 模板、资料库、固定流程，不再每次从零开始",
  6: "开始使用 Claude Code、Cursor、Agent 工具，让 AI 执行多步骤任务",
  7: "开始设计自己的 Agent、Skill、项目规则、自动化流程",
  8: "能用 AI 做出真实产品、工具、作品或业务流程",
  9: "AI 已经融入日常思考和工作方式，很多任务默认人机协作完成",
  10: "拥有自己的 AI 方法论、工具链、知识库、Agent 系统和创造体系",
};

export default function LevelsPage() {
  const [userLevel, setUserLevel] = useState<number | null>(null);

  useEffect(() => {
    const result = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    if (result) setUserLevel(result.aiLevel.level);
  }, []);

  return (
    <main className="container-narrow py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 回首页
        </Link>
        {userLevel !== null && (
          <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
            我的成长档案 →
          </Link>
        )}
      </header>

      <section className="mb-10 space-y-3">
        <p className="text-sm tracking-wide text-ink-mute">AI 能力进阶地图</p>
        <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
          从 Lv.0 到 Lv.10
        </h1>
        <p className="text-base leading-relaxed text-ink-soft">
          等级不是评判，是地图上的位置。你现在在哪里不重要，重要的是下一步有路可走。
        </p>
      </section>

      <div className="space-y-3">
        {Array.from({ length: 11 }).map((_, level) => {
          const isCurrent = userLevel === level;
          const isPassed = userLevel !== null && level < userLevel;
          const isNext = userLevel !== null && level === userLevel + 1;
          return (
            <div
              key={level}
              className={cn(
                "card transition",
                isCurrent && "border-accent bg-accent/10",
                isNext && "border-moss/60 bg-moss/5"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-medium",
                    isCurrent
                      ? "bg-accent text-white"
                      : isPassed
                      ? "bg-moss/30 text-moss"
                      : isNext
                      ? "bg-moss text-white"
                      : "bg-bg-warm text-ink-mute"
                  )}
                >
                  Lv.{level}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">{LEVEL_NAMES[level]}</h3>
                    {isCurrent && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                        你在这里
                      </span>
                    )}
                    {isNext && (
                      <span className="rounded-full bg-moss px-2 py-0.5 text-xs text-white">
                        下一站
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {LEVEL_DESCRIPTIONS[level]}
                  </p>
                  {(isCurrent || isNext) && level < 10 && (
                    <p className="border-l-2 border-accent/40 pl-3 text-xs leading-relaxed text-ink-mute">
                      要解锁下一级：{LEVEL_NEXT_CAPABILITY[level]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {userLevel === null && (
        <div className="mt-10 card space-y-3 text-center">
          <p className="text-sm text-ink-soft">想知道你现在在哪一级？</p>
          <Link href="/onboarding" className="btn-primary inline-block">
            做联合测试
          </Link>
        </div>
      )}
    </main>
  );
}
