// GET /api/hot —— 精选 / 全部动态 列表（支持 mode + category + sourceFilter）
import { NextRequest } from "next/server";
import { fetchHotItems } from "@/lib/hot/client";
import type { HotMode, HotCategory, HotSourceFilter } from "@/lib/hot/client";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = (sp.get("mode") || "selected") as HotMode;
  const category = (sp.get("category") || "all") as HotCategory;
  const sourceFilter = (sp.get("source") || "all") as HotSourceFilter;
  const limit = Number(sp.get("limit")) || 30;

  const result = await fetchHotItems({ mode, category, sourceFilter, limit });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
