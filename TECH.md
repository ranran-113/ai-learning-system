# TECH.md - 三导师 AI 学习成长系统技术实现文档

当前版本：v0.1.0 MVP 规划版  
最后更新：2026-05-11

---

## 1. 技术目标

MVP 的技术目标是：

1. 快速搭建一个可部署到 Vercel 的 Web App。
2. 实现联合测试、AI 能力等级、三导师学习、上传资料、AI 热点学习舱、成长档案等核心闭环。
3. 使用 LangGraph.js 编排三导师 Agent 工作流。
4. 使用 Supabase 支持邮箱登录与数据保存。
5. 保证手机和电脑都能访问。
6. 保持结构清晰，方便后续 Claude Code 继续开发后端和 Agent 框架。

---

## 2. 推荐技术栈

```text
Next.js + TypeScript + Tailwind CSS + shadcn/ui
LangGraph.js
Supabase
Vercel
Web Speech API
AI HOT Public API / RSS
```

### 2.1 技术分工

| 模块 | 技术 | 作用 |
|---|---|---|
| 前端 | Next.js | 页面路由、前后端一体开发 |
| 类型系统 | TypeScript | 降低后续维护风险 |
| UI | Tailwind + shadcn/ui | 快速做简洁、治愈风界面 |
| Agent 编排 | LangGraph.js | 三导师流程、状态、路由、记忆 |
| 数据库 | Supabase Postgres | 存储用户、课程、记录、画像 |
| 登录 | Supabase Auth | 邮箱登录 |
| 部署 | Vercel | Web 上线 |
| 语音 | Web Speech API | 语音输入和导师回复播放 |
| 热点 | AI HOT API / RSS | 精选热点接入 |

---

## 3. 技术原则

1. MVP 优先跑通学习闭环，不追求复杂架构。
2. 所有产品决策必须遵守 PRD。
3. LangGraph 只负责编排 Agent 工作流，不把所有业务逻辑塞进一个节点。
4. 所有 Prompt、导师规则、教学规则必须集中管理。
5. 数据库结构要支持后续扩展，但 MVP 不过度设计。
6. 所有外部 API 都要有兜底。
7. Vercel 部署要避免长时间任务和复杂后台进程。
8. 语音功能必须有文字输入兜底。

---

## 4. 推荐项目结构

