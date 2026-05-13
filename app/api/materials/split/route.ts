// POST /api/materials/split —— 调 LLM 把用户上传的资料拆成合成课程。
// 输入: { title, rawText }
// 输出: { summary, syntheticLesson }
import { NextRequest } from "next/server";
import { callLLM } from "@/lib/llm/client";
import type { BuiltInLesson } from "@/types/lesson";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SplitRequest = {
  title: string;
  rawText: string;
};

export async function POST(req: NextRequest) {
  let body: SplitRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const { title, rawText } = body;
  if (!title || !rawText) {
    return new Response(JSON.stringify({ error: "title 和 rawText 必填" }), { status: 400 });
  }
  if (rawText.length > 60000) {
    return new Response(
      JSON.stringify({ error: "文本太长（> 60K 字符）。请分段上传,或先用 NotebookLM 摘要后再传。" }),
      { status: 400 }
    );
  }

  const systemPrompt = `你是「学习内容拆课助手」。基于用户上传的一段资料,把它拆成一节可学习的微课。

输出严格的 JSON,格式:
{
  "summary": "整篇资料的核心要点摘要（150-200 字,用读者视角）",
  "lessonTitle": "本节微课的标题（≤ 30 字,点出读者能学到什么）",
  "lessonSummary": "微课摘要（80 字以内,告诉读者这节要弄清楚什么）",
  "keyConcepts": ["核心概念 1", "核心概念 2", "核心概念 3"],
  "socraticQuestions": [
    "第一个苏格拉底式起点问题（紧扣资料具体内容,而不是空泛）",
    "第二个问题（拆深一层）",
    "第三个问题（联系读者已有经验）"
  ],
  "outputTask": "本节学完用一句话沉淀什么（具体,可执行）",
  "targetLevelMin": 2,
  "targetLevelMax": 5
}

要求:
- summary 要保留资料的关键信息（数字 / 名词 / 结论）,不能空泛
- lessonTitle 不要照搬资料原标题,要点出"学了能拿来用什么"
- keyConcepts 3-4 个,每个 ≤ 8 字
- socraticQuestions 必须紧扣资料里的具体内容（提到某个具体观点 / 数字 / 案例）
- 整个 JSON 必须能被 JSON.parse 解析
- 不要 markdown 包裹,不要解释,不要 \`\`\``;

  const userPrompt = `资料标题: ${title}

资料内容:
${rawText.slice(0, 50000)}${rawText.length > 50000 ? "\n...(已截断)" : ""}

请按系统提示输出 JSON。`;

  try {
    const raw = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    );

    let parsed: any;
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "LLM 输出不是有效 JSON,可能内容太长或太短。试试改一下资料?", raw: raw.slice(0, 500) }),
        { status: 500 }
      );
    }

    // 构造合成 lesson
    const materialId = `material-${Date.now()}`;
    const syntheticLesson: BuiltInLesson = {
      id: materialId,
      courseId: "user-materials",
      title: parsed.lessonTitle || title,
      category: "ai_tech",  // 默认归到技术,用户可在 UI 里改
      targetLevelMin: parsed.targetLevelMin || 2,
      targetLevelMax: parsed.targetLevelMax || 5,
      defaultMentor: ["karpathy", "qian"],
      summary: parsed.lessonSummary || parsed.summary?.slice(0, 80) || title,
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : ["核心概念"],
      socraticQuestions: Array.isArray(parsed.socraticQuestions) && parsed.socraticQuestions.length > 0
        ? parsed.socraticQuestions
        : [`关于「${title}」,你最想弄清楚的是什么?`],
      outputTask: parsed.outputTask || `用一句话写下:「${title}」对你最有用的一点`,
      extensionRoadmap: [],
    };

    return new Response(
      JSON.stringify({
        summary: parsed.summary || "（无摘要）",
        syntheticLesson,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM 调用失败";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
