"use client";

// /papers —— AIPM 必读 15 篇论文（v0.1.6.1 Phase 1）
import { useState, useMemo } from "react";
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { cn } from "@/lib/utils";
import {
  CURATED_PAPERS,
  CATEGORY_LABELS,
  type PaperCategory,
  type CuratedPaper,
} from "@/lib/papers/papers";

export default function PapersPage() {
  const [category, setCategory] = useState<PaperCategory | "all">("all");
  const [searchQ, setSearchQ] = useState("");

  const filtered = useMemo(() => {
    let list = CURATED_PAPERS;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.abstractZh.includes(q) ||
          p.whyAipm.includes(q)
      );
    }
    return list;
  }, [category, searchQ]);

  return (
    <LearningCenterShell current="papers">
      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">论文导读</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">AIPM 必读 15 篇</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            这不是一份"AI 论文清单"——是**作为 AIPM 看懂这个行业的最低门槛**。每一篇都标了「为什么 AIPM 该读」+「核心贡献」。
            不懂的地方，点「让卡帕西讲解」让导师陪你过一遍。
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")} label={`全部 (${CURATED_PAPERS.length})`} />
          {(Object.keys(CATEGORY_LABELS) as PaperCategory[]).map((cat) => {
            const count = CURATED_PAPERS.filter((p) => p.category === cat).length;
            return (
              <FilterChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
                label={`${CATEGORY_LABELS[cat]} (${count})`}
              />
            );
          })}
        </div>

        {/* 搜索 */}
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="搜索标题 / 作者 / 关键词…"
          className="w-full rounded-full border border-bg-warm/70 bg-white/60 px-4 py-2 text-sm focus:border-accent/40 focus:outline-none"
        />

        {/* 列表 */}
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-mute">没找到符合的论文</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}

        <p className="pt-2 text-xs text-ink-mute">
          论文清单 v0.1.6.1（Phase 1 手动 curate）。Phase 2 将接入 arXiv API 自动拉取新论文 + 翻译 + 全文阅读。
        </p>
      </section>
    </LearningCenterShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-accent bg-accent text-white"
          : "border-bg-warm/70 text-ink-soft hover:border-accent/40 hover:bg-bg-subtle"
      )}
    >
      {label}
    </button>
  );
}

function PaperCard({ paper }: { paper: CuratedPaper }) {
  const difficultyLabel = {
    intro: "入门",
    intermediate: "进阶",
    advanced: "高阶",
  }[paper.difficulty];

  return (
    <Link
      href={`/papers/${paper.id}`}
      className="block rounded-xl border border-bg-warm/70 bg-white/40 p-4 transition hover:border-accent/40 hover:bg-bg-subtle/70"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium leading-snug">{paper.title}</h3>
            <p className="mt-0.5 text-xs text-ink-mute">
              {paper.authors} · {paper.year} · {paper.org}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <span className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
              {CATEGORY_LABELS[paper.category]}
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              paper.difficulty === "intro" ? "bg-moss/20 text-moss" :
              paper.difficulty === "intermediate" ? "bg-accent/20 text-accent" :
              "bg-accent-deep/20 text-accent-deep"
            )}>
              {difficultyLabel}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{paper.keyContribution}</p>
        <div className="flex items-center justify-end gap-2 pt-1 text-xs">
          <span className="text-accent">让卡帕西讲解 →</span>
        </div>
      </div>
    </Link>
  );
}