```text
ai-learning-system/
├─ app/
│  ├─ page.tsx                         # 首页
│  ├─ onboarding/page.tsx               # 联合测试页
│  ├─ profile/page.tsx                  # 成长档案页
│  ├─ levels/page.tsx                   # AI 能力 0-10 级地图页
│  ├─ courses/page.tsx                  # 课程中心页
│  ├─ hot/page.tsx                      # AI 热点学习舱页
│  ├─ hot/[id]/page.tsx                 # 热点详情 / 帮我讲解页
│  ├─ materials/page.tsx                # 上传资料页
│  ├─ learn/page.tsx                    # 三导师学习对话页
│  ├─ records/page.tsx                  # 学习记录 / 输出记录页
│  └─ api/
│     ├─ profile-test/route.ts          # 联合测试评分
│     ├─ chat/route.ts                  # 三导师对话
│     ├─ courses/route.ts               # 内置课程
│     ├─ materials/route.ts             # 上传资料与拆课
│     ├─ hot/route.ts                   # AI HOT 精选热点
│     ├─ records/route.ts               # 学习记录
│     └─ auth/route.ts                  # 登录相关兜底，如需要
│
├─ components/
│  ├─ ui/                               # shadcn/ui 组件
│  ├─ mentor-card.tsx
│  ├─ chat-panel.tsx
│  ├─ voice-input.tsx
│  ├─ level-map.tsx
│  ├─ profile-card.tsx
│  ├─ course-card.tsx
│  ├─ hot-item-card.tsx
│  ├─ material-uploader.tsx
│  └─ record-timeline.tsx
│
├─ lib/
│  ├─ langgraph/
│  │  ├─ graph.ts                       # LangGraph 主工作流
│  │  ├─ state.ts                       # 工作流状态定义
│  │  ├─ nodes.ts                       # 节点实现
│  │  └─ routers.ts                     # 路由判断
│  │
│  ├─ agents/
│  │  ├─ karpathy.ts                    # 卡帕西导师（AI 技术）
│  │  ├─ qian.ts                        # 钱学森导师（系统工程 + 决策思维）
│  │  └─ adler.ts                       # 阿德勒导师（情绪接纳 + 重构）
│  │
│  ├─ prompts/
│  │  ├─ mentor-personas.ts             # 三导师人格
│  │  ├─ socratic-method.ts             # 苏格拉底式教学法（卡帕西/钱学森共用）
│  │  ├─ output-rules.ts                # 输出沉淀规则
│  │  └─ safety-rules.ts                # 边界与兜底
│  │
│  ├─ courses/
│  │  ├─ built-in-courses.ts            # MVP 内置课程
│  │  ├─ ai-level-courses.ts            # 等级课程映射
│  │  └─ lesson-generator.ts            # 拆课逻辑
│  │
│  ├─ profile/
│  │  ├─ test-questions.ts              # 15 题测试
│  │  ├─ scoring.ts                     # 评分规则
│  │  └─ profile-generator.ts           # 画像生成
│  │
│  ├─ aihot/
│  │  ├─ client.ts                      # AI HOT API 调用
│  │  └─ normalize.ts                   # 热点数据标准化
│  │
│  ├─ materials/
│  │  ├─ parser.ts                      # txt/md/pdf 基础解析
│  │  └─ splitter.ts                    # 自动拆课
│  │
│  └─ supabase/
│     ├─ client.ts
│     ├─ server.ts
│     └─ schema.ts
│
├─ README.md
├─ CLAUDE.md
├─ PRD.md
├─ TECH.md
├─ CHANGELOG.md
├─ .env.example
├─ package.json
└─ tsconfig.json
```

---

## 5. 页面路由设计

| 路由 | 页面 | MVP 作用 |
|---|---|---|
| `/` | 首页 | 产品介绍，开始按钮 |
| `/onboarding` | 联合测试 | 15 题以内测试 |
| `/profile` | 成长档案 | 画像、等级、学习记录入口 |
| `/levels` | AI 能力地图 | 展示 Lv.0-Lv.10 |
| `/courses` | 课程中心 | 内置课程入口 |
| `/hot` | AI 热点学习舱 | AI HOT 精选热点 |
| `/hot/[id]` | 热点详情 | 查看热点并“帮我讲解” |
| `/materials` | 上传资料 | 上传并自动拆课 |
| `/learn` | 学习对话 | 三导师教学主界面 |
| `/records` | 学习记录 | 输出沉淀和历史记录 |

---

## 6. 数据模型设计

MVP 使用 Supabase Postgres。

### 6.1 users

由 Supabase Auth 管理。

扩展字段可放在 `user_profiles`。

### 6.2 user_profiles

```sql
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  display_name text,
  email text,
  learning_profile_type text,
  ai_level int,
  ai_level_name text,
  main_blocker text,
  preferred_pace text,
  mentor_mix jsonb,
  recommended_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 6.3 profile_test_results

```sql
create table profile_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  answers jsonb,
  learning_scores jsonb,
  ai_level_scores jsonb,
  result_summary text,
  created_at timestamptz default now()
);
```

### 6.4 courses

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  target_ai_level_min int,
  target_ai_level_max int,
  source_type text default 'built_in',
  created_at timestamptz default now()
);
```

### 6.5 lessons

```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  title text not null,
  summary text,
  content text,
  order_index int,
  output_task text,
  -- 延伸架构字段（MVP 埋钩子,Phase 2 启用）
  extends_concept_id text,                          -- 指向另一节课的某个核心概念
  next_recommended_lesson_ids text[],               -- 学完后推荐的下一节课列表
  extension_roadmap jsonb,                          -- Phase 2 占位课题 [{title, status, releasedLessonId?}]
  created_at timestamptz default now()
);
```

