"use client";

// /hot —— v0.1.6.1 重构:沿用 AI HOT 站结构
// 三大 tab:精选 / 全部 AI 动态 / AI 日报
// 精选 tab 内分类筛选:全部 / 模型 / 产品 / 行业 / 论文 / 技巧
// 全部 AI 动态:双层筛选（来源 + 分类）
// AI 日报:日期归档列表
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { cn } from "@/lib/utils";
import {
  HOT_CATEGORY_LABELS,
  type HotCategory,
  type HotItem,
  type HotMode,
  type HotSourceFilter,
  type DailyDigest,
} from "@/lib/hot/client";

type MainTab = "selected" | "all" | "daily";

const SOURCE_FILTER_LABELS: Record<HotSourceFilter, string> = {
  all: "全部",
  primary: "一手信源",
  news: "资讯",
  tweet: "推文",
};

export default function HotPage() {
  const [tab, setTab] = useState<MainTab>("selected");
  const [category, setCategory] = useState<HotCategory>("all");
  const [sourceFilter, setSourceFilter] = useState<HotSourceFilter>("all");
  const [searchQ, setSearchQ] = useState("");

  const [items, setItems] = useState<HotItem[]>([]);
  const [dailyList, setDailyList] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (tab === "daily") {
          const res = await fetch("/api/hot/daily?limit=30");
          const data = await res.json();
          setDailyList(data.digests || []);
          setFallback(data.source === "fallback");
        } else {
          const params = new URLSearchParams();
          params.set("mode", tab === "selected" ? "selected" : "all");
          params.set("category", category);
          if (tab === "all") params.set("source", sourceFilter);
          params.set("limit", "30");
          const res = await fetch(`/api/hot?${params.toString()}`);
          const data = await res.json();
          setItems(data.items || []);
          setFallback(data.source === "fallback");
          if (data.source === "fallback") setError(data.error || null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "未知错误");
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, category, sourceFilter]);

  // 客户端搜索
  const filteredItems = useMemo(() => {
    if (!searchQ.trim()) return items;
    const q = searchQ.toLowerCase();
    return items.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.summary.toLowerCase().includes(q) ||
        (x.category || "").toLowerCase().includes(q)
    );
  }, [items, searchQ]);

  return (
    <LearningCenterShell current="hot">
      <section className="space-y-5">
        {/* 标题 */}
        <div className="space-y-1.5">
          <p className="text-sm tracking-wide text-ink-mute">AI 热点学习舱</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">今天的 AI 热点</h1>
          <p className="text-sm text-ink-soft">遇到不懂的，点「让卡帕西讲解」让三导师陪你拆穿它。</p>
        </div>

        {/* 三大 tab */}
        <div className="flex flex-wrap gap-1 border-b border-bg-warm/60">
          <MainTabButton active={tab === "selected"} onClick={() => setTab("selected")} label="✨ 精选" subtitle="AI 自动挑选的高价值内容" />
          <MainTabButton active={tab === "all"} onClick={() => setTab("all")} label="🌐 全部 AI 动态" subtitle="AI 相关资讯全量信息流" />
          <MainTabButton active={tab === "daily"} onClick={() => setTab("daily")} label="📰 AI 日报" subtitle="每日精选汇编" />
        </div>

        {/* 兜底提示 */}
        {fallback && tab !== "daily" && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed text-ink-soft">
            <strong className="font-medium">AI HOT 接口暂时联系不上</strong>，下面是本地示例热点。
            {error && <span className="block text-ink-mute">（{error}）</span>}
          </div>
        )}

        {/* 内容区 */}
        {tab === "daily" ? (
          <DailyView digests={dailyList} loading={loading} fallback={fallback} />
        ) : (
          <ItemsView
            tab={tab}
            items={filteredItems}
            loading={loading}
            category={category}
            onCategoryChange={setCategory}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            searchQ={searchQ}
            onSearchChange={setSearchQ}
          />
        )}

        <p className="pt-2 text-xs text-ink-mute">
          数据来自 AI HOT 精选 (aihot.virxact.com)。热点摘要仅用于学习辅助，重要信息以原文为准。
        </p>
      </section>
    </LearningCenterShell>
  );
}

function MainTabButton({
  active,
  onClick,
  label,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2.5 text-left transition",
        active ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"
      )}
    >
      <div className={cn("text-sm", active && "font-medium")}>{label}</div>
      <div className="mt-0.5 text-xs text-ink-mute">{subtitle}</div>
    </button>
  );
}

