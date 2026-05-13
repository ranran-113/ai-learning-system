"use client";

// /textbooks/[bookId] —— 单本教材的章节列表（按 Part 分组）
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { cn } from "@/lib/utils";
import { TEXTBOOKS, getChaptersByBook } from "@/lib/textbooks/registry";
import { AVAILABLE_CHAPTERS } from "@/lib/textbooks/loader";
import type { TextbookId } from "@/lib/textbooks/types";

export default function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  if (bookId !== "ai" && bookId !== "aipm") notFound();

  const book = TEXTBOOKS[bookId as TextbookId];
  const chapters = getChaptersByBook(bookId as TextbookId);
  const available = new Set(AVAILABLE_CHAPTERS[bookId as TextbookId]);

  // 按 Part 分组
  const grouped = chapters.reduce((acc, c) => {
    if (!acc[c.part]) acc[c.part] = [];
    acc[c.part].push(c);
    return acc;
  }, {} as Record<string, typeof chapters>);

  return (
    <LearningCenterShell current="textbooks">
      <section className="space-y-6">
        <Link href="/textbooks" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 教材列表
        </Link>

        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">{book.id === "ai" ? "AI 通识" : "AIPM"}</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">{book.title}</h1>
          <p className="text-sm leading-relaxed text-ink-soft">{book.subtitle}</p>
          <p className="text-xs text-ink-mute">面向：{book.audience}</p>
          <p className="text-xs text-accent">
            已成稿 {available.size} / {chapters.length} 章 · {available.size === chapters.length ? "全本完成" : "持续更新中"}
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([part, chaps]) => (
            <div key={part} className="space-y-2">
              <h2 className="text-sm font-medium tracking-wide text-ink-soft">{part}</h2>
              <div className="space-y-1.5">
                {chaps.map((c) => {
                  const isAvailable = available.has(c.id);
                  return (
                    <ChapterRow
                      key={c.id}
                      bookId={bookId as TextbookId}
                      chapterId={c.id}
                      index={c.index}
                      title={c.title}
                      description={c.description}
                      levelRange={`Lv.${c.targetLevelMin}-${c.targetLevelMax}`}
                      isAvailable={isAvailable}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </LearningCenterShell>
  );
}

function ChapterRow({
  bookId,
  chapterId,
  index,
  title,
  description,
  levelRange,
  isAvailable,
}: {
  bookId: TextbookId;
  chapterId: string;
  index: number;
  title: string;
  description: string;
  levelRange: string;
  isAvailable: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-medium",
          isAvailable ? "bg-accent text-white" : "bg-bg-warm text-ink-mute"
        )}
      >
        C{String(index).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-base font-medium leading-snug", !isAvailable && "text-ink-mute")}>
            {title}
          </h3>
          {!isAvailable && (
            <span className="flex-shrink-0 rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-mute">
              即将上线
            </span>
          )}
        </div>
        <p className={cn("line-clamp-2 text-xs leading-relaxed", isAvailable ? "text-ink-soft" : "text-ink-mute")}>
          {description}
        </p>
        <p className="text-xs text-ink-mute">{levelRange}</p>
      </div>
    </div>
  );

  if (!isAvailable) {
    return <div className="rounded-lg border border-transparent opacity-60">{inner}</div>;
  }

  return (
    <Link
      href={`/textbooks/${bookId}/${chapterId}`}
      className="block rounded-lg border border-bg-warm/70 bg-white/40 px-3 transition hover:border-accent/40 hover:bg-bg-subtle/70"
    >
      {inner}
    </Link>
  );
}