**延伸字段说明**：

- `extends_concept_id`：MVP 不用,留给 Phase 2 单课深化（例如 Phase 2 的"AI 产品可靠性"课程,`extends_concept_id = "L1::输出不确定性"`）
- `next_recommended_lesson_ids`：每节课自己声明"学完我之后推荐学这些"。MVP 默认沿 `order_index` 走
- `extension_roadmap`：MVP 12 节每节预定义 3 个 Phase 2 占位（见 LESSONS.md §10）

### 6.6 materials

```sql
create table materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text,
  file_name text,
  file_type text,
  raw_text text,
  summary text,
  generated_course_id uuid,
  created_at timestamptz default now()
);
```

### 6.7 learning_sessions

```sql
create table learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  source_type text, -- built_in_course / material / hot_item
  source_id text,
  ai_level_at_start int,
  active_mentor text,
  session_summary text,
  output_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 6.8 messages

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references learning_sessions(id),
  role text, -- user / mentor / system
  mentor_name text,
  content text,
  created_at timestamptz default now()
);
```

### 6.9 outputs

```sql
create table outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_id uuid references learning_sessions(id),
  output_type text, -- one_sentence / note / prompt / social_post / speech_summary
  content text,
  source_type text,
  source_id text,
  created_at timestamptz default now()
);
```

### 6.10 hot_items_cache

```sql
create table hot_items_cache (
  id text primary key,
  title text,
  summary text,
  category text,
  source_url text,
  published_at timestamptz,
  raw jsonb,
  cached_at timestamptz default now()
);
```

---

## 7. API 设计

### 7.1 POST `/api/profile-test`

作用：提交联合测试答案，生成成长档案。

请求：

```json
{
  "answers": []
}
```

返回：

```json
{
  "learningProfileType": "信息过载型",
  "aiLevel": 2,
  "aiLevelName": "AI 对话者",
  "mentorMix": {
    "karpathy": 40,
    "qian": 25,
    "adler": 35
  },
  "recommendedPath": "AI PM 入门：从小白到能设计自己的 AI 学习系统",
  "nextAction": "学习如何用结构化 Prompt 控制 AI 输出"
}
```

### 7.2 GET `/api/courses`

作用：获取内置课程。

### 7.3 POST `/api/chat`

作用：三导师对话。

请求：

```json
{
  "sessionId": "...",
  "userMessage": "...",
  "sourceType": "built_in_course",
  "sourceId": "..."
}
```

返回：

```json
{
  "mentor": "karpathy",
  "message": "...",
  "nextQuestion": "...",
  "needOutput": false
}
```

mentor 字段取值：`"karpathy" | "qian" | "adler"`，由 `route_mentor` 节点在服务端决定。

### 7.4 POST `/api/materials`

作用：上传资料，自动拆课。

返回：

```json
{
  "materialId": "...",
  "summary": "...",
  "generatedLessons": []
}
```

### 7.5 GET `/api/hot`

作用：获取 AI HOT 精选热点。

MVP 默认调用：

```text
GET https://aihot.virxact.com/api/public/items?mode=selected
```

需要兜底：如果接口失败，显示本地示例热点。

### 7.6 POST `/api/records`

作用：保存学习输出和学习记录。

---

## 8. LangGraph 工作流设计

### 8.1 State 定义（LearningContext）

State 即 LearningContext，三位导师**共享同一份完整上下文**，切换时不丢任何信息。

