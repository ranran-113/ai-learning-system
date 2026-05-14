"use client";

// /learn/[direction]/[chapter]/feynman —— 费曼挑战页(v0.4 新建)
// 加载章节内容 → 生成挑战 → FeynmanChallenge 组件接管
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningCenterShell, type NavKey } from "@/components/learning-center-shell";
import { FeynmanChallenge } from "@/components/feynman-challenge";
import { LEARNING_LINES, type LearningLineId } from "@/lib/learning-lines/registry";
import { loadChapter, AVAILABLE_CHAPTERS } from "@/lib/textbooks/loader";
import { getOutline } from "@/lib/textbooks/registry";
import type { ChapterContent, TextbookId } from "@/lib/textbooks/types";
import { generateChallenge } from "@/lib/feynman/evaluator";
import type { FeynmanChallenge as FeynmanChallengeT } from "@/lib/feynman/prompts";

function getLearningLineId(d: string): LearningLineId | null {
  if (d === "ai" || d === "aipm" || d === "tools" || d === "aipm-job") return d as LearningLineId;
  return null;
}

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

export default function FeynmanPage({
  params,
}: {
  params: Promise<{ direction: string; chapter: string }>;
}) {
  const { direction, chapter: chapterId } = use(params);
  const lineId = getLearningLineId(direction);
  if (!lineId) notFound();

  const line = LEARNING_LINES[lineId];

  // 费曼挑战需要章节正文(读 markdown + keyConcepts)
  // tools / aipm-job 当前没有教材内容,所以费曼也没法做
  if (line.status === "coming-soon" || !line.textbookId) {
    return (
      <LearningCenterShell current={lineToNavKey(lineId)}>
        <div className="space-y-4">
          <Link href={`/learn/${lineId}`} className="text-sm text-ink-mute hover:text-ink-soft">
            ← 返回 {line.title}
          </Link>
          <div className="card space-y-2">
            <p className="text-base font-medium">本线的费曼挑战即将上线</p>
            <p className="text-sm text-ink-soft">
              {line.title} 学习线目前还在准备中。费曼挑战会跟着章节内容一起上线。
            </p>
            <Link href="/learn/ai" className="btn-ghost text-sm inline-block">
              先去 AI 通识试试费曼挑战
            </Link>
          </div>
        </div>
      </LearningCenterShell>
    );
  }

  const bookId = line.textbookId;
  const outline = getOutline(bookId, chapterId);
  if (!outline) notFound();
  const isAvailable = AVAILABLE_CHAPTERS[bookId].includes(chapterId);

  const [content, setContent] = useState<ChapterContent | null>(null);
  const [challenge, setChallenge] = useState<FeynmanChallengeT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    loadChapter(bookId, chapterId).then((c) => {
      if (c) {
        setContent(c);
        setChallenge(generateChallenge(bookId, chapterId, c));
      }
      setLoading(false);
    });
  }, [bookId, chapterId, isAvailable]);

  if (!isAvailable) {
    return (
      <LearningCenterShell current={lineToNavKey(lineId)}>
        <div className="space-y-4">
          <Link href={`/learn/${lineId}`} className="text-sm text-ink-mute hover:text-ink-soft">
            ← 返回 {line.title}
          </Link>
          <div className="card space-y-2">
            <p className="text-base font-medium">本章即将上线</p>
            <p className="text-sm text-ink-soft">
              C{String(outline.index).padStart(2, "0")} · {outline.title}
            </p>
            <p className="text-xs text-ink-mute">
              章节内容还没成稿,费曼挑战需要章节内容做基础,所以暂时不能开始。
            </p>
          </div>
        </div>
      </LearningCenterShell>
    );
  }

  if (loading) {
    return (
      <LearningCenterShell current={lineToNavKey(lineId)}>
        <p className="py-12 text-center text-sm text-ink-mute">加载中…</p>
      </LearningCenterShell>
    );
  }

  if (!content || !challenge) {
    return (
      <LearningCenterShell current={lineToNavKey(lineId)}>
        <p className="py-12 text-center text-sm text-ink-mute">加载失败</p>
      </LearningCenterShell>
    );
  }

  // 章节摘要:取 markdown 前 800 字 + keyConcepts(用于 LLM-as-Judge 参考)
  const chapterSummary = `${content.markdown.slice(0, 800)}\n\n关键概念:${content.keyConcepts.join(" / ")}`;

  return (
    <LearningCenterShell current={lineToNavKey(lineId)}>
      <FeynmanChallenge
        bookId={bookId}
        chapterId={chapterId}
        chapterTitle={content.title}
        chapterSummary={chapterSummary}
        challenge={challenge}
        backHref={`/learn/${lineId}`}
      />
    </LearningCenterShell>
  );
}
