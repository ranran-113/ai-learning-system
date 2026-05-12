# HARNESS.md - Agent Harness 升级路线

当前版本：v0.1.4 起点
最后更新：2026-05-12

本文件追踪「三导师 AI 学习成长系统」的 **Agent Harness 工程能力**演进。Karpathy 给的公式：`Agent Quality = Model × Harness`。模型再强，harness 烂就废；模型一般，harness 好也能跑出惊艳效果。

本文件**长期维护**：每个升级项的状态变化都更新这里，**任何想给系统加 harness 能力前先看这份文档**，避免重复发明轮子或漏掉已经规划好的内容。

---

## 1. Harness Engineering 是什么

给 LLM 套一层"骨架"，让它从「单次问答」变成「能持续做事的 agent」。Harness 给 LLM 加上：

- **路由**：什么情况找谁回答
- **记忆**：上下文怎么管理
- **工具**：能不能查东西、跑代码
- **状态机**：现在到流程的哪一步
- **自我检查**：输出是否符合预期，不符合就重试
- **评估**：这一轮做得好不好

---

## 2. 已实现的 Harness 能力（v0.1.3 状态）

| 能力 | 实现位置 | 状态 |
|------|---------|------|
| 多 agent 编排（三 mentor） | `lib/prompts/mentor-personas.ts` | ✅ |
| 动态路由（route_mentor） | `lib/langgraph/router.ts` | ✅ |
| 全量上下文管理（LearningContext） | `lib/langgraph/state.ts` | ✅ |
| 跨 agent 状态传递（接力前缀） | `lib/agents/builders.ts` | ✅ |
| 结构化协议输出（SSE 三帧） | `app/api/chat/route.ts` | ✅ |
| 优雅降级（AI HOT fallback） | `lib/hot/client.ts` | ✅ |
| 会话状态机 | `lib/records/records.ts` | ✅ |
| evidenceConflict 首轮特殊处理 | `lib/langgraph/router.ts` | ✅ |

---

## 3. 7 个升级项 —— 路线图与状态

### #1 输出校验 + 重试

**目标**：mentor 回复超出字数 / 缺少问号 / 违反人格规则时，系统自动让它重写。

**实现方案**：
- 在 `lib/langgraph/orchestrate.ts` 流式结束后跑 `validateMentorReply(mentor, content)`
- 检查项：长度（Karpathy 80-120 / Qian ≤150 / Adler 60-100）、Karpathy 必须含问号
- 失败时给 LLM 发一条"刚才那条不符合规则，请用 X 字内重新说"，非流式取结果
- UI 上首条流式显示后用"调整中..."替换为修正后版本

**状态**：🟢 **v0.1.4 实现中**

---

### #2 Few-shot 示例塞 system prompt

**目标**：给每位 mentor 加 3-5 个高质量真实对话样例，LLM 模仿更准，人格不漂。

**实现方案**：
- 在 `MENTORS.md` 加一节"示例对话"
- 同步到 `lib/prompts/mentor-personas.ts`：每位 mentor 的 system prompt 末尾加 `[示例对话]` 段
- 每个示例：用户问 + 导师正面回答 + 导师反面回答（标"不要这样"）

**状态**：🟡 **v0.1.5 计划**

**为什么不现在做**：需要先有真实对话作为样例素材。让用户用一两次系统、收集"哪些回复让你舒服 / 哪些让你别扭"，再把好的样例固化下来。现在写的样例可能是 LLM 自己的口味，不是真实用户期望。

---

### #3 上下文长度管理（对话压缩）

**目标**：对话超 30 轮自动压缩前面消息为摘要，防止 token 爆炸。

**实现方案**：
- `lib/langgraph/state.ts` 加 `compressedHistory: string` 字段
- 当 `messages.length > 30` 时,触发 `compressHistory(messages)`：调 LLM 把前 N-10 条压成一段摘要,塞进 LearningContext 顶部
- 已压缩的消息从 messages 数组移除

**状态**：🟠 **触发后做**（你的 MVP 测试一节课 10-20 轮,不会触发；上线后如果有用户跑长对话再做）

**为什么不现在做**：DeepSeek-V3 上下文 64K，每轮约 3-5K token，30 轮还远没到上限。提前实现增加触发条件复杂度，且代码不被执行无法验证。

---

### #4 结构化次态决策（mentor 返回 JSON）

