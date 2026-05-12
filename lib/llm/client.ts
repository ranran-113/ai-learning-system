// LLM 客户端 —— 用 fetch 直连 OpenAI 兼容 API（DeepSeek / GLM / OpenAI 全部支持）。
// 不依赖任何 SDK，避免 SDK 版本兼容性问题。

const provider = process.env.LLM_PROVIDER || "deepseek";
const apiKey = process.env.LLM_API_KEY || "";
const baseURL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const model = process.env.LLM_MODEL || "deepseek-chat";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  temperature?: number;
  maxTokens?: number;
};

function ensureKey() {
  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY 未配置。本地：检查 .env.local。Vercel：检查 Settings → Environment Variables。"
    );
  }
}

// 非流式调用
export async function callLLM(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  ensureKey();
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
      stream: false,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// 流式调用 —— 用 fetch + ReadableStream 手工解析 SSE
export async function* streamLLM(
  messages: LLMMessage[],
  options: LLMOptions = {}
): AsyncGenerator<string> {
  ensureKey();
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
  }
  if (!res.body) {
    throw new Error("LLM 响应没有 body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 帧按 \n\n 分隔
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const obj = JSON.parse(payload);
        const content = obj.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // 不是有效 JSON,跳过
      }
    }
  }
}

export function getProviderInfo() {
  return { provider, model, baseURL, hasKey: !!apiKey };
}