```ts
type LearningState = {
  userId?: string;
  userProfile?: UserProfile;
  aiLevel?: number;
  aiLevelHistory?: Array<{ level: number; at: string }>; // 历史等级变化
  sourceType: "course" | "material" | "hot";
  sourceContent?: string;
  currentMentor?: "karpathy" | "qian" | "adler";
  mentorTurnCount?: number;            // 当前导师已连续发言轮数（路由连续性用）
  lastHandoffReason?: string;          // 上一次切换的原因（供新导师参考）
  messages: Array<{ role: string; mentor?: string; content: string }>;
  outputHistory?: Array<{             // 用户全部历史输出沉淀
    type: string;
    content: string;
    createdAt: string;
  }>;
  recentSessionsSummary?: string;      // 最近 N 次会话摘要（断更召回用）
  userAnswer?: string;
  understandingScore?: number;
  needFollowUp?: boolean;
  needOutput?: boolean;
  outputText?: string;
};
```

### 8.2 节点

```text
load_profile
load_output_history          # 加载用户全部历史输出沉淀（全量上下文）
retrieve_source_content
detect_learning_state        # 分析用户最新发言的情绪/意图/任务类型信号
route_mentor                 # 路由节点：基于状态、内容、信号决定本轮导师
mentor_respond               # 选中的导师基于完整 LearningContext 回应
evaluate_user_answer
generate_follow_up_or_summary
request_output
save_record
```

### 8.3 路由逻辑

路由由 `route_mentor` 节点在每轮用户发言后执行，决定本轮由谁回应。**导师本人不负责切换判断，也不在对话中谈论切换**。

优先级（高到低）：

**0. 阿德勒（首次会话且 evidenceConflict = true，强制最高优先级，一次性）**

- 触发：用户首次进入学习对话，且测试结果中 `evidenceConflict = true`（用户答题里出现矛盾信号，如同时勾选 Lv.0 和 Lv.10）
- 对话姿态：以温和好奇的方式确认用户当前状态，引导用户自己澄清，不强制改答
- 完成此次对话后，flag 自动清除，路由回到正常状态
- 仅本节会话第 1 轮触发，后续轮次按优先级 1-3 继续

**1. 阿德勒（情绪信号触发，强信号即时切换）**

- 关键词：累、不想、学不下去、太差、放弃、焦虑、压力、跟不上、糟糕、算了、还是不会
- 语气：大量省略号、自嘲、突然变冷
- 行为：断更回归（上次会话 ≥ 7 天）、连续 2 次回避任务、当节课重复进出 ≥ 3 次
- 强制场景：刚登录回来且上次会话有未完成任务
- 对话姿态：第一句强制使用罗杰斯式无条件接纳，第二步进入阿德勒式重构（目的论 / 课题分离 / 缩小任务）

**2. 钱学森（系统/落地类）**

- 关键词：做、搭、设计、怎么开始、怎么落地、下一步、项目、产品、PRD、Agent、工作流
- 学习内容：AIPM 主线、Agent 设计、工作流类课程
- 状态转移：用户刚通过卡帕西搞懂一个概念，进入"想动手"模式
- 用户等级：Lv.5+ 段位的实践类学习

**3. 卡帕西（技术/概念，也是默认兜底）**

- 学习内容：AI 技术基础、论文导读、热点中的硬技术
- 新概念引入、用户使用了未定义清楚的词
- 用户说"我懂了"但未用自己的话复述
- 上面两个都不命中时的兜底

**连续性规则（防抖动）：**

- 当前导师默认保持 ≥ 2 轮，避免来回切人造成精神分裂感
- 阿德勒为唯一例外：情绪信号命中立即切换，不等 2 轮
- 钱学森 ↔ 卡帕西 之间需要明确任务类型变化才切换

**切换的用户感知：**

- 用户**不会看到任何 HANDOFF 或交接对话**
- 切换通过 UI 对话气泡上的导师名字/头像变化体现
- 新接手的导师基于完整 LearningContext 直接接住对话，不重新自我介绍

### 8.4 MVP 工作流

