"use client";

// /textbooks/[bookId]/[chapterId] —— 章节阅读页（tutorial mode）
// 右上角有「让导师讲解」CTA → /learn?source=textbook&id=<book>-<chapter>
//
// v0.4.3 修复:支持 ?from=<lineId> 参数,从学习线进入时返回回学习线
import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LearningCenterShell, type NavKey } from "@/components/learning-center-shell";
import { TEXTBOOKS, getOutline } from "@/lib/textbooks/registry";
import { loadChapter, AVAILABLE_CHAPTERS } from "@/lib/textbooks/loader";
import type { TextbookId, ChapterContent } from "@/lib/textbooks/types";
import { MENTOR_NAMES } from "@/types/mentor";

// 从 from 参数推导:返回链接 / 标签 / 侧边栏高亮
type FromContext = {
  backHref: string;
  backLabel: string;
  navKey: NavKey;
};

function getFromContext(bookId: TextbookId, from: string | null): FromContext {
  // from=ai/aipm/tools/aipm-job → 从学习线进入,返回学习线
  if (from === "ai") return { backHref: "/learn/ai", backLabel: "← 返回 AI 通识学习线", navKey: "line-ai" };
  if (from === "aipm") return { backHref: "/learn/aipm", backLabel: "← 返回 AIPM 学习线", navKey: "line-aipm" };
  if (from === "tools") return { backHref: "/learn/tools", backLabel: "← 返回 AI 工具学习线", navKey: "line-tools" };
  if (from === "aipm-job") return { backHref: "/learn/aipm-job", backLabel: "← 返回 AIPM 求职学习线", navKey: "line-job" };
  // 没有 from 参数 → 默认返回教材目录(老路径,保持兼容)
  return { backHref: `/textbooks/${bookId}`, backLabel: "← 返回目录", navKey: "textbooks" };
}

function ChapterPageInner({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = use(params);
  if (bookId !== "ai" && bookId !== "aipm") notFound();

  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const fromCtx = getFromContext(bookId as TextbookId, from);
  // 「聊」链接也带上 from,这样从教材点「让导师讲解」也能正确返回
  const chatLinkSuffix = from ? `&from=${from}` : "";

  const outline = getOutline(bookId as TextbookId, chapterId);
  if (!outline) notFound();
  const book = TEXTBOOKS[bookId as TextbookId];
  const isAvailable = AVAILABLE_CHAPTERS[bookId as TextbookId].includes(chapterId);

  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    loadChapter(bookId as TextbookId, chapterId).then((c) => {
      setContent(c);
      setLoading(false);
    });
  }, [bookId, chapterId, isAvailable]);

  if (!isAvailable) {
    return (
      <LearningCenterShell current={fromCtx.navKey}>
        <section className="space-y-6">
          <Link href={fromCtx.backHref} className="text-sm text-ink-mute hover:text-ink-soft">
            {fromCtx.backLabel}
          </Link>
          <div className="card space-y-3 text-center">
            <p className="text-base font-medium">本章即将上线</p>
            <p className="text-sm text-ink-soft">
              C{String(outline.index).padStart(2, "0")} · {outline.title}
            </p>
            <p className="text-xs leading-relaxed text-ink-mute">
              教材采用「Claude 直接撰写 + 用户审 / 加料」流程。每轮我完成 3-4 章。这一章在排队，将随下一批一起上线。
            </p>
            <Link href={fromCtx.backHref} className="btn-primary inline-block text-sm">
              看其他章节
            </Link>
          </div>
        </section>
      </LearningCenterShell>
    );
  }

  if (loading) {
    return (
      <LearningCenterShell current={fromCtx.navKey}>
        <p className="py-12 text-center text-sm text-ink-mute">加载中…</p>
      </LearningCenterShell>
    );
  }

  if (!content) {
    return (
      <LearningCenterShell current={fromCtx.navKey}>
        <p className="py-12 text-center text-sm text-ink-mute">加载失败</p>
      </LearningCenterShell>
    );
  }

  return (
    <LearningCenterShell current={fromCtx.navKey}>
      <article className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={fromCtx.backHref} className="text-sm text-ink-mute hover:text-ink-soft">
            {fromCtx.backLabel}
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink-mute">
            <span className="rounded-full bg-bg-warm px-2 py-0.5">
              {content.version === "v0_self"
                ? "Claude 撰稿 v0"
                : content.version === "v0_draft"
                ? "v0 草稿"
                : content.version === "v1_user_edited"
                ? "v1 你已审"
                : "v2 终版"}
            </span>
          </div>
        </div>

        {/* 章节正文 */}
        <div className="prose-zh max-w-none text-ink">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-2 text-3xl font-medium leading-snug">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-8 text-xl font-medium leading-snug border-b border-bg-warm/40 pb-1.5">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-6 text-base font-medium leading-snug">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="my-3 text-[15px] leading-[1.85] text-ink">{children}</p>
              ),
              ul: ({ children }) => <ul className="my-3 ml-5 list-disc space-y-1.5">{children}</ul>,
              ol: ({ children }) => <ol className="my-3 ml-5 list-decimal space-y-1.5">{children}</ol>,
              li: ({ children }) => <li className="text-[15px] leading-[1.85] text-ink">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-accent/40 bg-accent/5 px-4 py-2 text-[15px] leading-[1.85] text-ink-soft">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-medium text-accent-deep">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="rounded bg-bg-warm px-1.5 py-0.5 font-mono text-sm text-ink">
                  {children}
                </code>
              ),
              hr: () => <hr className="my-6 border-bg-warm/60" />,
            }}
          >
            {content.markdown}
          </ReactMarkdown>
        </div>

        {/* 章节末尾的「让导师讲解」CTA */}
        <div className="card space-y-3 border-moss/40 bg-moss/5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-moss">读完了？</p>
            <p className="text-base font-medium">让导师用苏格拉底式问题帮你深化</p>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">
            点下面按钮，进入对话模式。
            {MENTOR_NAMES[content.defaultMentor]} 会基于本章 3 个核心问题深化你的理解，
            最后帮你沉淀一句话进知识库。
          </p>
          <div className="pt-1">
            <Link
              href={`/learn?source=textbook&id=${bookId}-${chapterId}${chatLinkSuffix}`}
              className="btn-primary inline-block text-sm"
            >
              让{MENTOR_NAMES[content.defaultMentor]}陪我讨论
            </Link>
          </div>
        </div>

        {/* 章节元信息 */}
        <details className="text-xs text-ink-mute">
          <summary className="cursor-pointer">本章互动配置（开发用）</summary>
          <div className="mt-3 space-y-2 rounded-lg bg-bg-subtle p-3">
            <div><strong>核心概念:</strong> {content.keyConcepts.join(" / ")}</div>
            <div>
              <strong>苏格拉底起点问题:</strong>
              <ol className="ml-4 list-decimal">
                {content.socraticQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </div>
            <div><strong>输出任务:</strong> {content.outputTask}</div>
            <div><strong>默认导师:</strong> {content.defaultMentor}</div>
          </div>
        </details>
      </article>
    </LearningCenterShell>
  );
}

// 默认 export:用 Suspense 包住,因为 useSearchParams 需要在 Suspense 边界内
export default function ChapterPage(props: { params: Promise<{ bookId: string; chapterId: string }> }) {
  return (
    <Suspense
      fallback={
        <LearningCenterShell current="textbooks">
          <p className="py-12 text-center text-sm text-ink-mute">加载中…</p>
        </LearningCenterShell>
      }
    >
      <ChapterPageInner params={props.params} />
    </Suspense>
  );
}
