// AIPM 必读 15 篇论文（v0.1.6.1 Phase 1 curate）
import type { MentorKey } from "@/types/mentor";

export type PaperCategory =
  | "foundation"
  | "alignment"
  | "reasoning"
  | "agent"
  | "rag"
  | "multimodal"
  | "efficiency";

export type CuratedPaper = {
  id: string;
  title: string;
  authors: string;
  year: number;
  org: string;
  category: PaperCategory;
  abstractZh: string;
  whyAipm: string;
  arxivUrl?: string;
  paperUrl?: string;
  recommendedMentor: MentorKey;
  difficulty: "intro" | "intermediate" | "advanced";
  keyContribution: string;
};

export const CATEGORY_LABELS: Record<PaperCategory, string> = {
  foundation: "基础模型",
  alignment: "对齐与微调",
  reasoning: "推理与提示",
  agent: "Agent 与工具",
  rag: "RAG 与知识",
  multimodal: "多模态",
  efficiency: "效率与开源",
};

export const CURATED_PAPERS: CuratedPaper[] = [
  {
    id: "attention-is-all-you-need",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    year: 2017,
    org: "Google Brain",
    category: "foundation",
    keyContribution: "提出 Transformer 架构，用注意力机制替代 RNN / CNN，奠定了所有现代大模型的基础。",
    abstractZh:
      "提出 Transformer：一种完全基于注意力机制（attention）的序列建模架构，抛弃了 RNN 和 CNN。在机器翻译任务上质量大幅超越 RNN-based 模型，同时训练速度更快。这是过去 8 年所有大模型（GPT / BERT / Claude / Llama / ...）的共同祖先。",
    whyAipm:
      "如果你做 AI 产品，这是必读的「起源论文」。你不需要懂数学，但要知道：为什么大模型能记住长上下文？为什么并行训练这么快？答案在这篇里。看完你会理解所有现代 AI 产品的底层。",
    arxivUrl: "https://arxiv.org/abs/1706.03762",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "gpt-3",
    title: "Language Models are Few-Shot Learners (GPT-3)",
    authors: "Brown et al.",
    year: 2020,
    org: "OpenAI",
    category: "foundation",
    keyContribution: "证明只要模型够大 + 数据够多，就能「涌现」few-shot learning 能力，不需要专门微调。",
    abstractZh:
      "GPT-3 是 1750 亿参数的语言模型。在几乎所有 NLP 任务上，只需要给它几个例子（few-shot prompt），不需要微调，就能达到很强的表现。这篇论文第一次让世界看到「参数规模 → 涌现能力」的现象。ChatGPT 不是 GPT-3，但路径是这篇论文铺开的。",
    whyAipm:
      "理解「为什么 AI 产品突然能用了」的关键。Prompt Engineering 这门学问就是从 GPT-3 开始的。看完你会理解：为什么我们说「上下文 + 例子 = 新一代编程」，为什么不需要微调也能做出强大产品。",
    arxivUrl: "https://arxiv.org/abs/2005.14165",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "instructgpt",
    title: "Training Language Models to Follow Instructions with Human Feedback (InstructGPT)",
    authors: "Ouyang et al.",
    year: 2022,
    org: "OpenAI",
    category: "alignment",
    keyContribution: "提出 RLHF 三阶段训练法（SFT + RM + PPO），把会胡说的 GPT-3 变成会听话的 ChatGPT。",
    abstractZh:
      "GPT-3 出来两年没火。这篇论文做了 RLHF（人类反馈强化学习）三步：先 SFT（监督微调）让模型学会基本指令格式，再训练 Reward Model，最后用 PPO 强化学习。这一套就是 ChatGPT 的本体。从那以后，所有 LLM 厂商都在做 RLHF 或它的变体。",
    whyAipm:
      "ChatGPT 起源故事。看完你会理解：为什么 ChatGPT 比 GPT-3 好用 1000 倍，为什么 AI 产品都有「安全性 + 有用性」的 trade-off，为什么标注员的质量决定模型上限。这是 AI 产品对齐（alignment）的根 paper。",
    arxivUrl: "https://arxiv.org/abs/2203.02155",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "chain-of-thought",
    title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    authors: "Wei et al.",
    year: 2022,
    org: "Google Research",
    category: "reasoning",
    keyContribution: "发现只要在 prompt 里加「让我们一步步想」，模型推理准确率就能大幅提升。",
    abstractZh:
      "提出 Chain-of-Thought（CoT）prompting：让模型在回答前显式输出推理步骤。一个简单的「Let us think step by step」就能让数学、常识、符号推理任务的准确率从 17% 提升到 78%。这是 prompt engineering 最重要的一篇。",
    whyAipm:
      "极其实用。任何你做的 AI 产品涉及推理（财务计算 / 决策辅助 / 多步规划）都该用 CoT。看完你会：1) 写更好的 prompt；2) 理解 o1 / Claude 3 等推理模型的「思考过程」是怎么来的。",
    arxivUrl: "https://arxiv.org/abs/2201.11903",
    recommendedMentor: "karpathy",
    difficulty: "intro",
  },
  {
    id: "react",
    title: "ReAct: Synergizing Reasoning and Acting in Language Models",
    authors: "Yao et al.",
    year: 2022,
    org: "Princeton / Google",
    category: "agent",
    keyContribution: "提出 Thought-Action-Observation 循环，让 LLM 同时具备推理和工具调用能力，是所有 Agent 的鼻祖。",
    abstractZh:
      "传统 prompt 让 LLM 直接给答案，但复杂任务它会瞎编。ReAct 让 LLM 交替输出 Thought（思考）→ Action（调工具）→ Observation（看结果）→ 再思考，直到完成。LangChain Agent、Claude Code、Cursor、几乎所有 Agent 产品的核心循环都是这个。",
    whyAipm:
      "做 Agent 产品的必读起点。看完你会理解：为什么 Agent 慢？（要多轮）为什么有时候会瞎跑？（Thought 出错连锁反应）Agent 设计的本质是什么？（设计这个循环的边界条件）。",
    arxivUrl: "https://arxiv.org/abs/2210.03629",
    recommendedMentor: "qian",
    difficulty: "intermediate",
  },
  {
    id: "constitutional-ai",
    title: "Constitutional AI: Harmlessness from AI Feedback",
    authors: "Bai et al.",
    year: 2022,
    org: "Anthropic",
    category: "alignment",
    keyContribution: "提出用一组「宪法」规则 + AI 自我批评替代部分人类反馈，是 Claude 的核心训练方法。",
    abstractZh:
      "Anthropic 提出 CAI（Constitutional AI）：用一组人类写好的原则（「宪法」）指导 AI 自己批评和修改自己的回答，大幅减少对人类标注的依赖。Claude 就是用这个方法训练的。这是 OpenAI 的 RLHF 之外的另一条对齐路线。",
    whyAipm:
      "理解为什么 Claude 在「拒绝有害请求」上更细腻、为什么它有清晰的「行为准则」。做企业 AI 产品时，可解释 + 可控的对齐机制比黑盒 RLHF 更有价值。",
    arxivUrl: "https://arxiv.org/abs/2212.08073",
    recommendedMentor: "karpathy",
    difficulty: "advanced",
  },
  {
    id: "rag-original",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    authors: "Lewis et al.",
    year: 2020,
    org: "Facebook AI",
    category: "rag",
    keyContribution: "首次提出 RAG 架构：检索 + 生成。所有「AI 接知识库」的产品都是这一套。",
    abstractZh:
      "LLM 自身知识有限，记忆也不准。RAG 提出在生成时先从外部知识库检索相关段落，再让 LLM 基于段落回答。这套范式适用于：开放问答、知识库问答、企业内部检索。今天所有 AI 客服、企业知识库、PDF 问答产品的底座。",
    whyAipm:
      "做「AI + 你公司资料」产品的必读。看完你会理解：为什么 RAG 比「全部塞 context」更可控、为什么有时候 RAG 检索不到、为什么需要 chunk 和 embedding 选择。",
    arxivUrl: "https://arxiv.org/abs/2005.11401",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "gpt-4",
    title: "GPT-4 Technical Report",
    authors: "OpenAI",
    year: 2023,
    org: "OpenAI",
    category: "multimodal",
    keyContribution: "首个达到部分专业人类水平的多模态大模型，标志 AI 产品进入实用阶段。",
    abstractZh:
      "GPT-4 在律师考试、医学考试、SAT 等任务上达到人类前 10% 水平，首次让「AI 能做专业工作」成为现实。完整训练细节没公开（出于安全 / 竞争考虑），但报告了能力、安全、限制。多模态能力（看图）首次商业化。",
    whyAipm:
      "了解「前沿模型能做什么」的标杆。任何「我们这个产品 GPT-3.5 做得不好，GPT-4 行吗？」的判断，都基于读这份报告。看完你会知道 frontier 模型的真实能力边界。",
    paperUrl: "https://cdn.openai.com/papers/gpt-4.pdf",
    recommendedMentor: "qian",
    difficulty: "intro",
  },
  {
    id: "llama-2",
    title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
    authors: "Touvron et al.",
    year: 2023,
    org: "Meta",
    category: "efficiency",
    keyContribution: "首个对标 GPT-3.5 的真开源（含商用）模型，催生了整个开源 LLM 生态。",
    abstractZh:
      "Meta 开源 Llama 2（7B / 13B / 70B），允许商用，且训练细节、数据、评估全部公开。这是开源 LLM 生态的转折点。之后所有的 DeepSeek、Qwen、Mistral、Yi 都站在 Llama 的肩上。",
    whyAipm:
      "做 to B / 私有部署的 AI 产品必读。看完你会理解：7B vs 13B vs 70B 各自能力边界、Fine-tune 的工程现实、为什么开源模型对企业更友好（数据安全 + 可定制 + 成本）。",
    paperUrl:
      "https://ai.meta.com/research/publications/llama-2-open-foundation-and-fine-tuned-chat-models/",
    recommendedMentor: "qian",
    difficulty: "intermediate",
  },
  {
    id: "dpo",
    title: "Direct Preference Optimization (DPO): Your Language Model is Secretly a Reward Model",
    authors: "Rafailov et al.",
    year: 2023,
    org: "Stanford",
    category: "alignment",
    keyContribution: "用一个简洁的损失函数替代复杂的 RLHF（PPO + RM 训练），训练更快更稳。",
    abstractZh:
      "RLHF 训练流程复杂（要先训 Reward Model，再用 PPO，容易不稳定）。DPO 证明可以用一个直接的损失函数直接从偏好数据训练 LLM，效果和 RLHF 相当甚至更好，但训练更简单稳定。现在很多开源模型用 DPO 替代 PPO。",
    whyAipm:
      "如果你的团队要微调 LLM 做 alignment，DPO 比 PPO 容易实现 10 倍。看完你会理解：对齐训练不需要那么复杂、为什么 2024 年大量开源模型转向 DPO 路线。",
    arxivUrl: "https://arxiv.org/abs/2305.18290",
    recommendedMentor: "karpathy",
    difficulty: "advanced",
  },
  {
    id: "mixtral",
    title: "Mixtral of Experts",
    authors: "Mistral AI",
    year: 2024,
    org: "Mistral AI",
    category: "efficiency",
    keyContribution: "证明 MoE（混合专家）架构能在保持稀疏激活的同时达到 dense 模型 4x 推理速度。",
    abstractZh:
      "Mixtral 8x7B 是开源 MoE 模型：总参数 47B，但每次推理只激活 13B，速度接近 13B 模型，效果接近 70B 模型。MoE 不是新概念，但 Mixtral 第一次让开源 MoE 大规模可用。GPT-4 据传也是 MoE。",
    whyAipm:
      "理解「为什么 GPT-4 / Gemini / Claude 推理这么快」。MoE 是降本增效的关键路线。做产品架构选型时，知道 MoE 的存在能帮你更好估算成本和延迟。",
    paperUrl: "https://mistral.ai/news/mixtral-of-experts/",
    recommendedMentor: "qian",
    difficulty: "advanced",
  },
  {
    id: "sora-world-sim",
    title: "Video Generation Models as World Simulators (Sora)",
    authors: "OpenAI",
    year: 2024,
    org: "OpenAI",
    category: "multimodal",
    keyContribution: "首个能生成 1 分钟高质量视频的扩散 Transformer，提出「视频模型即世界模拟器」假说。",
    abstractZh:
      "Sora 不仅是视频生成模型，OpenAI 把它定位为「世界模拟器」。它能生成 1 分钟连贯、物理合理的视频。技术上是 Diffusion + Transformer 的结合（DiT）。这篇 report 提示了通往 AGI 的另一条路线：不靠语言，靠视觉理解世界。",
    whyAipm:
      "看 AI 产品的未来形态。视频生成会彻底改变内容产业、教育、广告、设计。做 AI 内容类产品的 PM 必读。看完你会理解：为什么不光要关注 LLM，视觉生成模型也在快速演化。",
    paperUrl: "https://openai.com/research/video-generation-models-as-world-simulators",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "deepseek-v3",
    title: "DeepSeek-V3 Technical Report",
    authors: "DeepSeek AI",
    year: 2024,
    org: "DeepSeek（中国）",
    category: "efficiency",
    keyContribution: "用 1/10 的训练成本达到 GPT-4 级别能力，打破「AI 必须烧钱」的迷思。",
    abstractZh:
      "DeepSeek-V3 是 671B MoE 模型（每次激活 37B），在多项 benchmark 上接近或超过 GPT-4o / Claude 3.5。训练成本仅 $5.6M（GPT-4 据传 $100M+）。技术亮点：MLA 注意力、DeepSeekMoE、FP8 训练、多 token 预测。",
    whyAipm:
      "国产顶级模型的代表，也是性价比的标杆。看完你会理解：AI 能力 / 成本的比例正在变化、为什么中国厂商可能在 2025-2026 年抹平差距、为什么开源对企业 AI 产品定价是一个搅局变量。",
    arxivUrl: "https://arxiv.org/abs/2412.19437",
    recommendedMentor: "qian",
    difficulty: "advanced",
  },
  {
    id: "o1-reasoning",
    title: "Learning to Reason with LLMs (OpenAI o1)",
    authors: "OpenAI",
    year: 2024,
    org: "OpenAI",
    category: "reasoning",
    keyContribution: "首个用大规模 RL 训练「推理能力」的模型，在数学、代码、科学问题上达到博士水平。",
    abstractZh:
      "OpenAI o1 不是 GPT-5。它是用 RL 训练的「推理模型」—— 输出前先长链思考（chain of thought），然后给答案。在数学奥赛、PhD 级别物理、编程上得分大幅超过 GPT-4。这是 LLM 的第二条 scaling law：test-time compute（推理时算力越多，越聪明）。",
    whyAipm:
      "推理模型代表了 AI 产品的下一波形态。看完你会理解：为什么慢 + 贵但更准的模型有市场、什么场景应该用 o1（Claude 3.7 Reasoning）类模型、为什么 AI 产品的「思考过程」会成为下一个用户价值。",
    paperUrl: "https://openai.com/index/learning-to-reason-with-llms/",
    recommendedMentor: "karpathy",
    difficulty: "intermediate",
  },
  {
    id: "claude-3-card",
    title: "Claude 3 Model Card",
    authors: "Anthropic",
    year: 2024,
    org: "Anthropic",
    category: "foundation",
    keyContribution: "200K 长上下文成为新标准，AI 助手能记住整本书的信息。",
    abstractZh:
      "Anthropic 发布 Claude 3 家族（Haiku / Sonnet / Opus）。200K context window 成为新标准（GPT-4 当时只有 32K-128K）。多模态能力、coding 能力、低 hallucination 率上全面对标 GPT-4。它的 model card 详细介绍了能力、限制、伦理评估。",
    whyAipm:
      "长上下文是 AI 产品形态变化的关键变量。看完你会理解：200K context 让「AI 读完整本书后回答」成为可能，直接改变了文档处理类产品的工作流（不需要 RAG 切块了）。",
    paperUrl: "https://www.anthropic.com/news/claude-3-family",
    recommendedMentor: "qian",
    difficulty: "intro",
  },
];

export function getPaperById(id: string): CuratedPaper | undefined {
  return CURATED_PAPERS.find((p) => p.id === id);
}