```text
读取用户画像
→ 读取 AI 等级
→ 读取历史输出沉淀（构成 LearningContext 一部分）
→ 读取学习来源内容
→ 分析用户最新发言的情绪/意图信号
→ 路由节点选择导师（系统决定，非导师自决）
→ 选中导师基于全量 LearningContext 生成回应
→ 等待用户回答
→ 评估理解
→ 追问或总结
→ 要求输出
→ 保存记录
```

---

## 9. Prompt 管理

所有 Prompt 放在：

```text
lib/prompts/
```

必须包含：

- 三导师人格 Prompt（卡帕西 / 钱学森 / 阿德勒）
- 苏格拉底式教学法 Prompt（卡帕西、钱学森共用）
- 全量上下文统一段（三位顶部共享）
- 输出沉淀 Prompt
- 热点讲解 Prompt
- 上传资料拆课 Prompt
- 兜底 Prompt

### 9.1 苏格拉底式教学法核心规则（卡帕西 / 钱学森共用）

```text
你不能直接长篇讲解。
你必须一次只推进一个知识点。
你必须先问用户一个问题。
用户回答后，你再根据回答追问、提示或总结。
最后必须要求用户用自己的话输出。
```

放在 `lib/prompts/socratic-method.ts`，被 `karpathy.ts` 和 `qian.ts` 引用。`adler.ts` 不引用此文件，他用「罗杰斯式开场 + 阿德勒哲学内核」的混合模式。

---

## 10. 上传资料自动拆课实现

### 10.1 支持格式

MVP 支持：

- pasted text
- txt
- md
- 简单文字型 pdf

### 10.2 流程

```text
读取文件
→ 提取文本
→ 生成摘要
→ 识别主题
→ 拆成 3-8 个课时
→ 每个课时生成：标题、摘要、核心概念、苏格拉底式问题、输出任务
```

### 10.3 兜底

- PDF 解析失败：提示用户复制文本。
- 文本太长：先截取前几万字符，提示用户分段上传。
- 内容太短：直接生成一节微课。
- 内容不清晰：要求用户补充学习目标。

---

## 11. AI HOT 接入

### 11.1 数据源

AI HOT Agent 接入页提供 RSS、REST API、Skill 等方式，可匿名免费读取精选、全部 AI 动态、日报、分类和关键词搜索。

MVP 使用精选热点：

```text
GET /api/public/items?mode=selected
```

基础地址：

```text
https://aihot.virxact.com
```

### 11.2 标准化字段

系统内部统一为：

```ts
type HotItem = {
  id: string;
  title: string;
  summary: string;
  category?: string;
  sourceUrl?: string;
  publishedAt?: string;
  raw?: unknown;
};
```

### 11.3 显示规则

MVP 展示：

- 标题
- 摘要
- 分类
- 来源链接
- 发布时间
- 帮我讲解按钮

### 11.4 重要提示

热点摘要仅用于学习辅助，重要信息以原文为准。

### 11.5 兜底

- API 失败：显示本地示例热点。
- 返回字段变化：使用 normalize 函数兼容。
- 限流：提示稍后刷新。

---

## 12. 语音功能实现

MVP 使用浏览器能力。

### 12.1 语音输入

优先使用 Web Speech API 的 SpeechRecognition。

如果浏览器不支持：

- 隐藏语音按钮，保留文字输入
- 或提示“当前浏览器不支持语音输入，请使用文字输入”

### 12.2 导师回复播放

使用 SpeechSynthesis。

MVP 不做：

- 三导师专属音色
- 情绪语音
- 实时语音流

---

## 13. 登录与保存

### 13.1 登录策略

```text
先免登录体验 → 保存时邮箱登录
```

### 13.2 未登录时

可使用 localStorage 临时保存：

- 测试答案
- 临时画像
- 当前学习进度

### 13.3 登录后

将本地临时记录写入 Supabase。

---

## 14. 错误兜底策略