function ItemsView({
  tab,
  items,
  loading,
  category,
  onCategoryChange,
  sourceFilter,
  onSourceFilterChange,
  searchQ,
  onSearchChange,
}: {
  tab: MainTab;
  items: HotItem[];
  loading: boolean;
  category: HotCategory;
  onCategoryChange: (c: HotCategory) => void;
  sourceFilter: HotSourceFilter;
  onSourceFilterChange: (s: HotSourceFilter) => void;
  searchQ: string;
  onSearchChange: (q: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* 全部 AI 动态:双层筛选第一行（来源）*/}
      {tab === "all" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-mute">来源：</span>
          {(Object.keys(SOURCE_FILTER_LABELS) as HotSourceFilter[]).map((s) => (
            <FilterChip
              key={s}
              active={sourceFilter === s}
              onClick={() => onSourceFilterChange(s)}
              label={SOURCE_FILTER_LABELS[s]}
            />
          ))}
        </div>
      )}

      {/* 分类筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-mute">分类：</span>
        {(Object.keys(HOT_CATEGORY_LABELS) as HotCategory[]).map((c) => (
          <FilterChip
            key={c}
            active={category === c}
            onClick={() => onCategoryChange(c)}
            label={HOT_CATEGORY_LABELS[c]}
          />
        ))}
      </div>

      {/* 搜索 */}
      <input
        type="text"
        value={searchQ}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索标题 / 摘要…"
        className="w-full rounded-full border border-bg-warm/70 bg-white/60 px-4 py-2 text-sm focus:border-accent/40 focus:outline-none"
      />

      {/* 列表 */}
      {loading ? (
        <div className="py-12 text-center text-sm text-ink-mute">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-bg-warm border-t-accent" />
          加载中…
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-mute">这个筛选下没有内容</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <HotItemCard key={item.id} item={item} isSelected={tab === "selected"} />
          ))}
        </div>
      )}
    </div>
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

function HotItemCard({ item, isSelected }: { item: HotItem; isSelected: boolean }) {
  return (
    <Link
      href={`/hot/${encodeURIComponent(item.id)}`}
      className="block rounded-xl border border-bg-warm/70 bg-white/40 p-4 transition hover:border-accent/40 hover:bg-bg-subtle/70"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-medium leading-snug">{item.title}</h3>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {item.category && (
              <span className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
                {item.category}
              </span>
            )}
            {isSelected && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                ✨ 精选
              </span>
            )}
          </div>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{item.summary}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {item.publishedAt && (
            <span className="text-ink-mute">{formatDate(item.publishedAt)}</span>
          )}
          <span className="text-accent">让卡帕西讲解 →</span>
        </div>
      </div>
    </Link>
  );
}

function DailyView({
  digests,
  loading,
  fallback,
}: {
  digests: DailyDigest[];
  loading: boolean;
  fallback: boolean;
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-ink-mute">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-bg-warm border-t-accent" />
        加载中…
      </div>
    );
  }

  // 按月分组
  const grouped = useMemo(() => {
    const map = new Map<string, DailyDigest[]>();
    for (const d of digests) {
      const ym = d.date.slice(0, 7); // YYYY-MM
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(d);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [digests]);

  return (
    <div className="space-y-6">
      {fallback && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed text-ink-soft">
          <strong className="font-medium">AI HOT 日报接口暂时不可用</strong>，下面显示最近 7 天的占位列表。
          接口恢复后会显示真实日报。
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-mute">暂无日报</p>
      ) : (
        grouped.map(([ym, items]) => (
          <div key={ym} className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-ink-soft">
              {ym.replace("-", "年 ")} 月
              <span className="ml-2 text-xs text-ink-mute">{items.length}</span>
            </h3>
            <div className="space-y-2">
              {items.map((d) => (
                <a
                  key={d.date}
                  href={d.url || "#"}
                  target={d.url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={cn(
                    "block rounded-lg border border-bg-warm/70 bg-white/40 p-4 transition",
                    d.url ? "hover:border-accent/40 hover:bg-bg-subtle/70" : "opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{d.title || d.volume || "AI 日报"}</p>
                      <p className="mt-0.5 text-xs text-ink-mute">
                        {d.date}
                        {d.storiesCount && ` · ${d.storiesCount} stories`}
                      </p>
                    </div>
                    {d.url && <span className="flex-shrink-0 text-xs text-accent">查看 →</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
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
