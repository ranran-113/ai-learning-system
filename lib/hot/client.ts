// AI HOT API 客户端。详见 TECH.md §11。
// 公开 API,匿名访问,不需要 key。
// 失败兜底:返回本地示例热点。
import type { LessonCategory } from "@/types/lesson";

export type HotItem = {
  id: string;
  title: string;
  summary: string;
  category?: string;
  sourceUrl?: string;
  publishedAt?: string;
  raw?: unknown;
};

export type HotMode = "selected" | "all";
// 精选 / 全部动态 共用的分类标签
export type HotCategory = "all" | "model" | "product" | "industry" | "paper" | "technique";
// 全部动态独有的来源筛选
export type HotSourceFilter = "all" | "primary" | "news" | "tweet";

export type DailyDigest = {
  date: string;          // YYYY-MM-DD
  volume?: string;       // "Vol.2026.05.13"
  storiesCount?: number;
  title?: string;        // 简短描述/精选标题
  url?: string;          // 原日报链接
};

const BASE_URL = process.env.AIHOT_BASE_URL || "https://aihot.virxact.com";

// 中文分类 → API 参数（如果 API 接受英文 key）
export const HOT_CATEGORY_LABELS: Record<HotCategory, string> = {
  all: "全部",
  model: "模型",
  product: "产品",
  industry: "行业",
  paper: "论文",
  technique: "技巧",
};

// 兜底:本地示例热点
const FALLBACK_ITEMS: HotItem[] = [
  {
    id: "fallback-1",
    title: "Claude Skills 发布 —— Anthropic 的能力封装新范式",
    summary: "Anthropic 推出 Skills,允许给 Claude 装上可触发的能力封装。和 Prompt / GPT 自定义指令在概念上有什么不同?对 AI 产品设计有什么启发?",
    category: "产品",
    sourceUrl: "https://www.anthropic.com",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "fallback-2",
    title: "MCP (Model Context Protocol) 正在成为 AI 工具的标准接口",
    summary: "MCP 是 Anthropic 提出的、让 AI 系统接入外部数据和工具的开放协议。Cursor / Claude Code 等已经原生支持。它解决的问题和工具调用是同一类吗?",
    category: "技巧",
    sourceUrl: "https://modelcontextprotocol.io",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "fallback-3",
    title: "DeepSeek-V3 推理速度大幅提升",
    summary: "DeepSeek 最新版本在编码、推理任务上接近顶级模型,但成本只有 1/10。给 AIPM 的启发:成本和能力的关系正在变化,产品定价策略需要重新评估。",
    category: "模型",
    sourceUrl: "https://deepseek.com",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "fallback-4",
    title: "Hermes Agent 开源:7×24 持久化个人 AI Agent 范式",
    summary: "Nous Research 开源的 Hermes Agent 在两个月内获 58k stars。和 Claude Code 比，它是「会进化」的 agent：四层记忆架构 + Skills 自生成 + 数据飞轮。对 AIPM 启发：从工具到基础设施的范式转变。",
    category: "产品",
    sourceUrl: "https://github.com/NousResearch/hermes-agent",
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "fallback-5",
    title: "OpenAI o3 在 ARC-AGI 上首次接近人类水平",
    summary: "o3 在 ARC-AGI 抽象推理 benchmark 上 75-90% 分数,接近人类水平。这是推理模型(reasoning model)路线的关键里程碑。但成本可观:每个任务 ~$20。",
    category: "模型",
    sourceUrl: "https://openai.com",
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// 规范化 AI HOT 返回的字段
function normalize(raw: any): HotItem | null {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || raw._id || raw.uuid || raw.slug;
  const title = raw.title || raw.name || raw.headline;
  const summary = raw.summary || raw.description || raw.excerpt || raw.snippet || "";
  if (!id || !title) return null;
  return {
    id: String(id),
    title: String(title),
    summary: String(summary).slice(0, 500),
    category: raw.category || raw.tag || raw.type,
    sourceUrl: raw.source_url || raw.sourceUrl || raw.url || raw.link,
    publishedAt: raw.published_at || raw.publishedAt || raw.date || raw.created_at,
    raw,
  };
}

// 抓取热点（支持 mode + category + source filter）
export async function fetchHotItems(options: {
  mode?: HotMode;
  category?: HotCategory;
  sourceFilter?: HotSourceFilter;
  limit?: number;
} = {}): Promise<{
  items: HotItem[];
  source: "api" | "fallback";
  error?: string;
}> {
  const { mode = "selected", category = "all", sourceFilter = "all", limit = 30 } = options;
  try {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("limit", String(limit));
    if (category !== "all") params.set("category", category);
    if (sourceFilter !== "all") params.set("source", sourceFilter);

    const url = `${BASE_URL}/api/public/items?${params.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`AI HOT ${res.status}`);
    const data = await res.json();
    const rawList = Array.isArray(data) ? data : data.items || data.data || data.results || [];
    const items: HotItem[] = rawList
      .map(normalize)
      .filter((x: HotItem | null): x is HotItem => x !== null)
      .slice(0, limit);
    if (items.length === 0) {
      // API 返回空,按分类过滤兜底数据
      const filtered = filterFallback(category);
      return { items: filtered, source: "fallback", error: "API 无返回内容" };
    }
    return { items, source: "api" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { items: filterFallback(category), source: "fallback", error: message };
  }
}

// 向后兼容
export const fetchSelectedHotItems = (limit = 20) => fetchHotItems({ mode: "selected", limit });

function filterFallback(category: HotCategory): HotItem[] {
  if (category === "all") return FALLBACK_ITEMS;
  const labelMap: Record<HotCategory, string> = HOT_CATEGORY_LABELS;
  return FALLBACK_ITEMS.filter((i) => i.category === labelMap[category]);
}

export async function fetchHotItemById(id: string): Promise<HotItem | null> {
  const fallback = FALLBACK_ITEMS.find((x) => x.id === id);
  if (fallback) return fallback;
  const { items } = await fetchHotItems({ mode: "selected", limit: 50 });
  if (items.find((x) => x.id === id)) return items.find((x) => x.id === id) || null;
  const allItems = (await fetchHotItems({ mode: "all", limit: 100 })).items;
  return allItems.find((x) => x.id === id) || null;
}

// 抓取每日精选汇编（AI HOT Daily）
export async function fetchDailyDigests(limit = 30): Promise<{
  digests: DailyDigest[];
  source: "api" | "fallback";
}> {
  try {
    const url = `${BASE_URL}/api/public/daily?limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 600 }, // 日报缓存 10 分钟
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.items || data.data || [];
    const digests: DailyDigest[] = list.map((raw: any) => ({
      date: raw.date || raw.published_at || raw.publishedAt || "",
      volume: raw.volume || raw.vol,
      storiesCount: raw.stories_count || raw.storiesCount || raw.count,
      title: raw.title,
      url: raw.url || raw.link,
    })).filter((d: DailyDigest) => d.date);
    if (digests.length === 0) throw new Error();
    return { digests, source: "api" };
  } catch {
    // 兜底:用最近 7 天的日期生成空 digest 列表
    const fallback: DailyDigest[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const ymd = d.toISOString().slice(0, 10);
      fallback.push({
        date: ymd,
        volume: `Vol.${ymd.replace(/-/g, ".")}`,
        title: i === 0 ? "今日精选（待 AI HOT 接口恢复）" : "历史日报",
      });
    }
    return { digests: fallback, source: "fallback" };
  }
}
