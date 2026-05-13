// POST /api/sediment/draft —— AI 帮用户起草原子笔记（混合沉淀方案 C）。
// 输入:本节 lesson 信息 + 完整对话历史
// 输出:{ title, content, tags }（非流式,一次性返回）
import { NextRequest } from "next/server";
import { callLLM } from "@/lib/llm/client";
import type { BuiltInLesson } from "@/types/lesson";
import type { ChatMessage } from "@/lib/langgraph/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftRequest = {
  lesson: BuiltInLesson;
  messages: ChatMessage[];
};

export async function POST(req: NextRequest) {
  let body: DraftRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const transcript = body.messages
    .map((m) => `${m.role === "user" ? "你" : "导师"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `你是「学习沉淀助手」。基于一节学习对话,帮用户起草一条「原子笔记」。

原子笔记三原则:
1. 去掉导师的表达风格,只留底层逻辑（用用户视角的话）
2. 一条笔记只解决一个问题
3. 脱离对话上下文也能看懂（未来三个月看到这条笔记,不需要回忆当时聊了什么也能用）

你的输出必须是严格的 JSON 格式:
{
  "title": "一句话点明这条笔记解决什么问题（≤ 25 字）",
  "content": "正文,用用户视角的话,3-5 句话（≤ 200 字）。脱离原文也能看懂。",
  "tags": ["#标签1", "#标签2", "#标签3"]
}

标签规则:
- 2-4 个标签
- 用 # 开头
- 用 / 建层级（如 #AI技术/RAG）
- 必须用中文

只输出 JSON,不要 markdown 包裹,不要解释,不要 \`\`\`。`;

  const userPrompt = `本节课:${body.lesson.title}
课程摘要:${body.lesson.summary}
核心概念:${body.lesson.keyConcepts.join("、")}
本节输出任务:${body.lesson.outputTask}

完整对话:
${transcript}

请基于上面的对话,帮用户起草一条原子笔记。输出 JSON。`;

  try {
    const raw = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 600 }
    );
    // 尝试解析 JSON
    let parsed: { title?: string; content?: string; tags?: string[] };
    try {
      // 容错:去掉可能的 markdown 围栏
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      // 解析失败时,把 raw 作为 content,让用户编辑
      parsed = { title: "", content: raw, tags: [] };
    }
    return new Response(
      JSON.stringify({
        title: parsed.title || "",
        content: parsed.content || "",
        tags: parsed.tags || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM 调用失败";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
