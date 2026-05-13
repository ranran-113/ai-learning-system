# CHANGELOG.md - 版本记录

所有重要改动都记录在本文件中。

版本格式建议：

```text
v主版本.次版本.修订版本
```

---

## v0.1.0 - MVP 规划版

日期：2026-05-11（含同日修订）

### 2026-05-11 修订（导师与教学架构调整）

- **三导师阵容修订**：「苏格拉底」改为「卡帕西」（Andrej Karpathy 风格）。原因：苏格拉底是教学方法不是领域专家，卡帕西作为真实的 AI 技术教育者更契合产品定位。
- **苏格拉底式教学法下沉**：从单独导师变为「卡帕西」和「钱学森」共用的教学方法。罗杰斯导师不使用此方法，他用 Person-Centered 共情陪伴。
- **导师切换改为系统路由**：原方案「导师自决切换 + HANDOFF token」作废。改由 LangGraph `route_mentor` 节点在每轮用户发言后基于用户状态、学习内容、情绪信号自动决定本轮由谁回应。导师本人不知道也不谈论切换，用户通过 UI 上的导师名字/头像感知。
- **全量上下文规则**：三位导师共享同一份 LearningContext（用户画像 + 完整对话历史 + 全部历史输出沉淀 + 学习来源内容 + 上一位导师交接信息），保证切换时上下文不丢失。
- **连续性规则**：当前导师默认保持 ≥ 2 轮避免抖动；罗杰斯为例外，情绪信号命中立即切换。
- **代码命名约定**：导师 key 为 `karpathy` / `qian` / `rogers`。卡帕西取自在世真人 Andrej Karpathy，MVP 内部开发可用本名，公开上线前需决定是否更名以规避真人形象使用问题。
- **发言字数约束**：卡帕西默认 80 字以内，必要铺垫时可放宽到 120 字；钱学森 ≤ 150 字；罗杰斯 60-100 字。

### 2026-05-11 修订 ②（导师阵容定型 + 心理导师哲学调整）

- **罗杰斯替换为阿德勒**：情绪/陪伴位由罗杰斯改为阿德勒。原因：纯罗杰斯式接纳容易纵容长期回避，与产品「持续学习 + 输出沉淀」行动导向冲突；阿德勒的目的论、课题分离更能有效处理断更自责和输出恐惧。
- **阿德勒采用混合模式**：哲学内核用阿德勒，但**第一句强制使用罗杰斯式无条件接纳**，避免纯阿德勒的说教感。对话三步：接住情绪 → 温和重构（目的论 / 课题分离）→ 缩小任务到 5 分钟。
- **回避边界**：允许用户「今天不学」，但回避同一任务 ≥ 2 次时阿德勒会温和揭示目的论（"你不是不能，是你在选择不做"），防止系统纵容长期断更。
- **钱学森扩展工具箱**：吸纳查理·芒格的部分决策思维工具 —— 反向思考、能力圈判断、机会成本、避免认知偏误。钱学森定位不变（系统工程与项目导师），仅在合适场景调用这些决策工具。
- **芒格列为 Phase 2 候选**：不进 MVP，避免「并列的杂乱主线」。Phase 2 可考虑作为第 4 位导师，专门服务 AIPM 高阶用户的产品决策与商业判断训练。
- **代码命名约定更新**：情绪/陪伴位导师 key 由 `rogers` 改为 `adler`，文件由 `agents/rogers.ts` 改为 `agents/adler.ts`。
- **发言字数约束**：阿德勒沿用罗杰斯原约束 60-100 字。

### 2026-05-11 修订 ③（评分算法 + 测试题 + 课程内容 + 延伸架构定稿）