**目标**：mentor 不仅返回话，还返回内部判断 —— "用户理解度 0.7" / "建议下一步做输出" / "本节可以结束了"。系统据此触发 UI 提示。

**实现方案**：
- LLM 输出格式改为 JSON：`{ reply: "...", understandingScore: 0-1, nextAction: "deepen" | "summarize" | "request_output" | "switch_topic" }`
- 流式输出 reply，最后一帧带 metadata
- 客户端根据 metadata 触发 UI 提示（如自动弹出输出沉淀框）

**状态**：🟠 **MVP 后做**

**为什么不现在做**：
1. 不知道要哪些决策信号 —— 需要先看用户实际怎么用，才知道哪些次态对体验有帮助
2. 现在加是猜，做出来可能用不上 / 用不对
3. JSON 输出比纯文本输出消耗更多 token，且可能丢失流式的"逐字感"
4. 等 #2（few-shot）做完，自然知道哪些决策是关键

---

### #5 工具调用（tool use / function calling）

**目标**：mentor 能"查"东西：查用户历史输出沉淀、查相关课程、查某主题的最近热点。

**实现方案**：
- 改 agent loop 为多步：think → tool call → observe → think → ...
- 实现工具：
  - `search_user_outputs(query)` → 从 Supabase outputs 表搜
  - `search_lessons(topic)` → 从 12 节课元数据搜
  - `get_user_recent_sessions(limit)` → 从 Supabase sessions 搜
- 使用 OpenAI tool_call 协议（DeepSeek 也支持）
- 改 orchestrate 为支持多步调用

**状态**：🟠 **Supabase 接好+有真实数据后做**

**为什么不现在做**：
1. **没数据源**：mentor 能查"上次你说过什么"才有意义。在 Supabase 接好、用户产生了真实输出沉淀之前，工具没东西可查
2. **改 agent loop 是大工程**：单步 → 多步是结构性变化，回退成本高，得在数据稳定后做
3. **需要先有评估方法**（#7）：工具用对没用对怎么判断？没基线就是瞎调

---

### #6 Prompt Caching

**目标**：DeepSeek 自动缓存识别相同的前缀，把系统 prompt 的不变部分缓存起来，每轮便宜 90%。

**实现方案**：
- 重排 system prompt 结构：把不变的（persona / 通用规则）放最前面，把变的（用户当前状态、对话历史）放后面
- 利用 DeepSeek 自动 prefix caching（不需要显式 API 参数）
- 在 `lib/llm/client.ts` 中记录 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` 用于验证缓存生效

**状态**：🟢 **v0.1.4 实现中**

---

### #7 自动评估 harness

**目标**：跑 50 个测试对话，每周自动测三位 mentor 是不是还在按 system prompt 行事。

**实现方案**：
- 创建 `eval/` 目录
- `eval/test-cases.ts`：50 个测试 prompt，每个标注"应触发哪个 mentor"+"理想回复长度范围"+"理想回复应包含/不应包含的关键词"
- `eval/runner.ts`：跑测试用例,记录每条 result
- `eval/score.ts`：用 LLM-as-judge 给每条评分
- CI 集成（GitHub Actions 定期跑）

**状态**：🟠 **MVP 上线后做**

**为什么不现在做**：
1. 现在没有真实用户对话，无法构造高质量测试用例
2. 没有"现在的质量基线"，无法判断回归
3. 评估系统的设计需要先看产品形态稳定后再做

---

## 4. 总览：什么时候做哪一组？

```text
v0.1.4（当下）       │ #1 输出校验   #6 Prompt caching
                    │
v0.1.5（用过 1-2 次）│ #2 Few-shot
                    │
v0.2 / MVP 上线后    │ #3 上下文压缩  #4 结构化决策  #5 工具调用  #7 自动评估
```

## 5. 维护规则

| 操作 | 流程 |
|------|------|
| 实现一个升级项 | 把 §3 对应项的状态从 🟡/🟠 改为 ✅，标注实现 commit | 
| 发现新的 harness 缺陷 | 在 §3 后追加 #8/#9...，状态默认 🟠 |
| 升级项被推迟 | 修改状态和"为什么不现在做"的理由 |
| 完整升级完成（7 个全 ✅）| 把这一章移到 README.md §8 当前版本状态 |

任何要给系统加 harness 能力的工作，**先检查本文档**：
1. 是不是已经规划过？
2. 当前的状态是？
3. 触发条件是否到了？

如果命中已有升级项，按规划做；如果是新需求，按 §5 加新条目。
