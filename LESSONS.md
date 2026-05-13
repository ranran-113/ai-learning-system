# LESSONS.md - MVP 12 节微课与延伸路径

当前版本：v0.1.0 MVP 内容定稿版
最后更新：2026-05-11

本文件是 MVP 第一批内置课程的**完整数据源**。后续项目初始化后，本文件内容会被转写到 `lib/courses/built-in-courses.ts`，但本文件作为**人类可读的真理源**长期维护。

任何课程的新增、删除、修改，先改本文件，再同步代码。

---

## 1. 设计原则

每节课不是一次知识传授，是一次完整学习闭环：

```text
导师开场（基于全量 LearningContext）
→ 抛 1 个苏格拉底式问题
→ 用户回答
→ 导师追问 / 提示 / 重构
→ 锁定一个核心概念
→ 重复 2-3 次
→ 要求用户用自己的话输出
→ 保存沉淀
→ 推荐下一节
```

每节课强制满足：

- **建议单次 15-25 分钟**（控制规模，对抗信息过载），但**深入想透不限时长**。系统不会强制结束。一节课可跨多次会话累积（详见 PRD §10.x 沉浸式学习）
- **3-4 个核心概念，不多**（防止灌输）
- **3 个开场苏格拉底问题**（导师起点提示词，后续由 LangGraph 动态生成追问）
- **1 个 5-10 分钟可完成的输出任务**（必出沉淀）
- **明确默认主导师**（卡帕西 / 钱学森；阿德勒只在情绪触发时介入）
- **3 个延伸方向占位**（用于 Phase 2 接续，给用户路线感）

苏格拉底问题不是题库，是导师的**起点提示词** —— 实际对话由 LangGraph 跑出来，会根据用户回答动态生成几十轮追问、提示、小结。

---

## 2. 12 节课总览

| ID | 类别 | 标题 | 目标 Lv | 默认导师 |
|----|------|------|--------|---------|
| L1 | aipm | AI 产品和传统产品到底有什么不同 | 2-4 | 钱学森 |
| L2 | aipm | AI 产品需求分析：从模糊愿景到可做需求 | 3-5 | 钱学森 |
| L3 | aipm | Prompt 产品化：把 Prompt 当产品来设计 | 3-5 | 卡帕西→钱学森 |
| L4 | aipm | Agent 产品设计入门：从工作流到 Agent | 5-7 | 钱学森 |
| L5 | ai_tech | 大模型究竟是什么：祛魅 + 最小可跑版本 | 0-3 | 卡帕西 |
| L6 | ai_tech | RAG：为什么 AI 需要你给它资料 | 2-4 | 卡帕西 |
| L7 | ai_tech | Agent 和工作流：让 AI 多步做事 | 3-5 | 卡帕西→钱学森 |
| L8 | ai_level | Lv.1→Lv.2 学会有效提问——「会问」到底是什么 | 1-2 | 卡帕西 |
| L9 | ai_level | Lv.2→Lv.3 控制 AI 输出：结构化 Prompt 实战 | 2-3 | 卡帕西 |
| L10 | ai_level | Lv.4→Lv.5 搭建你的第一个 AI 工作流 | 4-5 | 钱学森 |
| L11 | paper | InstructGPT 与 RLHF：为什么 ChatGPT 听得懂你说话 | 4-7 | 卡帕西 |
| L12 | hot | Claude Skills 是什么——一个具体热点怎么变成学习 | 5-7 | 卡帕西→钱学森 |

---

## 3. 第一部分：AIPM 主线（4 节）

### L1 · AI 产品和传统产品到底有什么不同

- **id**: `L1`
- **courseId**: `aipm-main`
- **category**: `aipm`
- **targetLevelMin / Max**: 2 / 4
- **defaultMentor**: `qian`
- **summary**: AI 产品输出有不确定性、依赖上下文、需要新的评估方法 —— 这是和传统产品最根本的几个不同。

**核心概念**：
1. 输出不确定性
2. 上下文依赖
3. 训练数据 vs 用户数据
4. 评估方法（不是 0/1 通过）