- **AI 能力等级评分算法定稿**：采用「行为指纹法」而非自评。核心参数 `MIN_EVIDENCE = 3`、`PREREQ_RATIO = 0.4`，含 Dunning-Kruger 自动降级与冒充者综合症微调按钮。完整算法见 `TECH.md` §19。
- **置信度区间展示**：结果页向用户展示置信度（0-1）与等级区间 `[rangeMin, rangeMax]`，符合产品「治愈风」与诚实原则。
- **±1 微调机制**：结果页提供「觉得算高了 [-1] / 算低了 [+1]」按钮，**每用户只能微调一次**。`user_profiles` 表加 `ai_level_algorithm` / `ai_level_user_adjusted` 双字段，当前生效 `ai_level = user_adjusted ?? algorithm`。
- **冲突检测处理**：UI 温和提示「我们注意到…」并允许用户保留原答案；保留时设 `evidenceConflict = true`，触发首次会话由阿德勒以温和好奇方式回访（路由优先级 0，一次性）。详见 `MENTORS.md` §5.3。
- **路由优先级新增 0 级**：首次会话且 `evidenceConflict = true` → 阿德勒最高优先级，完成后 flag 清除。
- **15 题联合测试题目定稿**：5 题画像 + 7 题等级 + 2 题方向 + 1 题阻力。完整题目（含每个选项的指标映射、设计意图）见 `QUESTIONS.md`。
- **4 种学习人格类型定义**：信息过载型 / 完美主义自责型 / 断更型 / 稳定成长型。分类规则与 mentor mix baseline 见 `TECH.md` §20.3-20.4。MVP 先 4 类，Phase 2 再细化。
- **MVP 12 节微课内容定稿**：AIPM 主线 4 节（L1-L4）+ AI 技术基础 3 节（L5-L7）+ 等级进阶 3 节（L8/L9/L10）+ 论文导读 1 节（L11 InstructGPT 与 RLHF）+ 热点示例 1 节（L12 Claude Skills，同时是热点学习模板）。完整内容见 `LESSONS.md`。
- **课程延伸架构**：`lessons` 表新增三个字段 `extends_concept_id` / `next_recommended_lesson_ids` / `extension_roadmap`，MVP 埋钩子 Phase 2 启用。每节课预定义 3 个 Phase 2 延伸方向，共 36 个占位课题。详见 `LESSONS.md` §9-10。
- **课程结束页 UI 钩子**：每节课完成后显示「下一节」+「Phase 2 路线（灰色占位）」，让用户感知到主线纵深，不会"学完一节就结束"。
- **三导师 System Prompt 完整定稿**：三位完整人格 Prompt、典型句式库、路由触发信号、连续性规则全部落到 `MENTORS.md`。`adler.ts` 不引用 `socratic-method.ts`。
- **新增 3 份内容真理源文档**：`LESSONS.md` / `QUESTIONS.md` / `MENTORS.md`，作为人类可读的单一真相来源，对应代码文件由本文件转写产生。
- **新增 TECH §19-20 两章**：评分算法 + 测试题数据结构，与 `QUESTIONS.md` / `LESSONS.md` 互引。
- **CLAUDE.md 必读清单扩展**：从 5 份文档扩展到 8 份，并按任务类型分配优先级。新增禁止行为 13/14（不可删除延伸钩子字段、不可删除 Phase 2 占位内容）。

### 已确定

- 明确产品定位：三导师 AI 学习成长系统。
- 明确核心主线：持续学习 AI → 输出沉淀 → 能力成长。
- 明确目标用户：AI 小白、AI 爱好者、AIPM、职场学习者、AI 从业者、高焦虑学习者。
- 明确 MVP 做网页版，部署到 Vercel，手机和电脑可用。
- 明确采用 Next.js + TypeScript + Tailwind + shadcn/ui + LangGraph.js + Supabase + Vercel。
- 明确先免登录体验，保存时邮箱登录。
- 明确加入 15 题以内联合测试。
- 明确联合测试同时生成学习人格画像和 AI 能力等级。
- 明确 AI 能力进阶地图直接采用 Lv.0-Lv.10。
- 明确 AI 能力等级命名：
  - Lv.0 AI 旁观者
  - Lv.1 AI 初用者
  - Lv.2 AI 对话者
  - Lv.3 AI 控制者
  - Lv.4 AI 跨场景使用者
  - Lv.5 AI 工作流搭建者
  - Lv.6 AI Agent 使用者
  - Lv.7 AI Agent 设计者
  - Lv.8 AI 产品创造者
  - Lv.9 AI 原生工作者
  - Lv.10 个人 AI 系统构建者