| 场景 | 兜底 |
|---|---|
| LLM 调用失败 | 显示重试按钮，保留用户输入 |
| LangGraph 节点失败 | 返回基础导师回复，不中断会话 |
| 语音输入失败 | 回退文字输入 |
| 语音播放失败 | 仅显示文字 |
| AI HOT 失败 | 显示本地示例热点 |
| PDF 解析失败 | 提示复制文本或上传 txt/md |
| 保存失败 | 提示稍后重试，允许本地下载记录 |
| 用户未登录 | 引导邮箱登录后保存 |
| 内容过长 | 自动截断并提示分段学习 |

---

## 15. MVP 第一批内置课程数据结构

完整 12 节课内容见 **`LESSONS.md`**（人类可读真理源）。本节定义类型，代码实现时从 `LESSONS.md` 转写到 `lib/courses/built-in-courses.ts`。

```ts
type MentorKey = "karpathy" | "qian" | "adler";

type ExtensionRoadmapItem = {
  title: string;
  status: "phase_2_planned" | "phase_2_in_progress" | "released";
  releasedLessonId?: string;        // released 状态时指向实际 lesson id
};

type BuiltInLesson = {
  id: string;                       // "L1" - "L12"
  courseId: string;                 // "aipm-main" / "ai-tech-foundation" / "ai-level-progression" / "ai-paper-reading" / "ai-hot-example"
  title: string;
  category: "aipm" | "ai_tech" | "ai_level" | "paper" | "hot";
  targetLevelMin: number;           // 0-10
  targetLevelMax: number;           // 0-10
  defaultMentor: MentorKey | MentorKey[];  // 单一或序列（如 ["karpathy", "qian"] 表示先后）
  summary: string;
  keyConcepts: string[];            // 3-4 个
  socraticQuestions: string[];      // 3 个开场问题
  outputTask: string;               // 5-10 分钟可完成
  
  // 延伸架构（MVP 埋钩子,Phase 2 启用）
  extendsConceptId?: string;        // 指向另一节课的某个概念,表示深化
  nextRecommendedLessonIds?: string[];   // 推荐下一节
  extensionRoadmap: ExtensionRoadmapItem[];  // 3 个 Phase 2 占位
};
```

MVP 总共 12 节微课。完整数据见 `LESSONS.md`，36 个 Phase 2 延伸课题占位也在 `LESSONS.md` §10。

---

## 16. 环境变量

见 `.env.example`。

必需：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
AIHOT_BASE_URL=https://aihot.virxact.com
```

可选：

```env
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

---

## 17. 开发优先级

优先级从高到低：

```text
1. 联合测试 + AI 等级结果
2. 三导师学习闭环
3. 输出沉淀保存
4. 内置课程基础结构
5. 上传资料自动拆课
6. AI 热点学习舱精选热点
7. 语音输入和播放
8. 治愈风页面优化
```

---

## 18. 官方参考

- LangGraph.js Docs: https://docs.langchain.com/oss/javascript/langgraph/overview
- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Supabase Auth + Next.js: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- AI HOT Agent 接入: https://aihot.virxact.com/agent
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## 19. AI 能力等级评分算法

完整算法落到 `lib/profile/scoring.ts`。本节定义核心规则。

### 19.1 核心模型

不做"自评式"评分（受 Dunning-Kruger 与冒充者综合症双重污染），改用**行为指纹法**：

```text
7 道行为题 → 每个选项关联 1+ 个等级指标
        → 累计指标分布 levelScores[0..10]
        → 找证据中心 + 应用前置技能门槛
        → 输出 (等级 + 置信度 + 区间)
```

### 19.2 关键参数

| 参数 | 值 | 说明 |
|------|----|----|
| `MIN_EVIDENCE` | 3 | 至少这么多权重才认为该等级有效 |
| `PREREQ_RATIO` | 0.4 | 前置等级证据强度的最低占比 |
| `WEIGHT_LIGHT` | 1 | 弱信号选项权重 |
| `WEIGHT_MEDIUM` | 3 | 中等信号选项权重 |
| `WEIGHT_STRONG` | 5 | 强信号选项权重（如 Lv.7+ 硬证据） |

