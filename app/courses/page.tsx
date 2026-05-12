"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { lsGet, LS_KEYS, cn } from "@/lib/utils";
import { BUILT_IN_LESSONS } from "@/lib/courses/built-in-courses";
import { MENTOR_NAMES } from "@/types/mentor";
import type { TestResult } from "@/types/profile";
import type { BuiltInLesson, LessonCategory } from "@/types/lesson";

const CATEGORY_LABELS: Record<LessonCategory, string> = {
  aipm: "AIPM 主线",
  ai_tech: "AI 技术基础",
  ai_level: "等级进阶",
  paper: "论文导读",
  hot: "热点学习",
};

const CATEGORY_ORDER: LessonCategory[] = ["aipm", "ai_tech", "ai_level", "paper", "hot"];

export default function CoursesPage() {
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "for_me" | LessonCategory>("all");

  useEffect(() => {
    const r = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    if (r) setUserLevel(r.aiLevel.level);
  }, []);

  const filteredLessons = useMemo(() => {
    if (filter === "all") return BUILT_IN_LESSONS;
    if (filter === "for_me") {
      if (userLevel === null) return BUILT_IN_LESSONS;
      return BUILT_IN_LESSONS.filter(
        (l) => l.targetLevelMin <= userLevel + 1 && l.targetLevelMax >= userLevel
      );
    }
    return BUILT_IN_LESSONS.filter((l) => l.category === filter);
  }, [filter, userLevel]);

  // 按类别分组（all 视图用）
  const grouped = useMemo(() => {
    if (filter !== "all") return null;
    const map = new Map<LessonCategory, BuiltInLesson[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const lesson of BUILT_IN_LESSONS) {
      map.get(lesson.category)!.push(lesson);
    }
    return map;
  }, [filter]);

  return (
    <main className="container-narrow py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 学习中心
        </Link>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">课程中心</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            12 节微课 · 4 条主线
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            每节 15-25 分钟，3 个核心概念，1 个输出任务。学完不算完，输出沉淀下来才算。
          </p>
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="全部" />
          {userLevel !== null && (
            <FilterButton
              active={filter === "for_me"}
              onClick={() => setFilter("for_me")}
              label={`适合我 (Lv.${userLevel})`}
              highlight
            />
          )}
          {CATEGORY_ORDER.map((cat) => (
            <FilterButton
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={CATEGORY_LABELS[cat]}
            />
          ))}
        </div>

        {/* 课程列表 */}
        {grouped ? (
          <div className="space-y-8">
            {CATEGORY_ORDER.map((cat) => {
              const lessons = grouped.get(cat)!;
              if (lessons.length === 0) return null;
              return (
                <div key={cat} className="space-y-3">
                  <h2 className="text-sm font-medium tracking-wide text-ink-soft">
                    {CATEGORY_LABELS[cat]} <span className="text-ink-mute">· {lessons.length} 节</span>
                  </h2>
                  <div className="space-y-2.5">
                    {lessons.map((l) => (
                      <LessonCard key={l.id} lesson={l} userLevel={userLevel} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLessons.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink-mute">
                这一类暂时没有课程
              </p>
            ) : (
              filteredLessons.map((l) => (
                <LessonCard key={l.id} lesson={l} userLevel={userLevel} />
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition",
        active
          ? "border-accent bg-accent text-white"
          : highlight
          ? "border-moss/50 bg-moss/10 text-moss hover:bg-moss/20"
          : "border-bg-warm/70 text-ink-soft hover:border-accent/40 hover:bg-bg-subtle"
      )}
    >
      {label}
    </button>
  );
}

function LessonCard({ lesson, userLevel }: { lesson: BuiltInLesson; userLevel: number | null }) {
  const inRange =
    userLevel !== null &&
    lesson.targetLevelMin <= userLevel + 1 &&
    lesson.targetLevelMax >= userLevel;
  const tooHigh = userLevel !== null && lesson.targetLevelMin > userLevel + 1;
  const mentorNames = Array.isArray(lesson.defaultMentor)
    ? lesson.defaultMentor.map((m) => MENTOR_NAMES[m]).join(" → ")
    : MENTOR_NAMES[lesson.defaultMentor];

  return (
    <Link
      href={`/learn?lesson=${lesson.id}`}
      className={cn(
        "block rounded-lg border bg-white/40 p-4 transition hover:bg-bg-subtle/70",
        inRange
          ? "border-moss/40 hover:border-moss/60"
          : tooHigh
          ? "border-bg-warm/70 opacity-60 hover:opacity-80"
          : "border-bg-warm/70 hover:border-accent/40"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 rounded-md bg-bg-warm px-2 py-0.5 font-mono text-xs text-ink-soft">
          {lesson.id}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium leading-snug">{lesson.title}</h3>
            {inRange && (
              <span className="flex-shrink-0 rounded-full bg-moss px-2 py-0.5 text-xs text-white">
                适合你
              </span>
            )}
            {tooHigh && (
              <span className="flex-shrink-0 text-xs text-ink-mute">先升级</span>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {lesson.summary}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span>Lv.{lesson.targetLevelMin}-{lesson.targetLevelMax}</span>
            <span>·</span>
            <span>{mentorNames}</span>
            <span>·</span>
            <span>{lesson.keyConcepts.length} 个核心概念</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