- 明确三位导师：
  - 苏格拉底导师
  - 钱学森导师
  - 罗杰斯导师
- 明确教学方式必须采用苏格拉底教学法。
- 明确导师教学形式参考最初博客：角色感、陪伴感、对话式、追问式、课后沉淀。
- 明确 MVP 做文字 + 语音辅助互动。
- 明确语音方案：用户语音输入 + 导师回复播放；MVP 使用浏览器默认语音。
- 明确内置课程采用主线课程 + 知识库结合。
- 明确课程覆盖：AIPM、AI 技术、AI 论文、AI 热点、AI 能力等级进阶。
- 明确 MVP 第一批建议内置 12 节左右微课。
- 明确支持上传资料自动拆课。
- 明确上传资料 MVP 支持复制文本、txt、md、简单文字型 pdf。
- 明确加入 AI 热点学习舱。
- 明确 AI 热点学习舱接入 AI HOT 公开数据，默认展示精选热点。
- 明确 AI 热点学习舱不是复制 AI HOT 网站，而是热点学习入口。
- 明确成长档案页面偏治愈风。
- 明确核心文档：README.md、CLAUDE.md、PRD.md、TECH.md、CHANGELOG.md。

### 暂不做

- 视频导师
- 数字人
- 实时语音聊天
- 三位导师专属音色
- 支付系统
- 社区系统
- 完整课程商城
- 扫描 PDF OCR
- EPUB / MOBI / PPT 深度解析
- AI HOT 全量动态、日报、复杂搜索
- AI 能力等级行为自动评估
- 高级长期记忆

---

## v0.1.1 - 第一阶段本地静态版

日期：2026-05-12

### 已完成

- ✅ 初始化 Next.js 15 + React 18 + TypeScript 5 + Tailwind 3.4 项目骨架（11 个根级配置文件）
- ✅ 实现首页 `/`（治愈风开场 + CTA）
- ✅ 实现联合测试页 `/onboarding`：
  - 15 题完整流程（单选 + 多选）
  - 进度条 + 上一题/下一题 + localStorage 进度保留
  - Q6 冲突检测 + 温和确认 UI（保留 / 调低 / 调高 三选项）
  - 答题计时 + suspiciousAnswer 标记
- ✅ 实现成长档案页 `/profile`：
  - 4 种学习人格类型显示
  - AI 等级 + 置信度 + 区间 + 下一站
  - 三导师陪伴比例横条图
  - 节奏建议 + 今天的第一步
  - 首推荐课程卡片（第二阶段才接 AI）
  - ±1 一次性微调按钮
  - evidenceConflict 提示
  - 开发调试用的评分细节折叠面板
- ✅ 实现 AI 能力地图页 `/levels`（Lv.0-Lv.10 + 当前位置 + 下一站 + 路径感）
- ✅ 实现评分算法 `lib/profile/scoring.ts`（行为指纹法 + 前置技能门槛 + Dunning-Kruger 防护 + 4 兜底场景）
- ✅ 15 题完整数据 `lib/profile/test-questions.ts`（QUESTIONS.md 转写）
- ✅ 12 节微课完整数据 `lib/courses/built-in-courses.ts`（LESSONS.md 转写，含 36 个 extensionRoadmap 占位）
- ✅ 三导师 System Prompts `lib/prompts/mentor-personas.ts`（MENTORS.md 转写，第二阶段直接 import）
- ✅ 类型定义 `types/`（mentor / profile / lesson / test 共 4 个文件）
- ✅ 通用工具 `lib/utils.ts`（cn 函数 + localStorage SSR 安全封装）
- ✅ `.env.example` 模板（LLM Provider 抽象 + Supabase + AI HOT 占位）
- ✅ `PHASE_LAUNCH.md` 公开上线前 8 件事清单
- ✅ 治愈风 Tailwind 调色板（米白底、暖陶土橙、苔绿）
- ✅ `npm install` + `npm run build` + `npm run dev` 全部跑通,4 个页面均 HTTP 200
- ✅ TypeScript 严格模式编译零错误

