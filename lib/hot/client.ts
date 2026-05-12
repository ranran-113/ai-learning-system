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

const BASE_URL = process.env.AIHOT_BASE_URL || "https://aihot.virxact.com";

// 兜底:本地示例热点（API 失败时显示，让用户有内容看）
const FALLBACK_ITEMS: HotItem[] = [
  {
    id: "fallback-1",
    title: "Claude Skills 发布 —— Anthropic 的能力封装新范式",
    summary: "Anthropic 推出 Skills,允许给 Claude 装上可触发的能力封装。和 Prompt / GPT 自定义指令在概念上有什么不同?对 AI 产品设计有什么启发?",
    category: "Agent",
    sourceUrl: "https://www.anthropic.com",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "fallback-2",
    title: "MCP (Model Context Protocol) 正在成为 AI 工具的标准接口",
    summary: "MCP 是 Anthropic 提出的、让 AI 系统接入外部数据和工具的开放协议。Cursor / Claude Code 等已经原生支持。它解决的问题和工具调用是同一类吗?",
    category: "协议",
    sourceUrl: "https://modelcontextprotocol.io",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "fallback-3",
    title: "DeepSeek-V4 推理速度大幅提升",
    summary: "DeepSeek 最新版本在编码、推理任务上接近顶级模型,但成本只有 1/10。给 AIPM 的启发:成本和能力的关系正在变化,产品定价策略需要重新评估。",
    category: "模型",
    sourceUrl: "https://deepseek.com",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// 规范化 AI HOT 返回的字段到 HotItem
function normalize(raw: any): HotItem | null {
  if (!raw || typeof raw !== "object") return null;
  // 尝试多种可能的字段名（兼容 API 字段变化）
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

// 抓取精选热点（带兜底）
export async function fetchSelectedHotItems(limit = 20): Promise<{
  items: HotItem[];
  source: "api" | "fallback";
  error?: string;
}> {
  try {
    const url = `${BASE_URL}/api/public/items?mode=selected&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 300 }, // Next.js 缓存 5 分钟
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`AI HOT ${res.status}`);
    }
    const data = await res.json();
    // 兼容多种返回结构
    const rawList = Array.isArray(data) ? data : data.items || data.data || data.results || [];
    const items: HotItem[] = rawList.map(normalize).filter((x: HotItem | null): x is HotItem => x !== null).slice(0, limit);
    if (items.length === 0) {
      return { items: FALLBACK_ITEMS, source: "fallback", error: "API 无返回内容" };
    }
    return { items, source: "api" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { items: FALLBACK_ITEMS, source: "fallback", error: message };
  }
}

export async function fetchHotItemById(id: string): Promise<HotItem | null> {
  // 兜底项直接查
  const fallback = FALLBACK_ITEMS.find((x) => x.id === id);
  if (fallback) return fallback;

  // 否则从列表里找（简单实现:重新拉一次列表）
  const { items } = await fetchSelectedHotItems(50);
  return items.find((x) => x.id === id) || null;
}