**苏格拉底开场问题**（卡帕西/钱学森）：
1. 你给传统软件按一下「保存」会发生什么？给 AI 发一句话会发生什么？差异在哪？
2. 传统产品需求评审会问什么？AI 产品多了哪个维度？
3. 你的 AI 产品偶尔回答错了 1 次，你怎么定义这是 bug 还是预期内？

**输出任务**：用一句话写下传统产品和 AI 产品最大的一个不同（不用全面，写一个就够）。

**延伸方向**（Phase 2 占位）：
1. AI 产品的可靠性与置信度设计
2. AI 产品的评估方法（离线 / 在线 / A/B 测试）
3. AI 产品的成本结构与商业模型

---

### L2 · AI 产品需求分析：从模糊愿景到可做需求

- **id**: `L2`
- **courseId**: `aipm-main`
- **category**: `aipm`
- **targetLevelMin / Max**: 3 / 5
- **defaultMentor**: `qian`
- **summary**: AI 产品的需求分析不是把「老板说要做 AI」翻译成功能列表，是先回答「用户场景是什么、AI 在里面扮演什么角色、失败时怎么办」。

**核心概念**：
1. 用户场景 + AI 角色定义
2. 输入 / 输出契约
3. 失败 mode 设计
4. "什么不交给 AI"

**苏格拉底开场问题**：
1. 老板说"我们要做一个 AI 客服"。你的第一个问题会是什么？
2. AI 客服处理不了的场景，你怎么设计兜底？
3. 你怎么判断这个需求适合用 AI，还是该用规则引擎？

**输出任务**：选一个你最近想做的 AI 功能，写出：用户场景 1 句 + AI 角色 1 句 + 失败兜底 1 句。

**延伸方向**（Phase 2 占位）：
1. 写 AI PRD：从需求到一份可落地的文档
2. 用户研究方法在 AI 产品中的适配
3. AI 功能优先级判断框架

---

### L3 · Prompt 产品化：把 Prompt 当产品来设计

- **id**: `L3`
- **courseId**: `aipm-main`
- **category**: `aipm`
- **targetLevelMin / Max**: 3 / 5
- **defaultMentor**: `karpathy`（祛魅）→ `qian`（落地）
- **summary**: 你自己用的 Prompt 和产品里的 Prompt 不是同一种东西。产品 Prompt 要应对 10 个不同用户，需要角色 + 任务 + 约束 + 输出格式四段式结构，并且要管理版本、能评估、能迭代。

**核心概念**：
1. System Prompt vs User Prompt
2. 四段式：角色 + 任务 + 约束 + 输出格式
3. Prompt 版本管理
4. 评估与迭代

**苏格拉底开场问题**：
1. （卡帕西）所谓 Prompt，其实就是 X 给 Y。你来填一下 X 和 Y 是什么？
2. 同一个 Prompt 给 10 个不同用户用，你怎么让它对每个人都有效？
3. 你自己写 Prompt 第一行是「请帮我…」，但产品里的 Prompt 第一行通常写什么？为什么？

**输出任务**：选一个你常用的 Prompt，把它升级成「角色 + 任务 + 约束 + 输出格式」四段式版本。

**延伸方向**（Phase 2 占位）：
1. Prompt 评估与迭代：你怎么知道改得更好了
2. Prompt 版本管理与 A/B 测试
3. 多语言 / 多场景 Prompt 设计

---

### L4 · Agent 产品设计入门：从工作流到 Agent

- **id**: `L4`
- **courseId**: `aipm-main`
- **category**: `aipm`
- **targetLevelMin / Max**: 5 / 7
- **defaultMentor**: `qian`
- **summary**: Agent 不是「更高级的 Prompt」，是给 AI 决策权。设计 Agent 等于设计三件事：什么时候它能决策、它有哪些工具、它带着什么上下文。

**核心概念**：
1. 单 Prompt → 工作流 → Agent 的进化
2. Agent 三件套：决策 + 工具 + 上下文
3. 何时不用 Agent
4. Agent 评估