### 关键技术决策

- **LLM Provider 切换**：从原方案 `OPENAI_API_KEY` 改为统一 4 环境变量（`LLM_PROVIDER` / `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`），默认 DeepSeek，可随时换 GLM / Claude / OpenAI，代码层零改动
- **第一阶段不接 Supabase**：用户数据全存 localStorage，降低准备成本，先验证产品体验
- **页面已为第二阶段留好钩子**：成长档案页的「开始第一节学习」按钮显示但 disabled，第二阶段填入 `/learn` 路由即可

### 下一步（v0.1.2）

- LangGraph 工作流（卡帕西 / 钱学森 / 阿德勒 + route_mentor 节点 + evidenceConflict 0 级路由）
- `/learn` 学习对话页
- 接入 DeepSeek（或所选 LLM）
- 学习记录与输出沉淀保存（先 localStorage,后期迁 Supabase）

---

## v0.1.1 - 待开发（已被本版本替代）

计划内容：

- 初始化 Next.js 项目。
- 搭建基础页面路由。
- 实现首页、联合测试页、成长档案页、AI 能力地图页。
- 完成基础 UI 组件。

---

## v0.1.2 - 第二阶段三导师对话接入

日期：2026-05-12

### 已完成

- ✅ LLM 客户端 `lib/llm/client.ts`：fetch 直连 OpenAI 兼容 API（DeepSeek/GLM/OpenAI 一套代码全支持），含流式 + 非流式
- ✅ LearningContext 完整定义 `lib/langgraph/state.ts`：覆盖 testResult + currentLesson + messages + outputHistory + activeMentor + mentorTurnCount + isFirstTurnOfSession
- ✅ 三导师 prompt builder `lib/agents/builders.ts`：把 LearningContext 翻译成 system prompt + 历史 messages
- ✅ 路由 `lib/langgraph/router.ts`：实现 MENTORS.md §6 路由优先级 0-3 + 连续性规则
- ✅ 主流程 `lib/langgraph/orchestrate.ts`：route → buildPrompt → streamLLM
- ✅ POST `/api/chat`：SSE 流式输出（meta + chunk + done/error 三种帧）
- ✅ 学习对话页 `/learn`：完整聊天 UI + 流式渲染 + 输出沉淀弹层 + 结束本节归档
- ✅ Records 持久化 `lib/records/records.ts`：localStorage 存当前会话 / 归档会话 / 跨会话输出沉淀
- ✅ Profile 页「开始第一节学习」按钮启用，跳转到 `/learn?lesson=Lx`
- ✅ 决定不引入 LangGraph 框架，用纯 TypeScript 等价实现。文件路径保留 `lib/langgraph/` 与文档一致

### 架构决策

- **LLM 客户端去 SDK 化**：原计划用 `openai` npm 包，实际跑下来 SDK v6 + DeepSeek baseURL 组合有兼容问题。改为 fetch 直连 OpenAI 兼容 API，**反而更稳、更轻、provider 切换更干净**。
- **MVP 不引入 LangGraph 框架**：MVP 流程是「route → respond → save」单步，不是真正的图。用纯 TS 实现更简单、bundle 更小、调试更容易。如果未来要扩展为多分支流程图，再引入 LangGraph 平迁。
- **流式响应**：选 SSE（Server-Sent Events）风格的 ReadableStream，不用 WebSocket 也不用 React Suspense streaming，最稳。

