// 主流程编排：route → build prompt → call LLM → return
// 这是 /api/chat 路由的核心逻辑。
import type { LearningContext, ChatMessage } from "./state";
import type { MentorKey } from "@/types/mentor";
import { routeMentor } from "./router";
import { buildLLMMessages } from "@/lib/agents/builders";
import { streamLLM } from "@/lib/llm/client";

export type ChatTurnResult = {
  activeMentor: MentorKey;
  routingReason: string;
  stream: AsyncGenerator<string>;
};

// 处理一轮用户输入,返回(导师选择 + 流式回复)
export function runChatTurn(
  ctx: LearningContext,
  latestUserMessage: string
): ChatTurnResult {
  const decision = routeMentor(ctx, latestUserMessage);
  const messages = buildLLMMessages(decision.mentor, ctx);

  // 把用户最新发言追加进去（注意：ctx.messages 里可能还没包含本轮的 user 消息,所以需要补）
  // 但调用方应该已经把 user 消息加到 ctx.messages 里了。这里做个保险:如果最后一条不是 user,追加。
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== latestUserMessage) {
    messages.push({ role: "user", content: latestUserMessage });
  }

  // 不同导师用不同的字数预算来控制 max_tokens
  const tokenBudget = {
    karpathy: 200,   // 80-120 字 ≈ 100-150 token
    qian: 300,        // ≤150 字
    adler: 200,       // 60-100 字
  }[decision.mentor];

  const stream = streamLLM(messages, {
    temperature: 0.7,
    maxTokens: tokenBudget,
  });

  return {
    activeMentor: decision.mentor,
    routingReason: decision.reason,
    stream,
  };
}

// helper：把 messages 数组归一为 ChatMessage[]（前端 / localStorage 用）
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