**苏格拉底开场问题**：
1. 工作流和 Agent 最大的区别是什么？提示：想想 if/else 在哪。
2. Agent 有「决策权」，这个权力从哪里来？是 Prompt 给的还是别的？
3. 你设计一个 Agent，最先想清楚的应该是什么？

**输出任务**：画一个你想做的 Agent：决策点 + 工具 + 上下文（三个框，文字写或画图都行）。

**延伸方向**（Phase 2 占位）：
1. Agent 评估方法：可靠性 / 完成度 / 安全性
2. 多 Agent 协作系统设计
3. Agent 失败模式与兜底机制

---

## 4. 第二部分：AI 技术基础（3 节）

### L5 · 大模型究竟是什么：祛魅 + 最小可跑版本

- **id**: `L5`
- **courseId**: `ai-tech-foundation`
- **category**: `ai_tech`
- **targetLevelMin / Max**: 0 / 3
- **defaultMentor**: `karpathy`
- **summary**: 大模型在做一件特别简单的事：根据前文，猜下一个词。所谓「智能」是这件简单的事在海量文本上做到极致后的副作用。

**核心概念**：
1. 大模型 = 在大量文本上做下一个词预测
2. 训练 vs 推理
3. 为什么会"看起来理解"
4. 大模型不是搜索引擎

**苏格拉底开场问题**：
1. 我说「今天天气真…」你会猜下一个字是什么？大模型在做的事和这个有什么不同？
2. 大模型回答你时，它「知道」答案吗？还是在做别的？
3. 为什么它有时候胡说八道，但又看起来很流畅？

**输出任务**：用一句你身边小孩能听懂的话，解释「大模型是什么」。

**延伸方向**（Phase 2 占位）：
1. 大模型训练全流程：从预训练到 RLHF
2. 模型能力地图：参数量 vs 能力的非线性
3. 大模型的限制：幻觉 / 偏见 / 知识截止

---

### L6 · RAG：为什么 AI 需要你给它资料

- **id**: `L6`
- **courseId**: `ai-tech-foundation`
- **category**: `ai_tech`
- **targetLevelMin / Max**: 2 / 4
- **defaultMentor**: `karpathy`
- **summary**: AI 不知道今天的新闻，也不知道你公司的内部资料。RAG 解决的是「让 AI 在回答前先看一份你给的资料」这件事。

**核心概念**：
1. 模型知识有截止日期
2. 模型不知道你的私有数据
3. RAG = 检索 + 生成
4. 向量搜索的直觉（不深入）

**苏格拉底开场问题**：
1. 你问 AI '今天的新闻是什么'，它能回答吗？为什么？
2. 假设你能在 AI 回答前先塞给它一份资料，会怎样？这件事有个名字。
3. RAG 解决了哪类问题，又解决不了哪类问题？

**输出任务**：用一句话回答：什么样的任务 RAG 帮得上，什么样的任务 RAG 帮不上。

**延伸方向**（Phase 2 占位）：
1. RAG 进阶：分块策略 / Embedding 选择 / 重排
2. 图 RAG / Agentic RAG：当传统 RAG 不够用
3. RAG vs 长上下文窗口：何时用哪个

---

### L7 · Agent 和工作流：让 AI 多步做事

- **id**: `L7`
- **courseId**: `ai-tech-foundation`
- **category**: `ai_tech`
- **targetLevelMin / Max**: 3 / 5
- **defaultMentor**: `karpathy`（理解）→ `qian`（设计）
- **summary**: 单次 Prompt 让 AI 做一件事，工作流让 AI 按固定顺序做多件事，Agent 让 AI 自己决定下一件事做什么。三者层层升级。

**核心概念**：
1. 单步调用 vs 多步任务
2. 工作流（固定 graph）
3. Agent（动态决策）
4. 工具调用

**苏格拉底开场问题**：
1. 让 AI 「写一篇文章」是一步还是多步？「订一张机票」呢？
2. 如果你写死了「先查天气，再写日程，再发邮件」，这是工作流还是 Agent？
3. Agent 怎么知道下一步该干什么？