### 19.3 核心算法（伪代码）

```ts
function determineLevel(levelScores: Record<number, number>): LevelResult {
  const totalWeight = sumValues(levelScores);
  if (totalWeight === 0) return { level: 0, confidence: 0 };
  
  // 1. 证据加权中心
  const centerOfMass = sum(L * levelScores[L]) / totalWeight;
  
  // 2. 从高往低扫,找候选最高等级
  let candidate = 0;
  for (let L = 10; L >= 0; L--) {
    if (levelScores[L] >= MIN_EVIDENCE) { candidate = L; break; }
  }
  
  // 3. 前置技能门槛：高等级声明必须有相邻低等级证据
  while (candidate > 2 && !hasPrerequisiteEvidence(candidate, levelScores)) {
    candidate--;
  }
  
  // 4. 用证据中心做上限,防止单点高分跳级
  const ceiling = Math.floor(centerOfMass + 1.5);
  candidate = Math.min(candidate, ceiling);
  
  // 5. 置信度 = 候选等级 ±1 范围证据占比
  const inRange = (levelScores[candidate-1] || 0) + levelScores[candidate] + (levelScores[candidate+1] || 0);
  const confidence = inRange / totalWeight;
  
  return {
    level: candidate,
    confidence,
    rangeMin: Math.max(0, candidate - 1),
    rangeMax: Math.min(10, candidate + 1),
    centerOfMass,
    evidenceProfile: levelScores
  };
}

function hasPrerequisiteEvidence(L: number, scores: Record<number, number>): boolean {
  if (L === 0 || L === 1) return true;
  const requiredFloor = MIN_EVIDENCE * PREREQ_RATIO;  // = 1.2
  return (scores[L-1] || 0) >= requiredFloor || (scores[L-2] || 0) >= requiredFloor;
}
```

### 19.4 偏误调整

- **Dunning-Kruger**（小白高估）：通过前置技能门槛自动降级
- **冒充者综合症**（中阶低估）：信行为题不信自评。结果页提供"我觉得算高了 [-1] / 算低了 [+1]"按钮,**只能微调一次**
- **冲突检测**：用户答案出现矛盾（如同时勾 Lv.0 + Lv.10）→ 设 `evidenceConflict = true`,首次会话由阿德勒以温和好奇方式确认（路由优先级 0,见 §8.3）

### 19.5 微调存储

`user_profiles` 表中保留两个字段，用于后续分析偏差：

```sql
ai_level_algorithm int,        -- 算法原始结果
ai_level_user_adjusted int,    -- 用户微调后结果（可为 null,只允许调一次）
ai_level int,                  -- 当前生效等级（= user_adjusted ?? algorithm）
```

### 19.6 边界场景

| 场景 | 处理 |
|------|------|
| 全选 A "没用过 AI" | 直接 Lv.0,跳过算法 |
| 总证据 < 5 分 | 兜底 Lv.1,置信度 < 0.3,UI 建议重测 |
| 证据完全均匀 | 用 centerOfMass 取整,置信度 < 0.5 |
| 候选 = 10 但置信度 < 0.7 | 降到 9（Lv.10 证据要求极高） |
| 答题时长 < 60 秒 | 标记 `suspiciousAnswer: true`,UI 引导重答 |
| 两次测试跳跃 ≥ 3 级 | 信新结果,UI 显示历史对比 |

---

## 20. 联合测试 15 题结构

完整 15 题内容（题干、选项、指标映射、设计意图）见 **`QUESTIONS.md`**。本节定义类型与评分规则。

### 20.1 题目分布

