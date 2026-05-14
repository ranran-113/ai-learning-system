// POST /api/feynman/child-question
// 输入: { challenge: FeynmanChallenge, userExplanation: string }
// 输出: { questions: string[] }
//
// 让 AI 扮演 10 岁孩子,根据用户的解释反问 1-2 个最朴素的「为什么 / 我不懂」
import { NextRequest } from "next/server";
import { generateChildQuestions } from "@/lib/feynman/evaluator";
import type { FeynmanChallenge } from "@/lib/feynman/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Req = {
  challenge: FeynmanChallenge;
  userExplanation: string;
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
    const questions = await generateChildQuestions(body.challenge, body.userExplanation);
    return new Response(JSON.stringify({ questions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
