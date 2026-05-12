// 15 题联合测试完整数据。真理源：QUESTIONS.md。任何改动先改 .md 再同步本文件。
import type { TestQuestion } from "@/types/test";

export const TEST_QUESTIONS: TestQuestion[] = [
  // ============= 第一部分：学习人格画像 Q1-Q5 =============
  {
    id: "Q1",
    questionType: "single",
    questionCategory: "profile",
    text: "你最近一周学 AI 的状态最像哪个？",
    options: [
      {
        id: "Q1-A",
        text: "我每天都有学一会，状态稳定",
        profileImpacts: [
          { dimension: "persistence", delta: 5 },
          { dimension: "anxiety", delta: -2 },
        ],
      },
      {
        id: "Q1-B",
        text: "我想学但开了几次后就停了",
        profileImpacts: [
          { dimension: "persistence", delta: -3 },
          { dimension: "selfBlame", delta: 3 },
        ],
      },
      {
        id: "Q1-C",
        text: "我学得很猛但只持续了几天就累了",
        profileImpacts: [
          { dimension: "persistence", delta: -2 },
          { dimension: "anxiety", delta: 3 },
        ],
      },
      {
        id: "Q1-D",
        text: "我看了很多收藏，但真正学进去的少",
        profileImpacts: [
          { dimension: "persistence", delta: -2 },
          { dimension: "anxiety", delta: 4 },
        ],
      },
      {
        id: "Q1-E",
        text: "我最近完全没学，状态不太好",
        profileImpacts: [
          { dimension: "persistence", delta: -5 },
          { dimension: "selfBlame", delta: 5 },
        ],
      },
    ],
  },
  {
    id: "Q2",
    questionType: "single",
    questionCategory: "profile",
    text: "看到一个新 AI 概念你不懂时，通常会怎样？",
    options: [
      {
        id: "Q2-A",
        text: "觉得有意思，立刻去查",
        profileImpacts: [
          { dimension: "anxiety", delta: -3 },
          { dimension: "persistence", delta: 2 },
        ],
      },
      {
        id: "Q2-B",
        text: "觉得焦虑，担心又是新东西要追",
        profileImpacts: [{ dimension: "anxiety", delta: 5 }],
      },
      {
        id: "Q2-C",
        text: "收藏起来，告诉自己晚点看（然后大概率没看）",
        profileImpacts: [
          { dimension: "persistence", delta: -3 },
          { dimension: "anxiety", delta: 2 },
        ],
      },
      {
        id: "Q2-D",
        text: "想搞懂，但被术语劝退",
        profileImpacts: [
          { dimension: "anxiety", delta: 3 },
          { dimension: "selfBlame", delta: 2 },
        ],
      },
      {
        id: "Q2-E",
        text: "跳过，反正不影响我现在用",
        profileImpacts: [
          { dimension: "anxiety", delta: -1 },
          { dimension: "persistence", delta: -1 },
        ],
      },
    ],
  },
  {
    id: "Q3",
    questionType: "single",
    questionCategory: "profile",
    text: "如果让你现在把今天学的写一句话发出来，你会？",
    options: [
      {
        id: "Q3-A",
        text: "直接发，有什么发什么",
        profileImpacts: [{ dimension: "outputWillingness", delta: 5 }],
      },
      {
        id: "Q3-B",
        text: "想发，但会反复改几遍才发",
        profileImpacts: [
          { dimension: "outputWillingness", delta: 2 },
          { dimension: "selfBlame", delta: 3 },
        ],
      },
      {
        id: "Q3-C",
        text: "想发，但担心写得不专业，最后不发",
        profileImpacts: [
          { dimension: "outputWillingness", delta: -3 },
          { dimension: "selfBlame", delta: 4 },
        ],
      },
      {
        id: "Q3-D",
        text: "不太想发，觉得没必要让别人看",
        profileImpacts: [{ dimension: "outputWillingness", delta: -3 }],
      },
      {
        id: "Q3-E",
        text: "我会发，但只发给特定的人看",
        profileImpacts: [{ dimension: "outputWillingness", delta: 2 }],
      },
    ],
  },
  {
    id: "Q4",
    questionType: "single",
    questionCategory: "profile",
    text: "你更愿意接受哪种学习节奏？",
    options: [
      { id: "Q4-A", text: "每天 10-15 分钟，稳定一年", paceValue: "daily_micro" },
      { id: "Q4-B", text: "一周 2-3 次，每次 30-60 分钟", paceValue: "weekly_medium" },
      { id: "Q4-C", text: "周末集中学，工作日不学", paceValue: "weekend_burst" },
      { id: "Q4-D", text: "兴趣来了猛学，没兴趣就停", paceValue: "interest_driven" },
      { id: "Q4-E", text: "我不确定，看推荐", paceValue: "uncertain" },
    ],
  },
  {
    id: "Q5",
    questionType: "single",
    questionCategory: "profile",
    text: "学一件事中途卡住，你的第一反应是？",
    options: [
      {
        id: "Q5-A",
        text: "觉得是自己不够聪明",
        profileImpacts: [{ dimension: "selfBlame", delta: 5 }],
      },
      {
        id: "Q5-B",
        text: "觉得是方法不对，换个角度",
        profileImpacts: [
          { dimension: "selfBlame", delta: -3 },
          { dimension: "persistence", delta: 2 },
        ],
      },
      {
        id: "Q5-C",
        text: "想找人问，但又怕暴露自己不懂",
        profileImpacts: [
          { dimension: "selfBlame", delta: 3 },
          { dimension: "outputWillingness", delta: -2 },
        ],
      },
      {
        id: "Q5-D",
        text: "觉得算了，可能不适合我",
        profileImpacts: [
          { dimension: "selfBlame", delta: 2 },
          { dimension: "persistence", delta: -3 },
        ],
      },
      {
        id: "Q5-E",
        text: "把它放着，过几天再说",
        profileImpacts: [{ dimension: "persistence", delta: -1 }],
      },
    ],
  },

  // ============= 第二部分：AI 能力等级行为指纹 Q6-Q12 =============
  {
    id: "Q6",
    questionType: "multiple",
    questionCategory: "level",
    text: "下面哪些是你最近 30 天真做过的？（多选，可选多个）",
    options: [
      { id: "Q6-A", text: "没怎么用过 AI", levelIndicators: [{ level: 0, weight: 5 }] },
      { id: "Q6-B", text: "让 AI 写邮件 / 总结文章 / 查资料", levelIndicators: [{ level: 1, weight: 3 }] },
      { id: "Q6-C", text: "我会追问、补充背景信息给 AI", levelIndicators: [{ level: 2, weight: 3 }] },
      { id: "Q6-D", text: "我写过带格式 / 语气 / 范围要求的多段 Prompt", levelIndicators: [{ level: 3, weight: 3 }] },
      { id: "Q6-E", text: "同一周内用 AI 做过 ≥ 3 类完全不同的事", levelIndicators: [{ level: 4, weight: 3 }] },
      { id: "Q6-F", text: "我有自己保存的 Prompt 模板或资料库", levelIndicators: [{ level: 5, weight: 3 }] },
      { id: "Q6-G", text: "我用过 Claude Code / Cursor / Cline 等 AI 编程工具", levelIndicators: [{ level: 6, weight: 3 }] },
      { id: "Q6-H", text: "我写过 Agent / Skill / 项目规则 / 自定义自动化", levelIndicators: [{ level: 7, weight: 5 }] },
      { id: "Q6-I", text: "我用 AI 做出过真实的产品 / 工具 / 作品", levelIndicators: [{ level: 8, weight: 5 }] },
      { id: "Q6-J", text: "AI 已默认介入我每天的工作流", levelIndicators: [{ level: 9, weight: 3 }] },
      { id: "Q6-K", text: "我有自己的 AI 方法论 + 工具链 + 知识库体系", levelIndicators: [{ level: 10, weight: 5 }] },
    ],
  },
  {
    id: "Q7",
    questionType: "single",
    questionCategory: "level",
    text: "想象你要让 AI 帮你写一份产品介绍，你最像哪种做法？",
    options: [
      { id: "Q7-A", text: "直接说「帮我写个产品介绍」", levelIndicators: [{ level: 1, weight: 3 }] },
      { id: "Q7-B", text: "加上「我们的产品是 XXX，目标用户是 XXX」", levelIndicators: [{ level: 2, weight: 3 }] },
      {
        id: "Q7-C",
        text: "还会要求格式、长度、语气、举例风格",
        levelIndicators: [{ level: 3, weight: 3 }, { level: 2, weight: 1 }],
      },
      {
        id: "Q7-D",
        text: "我有自己的 Prompt 框架 / 模板，套着写",
        levelIndicators: [{ level: 5, weight: 3 }, { level: 3, weight: 1 }],
      },
      {
        id: "Q7-E",
        text: "我会让 AI 先反问我，基于答案再生成",
        levelIndicators: [{ level: 4, weight: 3 }, { level: 3, weight: 2 }],
      },
    ],
  },
  {
    id: "Q8",
    questionType: "single",
    questionCategory: "level",
    text: "你保存或重复使用过 Prompt / AI 资料库吗？",
    options: [
      {
        id: "Q8-A",
        text: "没保存过，每次都从零",
        levelIndicators: [{ level: 0, weight: 2 }, { level: 1, weight: 1 }],
      },
      { id: "Q8-B", text: "偶尔复制粘贴用过的好提示", levelIndicators: [{ level: 2, weight: 2 }] },
      {
        id: "Q8-C",
        text: "我有专门收藏 Prompt 的地方（文档 / 笔记）",
        levelIndicators: [{ level: 4, weight: 3 }, { level: 3, weight: 1 }],
      },
      { id: "Q8-D", text: "我有自己整理的 AI 资料库 + 模板库", levelIndicators: [{ level: 5, weight: 5 }] },
      {
        id: "Q8-E",
        text: "我有完整的工作流（Prompt + 资料 + 模板 + 固定流程）",
        levelIndicators: [{ level: 5, weight: 5 }, { level: 6, weight: 2 }],
      },
    ],
  },
  {
    id: "Q9",
    questionType: "multiple",
    questionCategory: "level",
    text: "下面这些工具你用过哪些？（多选，可选多个）",
    options: [
      { id: "Q9-A", text: "没听过这些工具", levelIndicators: [{ level: 0, weight: 3 }] },
      { id: "Q9-B", text: "ChatGPT / Claude / Gemini 网页或 App 版", levelIndicators: [{ level: 1, weight: 2 }] },
      { id: "Q9-C", text: "Cursor", levelIndicators: [{ level: 6, weight: 3 }] },
      { id: "Q9-D", text: "Claude Code", levelIndicators: [{ level: 6, weight: 3 }] },
      { id: "Q9-E", text: "Windsurf / Cline / Aider 等 AI 编程工具", levelIndicators: [{ level: 6, weight: 3 }] },
      { id: "Q9-F", text: "写过 Custom Instructions / GPTs / Projects / Skills", levelIndicators: [{ level: 7, weight: 5 }] },
      { id: "Q9-G", text: "自己搭过 Agent / LangGraph / 多步骤自动化工作流", levelIndicators: [{ level: 7, weight: 5 }] },
      { id: "Q9-H", text: "AI 工具集成进了我的开发 / 工作流（API、自动化）", levelIndicators: [{ level: 8, weight: 3 }] },
    ],
  },
  {
    id: "Q10",
    questionType: "single",
    questionCategory: "level",
    text: "你用 AI 真正做出过什么完整的东西吗？",
    options: [
      { id: "Q10-A", text: "没有，都是单次使用", levelIndicators: [{ level: 1, weight: 2 }] },
      { id: "Q10-B", text: "做过一些短内容（邮件、文案、小报告）", levelIndicators: [{ level: 2, weight: 2 }] },
      { id: "Q10-C", text: "做过完整作品（一篇深度文章、一份分析报告）", levelIndicators: [{ level: 4, weight: 3 }] },
      {
        id: "Q10-D",
        text: "用 AI 做过一个小工具 / 小程序 / 网站原型",
        levelIndicators: [{ level: 7, weight: 3 }, { level: 8, weight: 2 }],
      },
      { id: "Q10-E", text: "用 AI 做出过有真实用户使用的产品", levelIndicators: [{ level: 8, weight: 5 }] },
      {
        id: "Q10-F",
        text: "AI 帮我搭出了多个产品 / 工具，形成体系",
        levelIndicators: [{ level: 10, weight: 3 }, { level: 8, weight: 3 }],
      },
    ],
  },
  {
    id: "Q11",
    questionType: "single",
    questionCategory: "level",
    text: "AI 在你日常工作 / 学习里占多大比例？",
    options: [
      { id: "Q11-A", text: "几乎不用", levelIndicators: [{ level: 0, weight: 3 }] },
      { id: "Q11-B", text: "偶尔用一下，问个问题", levelIndicators: [{ level: 1, weight: 3 }] },
      { id: "Q11-C", text: "大多数任务我会想到先问 AI", levelIndicators: [{ level: 4, weight: 3 }] },
      { id: "Q11-D", text: "我大部分写、查、想都和 AI 一起做", levelIndicators: [{ level: 5, weight: 3 }] },
      { id: "Q11-E", text: "AI 已是我工作流不可分割的一部分", levelIndicators: [{ level: 9, weight: 5 }] },
      { id: "Q11-F", text: "我大部分时间在设计「AI + 我」的协作系统", levelIndicators: [{ level: 10, weight: 5 }] },
    ],
  },
  {
    id: "Q12",
    questionType: "single",
    questionCategory: "level",
    text: "你有没有形成自己的 AI 使用方法论 / 工具链？",
    options: [
      {
        id: "Q12-A",
        text: "没有，想到什么就用",
        levelIndicators: [{ level: 1, weight: 1 }, { level: 2, weight: 1 }],
      },
      { id: "Q12-B", text: "有几个固定的 prompt / 工具，但没成体系", levelIndicators: [{ level: 4, weight: 3 }] },
      {
        id: "Q12-C",
        text: "我有一套个人 AI 使用方法，会迭代它",
        levelIndicators: [{ level: 7, weight: 3 }, { level: 5, weight: 2 }],
      },
      { id: "Q12-D", text: "我有完整的 AI 方法论 + 工具链 + 知识库", levelIndicators: [{ level: 10, weight: 5 }] },
      {
        id: "Q12-E",
        text: "我已经开始把我的 AI 方法论分享 / 教别人",
        levelIndicators: [{ level: 10, weight: 5 }, { level: 8, weight: 3 }],
      },
    ],
  },

  // ============= 第三部分：学习目标与内容偏好 Q13-Q14 =============
  {
    id: "Q13",
    questionType: "single",
    questionCategory: "path",
    text: "你最想通过这个系统获得什么？",
    options: [
      { id: "Q13-A", text: "系统理解 AI，从小白入门", pathRecommendation: "AI 技术基础 + AIPM 入门" },
      { id: "Q13-B", text: "持续跟进 AI 最新动态、论文、热点", pathRecommendation: "AI 热点学习舱 + 论文导读" },
      { id: "Q13-C", text: "学习 AI 产品设计，做 AIPM", pathRecommendation: "AIPM 主线" },
      { id: "Q13-D", text: "学习 Agent / 工作流，自己搭东西", pathRecommendation: "Agent 设计课程" },
      { id: "Q13-E", text: "把自己的资料 / 项目用 AI 学习消化", pathRecommendation: "上传资料学习" },
      { id: "Q13-F", text: "还没想好，先体验一下", pathRecommendation: "默认: 卡帕西破冰" },
    ],
  },
  {
    id: "Q14",
    questionType: "single",
    questionCategory: "path",
    text: "学习内容你更偏好哪种？",
    options: [
      { id: "Q14-A", text: "系统化的内置课程，跟着走", sourceTypePreference: "built_in_course" },
      { id: "Q14-B", text: "用我自己的资料（读的书、文章、PDF）", sourceTypePreference: "material" },
      { id: "Q14-C", text: "AI 热点话题", sourceTypePreference: "hot_item" },
      { id: "Q14-D", text: "三种混着来，看心情", sourceTypePreference: "mixed" },
    ],
  },

  // ============= 第四部分：当前最大阻力 Q15 =============
  {
    id: "Q15",
    questionType: "single",
    questionCategory: "blocker",
    text: "你觉得自己现在学 AI 最大的卡点是什么？",
    options: [
      { id: "Q15-A", text: "信息太多，不知道从哪学", blockerValue: "information_overload" },
      { id: "Q15-B", text: "我学了但用不出来", blockerValue: "knowledge_application" },
      { id: "Q15-C", text: "我能学但学不持续", blockerValue: "persistence" },
      { id: "Q15-D", text: "我害怕输出，学了也不说不写", blockerValue: "output_fear" },
      { id: "Q15-E", text: "我焦虑，觉得自己跟不上", blockerValue: "anxiety" },
      { id: "Q15-F", text: "我不知道学 AI 对我有什么用", blockerValue: "motivation" },
    ],
  },
];

export const TOTAL_QUESTIONS = TEST_QUESTIONS.length;
