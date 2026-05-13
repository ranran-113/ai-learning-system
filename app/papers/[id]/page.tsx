"use client";

// /papers/[id] —— 论文详情 + 让卡帕西讲解 CTA
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { getPaperById, CATEGORY_LABELS } from "@/lib/papers/papers";

export default function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const paper = getPaperById(decodeURIComponent(id));
  if (!paper) {
    notFound();
  }

  const sourceUrl = paper.arxivUrl || paper.paperUrl;
  const difficultyLabel = {
    intro: "入门",
    intermediate: "进阶",
    advanced: "高阶",
  }[paper.difficulty];

  return (
    <LearningCenterShell current="papers">
      <article className="space-y-6">
        <Link href="/papers" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 论文列表
        </Link>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
              {CATEGORY_LABELS[paper.category]}
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
              {difficultyLabel}
            </span>
            <span className="text-xs text-ink-mute">
              {paper.year} · {paper.org}
            </span>
          </div>
          <h1 className="text-2xl font-medium leading-snug sm:text-3xl">{paper.title}</h1>
          <p className="text-sm text-ink-soft">{paper.authors}</p>
        </div>

        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">一句话核心贡献</p>
          <p className="text-base font-medium leading-relaxed">{paper.keyContribution}</p>
        </div>

        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">摘要（中文）</p>
          <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{paper.abstractZh}</p>
        </div>

        <div className="card space-y-2 border-accent/30 bg-accent/5">
          <p className="text-xs uppercase tracking-wider text-accent">为什么 AIPM 该读</p>
          <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{paper.whyAipm}</p>
        </div>

        {/* 让卡帕西讲解 CTA */}
        <div className="card space-y-3 border-moss/40 bg-moss/5">
          <p className="text-sm font-medium">看不懂？让导师陪你拆穿</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            点下面按钮，导师会用「这论文要解决什么 → 核心方法 → 对 AIPM 的启发 → 沉淀一句话」的模板带你过一遍。
          </p>
          <Link
            href={`/learn?source=paper&id=${encodeURIComponent(paper.id)}`}
            className="btn-primary inline-block text-sm"
          >
            让卡帕西讲解
          </Link>
        </div>

        {sourceUrl && (
          <div className="text-xs text-ink-mute">
            <p>原文：</p>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-accent hover:underline"
            >
              {sourceUrl}
            </a>
          </div>
        )}
      </article>
    </LearningCenterShell>
  );
}