### 第一阶段 vs 第二阶段对比

| 维度 | v0.1.1 第一阶段 | v0.1.2 第二阶段 |
|------|----------------|----------------|
| 页面数 | 4 | 5（新增 /learn） |
| API 路由 | 0 | 1（/api/chat） |
| LLM 调用 | 无 | DeepSeek（可换 GLM/Claude/OpenAI） |
| 数据存储 | localStorage | localStorage（不变，Supabase 在第三阶段） |
| 三导师 | 仅 Prompt 文件 | 真实路由 + 实时回复 |
| 流式 | 无 | SSE 流式 token |

### 下一步（v0.1.3 或更后）

- Supabase 数据持久化（让数据跨设备 + 长期保留）
- 学习记录页 `/records`（查所有历史会话 + 输出沉淀）
- AI 热点学习舱 `/hot`
- 上传资料自动拆课 `/materials`
- 上传资料 UI + 服务端解析

---

## v0.1.2 - 待开发（已被本版本替代）

计划内容：

- 实现三导师 Prompt。
- 实现 LangGraph 最小工作流。
- 实现三导师学习对话页。
- 实现一句话输出沉淀。

---

## v0.1.3 - dashboard + 课程中心 + 热点学习舱 + 多 source learn

日期：2026-05-12

### 已完成

- ✅ `/profile` 改造为学习中心 dashboard：6 个 tile 入口（继续学习 / 课程 / 热点 / 上传资料 / 记录 / 能力地图）+ 测试结果嵌入
- ✅ `/courses` 课程中心：12 节微课列表 + 按类别/「适合我」筛选 + 等级标签
- ✅ `/records` 学习记录：会话归档 + 输出沉淀双 tab，自动从 localStorage 读取
- ✅ `lib/hot/client.ts` AI HOT API 客户端 + 字段规范化 + 兜底（API 失败显示本地示例热点）
- ✅ `app/api/hot/route.ts` 服务端 hot 列表端点（5 分钟缓存）
- ✅ `/hot` AI 热点学习舱：精选列表，每条点开可看详情
- ✅ `/hot/[id]` 热点详情页：标题、摘要、原文链接、「帮我讲解」CTA
- ✅ `/learn` 扩展支持多 source：内置课程 / hot_item（material 占位）
- ✅ 热点的合成课程：通过 `buildSyntheticLessonFromHot()` 把热点构造成 BuiltInLesson，复用三导师 prompt builder。模板「是什么→解决什么→相似/不同→对 AIPM 启发」
- ✅ `/materials` 上传资料页占位（明确告诉用户「即将开放」+ 引导去热点 / 课程）

### 架构决策

- **热点学习的"合成 lesson" 模式**：不为热点单独写一套 mentor prompt，而是把热点 wrap 成 BuiltInLesson 形式，复用现有的三导师 prompt builder + LearningContext。代码复用度高，新增 source 类型只需要一个 `buildSyntheticLessonFromXxx()` 函数。
- **AI HOT 兜底**：API 失败时不报错，显示 3 条本地示例热点。用户体验不中断。
- **/hot 用 Server Component + revalidate=300**：5 分钟缓存，不每次访问都打 AI HOT，省用量。

### 下一步（v0.1.4）

- Supabase 邮箱登录（等用户提供 keys）
- 数据从 localStorage 迁移到 Supabase tables
- /materials 真正实现：文件上传 + LLM 拆课
- 学习记录跨设备同步

---

## v0.1.3 - 待开发（已被本版本替代）

计划内容：

- 实现 Supabase 邮箱登录。
- 实现成长档案保存。
- 实现学习记录保存。

---

## v0.1.4 - Supabase 邮箱登录 + harness 升级 #1 + #6

日期：2026-05-12

### 已完成 —— 主线 (Supabase 邮箱登录 + 数据云端同步)

