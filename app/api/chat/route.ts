// POST /api/chat —— 三导师对话端点（流式 SSE 输出）。
// 客户端发送 LearningContext，服务端 route_mentor → 调 LLM → 流式返回。
import { NextRequest } from "next/server";
import { runChatTurn } from "@/lib/langgraph/orchestrate";
import type { LearningContext } from "@/lib/langgraph/state";

// 必须用 Node.js runtime（不是 Edge），因为 openai SDK 在 Edge 上可能有问题
export const runtime = "nodejs";
// 因为是流式响应,不能静态化
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  context: LearningContext;
  userMessage: string;
};

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.context || !body.userMessage) {
    return new Response(
      JSON.stringify({ error: "context 和 userMessage 必填" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let turnResult;
  try {
    turnResult = runChatTurn(body.context, body.userMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 用 SSE (Server-Sent Events) 风格的流式响应
  // 第一行：meta（导师 + 路由原因），之后：data 行
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 先发 meta 帧告诉前端是哪位导师
      const meta = JSON.stringify({
        type: "meta",
        mentor: turnResult.activeMentor,
        routingReason: turnResult.routingReason,
      });
      controller.enqueue(encoder.encode(`data: ${meta}\n\n`));

      try {
        for await (const chunk of turnResult.stream) {
          const data = JSON.stringify({ type: "chunk", content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : "LLM 调用失败";
        const errFrame = JSON.stringify({ type: "error", message });
        controller.enqueue(encoder.encode(`data: ${errFrame}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
