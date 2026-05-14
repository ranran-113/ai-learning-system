// 费曼挑战的服务端调用 —— 调 LLM 生成「10 岁孩子」反问 + 评价
// 客户端不直接调 LLM API,通过 /api/feynman/* 路由

import { callLLM } from "@/lib/llm/client";
import type { ChapterContent } from "@/lib/textbooks/types";
import {
  buildChallengeFromChapter,
  buildChildRolePrompt,
  buildJudgePrompt,
  type FeynmanChallenge,
} from "./prompts";
import type { FeynmanData, FeynmanResult } from "@/lib/langgraph/state";

// 生成挑战(纯本地推导,不调 LLM,免费快)
export function generateChallenge(
  bookId: string,
  chapterId: string,
  chapter: ChapterContent
): FeynmanChallenge {
  return buildChallengeFromChapter(bookId, chapterId, chapter);
}

// 调 LLM 让 AI 扮演 10 岁孩子,根据用户讲解反问 1-2 个问题
export async function generateChildQuestions(
  challenge: FeynmanChallenge,
  userExplanation: string
): Promise<string[]> {
  const prompt = buildChildRolePrompt(challenge, userExplanation);
  const raw = await callLLM(
    [
      { role: "system", content: prompt },
      { role: "user", content: "请按要求输出 1-2 个反问,每个一行,不加任何前缀。" },
    ],
    { temperature: 0.7, maxTokens: 200 }
  );
  // 按行拆,去空,最多取 2 条
  const lines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 100)
    .slice(0, 2);
  // fallback:如果 LLM 没返回有效内容,给一个默认反问
  if (lines.length === 0) {
    return ["我有个问题:你刚才说的那个我没听懂,能再说一遍吗?"];
  }
  return lines;
}

// 调 LLM 让 LLM-as-Judge 给整轮评价
export async function judgeFeynman(
  challenge: FeynmanChallenge,
  userExplanation: string,
  childQuestions: string[],
  userFollowUps: string[],
  chapterSummary: string
): Promise<{
  result: FeynmanResult;
  review: string;
  highlights: string[];
  gaps: string[];
}> {
  const prompt = buildJudgePrompt(
    challenge,
    userExplanation,
    childQuestions,
    userFollowUps,
    chapterSummary
  );
  const raw = await callLLM(
    [
      { role: "system", content: prompt },
      { role: "user", content: "请按严格 JSON 格式输出评价。" },
    ],
    { temperature: 0.3, maxTokens: 400 }
  );
  // 尝试解析 JSON
  try {
    // LLM 可能在 JSON 前后加 ```json,先剥
    const jsonText = raw.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(jsonText);
    return {
      result: (parsed.result || "almost") as FeynmanResult,
      review: parsed.review || "评估完成。",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    };
  } catch {
    // 解析失败兜底:默认 almost
    return {
      result: "almost",
      review: raw.slice(0, 200),
      highlights: [],
      gaps: [],
    };
  }
}

// 组装最终的 FeynmanData,用于存到 OutputRecord
export function buildFeynmanData(
  challenge: FeynmanChallenge,
  userExplanation: string,
  childQuestions: string[],
  userFollowUps: string[],
  judgement: { result: FeynmanResult; review: string },
  durationSeconds?: number
): FeynmanData {
  return {
    chapterId: challenge.chapterId,
    challengeQuestion: challenge.question,
    forbiddenTerms: challenge.forbiddenTerms,
    userExplanation,
    childQuestions,
    userFollowUps,
    result: judgement.result,
    aiReview: judgement.review,
    durationSeconds,
  };
}