**输出任务**：把你最近想让 AI 帮你做的一个多步任务拆成 3 步，标出哪一步是 Agent 自己决定的。

**延伸方向**（Phase 2 占位）：
1. LangGraph 实战：搭一个能跑的多步骤工作流
2. Agent 的记忆系统：短期 / 长期 / 工作记忆
3. 工具调用设计：MCP 与函数调用

---

## 5. 第三部分：AI 能力等级进阶（3 节）

### L8 · Lv.1→Lv.2 学会有效提问——「会问」到底是什么

- **id**: `L8`
- **courseId**: `ai-level-progression`
- **category**: `ai_level`
- **targetLevelMin / Max**: 1 / 2
- **defaultMentor**: `karpathy`
- **summary**: 大部分人第一轮问 AI 都答不好，然后第二轮补一句话就好了。这节课的目标：把第二轮要说的话挪到第一轮。

**核心概念**：
1. 上下文充足度
2. 追问的力量
3. 信息密度
4. 告诉 AI「你是谁」

**苏格拉底开场问题**：
1. 你最近一次问 AI，觉得答得不满意 —— 是 AI 的问题，还是问题本身？
2. 假设 AI 是新来的实习生，你要给它什么背景它才能帮你写好这份报告？
3. AI 没答好你的第二句话通常是什么？能不能把第二句挪到第一句？

**输出任务**：选一个你最近问过 AI 的差问题，重写它（把你第二轮才说的话挪到第一轮）。

**延伸方向**（Phase 2 占位）：
1. 高效提问的 5 个模式
2. 用 AI 反向帮你提问：元提问技巧
3. Lv.2→Lv.3 衔接：从"会问"到"会控制"（与 L9 互链）

---

### L9 · Lv.2→Lv.3 控制 AI 输出：结构化 Prompt 实战

- **id**: `L9`
- **courseId**: `ai-level-progression`
- **category**: `ai_level`
- **targetLevelMin / Max**: 2 / 3
- **defaultMentor**: `karpathy`
- **summary**: AI 不按你想的方式输出，通常不是 AI 的问题，是你没说清楚要什么格式、什么语气、什么长度、不确定时怎么办。

**核心概念**：
1. 格式约束（JSON / Markdown / 分段）
2. 长度约束
3. 语气与角色
4. 拒绝条件（"资料不足时你应该…"）

**苏格拉底开场问题**：
1. 你让 AI 写东西，它给你 800 字但你只要 200 字 —— 问题出在哪？
2. "专业一点"和"写得像 30 年律师"哪个更可控？
3. 怎么让 AI 在不确定时说"我不知道"而不是编一个？

**输出任务**：写一个 Prompt，要求 AI 在 100 字以内、以「资深 AIPM」语气、用 Markdown 表格输出，资料不足时主动说。

**延伸方向**（Phase 2 占位）：
1. JSON / 结构化输出的 5 个坑
2. 让 AI 自我检查与修正
3. Lv.3→Lv.4 衔接：跨场景使用 AI

---

### L10 · Lv.4→Lv.5 搭建你的第一个 AI 工作流

- **id**: `L10`
- **courseId**: `ai-level-progression`
- **category**: `ai_level`
- **targetLevelMin / Max**: 4 / 5
- **defaultMentor**: `qian`
- **summary**: 你已经用 AI 做过很多事，但每次都从零开始问。Lv.5 的核心动作是：把重复任务沉淀成「模板 + 资料库 + 固定流程」。

**核心概念**：
1. 重复任务识别
2. Prompt 模板化
3. 资料库构建
4. 流程固化

**苏格拉底开场问题**：
1. 你最近一周用 AI 重复做了哪件事 ≥ 3 次？
2. 这件事的"变量"是什么，"不变量"是什么？
3. 如果写一个模板，下次只填变量就能跑，这个模板长什么样？

**输出任务**：找一个你做过 ≥ 3 次的 AI 任务，写出它的「模板 Prompt」+ 需要填的 3 个变量。