- ✅ 安装 `@supabase/supabase-js` + `@supabase/ssr`
- ✅ `lib/supabase/client.ts`：浏览器端 client
- ✅ `lib/supabase/server.ts`：服务端 client + admin client
- ✅ `middleware.ts`：每个请求维护 auth session cookie
- ✅ `supabase/schema.sql`：用户跑一次的建表 SQL（profiles + outputs + learning_sessions + RLS + 触发器）
- ✅ `/login` 页：magic link 登录（无密码,邮件链接）
- ✅ `/auth/callback` 路由：处理 magic link 回调
- ✅ `lib/sync/sync.ts`：`syncLocalToSupabase()` + `syncSupabaseToLocal()` + 用户态查询
- ✅ `/profile` 加：登录态显示、邮箱登录入口、手动同步按钮、退出登录、首次登录后自动双向同步、未登录时数据丢失提示

### 已完成 —— Harness 升级

#### #6 Prompt caching 优化

- ✅ `lib/agents/builders.ts` 重写：system prompt 按"稳定前缀"组织
  - 顺序：[最稳定] persona → [次稳定] lesson → [次稳定] profile → [动态] outputs + turn count
  - DeepSeek 自动 prefix caching 在同会话内最长公共前缀命中
  - 预期：同一节课内,persona + lesson 部分缓存,每轮便宜约 80%

#### #1 输出校验 + 重试

- ✅ `validateMentorReply(mentor, content)`：检查字数硬上限 + Karpathy 必须含问号
- ✅ `buildRewriteRequest()`：违规时生成"请用更紧约束重新说一遍"的 follow-up messages
- ✅ `lib/langgraph/orchestrate.ts` 重构为 AsyncGenerator,流式后追加校验:
  - 不违规 → 直接 done
  - 违规 → 发 `rethink` 帧 → 非流式调 LLM 重写 → 发 `replace` 帧带新内容
- ✅ `/learn` 页处理 `rethink` / `replace` 帧:UI 显示"…(调整一下表达)…",再用重写版本替换
- ✅ `app/api/chat/route.ts` 重构为简单转发 generator 帧

### 已完成 —— 文档

- ✅ 新增 `HARNESS.md`：7 个 harness 升级项的完整状态追踪 + 触发条件 + 实现方案 + 为什么不现在做的理由
- ✅ `CLAUDE.md` §3 必读清单加入 `HARNESS.md` + `PHASE_LAUNCH.md`
- ✅ `README.md` §7 项目核心文件清单同步

### 用户需要做的（首次部署后必须做）

1. **在 Supabase Dashboard 跑 schema.sql**：项目 → SQL Editor → 新查询 → 粘贴 `supabase/schema.sql` 整个文件 → Run。会建 3 张表 + RLS + 触发器。
2. **在 Vercel 添加 3 个 Supabase 环境变量**：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（标 Sensitive）
3. Vercel 重新部署一次让环境变量生效

### Phase 2 harness 余项追踪

详见 `HARNESS.md` §3:

- #2 Few-shot 示例 → v0.1.5 计划（用户使用后收集真实样例）
- #3 上下文长度管理 → 触发后做（会话超 30 轮）
- #4 结构化次态决策 → MVP 后做（需先看用户使用模式）
- #5 工具调用 → Supabase 接好+有真实数据后做（本版本已铺好数据源）
- #7 自动评估 harness → MVP 上线后做

### 下一步（v0.1.5）

- 跑一些真实学习对话,收集 mentor 回复样例 → #2 Few-shot
- 视用户反馈决定是否做 /materials 上传资料拆课

---

## v0.1.4 - 待开发（已被本版本替代）

计划内容：

- 实现内置课程中心。
- 实现 MVP 12 节微课数据。
- 实现课程学习入口。

---

## v0.1.5 - 5E 教学法 + 左右布局 dashboard + 会话累积起点

日期：2026-05-13

### 已完成 —— 教学方法升级（5E + 锚定开场）

