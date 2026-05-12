// GET /api/hot —— 返回精选热点列表（服务端调 AI HOT,带兜底和缓存）
import { NextRequest } from "next/server";
import { fetchSelectedHotItems } from "@/lib/hot/client";

export const runtime = "nodejs";
export const revalidate = 300; // 5 分钟缓存

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
  const result = await fetchSelectedHotItems(limit);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
