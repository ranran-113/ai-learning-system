"use client";

// /learn/[direction] —— 学习线总览页(v0.4 新建)
// direction: ai / aipm / tools / aipm-job
// 显示该线全部章节 + 每章 4 个动作(读 / 聊 / 沉淀 / 费曼)
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningCenterShell, type NavKey } from "@/components/learning-center-shell";
import { LEARNING_LINES, type LearningLineId } from "@/lib/learning-lines/registry";
import {
  computeLineProgress,
  computeLineChapterProgresses,
  type ChapterProgress,
  type LineProgress,
} from "@/lib/learning-lines/progress";
import { AI_CHAPTERS, AIPM_CHAPTERS, TEXTBOOKS } from "@/lib/textbooks/registry";
import { AVAILABLE_CHAPTERS } from "@/lib/textbooks/loader";
import type { ChapterOutline, TextbookId } from "@/lib/textbooks/types";
import { cn } from "@/lib/utils";

// 验证 + 获取学习线
function getLearningLineId(direction: string): LearningLineId | null {
  if (direction === "ai" || direction === "aipm" || direction === "tools" || direction === "aipm-job") {
    return direction as LearningLineId;
  }
  return null;
}

// 把学习线 id 映射到侧边栏 NavKey
function lineToNavKey(id: LearningLineId): NavKey {
  switch (id) {
    case "ai":
      return "line-ai";
    case "aipm":
      return "line-aipm";
    case "tools":
      return "line-tools";
    case "aipm-job":
      return "line-job";
  }
}

export default function DirectionPage({ params }: { params: Promise<{ direction: string }> }) {
  const { direction } = use(params);
  const lineId = getLearningLineId(direction);
  if (!lineId) notFound();

  const line = LEARNING_LINES[lineId];

  // 拿 chapters / progress(只在 client 端,避免 SSR 不一致)
  const [progress, setProgress] = useState<LineProgress | null>(null);
  const [chapterProgresses, setChapterProgresses] = useState<ChapterProgress[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (line.status === "ready") {
      setProgress(computeLineProgress(lineId));
      setChapterProgresses(computeLineChapterProgresses(lineId));
    }
  }, [lineId, line.status]);

  return (
    <LearningCenterShell current={lineToNavKey(lineId)}>
      <section className="space-y-6">
        <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 返回首页
        </Link>

        {/* 头 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{line.emoji}</span>
            <h1 className="text-2xl font-medium leading-snug sm:text-3xl">{line.title} 学习线</h1>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">
            <span className="text-ink-mute">这条线带你:</span> {line.oneLineGoal}
          </p>
          <p className="text-xs text-ink-mute">
            适合:{line.audience} · {line.entryPoint}
          </p>

          {hydrated && progress && (
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
                <span>
                  已开始 {progress.startedChapters}/{progress.totalChapters} 章 ·
                  真懂 {progress.fullyUnderstoodChapters} 章
                </span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-warm/50">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 章节列表 / coming-soon */}
        {line.status === "coming-soon" ? (
          <ComingSoonView lineId={lineId} />
        ) : (
          <ReadyLineView lineId={lineId} chapterProgresses={chapterProgresses} />
        )}
      </section>
    </LearningCenterShell>
  );
}