- ✅ 卡帕西 / 钱学森 system prompt 重写：明确分 5 阶段（Engage 锚定 → Explore 苏格拉底 → Explain 祛魅时刻 → Elaborate → Evaluate）
- ✅ 第一轮开场带**概念锚定段**（120-200 字）告诉用户今天要弄清楚什么 + 第一个问题，避免新手"被冷启动"
- ✅ **祛魅时刻指令**：用户卡 2 轮以上 / 来回兜圈子时，mentor 主动"讲穿":"所谓 X 其实就是 Y"，≤ 60-80 字立即接下一个问题
- ✅ 字数限制分层：首轮（含锚定）120-240 字软上限，后续回归 80/150/100 字
- ✅ `validateMentorReply(mentor, content, isFirstTurn)` 按首轮 / 后续用不同 limit
- ✅ MENTORS.md §1.1 新增 5E 教学法说明

### 已完成 —— UI 重构（学习中心左右布局）

- ✅ 新增 `/onboarding/result` 测试结果**庆祝页**：测试完成 → 揭示等级 / 进度条 / 节奏 / 推荐课 → 大按钮「开始你的第一节」直达 /learn
- ✅ /onboarding 跳转改为 /onboarding/result（不直接进 /profile）
- ✅ `components/learning-center-shell.tsx` 学习中心 Shell：
  - 桌面：左侧 240px sidebar 导航（学习中心 / 课程中心 / AI 热点 / 上传资料 / 学习记录 / 能力地图 / 设置）+ 右侧 main
  - 移动：顶栏 + drawer 菜单
  - 内置用户邮箱显示 + 登录 / 退出
- ✅ /profile 重构为**纯 dashboard**（不再扛"结果展示"角色，结果展示在 /onboarding/result）：欢迎 + 继续学习卡 + 等级紧凑展示 + 节奏 + 三导师比例
- ✅ /courses / /records / /hot / /hot/[id] / /materials / /levels 全部包进 Shell，导航一致
- ✅ 新增 `/settings` 页：账号 / 数据同步 / 重新测试 / 清空本地缓存（危险操作）

### 已完成 —— 沉浸式学习（去时间限制 + 会话累积起点）

- ✅ PRD.md / LESSONS.md 移除"15-25 分钟"硬约束，改为"建议 15-25 分钟，但深入想透不限时长"
- ✅ /learn header 加**深度感指示器**（⚪⚪⚫⚫⚫ 基于用户发言轮数），替代时间感
- ✅ /learn header 把「结束本节」改为「暂停本节」，更柔和
- ✅ `resumeArchivedSession()`：进入同一节课时自动恢复最近一次归档会话（v0.1.5 会话累积模型起点）
- ✅ HARNESS.md §4.1 文档化 "v0.2 完整版会话累积模型" 待办（mentor 跨会话续学 + 掌握度评估）

### 用户需要做的

1. **推送代码**：`cd /Users/maiyatang2017/学习系统 && git push`
2. **不需要额外动作**：Supabase schema 不变，Vercel 环境变量不变。本轮纯 UI + 教学逻辑升级，DB / API 无破坏性变更。

### 下一步（v0.1.6）

- 真实使用反馈 → harness #2 Few-shot 示例
- 视用户感受决定 /materials 上传资料拆课优先级
- v0.2 启动时:完整版「会话累积模型」 + 「掌握度评估」

---

## v0.1.5 - 待开发（已被本版本替代）

计划内容：

- 实现上传资料基础解析。
- 实现自动拆课。
- 实现基于上传资料的三导师学习。

---

## v0.1.6 - 待开发

计划内容：

- 接入 AI HOT 精选热点。
- 实现 AI 热点学习舱。
- 实现热点“帮我讲解”。

---

## v0.1.7 - 待开发

计划内容：

- 实现语音输入。
- 实现导师回复播放。
- 增加语音失败兜底。

---

## v0.1.8 - 待开发

计划内容：

- 完成 Vercel 部署。
- 完成 README 运行说明更新。
- 完成基础测试。
