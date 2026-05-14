// POST /api/feynman/judge
// 输入: { challenge, userExplanation, childQuestions, userFollowUps, chapterSummary }
// 输出: { result: "passed" | "almost" | "needs_work", review, highlights, gaps }
//
// LLM-as-Judge 给用户整轮费曼挑战表现打三档评价
import { NextRequest } from "next/server";
import { judgeFeynman } from "@/lib/feynman/evaluator";
import type { FeynmanChallenge } from "@/lib/feynman/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Req = {
  challenge: FeynmanChallenge;
  userExplanation: string;
  childQuestions: string[];
  userFollowUps: string[];
  chapterSummary: string;
};

export async function POST(req: NextRequest) {
  let body: Req;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!body.challenge || !body.userExplanation) {
    return new Response(JSON.stringify({ error: "challenge 和 userExplanation 必填" }), {
      status: 400,
    });
  }

  try {
    const judgement = await judgeFeynman(
      body.challenge,
      body.userExplanation,
      body.childQuestions || [],
      body.userFollowUps || [],
      body.chapterSummary || ""
    );
    return new Response(JSON.stringify(judgement), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