// ============ ready 状态:显示章节列表 + 4 动作 ============
function ReadyLineView({
  lineId,
  chapterProgresses,
}: {
  lineId: LearningLineId;
  chapterProgresses: ChapterProgress[];
}) {
  const line = LEARNING_LINES[lineId];
  const bookId = line.textbookId as TextbookId;
  const chapters: ChapterOutline[] = bookId === "ai" ? AI_CHAPTERS : AIPM_CHAPTERS;
  const available = new Set(AVAILABLE_CHAPTERS[bookId]);

  // 按 part 分组
  const grouped = chapters.reduce((acc, c) => {
    if (!acc[c.part]) acc[c.part] = [];
    acc[c.part].push(c);
    return acc;
  }, {} as Record<string, ChapterOutline[]>);

  // 进度 map
  const progressMap = new Map(chapterProgresses.map((p) => [p.chapterId, p]));

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([part, chaps]) => {
        const allInPartStarted = chaps.every((c) => progressMap.get(c.id)?.isStarted);
        const allInPartUnderstood = chaps.every((c) => progressMap.get(c.id)?.isFullyUnderstood);
        return (
          <div key={part} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <h2 className="text-sm font-medium text-ink-soft">{part}</h2>
              <span className="text-ink-mute">
                {allInPartUnderstood ? "全章真懂" : allInPartStarted ? "全章已开始" : ""}
              </span>
            </div>
            <div className="space-y-1.5">
              {chaps.map((c) => (
                <ChapterRow
                  key={c.id}
                  bookId={bookId}
                  chapter={c}
                  isAvailable={available.has(c.id)}
                  progress={progressMap.get(c.id)}
                  lineId={lineId}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChapterRow({
  bookId,
  chapter,
  isAvailable,
  progress,
  lineId,
}: {
  bookId: TextbookId;
  chapter: ChapterOutline;
  isAvailable: boolean;
  progress?: ChapterProgress;
  lineId: LearningLineId;
}) {
  const actions = progress?.actions;
  const isFullyUnderstood = progress?.isFullyUnderstood ?? false;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition",
        !isAvailable
          ? "border-transparent opacity-60"
          : isFullyUnderstood
          ? "border-moss/40 bg-moss/5"
          : "border-bg-warm/70 bg-white/40 hover:border-accent/40 hover:bg-bg-subtle/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-xs font-medium",
            isFullyUnderstood
              ? "bg-moss text-white"
              : isAvailable
              ? "bg-accent text-white"
              : "bg-bg-warm text-ink-mute"
          )}
        >
          C{String(chapter.index).padStart(2, "0")}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("text-sm font-medium leading-snug", !isAvailable && "text-ink-mute")}>
              {chapter.title}
            </h3>
            {!isAvailable && (
              <span className="rounded-full bg-bg-warm px-2 py-0.5 text-[10px] text-ink-mute">
                即将上线
              </span>
            )}
            {isFullyUnderstood && (
              <span className="rounded-full bg-moss/20 px-2 py-0.5 text-[10px] text-moss">
                ✓ 真懂
              </span>
            )}
          </div>
          <p
            className={cn(
              "line-clamp-1 text-xs leading-relaxed",
              isAvailable ? "text-ink-soft" : "text-ink-mute"
            )}
          >
            {chapter.description}
          </p>

          {/* 3 主动作 —— v0.4.4 修正:聊&沉淀 是一体的(沉淀在 chat 内完成,不独立) */}
          {isAvailable && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              <ActionButton
                emoji="📖"
                label="读"
                state={actions?.read ? "done" : "todo"}
                href={`/textbooks/${bookId}/${chapter.id}?from=${lineId}`}
              />
              <ActionButton
                emoji="💬"
                label="聊&沉淀"
                state={
                  actions?.chat && actions?.note
                    ? "done"
                    : actions?.chat
                    ? "partial"  // 聊过但没沉淀
                    : "todo"
                }
                partialHint="聊过没沉淀"
                href={`/learn?source=textbook&id=${bookId}-${chapter.id}&from=${lineId}`}
              />
              <ActionButton
                emoji="🎯"
                label="费曼"
                state={actions?.feynman ? "done" : "todo"}
                href={`/learn/${lineId}/${chapter.id}/feynman`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  emoji,
  label,
  state,
  partialHint,
  href,
}: {
  emoji: string;
  label: string;
  state: "todo" | "partial" | "done";
  partialHint?: string;
  href: string;
}) {
  // 3 种状态:未做 / 半完成(只聊没沉淀) / 完成
  const cls =
    state === "done"
      ? "bg-moss/15 text-moss hover:bg-moss/25"
      : state === "partial"
      ? "bg-accent/25 text-accent-deep hover:bg-accent/35"
      : "bg-accent/10 text-accent hover:bg-accent/20";

  const title =
    state === "done"
      ? `${label} 已完成`
      : state === "partial" && partialHint
      ? `${label}: ${partialHint}`
      : `去 ${label}`;

  return (
    <Link href={href} className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition", cls)} title={title}>
      <span>{emoji}</span>
      <span>{label}</span>
      {state === "done" && <span className="text-[10px]">✓</span>}
      {state === "partial" && <span className="text-[10px]">⚠</span>}
    </Link>
  );
}

// ============ coming-soon 状态 ============
function ComingSoonView({ lineId }: { lineId: LearningLineId }) {
  const line = LEARNING_LINES[lineId];

  return (
    <div className="card space-y-3">
      <p className="text-base font-medium">本线即将上线</p>
      {lineId === "tools" && (
        <div className="space-y-2 text-sm text-ink-soft">
          <p>AI 工具线的 MVP 内容是 <strong>Claude Code 专题 8 节</strong>:</p>
          <ul className="space-y-0.5 pl-4 text-xs text-ink-soft">
            <li>T1 安装 + 第一次跑起来</li>
            <li>T2 配置文件 + 我的常用设置</li>
            <li>T3 Skills / Hooks / Slash Commands</li>
            <li>T4 MCP 接入</li>
            <li>T5 在真实项目里用 CC 的 10 个套路</li>
            <li>T6 拆解 CC 的设计哲学</li>
            <li>T7 CC vs Cursor vs Devin</li>
            <li>T8 用 CC 搭一个个人 Agent</li>
          </ul>
          <p className="text-xs text-ink-mute">
            未来扩展:Cursor / NotebookLM / Comfy / MidJourney 等。
          </p>
        </div>
      )}
      {lineId === "aipm-job" && (
        <div className="space-y-2 text-sm text-ink-soft">
          <p>AIPM 求职线的 MVP 内容:</p>
          <ul className="space-y-0.5 pl-4 text-xs text-ink-soft">
            <li>📝 简历模块:R1-R3(差异 / 写法 / 投递)</li>
            <li>🎤 模拟面试模块:30 分钟动态对话,钱学森扮演面试官</li>
            <li>🚀 入职模块:O1-O3(30 天 checklist / 写 PRD / 协作)</li>
          </ul>
        </div>
      )}
      <p className="text-xs text-ink-mute pt-2">
        计划在 v0.5 完成。当前你可以先去其他学习线:
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/learn/ai" className="btn-ghost text-sm">
          🧠 AI 通识
        </Link>
        <Link href="/learn/aipm" className="btn-ghost text-sm">
          💼 AIPM
        </Link>
      </div>
    </div>
  );
}
