// 主流程编排：route → build prompt → stream LLM → validate → (optional) rewrite
// 这是 /api/chat 路由的核心逻辑。
import type { LearningContext, ChatMessage } from "./state";
import type { MentorKey } from "@/types/mentor";
import { routeMentor } from "./router";
import {
  buildLLMMessages,
  validateMentorReply,
  buildRewriteRequest,
} from "@/lib/agents/builders";
import { streamLLM, callLLM } from "@/lib/llm/client";

// 流式输出帧类型
export type StreamFrame =
  | { type: "meta"; mentor: MentorKey; routingReason: string }
  | { type: "chunk"; content: string }
  | { type: "rethink"; reason: string }     // 触发了校验重写
  | { type: "replace"; content: string }    // 重写后的完整内容
  | { type: "done"; usage?: { cacheHit?: number; cacheMiss?: number } }
  | { type: "error"; message: string };

// 处理一轮用户输入,异步生成流式帧
export async function* runChatTurn(
  ctx: LearningContext,
  latestUserMessage: string
): AsyncGenerator<StreamFrame> {
  const decision = routeMentor(ctx, latestUserMessage);
  yield { type: "meta", mentor: decision.mentor, routingReason: decision.reason };

  const messages = buildLLMMessages(decision.mentor, ctx);
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== latestUserMessage) {
    messages.push({ role: "user", content: latestUserMessage });
  }

  const tokenBudget = {
    karpathy: 200,
    qian: 300,
    adler: 200,
  }[decision.mentor];

  // 第一遍：流式输出
  let collected = "";
  try {
    for await (const chunk of streamLLM(messages, {
      temperature: 0.7,
      maxTokens: tokenBudget,
    })) {
      collected += chunk;
      yield { type: "chunk", content: chunk };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM 调用失败";
    yield { type: "error", message };
    return;
  }

  // 第二遍：校验
  const validation = validateMentorReply(decision.mentor, collected);
  if (!validation.valid) {
    yield { type: "rethink", reason: validation.reason || "回复不符合规则" };

    // 用非流式重写一次
    try {
      const rewriteMessages = [
        ...messages,
        ...buildRewriteRequest(decision.mentor, collected, validation.reason || ""),
      ];
      const rewritten = await callLLM(rewriteMessages, {
        temperature: 0.5,  // 重写时温度调低,更守规则
        maxTokens: tokenBudget,
      });
      // 校验重写结果（避免重写也违规）
      const reCheck = validateMentorReply(decision.mentor, rewritten);
      // 即使重写也违规,也用它（避免无限循环）
      yield { type: "replace", content: reCheck.valid ? rewritten : rewritten };
    } catch {
      // 重写失败,保留原版本
    }
  }

  yield { type: "done" };
}

// helper：把 messages 数组归一为 ChatMessage[]
export function appendUserMessage(
  messages: ChatMessage[],
  content: string
): ChatMessage[] {
  return [
    ...messages,
    {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function appendMentorMessage(
  messages: ChatMessage[],
  mentor: MentorKey,
  content: string
): ChatMessage[] {
  return [
    ...messages,
    {
      id: `m-${Date.now()}`,
      role: "mentor",
      mentor,
      content,
      createdAt: new Date().toISOString(),
    },
  ];
}
