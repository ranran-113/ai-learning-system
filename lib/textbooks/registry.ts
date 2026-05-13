// 两本教材的 outline 注册表 —— 总共 32 章
// 这是教材的骨架,实际章节正文由 scripts/generate-chapter.sh 调 DeepSeek 生成
import type { Textbook, ChapterOutline } from "./types";

export const TEXTBOOKS: Record<"ai" | "aipm", Textbook> = {
  ai: {
    id: "ai",
    title: "AI 通识：从零到个人 AI 系统",
    subtitle: "完全小白可读,最终能达 Lv.10",
    audience: "所有想真正理解 AI 的人 —— 不需要任何技术背景",
    totalChapters: 16,
    styleGuide: `
- 像 Karpathy 拆穿黑箱（"所谓 X,其实就是 Y"）
- 像李宏毅口语化深入浅出
- 像 Jay Alammar 用类比和可视化
- 中文母语节奏,不用学术腔
- 不放数学公式,除非必要;放最小可跑示例
- 反常识开场,先打破成见再讲解
- 用第二人称("你"),拉近距离
- 每节都有具体例子或类比
- 章末收束:本章你学到了什么 (不夸张)
`.trim(),
  },
  aipm: {
    id: "aipm",
    title: "AI 产品：从理解到创造",
    subtitle: "面向 AIPM / 想转 AIPM 的人,系统化的工程视角",
    audience: "AIPM 从业者、想转 AIPM 的产品经理、需要懂 AI 产品的工程师/设计师",
    totalChapters: 16,
    styleGuide: `
- Chip Huyen 式工程视角 + Lenny 案例驱动 + 三导师哲学
- 每章都有具体场景:你做某个 AI 产品时,这件事怎么影响决策
- 用真实案例:ChatGPT / Claude / Cursor / Devin / NotebookLM / 国产产品
- 中文母语节奏,术语保留英文原文并括注中文首次出现
- 落到 "你下一步具体做什么"
- 不抒情,克制,工程化
`.trim(),
  },
};