**延伸方向**（Phase 2 占位）：
1. AI 工作流的 5 个常见模式
2. 工作流的版本管理与协作
3. Lv.5→Lv.6 衔接：从工作流到 Agent（与 L4 / L7 互链）

---

## 6. 第四部分：AI 论文导读（1 节）

### L11 · InstructGPT 与 RLHF：为什么 ChatGPT 听得懂你说话

- **id**: `L11`
- **courseId**: `ai-paper-reading`
- **category**: `paper`
- **targetLevelMin / Max**: 4 / 7
- **defaultMentor**: `karpathy`
- **summary**: GPT-3 已经存在两年，ChatGPT 才让 AI 真正进入大众视野。中间发生的事叫 RLHF。这节课用一篇论文讲清楚「为什么 ChatGPT 比 GPT-3 好用」。

**选这篇的原因**：解释了「GPT-3 → ChatGPT 跳变」的核心机制，是 AIPM 理解 AI 产品演化最有用的论文之一，技术门槛适中。

**核心概念**：
1. GPT-3 vs InstructGPT 的差异
2. SFT（监督微调）
3. RLHF（人类反馈强化学习）
4. "对齐"是什么

**苏格拉底开场问题**：
1. 你觉得 ChatGPT 一开始就能像现在这样聊天吗？它比 GPT-3 多了什么？
2. 想象你怎么教一个小孩"不要说脏话"？这个过程和 RLHF 有什么像？
3. 对 AIPM 来说，知道 RLHF 能让你做出什么不一样的产品决策？

**输出任务**：用一句话向你的非技术同事解释「为什么 ChatGPT 比 GPT-3 好用」。

**延伸方向**（Phase 2 占位）：
1. Constitutional AI：另一种对齐路径
2. DPO 与新的偏好学习方法
3. RLHF 的局限与下一代方法

---

## 7. 第五部分：AI 热点学习示例（1 节，同时是模板）

### L12 · Claude Skills 是什么——一个具体热点怎么变成学习

- **id**: `L12`
- **courseId**: `ai-hot-example`
- **category**: `hot`
- **targetLevelMin / Max**: 5 / 7
- **defaultMentor**: `karpathy`（祛魅）→ `qian`（启发）
- **summary**: 双重身份：既是一节真课，也是「热点 → 学习」流程的标准模板（让以后所有热点都能套这个结构）。

**模板结构**（任何热点学习都用这套）：

```text
是什么 → 它解决什么问题 → 它和已知的什么相似 / 不同 → 对 AIPM 有什么启发 → 输出一句话总结
```

**核心概念**：
1. Skill = 可触发的能力封装
2. Skill vs Prompt vs Agent
3. Agent 产品化趋势
4. 对 AIPM 的启发

**苏格拉底开场问题**：
1. Skill 看起来是新东西，但本质上它和 Prompt / Custom Instruction 有什么相同和不同？
2. 如果你能给 Claude 装 5 个 Skill，你会装什么？为什么不直接写 5 个长 Prompt？
3. Skill 这种封装方式，对你做 AI 产品有什么启发？

**输出任务**：在 Anthropic 官方 Skills 库里挑一个你看不懂的 Skill，把它的 1 句话用途写出来。

**延伸方向**（Phase 2 占位）：
1. MCP（Model Context Protocol）：另一种能力封装
2. 多模态能力对比：GPT-4o / Claude / Gemini
3. AI 编程工具横评：Cursor / Claude Code / Windsurf

---

## 8. 测试结果 → 首推荐课程的映射规则

用户完成 15 题联合测试后，系统按以下优先级推荐**第一节课**：

### 优先级 1：看 Q13（学习目标）

| Q13 答案 | 首推课程 |
|---------|---------|
| A. 系统理解 AI，从小白入门 | L5（大模型是什么） |
| B. 持续跟进 AI 最新动态、论文、热点 | L12（Skills 示例） |
| C. 学习 AI 产品设计，做 AIPM | 按 aiLevel 走 AIPM 主线（L1 或 L2） |
| D. 学习 Agent / 工作流，自己搭东西 | L7 → L4 |
| E. 把自己的资料 / 项目用 AI 学习消化 | 跳过推荐，引导到 `/materials` |
| F. 还没想好，先体验一下 | 按 aiLevel 走默认路径 |

