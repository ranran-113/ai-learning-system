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

  // v0.4.5: token 预算放宽 —— 质量优先,不限字数。
  // 200 token ≈ 100 中文字,太紧。给 LLM 足够空间发挥(LLM 自己会按质量原则克制)。
  const tokenBudget = {
    karpathy: 1200,
    qian: 1500,
    adler: 1000,
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

  // 第二遍：校验（注意:本会话第一次 LLM 回复时用更宽松的开场字数限制）
  // 这里 isFirstTurnOfSession 来自 ctx,表示这次 chat call 是不是会话的第一次 LLM 调用
  // ctx.messages 此时还没包含本轮用户消息,所以 length == 1 (只有开场 mentor 消息) 时,这是 LLM 第一次说话
  const isFirstLLMTurn = ctx.messages.length <= 1;
  const validation = validateMentorReply(decision.mentor, collected, isFirstLLMTurn);
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
