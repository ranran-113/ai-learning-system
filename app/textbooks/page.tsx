"use client";

// /textbooks —— 两本教材的入口页
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { TEXTBOOKS, AI_CHAPTERS, AIPM_CHAPTERS } from "@/lib/textbooks/registry";
import { AVAILABLE_CHAPTERS } from "@/lib/textbooks/loader";

export default function TextbooksIndexPage() {
  return (
    <LearningCenterShell current="textbooks">
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">教材</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">两本内置电子教材</h1>
          <p className="text-base leading-relaxed text-ink-soft">
            完整体系化的 AI 与 AIPM 教材，每章都有「教程版」（读）+「对话版」（学）双模式。
            从 0 到个人 AI 系统构建者，无论你是小白还是从业者都能找到自己的位置。
          </p>
        </div>

        <div className="space-y-4">
          <BookCard
            id="ai"
            title={TEXTBOOKS.ai.title}
            subtitle={TEXTBOOKS.ai.subtitle}
            audience={TEXTBOOKS.ai.audience}
            totalChapters={AI_CHAPTERS.length}
            availableChapters={AVAILABLE_CHAPTERS.ai.length}
          />
          <BookCard
            id="aipm"
            title={TEXTBOOKS.aipm.title}
            subtitle={TEXTBOOKS.aipm.subtitle}
            audience={TEXTBOOKS.aipm.audience}
            totalChapters={AIPM_CHAPTERS.length}
            availableChapters={AVAILABLE_CHAPTERS.aipm.length}
          />
        </div>

        <div className="rounded-lg border border-bg-warm/60 bg-bg-subtle/30 p-4 text-xs leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">教材策略</p>
          <p className="mt-1">
            两本教材由 Claude 直接撰写（v0），每章 3500-5500 字。<strong>v0 即放进系统供你阅读</strong>，
            你可以在每章页面提出修改意见，我们一起迭代到 v1 / v2（终版）。
          </p>
          <p className="mt-1">
            每章都配套「让导师讲解」CTA —— 读完教程后直接进入苏格拉底对话，让卡帕西 / 钱学森用问题帮你深化理解。
          </p>
        </div>
      </section>
    </LearningCenterShell>
  );
}

function BookCard({
  id,
  title,
  subtitle,
  audience,
  totalChapters,
  availableChapters,
}: {
  id: string;
  title: string;
  subtitle: string;
  audience: string;
  totalChapters: number;
  availableChapters: number;
}) {
  return (
    <Link
      href={`/textbooks/${id}`}
      className="block rounded-xl border border-bg-warm/70 bg-white/40 p-5 transition hover:border-accent/40 hover:bg-bg-subtle/70"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-medium leading-snug">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <div className="flex-shrink-0 text-right text-xs text-ink-mute">
            <div>{totalChapters} 章</div>
            <div className={availableChapters === totalChapters ? "text-moss" : "text-accent"}>
              已成稿 {availableChapters} / {totalChapters}
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ink-mute">面向：{audience}</p>
      </div>
    </Link>
  );
}