// ============ AI 通识教材 16 章 outline ============
export const AI_CHAPTERS: ChapterOutline[] = [
  {
    id: "c01",
    bookId: "ai",
    index: 1,
    part: "Part I · 看清 AI 这件事",
    title: "AI 不是魔法，也不是电影：60 年简史",
    description: "把「AI」这个词祛魅,看清它走过的路。",
    detailedOutline: `
- 反常识开场:AI 不是 2023 年才有的,它已经经历了三次大热和两次寒冬
- 1956 达特茅斯会议:这个词怎么来的
- 第一波(规则)与第一次寒冬:为什么"专家系统"失败
- 第二波(统计学习/SVM)与第二次寒冬:为什么数据不够还是不行
- 第三波(深度学习):2012 AlexNet 开始的 12 年
- 2022 ChatGPT:为什么这次不一样
- 一个关键观察:AI 进步不是直线,是阶段性突破
- 给读者:不要被"AI 突然爆发"的叙事吓到,这是一场积累的故事
`.trim(),
    targetLevelMin: 0,
    targetLevelMax: 2,
    recommendedMentor: "karpathy",
  },
  {
    id: "c02",
    bookId: "ai",
    index: 2,
    part: "Part I · 看清 AI 这件事",
    title: "大模型在做什么：一切只为猜下一个字",
    description: "祛魅大模型 —— 它在做一件特别简单的事情,做到极致。",
    detailedOutline: `
- 用"今天天气真..."游戏让读者亲身体验"猜下一个字"
- 大模型 = 在万亿规模文本上把"猜下一个字"练到极致
- "智能"是这件事的副作用,不是它的本质
- 对比传统软件:你按"保存"会发生确定的事;大模型每次都是概率采样
- 类比:学了一辈子语言的人,反应是直觉性的,大模型也是
- 解释温度(temperature):为什么有时候它一本正经胡说八道
- 关键洞察:它学的不是知识,是字与字之间的接续规律
- 链接 C3:那它怎么学到的?(预告 Transformer)
`.trim(),
    linkedLessonId: "L5",
    targetLevelMin: 0,
    targetLevelMax: 3,
    recommendedMentor: "karpathy",
  },
  {
    id: "c03",
    bookId: "ai",
    index: 3,
    part: "Part I · 看清 AI 这件事",
    title: "Transformer：AI 大脑长什么样",
    description: "用乐高积木的类比,看穿现代大模型的核心架构。",
    detailedOutline: `
- 反常识:Transformer 不是一个"大脑",是一种"并行的查找规则"
- 类比:开会时你不是按顺序听每个人说,而是听到关键词后回头去关注那个人 = 注意力(attention)
- Self-Attention:每个词同时去"看"句中其他词,决定权重
- 多头注意力:不止一种看法,有多个视角
- 为什么能并行训练 = 为什么大模型时代真正到来
- 类比:RNN 像挨个看每节车厢,Transformer 像直升机俯瞰整列火车
- 不放公式,但说清"注意力的本质是 weighted sum"
- 链接 C4:有了架构,怎么"训练"出聪明
`.trim(),
    targetLevelMin: 1,
    targetLevelMax: 4,
    recommendedMentor: "karpathy",
  },
  {
    id: "c04",
    bookId: "ai",
    index: 4,
    part: "Part I · 看清 AI 这件事",
    title: "训练 vs 推理：AI 怎么学会和怎么回答",
    description: "看穿大模型生命周期的两个阶段。",
    detailedOutline: `
- 反常识:大模型"学习"一次,之后只是查表;它不会越用越聪明(在你这边不会)
- 三阶段训练:Pre-training(预训练) → SFT(监督微调) → RLHF(对齐)
- 预训练:海量互联网文本上猜下一个字,几个月,几千万美元
- SFT:用 Q&A 例子教它"对话格式"
- RLHF:人类标注员给它的回答打分,模型学会"什么是好的回答"
- 推理(Inference):你每次问它,它都是在"采样"一次,不会改变它的参数
- 关键:你跟 ChatGPT 聊得再多,它的"脑子"不变;只有 OpenAI 重训才会变
- 链接:这就是为什么有"上下文"概念(下一节深入)
`.trim(),
    targetLevelMin: 1,
    targetLevelMax: 4,
    recommendedMentor: "karpathy",
  },
  {
    id: "c05",
    bookId: "ai",
    index: 5,
    part: "Part II · 用得起来",
    title: "Prompt 的力量：你问得对它才答得对",
    description: "Lv.1→Lv.3 的核心跨越 —— 从一次性提问到结构化控制。",
    detailedOutline: `
- 反常识:"AI 答不准"通常不是 AI 笨,是你问得不对
- 把 AI 想象成"懂所有知识但刚来公司第一天的实习生"
- 三个层次:零上下文 → 加背景 → 加格式约束 → 加拒绝条件
- 具体例子:让 AI 写产品介绍,从 1 行 prompt 到 4 段式 prompt 的变化
- 角色设定 + 任务 + 约束 + 输出格式
- 进阶:让 AI 先反问你(元提示)
- 关键洞察:好 prompt = 把你脑子里隐含的上下文显式化
- 链接到 RAG:当上下文太多塞不进 prompt 时,我们需要新方法
`.trim(),
    linkedLessonId: "L8",
    targetLevelMin: 1,
    targetLevelMax: 3,
    recommendedMentor: "karpathy",
  },
  {
    id: "c06",
    bookId: "ai",
    index: 6,
    part: "Part II · 用得起来",
    title: "RAG：给 AI 一份资料",
    description: "解决 AI 不知道今天的新闻、不知道你公司资料的问题。",
    detailedOutline: `
- 反常识:RAG 不是让 AI 变聪明,是给它带"资料书"
- 类比:实习生考开卷考试 —— 不需要他全记住,只需要他会查
- 两步:Retrieval(检索) + Generation(生成)
- 检索是怎么做的?向量搜索的直觉(不深入数学)
- 类比:语义搜索 vs 关键词搜索
- chunk(切块)是什么、为什么需要
- RAG 适合什么场景:企业知识库、个人笔记问答、文档 QA
- RAG 不适合什么:需要全局推理(整本书的逻辑结构)
- 链接 Agent:RAG 是一次性查表,Agent 是多步行动
`.trim(),
    linkedLessonId: "L6",
    targetLevelMin: 2,
    targetLevelMax: 4,
    recommendedMentor: "karpathy",
  },
  {
    id: "c07",
    bookId: "ai",
    index: 7,
    part: "Part II · 用得起来",
    title: "Agent：让 AI 多步做事",
    description: "从单次问答到自主完成复杂任务。",
    detailedOutline: `
- 反常识:Agent 不是"更聪明的 AI",是"会循环的 AI"
- 单步:输入→输出(传统 prompt)
- 工作流(Workflow):预定义的固定步骤(先查天气,再写日程)
- Agent:动态决定下一步(ReAct: Thought → Action → Observation → Thought...)
- 类比:Workflow 像菜谱,Agent 像厨师 —— 一个按部就班,一个根据情况随机应变
- Agent 三件套:决策 + 工具 + 上下文
- 例子:让 Agent 帮你"查最新的 AI 论文,总结成中文,发到我的邮箱"
- Agent 的失败模式:循环不停、决策错连锁、工具调用错
- 链接:Multi-Agent 协作(下一节)
`.trim(),
    linkedLessonId: "L7",
    targetLevelMin: 3,
    targetLevelMax: 5,
    recommendedMentor: "karpathy",
  },
  {
    id: "c08",
    bookId: "ai",
    index: 8,
    part: "Part II · 用得起来",
    title: "从一次性使用到工作流",
    description: "Lv.4→Lv.5 的核心跨越 —— 把重复任务沉淀成可复用资产。",
    detailedOutline: `
- 反常识:每次都从零开始问 AI,等于每天从零教一遍同一个实习生
- 工作流 = 模板 + 资料库 + 固定流程
- 三个识别信号:这件事我做过 ≥3 次 / 有固定变量 / 有可复用的"骨架"
- 第一步:把好 prompt 存下来(Prompt 模板)
- 第二步:把常用资料结构化(资料库 / Obsidian / Notion)
- 第三步:把流程固化(脚本 / Agent / Custom GPT)
- 案例:个人 AI 工作流(写文章/做调研/写邮件)
- 关键洞察:这是从"用 AI" 到"用 AI 系统"的转折点
- 链接 Part III:看穿系统而不只是会用
`.trim(),
    linkedLessonId: "L10",
    targetLevelMin: 4,
    targetLevelMax: 5,
    recommendedMentor: "qian",
  },
  {
    id: "c09",
    bookId: "ai",
    index: 9,
    part: "Part III · 看穿系统",
    title: "多 Agent 协作：让 AI 团队替你干活",
    description: "从单个 Agent 到 Agent 团队。",
    detailedOutline: `
- 反常识:多 Agent 不一定比单 Agent 好,大多数场景下单 Agent 已经够用
- 什么时候需要多 Agent:角色分工明确 / 不同视角互补 / 一个 Agent 上下文塞不下
- 经典模式:Orchestrator + Workers(主管 + 执行)
- 例子:我们的产品本身就是多 Agent(卡帕西 / 钱学森 / 阿德勒)
- Agent 之间通信:共享 context vs 消息传递
- 多 Agent 的代价:成本 × N、协调失败、循环不停
- 类比:多 Agent 像项目团队,有沟通成本,不一定比一个全才高效
- 关键洞察:Agent 数量不是产品价值的代理变量
`.trim(),
    targetLevelMin: 4,
    targetLevelMax: 7,
    recommendedMentor: "qian",
  },
  {
    id: "c10",
    bookId: "ai",
    index: 10,
    part: "Part III · 看穿系统",
    title: "大模型的幻觉、偏见、知识截止",
    description: "了解 AI 的三大固有局限,而不是把它当万能。",
    detailedOutline: `
- 反常识:幻觉不是 bug,是 LLM 本质属性的副作用
- 幻觉的根源:它在"猜下一个最可能的字",不是"知道事实"
- 三类幻觉:事实幻觉(编造名人名言)、引用幻觉(编造论文 ID)、逻辑幻觉(推理跳跃)
- 缓解:RAG / temperature 调低 / 让它说"我不知道" / 验证机制
- 偏见:训练数据决定模型偏见,不是模型本身有"恶意"
- 知识截止日:为什么 GPT-4 不知道 2024 年的事
- 链接:理解这些局限是做 AI 产品的基础(对应 AIPM 教材 C3 可靠性章节)
- 关键洞察:不是"能不能消除幻觉",是"如何在有幻觉的前提下做出可用产品"
`.trim(),
    targetLevelMin: 3,
    targetLevelMax: 7,
    recommendedMentor: "karpathy",
  },
  {
    id: "c11",
    bookId: "ai",
    index: 11,
    part: "Part III · 看穿系统",
    title: "评估：怎么知道 AI 答得好不好",
    description: "把「AI 表现」从感觉变成可衡量。",
    detailedOutline: `
- 反常识:"AI 答得好不好"不是用户说了算,也不是开发者说了算,是 benchmark 说了算
- 常见 benchmark:MMLU(知识)、HumanEval(编码)、GSM8K(数学)、MT-Bench(对话)
- LLM-as-Judge:用 GPT-4 当裁判给其他模型打分
- 评估的三个层面:能力评估 / 对齐评估 / 安全评估
- 自己的产品怎么评估:离线测试集 + 在线 A/B + 用户反馈
- 关键洞察:能定义"什么叫好"的人,才能做好 AI 产品(对应 AIPM 教材)
- 链接:Karpathy 名言 "evals are everything"
`.trim(),
    targetLevelMin: 3,
    targetLevelMax: 7,
    recommendedMentor: "qian",
  },
  {
    id: "c12",
    bookId: "ai",
    index: 12,
    part: "Part III · 看穿系统",
    title: "自己搭一个 Agent",
    description: "理解 Agent 的三件套,自己设计一个能跑的 Agent。",
    detailedOutline: `
- Agent 三件套:决策 + 工具 + 上下文
- 决策:LLM 做的核心是"下一步做什么",不是直接给答案
- 工具:函数(API)、检索、Code Interpreter、Browser、Memory
- 上下文:系统 prompt + 对话历史 + 工具反馈 + RAG 内容
- 实战:用 Claude Code 搭一个"每天自动总结 AI 热点"的 Agent
- 调试:打开 verbose 日志看 Agent 的 Thought 链
- 失败案例:Agent 在循环中无限调用同一个工具,怎么办
- 关键洞察:好 Agent = 好上下文 + 好工具,不是更好的 LLM
- 对应 AIPM 教材 C6 Agent 产品设计
`.trim(),
    linkedLessonId: "L4",
    targetLevelMin: 5,
    targetLevelMax: 7,
    recommendedMentor: "qian",
  },
  {
    id: "c13",
    bookId: "ai",
    index: 13,
    part: "Part IV · 走向系统构建者",
    title: "把 AI 嵌进你每天的工作",
    description: "Lv.8→Lv.9 的核心 —— 让 AI 成为你工作流的一部分。",
    detailedOutline: `
- 反常识:Lv.9 的标志不是"会用更多 AI 工具",是"AI 默认介入你的工作"
- 三个层次:偶尔用 → 大部分场景想到用 → 默认用 AI 起步
- 工作流改造原则:把 AI 接进现有工具,而不是切换到新工具
- 具体场景:写邮件 / 调研 / 开会复盘 / 写文档 / 决策辅助
- 工具组合:Claude Code + Obsidian + 你的笔记
- 注意:不要被 AI 主导,要让 AI 服务你的判断
- 链接 C14:个人知识库才是 AI 长期协作的基础
`.trim(),
    targetLevelMin: 7,
    targetLevelMax: 9,
    recommendedMentor: "qian",
  },
  {
    id: "c14",
    bookId: "ai",
    index: 14,
    part: "Part IV · 走向系统构建者",
    title: "个人知识库 + AI = 个人方法论",
    description: "Lv.9→Lv.10 的核心 —— 把 AI 和你的认知融合。",
    detailedOutline: `
- 反常识:Lv.10 的标志不是"会用 AI",是"AI 已经长成你的一部分"
- 个人知识库为什么是 Lv.10 的地基(呼应博客 2)
- 输入/输出分离的设计:input = 你学的,output = 你做的
- 原子笔记三原则:去掉原作者风格 / 一笔记一问题 / 脱离原文也能看懂
- AI 是放大器,不是替代器
- 案例:用 Claude Code + Obsidian 搭个人方法论(参考用户自己的 wiki)
- 关键洞察:你的 wiki 和你的产品里的知识库不是同一个东西(回应用户问)
- 链接 C15:这只是个人,行业前沿在哪
`.trim(),
    targetLevelMin: 8,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
  {
    id: "c15",
    bookId: "ai",
    index: 15,
    part: "Part IV · 走向系统构建者",
    title: "多模态 / Embodied AI / 未来形态",
    description: "看清 AI 接下来 1-3 年最重要的几条路线。",
    detailedOutline: `
- 多模态:视觉(Sora / GPT-4V)、音频、视频、3D
- Embodied AI:让 AI 有"身体",机器人、自动驾驶、家庭助理
- World Models:Sora 类模型作为"世界模拟器"(对应论文 P12)
- 长上下文与无限记忆:从 128K 到 10M context
- 推理模型(o1 / Claude Sonnet Thinking):test-time compute 是第二条 scaling law
- 多 Agent / 自治系统:Hermes Agent 等开源 7×24 持续运行的范式
- 关键洞察:每条路线的瓶颈是什么、AIPM 该关注什么
- 链接 C16:AGI 是不是真的会来
`.trim(),
    targetLevelMin: 5,
    targetLevelMax: 10,
    recommendedMentor: "karpathy",
  },
  {
    id: "c16",
    bookId: "ai",
    index: 16,
    part: "Part IV · 走向系统构建者",
    title: "AGI 路线图：业内最严肃的几个判断",
    description: "用思辨的方式面对「AGI 何时来」这个问题。",
    detailedOutline: `
- 反常识:"AGI 何时来"不是一个事实问题,是一个定义问题 + 概率分布问题
- 几个最严肃的人怎么看:Hinton / Sutskever / Karpathy / Yann LeCun
- 时间预测的分布:2027-2050 是主流区间
- 通往 AGI 的几条假说路径:Scaling / Agent / Embodied / Neuro-Symbolic
- 风险讨论:对齐 / 失业 / 集中化 / 安全
- 不是"AGI 一定来",是"如果来了,你需要准备什么"
- 对个人:持续学习是 AGI 时代唯一不变的能力
- 终结:回到本书第一章 ——"AI 不是魔法",也不是末日,是工具
`.trim(),
    targetLevelMin: 5,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
];

// ============ AIPM 教材 16 章 outline ============
// （v0.2 下一轮生成,这里先占位）
export const AIPM_CHAPTERS: ChapterOutline[] = [
  {
    id: "c01",
    bookId: "aipm",
    index: 1,
    part: "Part I · AI 产品的本质",
    title: "AI 产品和传统产品的根本不同",
    description: "AIPM 上岗第一课 —— 这门生意为什么不一样。",
    detailedOutline: "输出不确定性 / 上下文依赖 / 训练数据 vs 用户数据 / 评估方法不是 0/1 通过 / 产品迭代节奏完全不同 / 4 个真实案例（ChatGPT / Notion AI / Cursor / 客服 AI）的对比",
    linkedLessonId: "L1",
    targetLevelMin: 2,
    targetLevelMax: 4,
    recommendedMentor: "qian",
  },
  {
    id: "c02",
    bookId: "aipm",
    index: 2,
    part: "Part I · AI 产品的本质",
    title: "AI 产品需求分析：从模糊愿景到可做需求",
    description: "老板说「做一个 AI X」时,你的第一个问题是什么。",
    detailedOutline: "用户场景 + AI 角色定义 / 输入输出契约 / 失败 mode 设计 / 什么不交给 AI / AI 客服案例完整推导",
    linkedLessonId: "L2",
    targetLevelMin: 3,
    targetLevelMax: 5,
    recommendedMentor: "qian",
  },
  {
    id: "c03",
    bookId: "aipm",
    index: 3,
    part: "Part I · AI 产品的本质",
    title: "AI 产品的可靠性 + 置信度设计",
    description: "AI 偶尔会错,产品怎么设计才不崩。",
    detailedOutline: "幻觉缓解策略 / 置信度暴露 / 渐进式信任 / 兜底机制 / 案例:GitHub Copilot 的 confidence 处理",
    targetLevelMin: 3,
    targetLevelMax: 6,
    recommendedMentor: "qian",
  },
  {
    id: "c04",
    bookId: "aipm",
    index: 4,
    part: "Part I · AI 产品的本质",
    title: "AI 产品的评估方法",
    description: "怎么知道你的 AI 产品做得好。",
    detailedOutline: "离线评估 / 在线评估 / A/B 测试在 AI 产品中的不同 / LLM-as-Judge / 用户反馈循环 / 案例:OpenAI Evals 框架",
    targetLevelMin: 3,
    targetLevelMax: 7,
    recommendedMentor: "qian",
  },
  {
    id: "c05",
    bookId: "aipm",
    index: 5,
    part: "Part II · 设计 AI 产品",
    title: "Prompt 产品化：把 Prompt 当产品来设计",
    description: "自己用的 prompt vs 产品里的 prompt 不是一回事。",
    detailedOutline: "System vs User prompt / 4 段式（角色+任务+约束+格式）/ 版本管理 / 测试集 / 案例:Cursor / Notion AI 的 prompt 演化",
    linkedLessonId: "L3",
    targetLevelMin: 3,
    targetLevelMax: 5,
    recommendedMentor: "qian",
  },
  {
    id: "c06",
    bookId: "aipm",
    index: 6,
    part: "Part II · 设计 AI 产品",
    title: "Agent 产品设计：从工作流到 Agent",
    description: "Agent 不是更高级的 Prompt,是给 AI 决策权。",
    detailedOutline: "决策 + 工具 + 上下文三件套 / 何时不用 Agent / Agent 评估 / 案例:Claude Code / Cursor / Devin / 我们产品本身的三导师 Agent",
    linkedLessonId: "L4",
    targetLevelMin: 5,
    targetLevelMax: 7,
    recommendedMentor: "qian",
  },
  {
    id: "c07",
    bookId: "aipm",
    index: 7,
    part: "Part II · 设计 AI 产品",
    title: "数据飞轮：AI 产品的护城河",
    description: "为什么有的 AI 产品越用越强,有的不变。",
    detailedOutline: "用户数据如何反哺模型 / 隐私 vs 改进的 trade-off / 案例:OpenAI 的 RLHF 飞轮 / Hermes Agent 的轨迹数据飞轮 / 国产产品如何建飞轮",
    targetLevelMin: 5,
    targetLevelMax: 8,
    recommendedMentor: "qian",
  },
  {
    id: "c08",
    bookId: "aipm",
    index: 8,
    part: "Part II · 设计 AI 产品",
    title: "多模型策略 + 成本控制",
    description: "不要押宝单一模型,做好 LLM 切换架构。",
    detailedOutline: "Provider 抽象层 / 路由策略（简单任务用小模型）/ 缓存 / Prompt caching / DeepSeek vs Claude vs GPT 在不同场景的性价比",
    targetLevelMin: 5,
    targetLevelMax: 8,
    recommendedMentor: "qian",
  },
  {
    id: "c09",
    bookId: "aipm",
    index: 9,
    part: "Part III · 落地 + 上线",
    title: "从 PRD 到上线：AI 项目管理",
    description: "AI 项目和传统项目管理的根本差异。",
    detailedOutline: "需求模糊度更高 / 工程师不知道能不能做 / 测试集驱动开发 / 持续灰度 / 与传统项目管理的 4 大不同",
    targetLevelMin: 5,
    targetLevelMax: 8,
    recommendedMentor: "qian",
  },
  {
    id: "c10",
    bookId: "aipm",
    index: 10,
    part: "Part III · 落地 + 上线",
    title: "跨职能协作：与工程师 / 设计师 / 法务",
    description: "AIPM 是协调岗,要让所有人对齐 AI 这件事。",
    detailedOutline: "和工程师:不要描述「AI 能不能做」,要描述「输入输出契约」 / 和设计师:不确定性怎么 UI 表达 / 和法务:数据隐私 / 模型版权 / 输出免责声明",
    targetLevelMin: 4,
    targetLevelMax: 8,
    recommendedMentor: "qian",
  },
  {
    id: "c11",
    bookId: "aipm",
    index: 11,
    part: "Part III · 落地 + 上线",
    title: "AI 产品的定价与商业模式",
    description: "AI 产品贵在哪,怎么收钱。",
    detailedOutline: "Token-based vs Seat-based vs Value-based / 用量梯度 / API 转售模式 / Freemium 在 AI 时代的两难 / 案例:ChatGPT Plus / Cursor / 国产产品对比",
    targetLevelMin: 5,
    targetLevelMax: 9,
    recommendedMentor: "qian",
  },
  {
    id: "c12",
    bookId: "aipm",
    index: 12,
    part: "Part III · 落地 + 上线",
    title: "AI 产品的风险与边界",
    description: "幻觉 / 隐私 / 版权 / 安全 —— AIPM 必须知道的红线。",
    detailedOutline: "幻觉给用户造成损失谁担责 / 用户数据用于训练的合规 / 生成内容的版权归属 / 越狱攻击 / 注入攻击 / 案例:几起真实事故复盘",
    targetLevelMin: 5,
    targetLevelMax: 9,
    recommendedMentor: "qian",
  },
  {
    id: "c13",
    bookId: "aipm",
    index: 13,
    part: "Part IV · 高阶 AIPM",
    title: "拆解 AI 产品：5 层逆向工程框架",
    description: "看懂任何 AI 产品的底层 —— 商业 / 用户 / 技术 / 模型 / 数据。",
    detailedOutline: "5 层框架完整拆解（呼应博客 4）/ 实战拆解 5 个产品:Cursor / Devin / NotebookLM / Claude Code / OiiOii",
    linkedLessonId: "L12",
    targetLevelMin: 6,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
  {
    id: "c14",
    bookId: "aipm",
    index: 14,
    part: "Part IV · 高阶 AIPM",
    title: "用决策思维做 AI 产品",
    description: "钱学森工具箱 —— 反向思考 / 能力圈 / 机会成本 / 认知偏误。",
    detailedOutline: "查理芒格决策工具在 AI 产品中的应用 / 反向思考:这个 AI 产品会怎么失败 / 能力圈:什么不该做 / 机会成本:做 A 就不能做 B",
    targetLevelMin: 6,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
  {
    id: "c15",
    bookId: "aipm",
    index: 15,
    part: "Part IV · 高阶 AIPM",
    title: "AI 产品案例集（精读 5 个）",
    description: "拆 5 个最值得学的 AI 产品。",
    detailedOutline: "ChatGPT:对话产品的开创者 / Claude:对齐做得最好 / Cursor:工具型 AI 的标杆 / Devin:真 Agent 的尝试 / NotebookLM:RAG 产品的标杆",
    targetLevelMin: 5,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
  {
    id: "c16",
    bookId: "aipm",
    index: 16,
    part: "Part IV · 高阶 AIPM",
    title: "AI PM 的成长路径",
    description: "从入门到资深 AIPM 的真实路径。",
    detailedOutline: "0-1 年:理解技术语言 / 1-3 年:能独立带 AI 产品 / 3-5 年:能识别错误的 AI 项目 / 5 年+:能定义新品类 / 关键技能曲线 / 求职建议",
    targetLevelMin: 0,
    targetLevelMax: 10,
    recommendedMentor: "qian",
  },
];

// 合并工具
export function getAllOutlines(): ChapterOutline[] {
  return [...AI_CHAPTERS, ...AIPM_CHAPTERS];
}

export function getOutline(bookId: "ai" | "aipm", chapterId: string): ChapterOutline | undefined {
  const list = bookId === "ai" ? AI_CHAPTERS : AIPM_CHAPTERS;
  return list.find((c) => c.id === chapterId);
}

export function getChaptersByBook(bookId: "ai" | "aipm"): ChapterOutline[] {
  return bookId === "ai" ? AI_CHAPTERS : AIPM_CHAPTERS;
}