| 题号 | 类型 | 用途 | 输出 |
|------|------|------|------|
| Q1-Q5 | 单选 | 学习人格画像 | 5 个维度分数 + 类型 |
| Q6 | **多选** | 行为广度扫描 | levelScores 全等级 |
| Q7-Q12 | 单选 / 多选 | 等级分段三角校验 | levelScores 各段细化 |
| Q13 | 单选 | 学习目标 | recommendedPath |
| Q14 | 单选 | 内容偏好 | 首选 sourceType |
| Q15 | 单选 | 当前最大阻力 | currentBlocker + mentor mix 微调 |

### 20.2 选项 → 指标映射数据结构

```ts
type LevelIndicator = {
  level: number;      // 0-10
  weight: number;     // 1 / 3 / 5
};

type ProfileDimensionImpact = {
  dimension: "anxiety" | "selfBlame" | "outputWillingness" | "persistence";
  delta: number;      // 可正可负
};

type TestOption = {
  id: string;                                  // "Q1-A"
  text: string;
  levelIndicators?: LevelIndicator[];          // 等级题用
  profileImpacts?: ProfileDimensionImpact[];   // 画像题用
  paceValue?: PacePreference;                  // Q4 专用
  pathRecommendation?: string;                 // Q13 专用
  sourceTypePreference?: SourceType;           // Q14 专用
  blockerValue?: BlockerType;                  // Q15 专用
};

type TestQuestion = {
  id: string;                          // "Q1" - "Q15"
  questionType: "single" | "multiple";
  questionCategory: "profile" | "level" | "path" | "blocker";
  text: string;
  options: TestOption[];
};
```

### 20.3 4 种学习人格类型分类规则

5 题画像题答完后得到 4 个维度分数，按优先级判定（先到先选）：

```ts
function classifyProfile(d: Dimensions): ProfileType {
  if (d.anxiety >= 7 && d.persistence <= 4) return "信息过载型";
  if (d.selfBlame >= 7 && d.outputWillingness <= 4) return "完美主义自责型";
  if (d.persistence <= 3) return "断更型";
  return "稳定成长型";
}
```

### 20.4 类型 → mentor mix 基线 + 节奏建议

| 类型 | karpathy | qian | adler | 节奏建议 |
|------|---------|------|-------|---------|
| 信息过载型 | 30% | 20% | 50% | 每天 10 分钟,稳定一个月 |
| 完美主义自责型 | 25% | 25% | 50% | 每天 15 分钟,每周 4 次 |
| 断更型 | 35% | 25% | 40% | 每周 2-3 次,每次 20-30 分钟 |
| 稳定成长型 | 40% | 40% | 20% | 每天 20-30 分钟 |

### 20.5 卡点 → mentor mix 微调

Q15 选项触发的微调（基于类型 baseline 做加减，三者总和恒为 100%）：

| Q15 选项 | currentBlocker | 微调 |
|---------|---------------|------|
| A. 信息太多 | `information_overload` | adler +5%, karpathy 起步最小 |
| B. 学了用不出来 | `knowledge_application` | qian +10%, 项目式优先 |
| C. 学不持续 | `persistence` | adler +10%, 低强度节奏 |
| D. 害怕输出 | `output_fear` | adler +10%, 极小输出任务 |
| E. 焦虑 | `anxiety` | adler +10% |
| F. 不知道有什么用 | `motivation` | qian +10%（反向思考） |

### 20.6 完整测试输出

```ts
type TestResult = {
  learningProfile: {
    type: ProfileType;
    dimensions: { anxiety: number; selfBlame: number; outputWillingness: number; persistence: number; pacePreference: PacePreference };
  };
  aiLevel: LevelResult;                        // 来自 §19 算法
  currentBlocker: BlockerType;
  recommendedPath: string;
  preferredSourceType: SourceType;
  mentorMix: { karpathy: number; qian: number; adler: number };  // 合计 100
  paceRecommendation: string;
  nextAction: string;
  evidenceConflict?: boolean;
  conflictPairs?: Array<{ low: string; high: string }>;
  answeredAt: string;
  durationSeconds: number;
  suspiciousAnswer?: boolean;
};
```