### 优先级 2：默认路径（按 aiLevel）

| aiLevel | 首推课程 |
|---------|---------|
| Lv.0-1 | L5（祛魅起步） |
| Lv.2 | L8（有效提问） |
| Lv.3 | L9（控制输出） |
| Lv.4 | L10（工作流） |
| Lv.5-6 | L7 → L4（Agent 入门） |
| Lv.7+ | L11 或 L12（论文 / 热点深化） |

### 优先级 3：卡点微调（Q15）

| Q15 currentBlocker | 微调 |
|--------------------|------|
| `output_fear` | 第一节强制以"小输出"任务，文案温和 |
| `motivation` | 第一节由钱学森反向开场（"不学会失去什么"） |
| 其他 | 按默认路径，mentorMix 加权阿德勒 |

---

## 9. 延伸架构

为支持 Phase 2 无痛续接，MVP 阶段已埋好以下延伸钩子：

### 9.1 数据字段（在 `lessons` 表中）

| 字段 | 类型 | 用途 |
|------|------|------|
| `extends_concept_id` | text | 指向另一节课的某个核心概念，表示"我是它的深化"。MVP 不用，Phase 2 启用 |
| `next_recommended_lesson_ids` | text[] | 学完本节后推荐的下一节课 IDs。MVP 课程默认沿 `order_index` 走 |
| `extension_roadmap` | jsonb | 记录该节课的 3 个 Phase 2 占位（见 9.2） |

### 9.2 extensionRoadmap 数据结构

```ts
type ExtensionRoadmapItem = {
  title: string;              // 占位课程标题
  status: "phase_2_planned" | "phase_2_in_progress" | "released";
  releasedLessonId?: string;  // released 状态时,指向实际 lesson id
};
```

MVP 12 节全部 status = `"phase_2_planned"`。当 Phase 2 实际做完某节后，更新对应 status 为 `"released"` 并填入 `releasedLessonId`。

### 9.3 课程结束页 UI 钩子

每节课完成后，页面底部显示：

```text
你刚学完：[本节标题]
下一节：[next_recommended_lesson_id 对应的课]

想深入这个方向？（Phase 2 路线）
- [extensionRoadmap[0].title]   [灰色,即将开放]
- [extensionRoadmap[1].title]   [灰色,即将开放]
- [extensionRoadmap[2].title]   [灰色,即将开放]
```

这个 UI 是用户的"路线感"来源，即使 Phase 2 没动手，用户看到也知道**这只是开端**。

---

## 10. Phase 2 完整延伸课题汇总（36 项）

