// 费曼挑战的 prompt 模板
//
// 三个 prompt:
// 1. challengeGen: 根据章节生成挑战题 + 禁用术语
// 2. childRole: AI 扮演 10 岁孩子,根据用户讲解反问 1-2 个最朴素的问题
// 3. judge: LLM-as-Judge 对用户的整轮表现评价(通过 / 差点 / 没过)
//
// 重要:这些 prompt 是 prompt 模式,不是导师人格。保持产品身份「三导师」,不引入第 4 个导师。

import type { ChapterContent } from "@/lib/textbooks/types";

export type FeynmanChallenge = {
  chapterId: string;
  question: string;          // 给用户的挑战题
  forbiddenTerms: string[];  // 禁用术语
  hintsAllowed: string[];    // 允许的类比(餐厅 / 实习生 / 房子 等大白话)
};

// 简单 fallback:每章 challenge 题目由教材的 keyConcepts 推。
// 后续 (Step 2 后) 可以让 LLM 生成更个性化的题。
export function buildChallengeFromChapter(
  bookId: string,
  chapterId: string,
  chapter: ChapterContent
): FeynmanChallenge {
  // 题目格式:"假装你跟一个 10 岁孩子讲。用 30 秒说清:[本章核心问题]"
  // 核心问题从 title 提炼
  const question = `用一个 10 岁孩子能听懂的话,30 秒说清:「${chapter.title}」到底在讲什么?`;

  // 禁用术语 = keyConcepts(强迫用户用大白话)
  const forbiddenTerms = chapter.keyConcepts || [];

  // 允许的类比工具
  const hintsAllowed = [
    "实习生 / 老板 / 同事 这种日常人物",
    "餐厅 / 厨房 / 菜谱 这种生活场景",
    "图书馆 / 老师 / 考试 这种校园场景",
    "玩具 / 游戏 / 故事 这种小孩听得懂的事",
  ];

  return {
    chapterId: `${bookId}-${chapterId}`,
    question,
    forbiddenTerms,
    hintsAllowed,
  };
}

// AI 扮演 10 岁孩子的 system prompt
export function buildChildRolePrompt(
  challenge: FeynmanChallenge,
  userExplanation: string
): string {
  return `你扮演一个 10 岁的小学生。你刚听完一个大人(用户)给你解释一个概念。

# 用户的解释
"${userExplanation}"

# 你的任务
作为 10 岁孩子,你的反应应该是:
- 真诚地以孩子视角回应
- 选 1-2 个你「真的没听懂的地方」,问出最朴素的「为什么 / 我不懂」
- 不要装懂
- 不要用任何专业术语反问
- 用「但是」「可是」「我有个问题」开头
- 每个反问 30 字以内

# 禁用术语(不要在你的反问里用)
${challenge.forbiddenTerms.map((t) => `- ${t}`).join("\n")}

# 输出格式
直接输出 1-2 个反问,每个一行,不要加任何解释 / 标号 / 前缀。

例子:
但是你说的「记住」是什么意思?它有脑子吗?
我有个问题:它怎么知道接下来要说啥?
`;
}

// LLM-as-Judge:评价用户整轮表现
export function buildJudgePrompt(
  challenge: FeynmanChallenge,
  userExplanation: string,
  childQuestions: string[],
  userFollowUps: string[],
  chapterSummary: string
): string {
  return `你是费曼学习法评估官。判断用户对这一章的理解深度。

# 章节核心(参考标准)
${chapterSummary}

# 这一章的关键概念
${challenge.forbiddenTerms.map((t) => `- ${t}`).join("\n")}

# 用户的初次讲解
"${userExplanation}"

# 然后小孩反问 + 用户跟进
${childQuestions
  .map((q, i) => `小孩: ${q}\n用户: ${userFollowUps[i] || "(用户没回答)"}`)
  .join("\n\n")}

# 评分维度
1. 准确性:用户讲的内容是否符合章节核心
2. 大白话:是否真的用了 10 岁孩子能听懂的话(没堆术语)
3. 完整性:是否覆盖了核心概念(可以漏边角,但核心要在)
4. 反问处理:小孩反问时,用户能否真的解释清楚,还是被问住

# 三档结果
- passed: 三个维度基本都 OK,小孩反问也能答上。说明这一章真懂了。
- almost: 大方向对,但某个维度卡了。比如「准确但用了术语」、「大白话但漏核心」、「小孩反问答得勉强」。
- needs_work: 大方向偏 / 严重堆术语 / 反问答不上 / 明显没懂。

# 输出格式(严格 JSON,不要解释)
{
  "result": "passed" | "almost" | "needs_work",
  "review": "一段不超过 80 字的评价,直接告诉用户哪里好哪里差,不要客套",
  "highlights": ["亮点 1", "亮点 2"],
  "gaps": ["卡点 1(可选)"]
}
`;
}
