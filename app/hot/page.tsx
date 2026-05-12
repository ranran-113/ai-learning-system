import Link from "next/link";
import { fetchSelectedHotItems } from "@/lib/hot/client";

// 服务端组件：在服务器上抓 AI HOT 数据，自带 5 分钟缓存
export const revalidate = 300;

export default async function HotPage() {
  const { items, source, error } = await fetchSelectedHotItems(20);

  return (
    <main className="container-narrow py-8">
      <header className="mb-8">
        <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 学习中心
        </Link>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">AI 热点学习舱</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            今天的 AI 热点
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            遇到不懂的，点「帮我讲解」让三导师陪你拆穿它。
          </p>
          {source === "fallback" && (
            <div className="rounded border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed text-ink-soft">
              <strong className="font-medium">AI HOT 暂时联系不上</strong>，下面是本地示例热点。
              {error && <span className="block text-ink-mute">（{error}）</span>}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/hot/${encodeURIComponent(item.id)}`}
              className="block rounded-lg border border-bg-warm/70 bg-white/40 p-4 transition hover:border-accent/40 hover:bg-bg-subtle/70"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-medium leading-snug">
                    {item.title}
                  </h3>
                  {item.category && (
                    <span className="flex-shrink-0 rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
                  {item.summary}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
                  {item.publishedAt && (
                    <span>{formatDate(item.publishedAt)}</span>
                  )}
                  <span className="text-accent">点开查看 →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="pt-2 text-xs text-ink-mute">
          数据来自 AI HOT 精选。热点摘要仅用于学习辅助，重要信息以原文为准。
        </p>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffH = Math.floor((now - d.getTime()) / 1000 / 3600);
    if (diffH < 1) return "刚刚";
    if (diffH < 24) return `${diffH} 小时前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} 天前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
