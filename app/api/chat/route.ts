// POST /api/chat —— 三导师对话端点（流式 SSE 输出）。
// 客户端发 LearningContext + userMessage,服务端 route → stream LLM → validate → (maybe rewrite) → 返回流式帧。
import { NextRequest } from "next/server";
import { runChatTurn } from "@/lib/langgraph/orchestrate";
import type { LearningContext } from "@/lib/langgraph/state";

export const runtime = "nodejs";
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendFrame = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        for await (const frame of runChatTurn(body.context, body.userMessage)) {
          sendFrame(frame);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "未知错误";
        sendFrame({ type: "error", message });
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
