// GET /api/hot/daily —— AI 日报列表
import { NextRequest } from "next/server";
import { fetchDailyDigests } from "@/lib/hot/client";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 30;
  const result = await fetchDailyDigests(limit);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
