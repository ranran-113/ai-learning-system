// MVP 12 节微课完整数据。真理源：LESSONS.md。任何改动先改 .md 再同步本文件。
import type { BuiltInLesson } from "@/types/lesson";

export const BUILT_IN_LESSONS: BuiltInLesson[] = [
  // ============= AIPM 主线 L1-L4 =============
  {
    id: "L1",
    courseId: "aipm-main",
    title: "AI 产品和传统产品到底有什么不同",
    category: "aipm",
    targetLevelMin: 2,
    targetLevelMax: 4,
    defaultMentor: "qian",
    summary:
      "AI 产品输出有不确定性、依赖上下文、需要新的评估方法 —— 这是和传统产品最根本的几个不同。",
    keyConcepts: ["输出不确定性", "上下文依赖", "训练数据 vs 用户数据", "评估方法（非 0/1）"],
    socraticQuestions: [
      "你给传统软件按一下「保存」会发生什么？给 AI 发一句话会发生什么？差异在哪？",
      "传统产品需求评审会问什么？AI 产品多了哪个维度？",
      "你的 AI 产品偶尔回答错了 1 次，你怎么定义这是 bug 还是预期内？",
    ],
    outputTask: "用一句话写下传统产品和 AI 产品最大的一个不同（不用全面，写一个就够）",
    extensionRoadmap: [
      { title: "AI 产品的可靠性与置信度设计", status: "phase_2_planned" },
      { title: "AI 产品的评估方法（离线 / 在线 / A/B 测试）", status: "phase_2_planned" },
      { title: "AI 产品的成本结构与商业模型", status: "phase_2_planned" },
    ],
  },
  {
    id: "L2",
    courseId: "aipm-main",
    title: "AI 产品需求分析：从模糊愿景到可做需求",
    category: "aipm",
    targetLevelMin: 3,
    targetLevelMax: 5,
    defaultMentor: "qian",
    summary:
      "AI 产品的需求分析不是把「老板说要做 AI」翻译成功能列表，是先回答「用户场景是什么、AI 在里面扮演什么角色、失败时怎么办」。",
    keyConcepts: ["用户场景 + AI 角色定义", "输入 / 输出契约", "失败 mode 设计", "什么不交给 AI"],
    socraticQuestions: [
      "老板说「我们要做一个 AI 客服」。你的第一个问题会是什么？",
      "AI 客服处理不了的场景，你怎么设计兜底？",
      "你怎么判断这个需求适合用 AI，还是该用规则引擎？",
    ],
    outputTask: "选一个你最近想做的 AI 功能，写出：用户场景 1 句 + AI 角色 1 句 + 失败兜底 1 句",
    extensionRoadmap: [
      { title: "写 AI PRD：从需求到一份可落地的文档", status: "phase_2_planned" },
      { title: "用户研究方法在 AI 产品中的适配", status: "phase_2_planned" },
      { title: "AI 功能优先级判断框架", status: "phase_2_planned" },
    ],
  },
  {
    id: "L3",
    courseId: "aipm-main",
    title: "Prompt 产品化：把 Prompt 当产品来设计",
    category: "aipm",
    targetLevelMin: 3,
    targetLevelMax: 5,
    defaultMentor: ["karpathy", "qian"],
    summary:
      "你自己用的 Prompt 和产品里的 Prompt 不是同一种东西。产品 Prompt 要应对 10 个不同用户，需要角色 + 任务 + 约束 + 输出格式四段式结构。",
    keyConcepts: [
      "System Prompt vs User Prompt",
      "四段式：角色 + 任务 + 约束 + 输出格式",
      "Prompt 版本管理",
      "评估与迭代",
    ],
    socraticQuestions: [
      "（卡帕西）所谓 Prompt，其实就是 X 给 Y。你来填一下 X 和 Y 是什么？",
      "同一个 Prompt 给 10 个不同用户用，你怎么让它对每个人都有效？",
      "你自己写 Prompt 第一行是「请帮我…」，但产品里的 Prompt 第一行通常写什么？为什么？",
    ],
    outputTask: "选一个你常用的 Prompt，把它升级成「角色 + 任务 + 约束 + 输出格式」四段式版本",
    extensionRoadmap: [
      { title: "Prompt 评估与迭代：你怎么知道改得更好了", status: "phase_2_planned" },
      { title: "Prompt 版本管理与 A/B 测试", status: "phase_2_planned" },
      { title: "多语言 / 多场景 Prompt 设计", status: "phase_2_planned" },
    ],
  },
  {
    id: "L4",
    courseId: "aipm-main",
    title: "Agent 产品设计入门：从工作流到 Agent",
    category: "aipm",
    targetLevelMin: 5,
    targetLevelMax: 7,
    defaultMentor: "qian",
    summary:
      "Agent 不是「更高级的 Prompt」，是给 AI 决策权。设计 Agent 等于设计三件事：什么时候它能决策、它有哪些工具、它带着什么上下文。",
    keyConcepts: [
      "单 Prompt → 工作流 → Agent 的进化",
      "Agent 三件套：决策 + 工具 + 上下文",
      "何时不用 Agent",
      "Agent 评估",
    ],
    socraticQuestions: [
      "工作流和 Agent 最大的区别是什么？提示：想想 if/else 在哪。",
      "Agent 有「决策权」，这个权力从哪里来？是 Prompt 给的还是别的？",
      "你设计一个 Agent，最先想清楚的应该是什么？",
    ],
    outputTask: "画一个你想做的 Agent：决策点 + 工具 + 上下文（三个框，文字写或画图都行）",
    extensionRoadmap: [
      { title: "Agent 评估方法：可靠性 / 完成度 / 安全性", status: "phase_2_planned" },
      { title: "多 Agent 协作系统设计", status: "phase_2_planned" },
      { title: "Agent 失败模式与兜底机制", status: "phase_2_planned" },
    ],
  },

  // ============= AI 技术基础 L5-L7 =============
  {
    id: "L5",
    courseId: "ai-tech-foundation",
    title: "大模型究竟是什么：祛魅 + 最小可跑版本",
    category: "ai_tech",
    targetLevelMin: 0,
    targetLevelMax: 3,
    defaultMentor: "karpathy",
    summary:
      "大模型在做一件特别简单的事：根据前文，猜下一个词。所谓「智能」是这件简单的事在海量文本上做到极致后的副作用。",
    keyConcepts: [
      "大模型 = 在大量文本上做下一个词预测",
      "训练 vs 推理",
      "为什么会「看起来理解」",
      "大模型不是搜索引擎",
    ],
    socraticQuestions: [
      "我说「今天天气真…」你会猜下一个字是什么？大模型在做的事和这个有什么不同？",
      "大模型回答你时，它「知道」答案吗？还是在做别的？",
      "为什么它有时候胡说八道，但又看起来很流畅？",
    ],
    outputTask: "用一句你身边小孩能听懂的话，解释「大模型是什么」",
    extensionRoadmap: [
      { title: "大模型训练全流程：从预训练到 RLHF", status: "phase_2_planned" },
      { title: "模型能力地图：参数量 vs 能力的非线性", status: "phase_2_planned" },
      { title: "大模型的限制：幻觉 / 偏见 / 知识截止", status: "phase_2_planned" },
    ],
  },
  {
    id: "L6",
    courseId: "ai-tech-foundation",
    title: "RAG：为什么 AI 需要你给它资料",
    category: "ai_tech",
    targetLevelMin: 2,
    targetLevelMax: 4,
    defaultMentor: "karpathy",
    summary:
      "AI 不知道今天的新闻，也不知道你公司的内部资料。RAG 解决的是「让 AI 在回答前先看一份你给的资料」这件事。",
    keyConcepts: [
      "模型知识有截止日期",
      "模型不知道你的私有数据",
      "RAG = 检索 + 生成",
      "向量搜索的直觉（不深入）",
    ],
    socraticQuestions: [
      "你问 AI 「今天的新闻是什么」，它能回答吗？为什么？",
      "假设你能在 AI 回答前先塞给它一份资料，会怎样？这件事有个名字。",
      "RAG 解决了哪类问题，又解决不了哪类问题？",
    ],
    outputTask: "用一句话回答：什么样的任务 RAG 帮得上，什么样的任务 RAG 帮不上",
    extensionRoadmap: [
      { title: "RAG 进阶：分块策略 / Embedding 选择 / 重排", status: "phase_2_planned" },
      { title: "图 RAG / Agentic RAG：当传统 RAG 不够用", status: "phase_2_planned" },
      { title: "RAG vs 长上下文窗口：何时用哪个", status: "phase_2_planned" },
    ],
  },
  {
    id: "L7",
    courseId: "ai-tech-foundation",
    title: "Agent 和工作流：让 AI 多步做事",
    category: "ai_tech",
    targetLevelMin: 3,
    targetLevelMax: 5,
    defaultMentor: ["karpathy", "qian"],
    summary:
      "单次 Prompt 让 AI 做一件事，工作流让 AI 按固定顺序做多件事，Agent 让 AI 自己决定下一件事做什么。三者层层升级。",
    keyConcepts: ["单步调用 vs 多步任务", "工作流（固定 graph）", "Agent（动态决策）", "工具调用"],
    socraticQuestions: [
      "让 AI 「写一篇文章」是一步还是多步？「订一张机票」呢？",
      "如果你写死了「先查天气，再写日程，再发邮件」，这是工作流还是 Agent？",
      "Agent 怎么知道下一步该干什么？",
    ],
    outputTask: "把你最近想让 AI 帮你做的一个多步任务拆成 3 步，标出哪一步是 Agent 自己决定的",
    extensionRoadmap: [
      { title: "LangGraph 实战：搭一个能跑的多步骤工作流", status: "phase_2_planned" },
      { title: "Agent 的记忆系统：短期 / 长期 / 工作记忆", status: "phase_2_planned" },
      { title: "工具调用设计：MCP 与函数调用", status: "phase_2_planned" },
    ],
  },

  // ============= AI 能力等级进阶 L8-L10 =============
  {
    id: "L8",
    courseId: "ai-level-progression",
    title: "Lv.1→Lv.2 学会有效提问——「会问」到底是什么",
    category: "ai_level",
    targetLevelMin: 1,
    targetLevelMax: 2,
    defaultMentor: "karpathy",
    summary:
      "大部分人第一轮问 AI 都答不好，然后第二轮补一句话就好了。这节课的目标：把第二轮要说的话挪到第一轮。",
    keyConcepts: ["上下文充足度", "追问的力量", "信息密度", "告诉 AI「你是谁」"],
    socraticQuestions: [
      "你最近一次问 AI，觉得答得不满意 —— 是 AI 的问题，还是问题本身？",
      "假设 AI 是新来的实习生，你要给它什么背景它才能帮你写好这份报告？",
      "AI 没答好你的第二句话通常是什么？能不能把第二句挪到第一句？",
    ],
    outputTask: "选一个你最近问过 AI 的差问题，重写它（把你第二轮才说的话挪到第一轮）",
    extensionRoadmap: [
      { title: "高效提问的 5 个模式", status: "phase_2_planned" },
      { title: "用 AI 反向帮你提问：元提问技巧", status: "phase_2_planned" },
      { title: "Lv.2→Lv.3 衔接：从「会问」到「会控制」", status: "phase_2_planned" },
    ],
  },
  {
    id: "L9",
    courseId: "ai-level-progression",
    title: "Lv.2→Lv.3 控制 AI 输出：结构化 Prompt 实战",
    category: "ai_level",
    targetLevelMin: 2,
    targetLevelMax: 3,
    defaultMentor: "karpathy",
    summary:
      "AI 不按你想的方式输出，通常不是 AI 的问题，是你没说清楚要什么格式、什么语气、什么长度、不确定时怎么办。",
    keyConcepts: [
      "格式约束（JSON / Markdown / 分段）",
      "长度约束",
      "语气与角色",
      "拒绝条件（资料不足时你应该…）",
    ],
    socraticQuestions: [
      "你让 AI 写东西，它给你 800 字但你只要 200 字 —— 问题出在哪？",
      "「专业一点」和「写得像 30 年律师」哪个更可控？",
      "怎么让 AI 在不确定时说「我不知道」而不是编一个？",
    ],
    outputTask:
      "写一个 Prompt，要求 AI 在 100 字以内、以「资深 AIPM」语气、用 Markdown 表格输出，资料不足时主动说",
    extensionRoadmap: [
      { title: "JSON / 结构化输出的 5 个坑", status: "phase_2_planned" },
      { title: "让 AI 自我检查与修正", status: "phase_2_planned" },
      { title: "Lv.3→Lv.4 衔接：跨场景使用 AI", status: "phase_2_planned" },
    ],
  },
  {
    id: "L10",
    courseId: "ai-level-progression",
    title: "Lv.4→Lv.5 搭建你的第一个 AI 工作流",
    category: "ai_level",
    targetLevelMin: 4,
    targetLevelMax: 5,
    defaultMentor: "qian",
    summary:
      "你已经用 AI 做过很多事，但每次都从零开始问。Lv.5 的核心动作是：把重复任务沉淀成「模板 + 资料库 + 固定流程」。",
    keyConcepts: ["重复任务识别", "Prompt 模板化", "资料库构建", "流程固化"],
    socraticQuestions: [
      "你最近一周用 AI 重复做了哪件事 ≥ 3 次？",
      "这件事的「变量」是什么，「不变量」是什么？",
      "如果写一个模板，下次只填变量就能跑，这个模板长什么样？",
    ],
    outputTask: "找一个你做过 ≥ 3 次的 AI 任务，写出它的「模板 Prompt」+ 需要填的 3 个变量",
    extensionRoadmap: [
      { title: "AI 工作流的 5 个常见模式", status: "phase_2_planned" },
      { title: "工作流的版本管理与协作", status: "phase_2_planned" },
      { title: "Lv.5→Lv.6 衔接：从工作流到 Agent", status: "phase_2_planned" },
    ],
  },

  // ============= AI 论文导读 L11 =============
  {
    id: "L11",
    courseId: "ai-paper-reading",
    title: "InstructGPT 与 RLHF：为什么 ChatGPT 听得懂你说话",
    category: "paper",
    targetLevelMin: 4,
    targetLevelMax: 7,
    defaultMentor: "karpathy",
    summary:
      "GPT-3 已经存在两年，ChatGPT 才让 AI 真正进入大众视野。中间发生的事叫 RLHF。这节课用一篇论文讲清楚「为什么 ChatGPT 比 GPT-3 好用」。",
    keyConcepts: [
      "GPT-3 vs InstructGPT 的差异",
      "SFT（监督微调）",
      "RLHF（人类反馈强化学习）",
      "「对齐」是什么",
    ],
    socraticQuestions: [
      "你觉得 ChatGPT 一开始就能像现在这样聊天吗？它比 GPT-3 多了什么？",
      "想象你怎么教一个小孩「不要说脏话」？这个过程和 RLHF 有什么像？",
      "对 AIPM 来说，知道 RLHF 能让你做出什么不一样的产品决策？",
    ],
    outputTask: "用一句话向你的非技术同事解释「为什么 ChatGPT 比 GPT-3 好用」",
    extensionRoadmap: [
      { title: "Constitutional AI：另一种对齐路径", status: "phase_2_planned" },
      { title: "DPO 与新的偏好学习方法", status: "phase_2_planned" },
      { title: "RLHF 的局限与下一代方法", status: "phase_2_planned" },
    ],
  },

  // ============= AI 热点学习示例 L12 =============
  {
    id: "L12",
    courseId: "ai-hot-example",
    title: "Claude Skills 是什么——一个具体热点怎么变成学习",
    category: "hot",
    targetLevelMin: 5,
    targetLevelMax: 7,
    defaultMentor: ["karpathy", "qian"],
    summary:
      "双重身份：既是一节真课，也是「热点 → 学习」流程的标准模板。是什么 → 解决什么问题 → 和已知什么相似/不同 → 对 AIPM 的启发 → 一句话总结。",
    keyConcepts: ["Skill = 可触发的能力封装", "Skill vs Prompt vs Agent", "Agent 产品化趋势", "对 AIPM 的启发"],
    socraticQuestions: [
      "Skill 看起来是新东西，但本质上它和 Prompt / Custom Instruction 有什么相同和不同？",
      "如果你能给 Claude 装 5 个 Skill，你会装什么？为什么不直接写 5 个长 Prompt？",
      "Skill 这种封装方式，对你做 AI 产品有什么启发？",
    ],
    outputTask: "在 Anthropic 官方 Skills 库里挑一个你看不懂的 Skill，把它的 1 句话用途写出来",
    extensionRoadmap: [
      { title: "MCP（Model Context Protocol）：另一种能力封装", status: "phase_2_planned" },
      { title: "多模态能力对比：GPT-4o / Claude / Gemini", status: "phase_2_planned" },
      { title: "AI 编程工具横评：Cursor / Claude Code / Windsurf", status: "phase_2_planned" },
    ],
  },
];

// 工具函数：根据等级和目标推荐第一节课
export function recommendFirstLesson(
  aiLevel: number,
  pathRecommendation: string
): string {
  // 按 LESSONS.md §8 推荐优先级
  if (pathRecommendation.includes("AI 技术基础")) return "L5";
  if (pathRecommendation.includes("热点") || pathRecommendation.includes("论文")) return "L12";
  if (pathRecommendation.includes("AIPM 主线")) return aiLevel <= 3 ? "L1" : "L2";
  if (pathRecommendation.includes("Agent")) return "L7";
  if (pathRecommendation.includes("卡帕西破冰")) return "L5";

  // 按等级兜底
  if (aiLevel <= 1) return "L5";
  if (aiLevel === 2) return "L8";
  if (aiLevel === 3) return "L9";
  if (aiLevel === 4) return "L10";
  if (aiLevel <= 6) return "L7";
  return "L11";
}

export function getLessonById(id: string): BuiltInLesson | undefined {
  return BUILT_IN_LESSONS.find((l) => l.id === id);
}
