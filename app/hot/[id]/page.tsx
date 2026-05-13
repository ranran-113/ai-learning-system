import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchHotItemById } from "@/lib/hot/client";
import { LearningCenterShell } from "@/components/learning-center-shell";

export const revalidate = 300;

export default async function HotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const item = await fetchHotItemById(decodedId);

  if (!item) {
    notFound();
  }

  return (
    <LearningCenterShell current="hot">
      <div className="mb-4">
        <Link href="/hot" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 热点列表
        </Link>
      </div>
      <article className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <span className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
                {item.category}
              </span>
            )}
            {item.publishedAt && (
              <span className="text-xs text-ink-mute">{formatDate(item.publishedAt)}</span>
            )}
          </div>
          <h1 className="text-2xl font-medium leading-snug sm:text-3xl">{item.title}</h1>
        </div>

        <div className="card">
          <p className="text-sm leading-relaxed text-ink-soft">{item.summary}</p>
        </div>

        {/* 帮我讲解 CTA */}
        <div className="card space-y-3 border-moss/40 bg-moss/5">
          <p className="text-sm font-medium">看不懂？让三导师陪你拆穿</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            点下面按钮，进入学习对话。导师会用「是什么 → 解决什么问题 → 和已知什么相似 → 对你有什么启发」的模板带你过一遍，结尾让你用一句话写下你的总结。
          </p>
          <div className="pt-1">
            <Link
              href={`/learn?source=hot_item&id=${encodeURIComponent(item.id)}`}
              className="btn-primary inline-block text-sm"
            >
              帮我讲解
            </Link>
          </div>
        </div>

        {/* 原文链接 */}
        {item.sourceUrl && (
          <div className="text-xs text-ink-mute">
            <p>原文：</p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-accent hover:underline"
            >
              {item.sourceUrl}
            </a>
            <p className="mt-1">
              ⚠️ 热点摘要仅用于学习辅助，重要信息以原文为准。
            </p>
          </div>
        )}
      </article>
    </LearningCenterShell>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