| 来源 | 延伸课题 |
|------|---------|
| L1 | AI 产品的可靠性与置信度设计 |
| L1 | AI 产品的评估方法（离线 / 在线 / A/B 测试） |
| L1 | AI 产品的成本结构与商业模型 |
| L2 | 写 AI PRD：从需求到一份可落地的文档 |
| L2 | 用户研究方法在 AI 产品中的适配 |
| L2 | AI 功能优先级判断框架 |
| L3 | Prompt 评估与迭代：你怎么知道改得更好了 |
| L3 | Prompt 版本管理与 A/B 测试 |
| L3 | 多语言 / 多场景 Prompt 设计 |
| L4 | Agent 评估方法：可靠性 / 完成度 / 安全性 |
| L4 | 多 Agent 协作系统设计 |
| L4 | Agent 失败模式与兜底机制 |
| L5 | 大模型训练全流程：从预训练到 RLHF |
| L5 | 模型能力地图：参数量 vs 能力的非线性 |
| L5 | 大模型的限制：幻觉 / 偏见 / 知识截止 |
| L6 | RAG 进阶：分块策略 / Embedding 选择 / 重排 |
| L6 | 图 RAG / Agentic RAG：当传统 RAG 不够用 |
| L6 | RAG vs 长上下文窗口：何时用哪个 |
| L7 | LangGraph 实战：搭一个能跑的多步骤工作流 |
| L7 | Agent 的记忆系统：短期 / 长期 / 工作记忆 |
| L7 | 工具调用设计：MCP 与函数调用 |
| L8 | 高效提问的 5 个模式 |
| L8 | 用 AI 反向帮你提问：元提问技巧 |
| L8 | Lv.2→Lv.3 衔接：从"会问"到"会控制" |
| L9 | JSON / 结构化输出的 5 个坑 |
| L9 | 让 AI 自我检查与修正 |
| L9 | Lv.3→Lv.4 衔接：跨场景使用 AI |
| L10 | AI 工作流的 5 个常见模式 |
| L10 | 工作流的版本管理与协作 |
| L10 | Lv.5→Lv.6 衔接：从工作流到 Agent |
| L11 | Constitutional AI：另一种对齐路径 |
| L11 | DPO 与新的偏好学习方法 |
| L11 | RLHF 的局限与下一代方法 |
| L12 | MCP（Model Context Protocol）：另一种能力封装 |
| L12 | 多模态能力对比：GPT-4o / Claude / Gemini |
| L12 | AI 编程工具横评：Cursor / Claude Code / Windsurf |

总计 36 项。Phase 2 可逐项启动，每启动一项就更新对应的 `extensionRoadmap[i].status`。

---

## 11. 课程数据 TypeScript 类型

后续项目初始化后，本文件内容写入 `lib/courses/built-in-courses.ts`：

```ts
import type { BuiltInLesson } from "@/types/lesson";

export const BUILT_IN_LESSONS: BuiltInLesson[] = [
  {
    id: "L1",
    courseId: "aipm-main",
    title: "AI 产品和传统产品到底有什么不同",
    category: "aipm",
    targetLevelMin: 2,
    targetLevelMax: 4,
    defaultMentor: "qian",
    summary: "AI 产品输出有不确定性、依赖上下文、需要新的评估方法 —— 这是和传统产品最根本的几个不同。",
    keyConcepts: [
      "输出不确定性",
      "上下文依赖",
      "训练数据 vs 用户数据",
      "评估方法（非 0/1）"
    ],
    socraticQuestions: [
      "你给传统软件按一下「保存」会发生什么？给 AI 发一句话会发生什么？差异在哪？",
      "传统产品需求评审会问什么？AI 产品多了哪个维度？",
      "你的 AI 产品偶尔回答错了 1 次，你怎么定义这是 bug 还是预期内？"
    ],
    outputTask: "用一句话写下传统产品和 AI 产品最大的一个不同（不用全面，写一个就够）",
    extensionRoadmap: [
      { title: "AI 产品的可靠性与置信度设计", status: "phase_2_planned" },
      { title: "AI 产品的评估方法（离线 / 在线 / A/B 测试）", status: "phase_2_planned" },
      { title: "AI 产品的成本结构与商业模型", status: "phase_2_planned" }
    ]
  },
  // L2 - L12 同结构...
];
```

BuiltInLesson 类型定义见 `TECH.md` §15。

---

## 12. 维护规则

任何对课程的改动，**先改本文件，再同步代码**：

| 操作 | 流程 |
|------|------|
| 新增一节课 | 本文件加 LXX 完整定义 → 同步到 `lib/courses/built-in-courses.ts` → 更新 §2 总览表 |
| 改一节课内容 | 改本文件 → 同步代码 → CHANGELOG 记录 |
| 升级延伸课题状态 | 改对应 LX 的 extensionRoadmap[i].status → 同步代码 |
| Phase 2 实际做出某节 | 创建新 lesson 数据 → 回到原 LX 把 extensionRoadmap[i].status 改为 `"released"` 并填 `releasedLessonId` |

任何产品决策变更（增删课程、改变结构、调整推荐规则）必须先询问项目负责人，符合 `CLAUDE.md` §5 产品决策规则。
