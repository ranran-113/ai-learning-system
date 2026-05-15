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

## v0.4.4 - 章节动作设计修正:聊&沉淀合并为一体

日期：2026-05-15

### 用户指出的设计错误

> 「【聊】和【沉淀】为啥是一样的?【沉淀】和【费曼】这两个难道不应该是在【聊】也就是老师讲课引导用户学习的过程中产生的吗?」

**用户对** —— v0.4.2 把章节卡片做成 4 个并列按钮 `[读][聊][沉淀][费曼]`,这是**设计错误**:

1. 【聊】和【沉淀】跳到同一个 URL,只是后者多了一个 `intent=sediment` 参数,但页面没处理 → 两个按钮效果一样
2. 更根本:**沉淀不是独立动作,它是「聊」的子动作** —— 进 chat 后老师引导对话,过程中点 chat 内的「完成沉淀」按钮就能生成原子笔记。把它拆成两个并列按钮让用户困惑「我点哪个?」

### 修正

**章节卡片从 4 动作 → 3 主动作**:

```
v0.4.2(错):  [📖 读] [💬 聊] [✍ 沉淀] [🎯 费曼]
v0.4.4(对):  [📖 读] [💬 聊&沉淀] [🎯 费曼]
```

**「💬 聊&沉淀」按钮 3 种状态**:
- 灰(accent/10)= 未开始
- 半完成(accent/25 + ⚠)= 聊过但没沉淀(提醒用户回去把沉淀做完)
- 绿(moss/15 + ✓)= 聊+沉淀都完成

**底层依然记 4 个子状态**(read / chat / note / feynman),只是 UI 上把 chat+note 合并显示。「真懂这一章」=3 主动作都完成 =4 子状态都完成。

### 关于费曼

用户也问到费曼是不是应该在【聊】里。我的判断是**费曼独立更好**:
- 费曼有特殊规则(禁用术语 / AI 扮演 10 岁孩子 / 用户主讲 / 三档评价)
- 它是**检验**,不是教学 —— 性质和聊不一样
- 方向相反:聊是「老师引导你」,费曼是「你讲给孩子听」

所以费曼保留为独立的第 3 主动作。

### 文件改动

- `app/learn/[direction]/page.tsx`:
  - 删除独立的【沉淀】按钮
  - 【💬 聊&沉淀】按钮 done 判定 = chat AND note
  - 新增 partial 状态(只聊没沉淀显示 ⚠)
  - ActionButton 组件接受 `state: "todo" | "partial" | "done"` 三档
- `PRD.md` §6.0 / §6.1 / §12.2 描述更新:**3 主动作 + 4 子状态**

### Build 通过

无新增路由,只改章节卡片渲染。

---

## v0.4.3 - 修复学习线返回 bug

详见前一节 commit message。

---

## v0.4.2 - Step 1 信息架构重整(代码实施)

日期：2026-05-14

### ⭐ 这是 v2.0 框架重做的第一个代码版本

v0.4.0-doc + v0.4.1-doc 文档对齐完毕后,本轮开始 **Step 1 信息架构重整**。详细计划见 `ROADMAP.md` Step 1。

### 已交付

**基础设施**:
- ✅ `lib/learning-lines/registry.ts`:**4 大学习线元数据**(ai / aipm / tools / aipm-job)
- ✅ `lib/learning-lines/progress.ts`:**跨线进度计算 + 4 动作完成状态**
- ✅ `lib/feynman/prompts.ts`:费曼挑战 prompt 模板(3 个 prompt:挑战生成 + 10 岁孩子角色 + LLM-as-Judge)
- ✅ `lib/feynman/evaluator.ts`:费曼 LLM 调用封装
- ✅ `lib/langgraph/state.ts`:`OutputRecord` 扩展支持 `type=feynman` + `FeynmanData` 类型
- ✅ `app/api/feynman/child-question/route.ts`:小孩反问 API
- ✅ `app/api/feynman/judge/route.ts`:LLM-as-Judge API

**组件**:
- ✅ `components/learning-center-shell.tsx`:**侧边栏完全重写** —— 8 平铺 → 4 分组(学习线 / 持续学习 / 资产 / 设置)
- ✅ `components/learning-line-card.tsx`:**4 大学习线卡片**(emoji + 进度条 + 推荐高亮)
- ✅ `components/feynman-challenge.tsx`:**费曼挑战完整交互组件**(5 阶段:讲解 → 等问 → 答跟进 → 评价 → 结果)

**页面**:
- ✅ `app/learn/[direction]/page.tsx`:**学习线总览页**(章节列表 + 每章 4 动作按钮:读/聊/沉淀/费曼 + coming-soon 占位)
- ✅ `app/learn/[direction]/[chapter]/feynman/page.tsx`:**费曼挑战页**
- ✅ `app/profile/page.tsx`:**首页完全重写**(欢迎语 + Lv + 沉淀计数 + 接着上次/今日推荐 + 4 学习线卡片 + 持续学习区 + 资产区)
- ✅ `app/onboarding/result/page.tsx`:**测试结果 CTA 改为「进入学习中心」**(跳 /profile 而不是 /learn?lesson=...)

### 设计取舍

- **chat 不再占首页 C 位**:用户进首页看到的是 4 大学习线,不是 chat 框。chat 退到「某一章的深化模式」(从某章卡片的「💬 聊」按钮进入)
- **保持路由兼容**:`/textbooks/*` `/papers/*` `/hot/*` `/courses/*` 全部保留。新路由 `/learn/[direction]` 是主入口,但用户从旧入口进来也不破坏
- **4 动作的具体路由**:
  - 📖 读 → `/textbooks/[bookId]/[chapterId]` (复用现有 reader)
  - 💬 聊 → `/learn?source=textbook&id=[bookId]-[chapterId]` (复用现有 chat)
  - ✍ 沉淀 → 同上(在 chat 内点沉淀按钮)
  - 🎯 费曼 → `/learn/[direction]/[chapter]/feynman` (新)
- **「真懂」标准**:4 动作全部完成才算「真懂」一章(显示 ✓ 标记)
- **三导师品牌位置**:**不占首页 C 位**,但侧边栏顶部副标题保留「三导师 · 4 学习线 · 你的成长系统」
- **侧边栏占位项**:AI 工具 / AIPM 求职 / GitHub / 博客 显示 `soon` 标签,可点击查看占位页

### Step 1 验收对照(ROADMAP §1.2)

- [x] 用户登录后第一眼看到「4 条学习线」,不是 chat 框
- [x] 新用户测完测试题,第一眼能看清自己该走哪条线(推荐线高亮)
- [x] 任何一个学习线点进去能看到「进度 + 章节列表 + 4 动作」
- [x] 费曼挑战入口可用,跑通最小版本(点击进入费曼页 + AI 评价)
- [x] chat 不再是首页 C 位,但用户进某一章后能方便地进 chat
- [x] 侧边栏分 4 组,视觉上一眼能看出层级
- [x] 沉淀的笔记入口归到「资产」分组

### Build 通过

新增路由:
- `/learn/[direction]` (4.85 kB)
- `/learn/[direction]/[chapter]/feynman` (5.44 kB)
- `/api/feynman/child-question`
- `/api/feynman/judge`

`/profile` 从 2.61 kB → 4.83 kB(因 4 学习线卡片 + 进度计算)。

### 下一步

- **用户验收 v0.4.2**(打开 /profile 看新首页,试一下费曼挑战)
- v0.5.x: Step 2 补 AI 工具线 + AIPM 求职线内容
- 当前 commit 标 `[MVP]`(v1.0 之前都是 MVP 阶段)

### 用户需要做的

1. **推送代码**: `cd /Users/maiyatang2017/学习系统 && git push`
2. **打开 /profile 看新首页**,确认 4 学习线展示对
3. **试一下费曼挑战**:进任意 AI 通识章节 → 学习线页 → 点 [🎯 费曼]
4. **反馈**

---

## v0.4.1-doc - 费曼学习法 + 教材-持续学习区双向链接 + MVP/正式版节奏

日期：2026-05-14

### 用户反馈引出的三个补充

用户审 PRD v2.0 后提了三个想法,本轮全部落进文档:

**1. 加费曼学习法**

- PRD §6.0 新增「每章 4 个动作」(读 / 聊 / 沉淀 / **费曼**),四动作通用于所有学习线
- PRD §6.1 / §6.2 更新「每章三动作」→「每章四动作」
- PRD §8.1 笔记类型扩展:新增 `feynman` 类型,字段含 `chapterId / userExplanation / childQuestions / userFollowUps / result / aiReview / durationSeconds`
- PRD §12.2 学习线页章节卡片显示 4 动作按钮 `[读][聊][沉淀][费曼]`
- PRD §12.6 新增费曼挑战页面 ASCII 原型
- **不引入第 4 个导师** —— AI 扮演的「10 岁孩子」是 prompt 模式,保持产品身份「三导师」不稀释

**2. 教材-持续学习区双向链接**

- PRD §7.0 新增「持续学习区 ↔ 教材的双向链接」一节
- **不改教材正文**(教材是稳态),建桥的两种形式:
  - 教材每章下方「📡 这一章在现实中」自动聚合区(近 90 天热点 / GitHub / 博客 / 论文)
  - 持续学习区每条内容显示「**对应教材:[章节链接]**」反向跳转
- 实现机制:tag 匹配 + 关键词匹配。每章带 `relatedTopics`,持续学习内容带 `tags`
- ROADMAP Step 3 增加 3.4 节专项实施

**3. MVP / 正式版 / 迭代节奏判断**

- ROADMAP 末尾新增「MVP / 正式版 / 迭代节奏」一大节
- **核心判断**:我们现在不是「从 MVP 到正式版的线性进展」,是「**用 v2.0 框架重做并补全**」
- **v1.0 = 正式版第一版 = Step 1-5 全部完成**
- 给出 v1.0 的 **6 条判断标准**(骨架完整 / 闭环跑通 / 不需说明书 / 经得起公开 / 无缺口 / 数据持久)
- 明确 **MVP 阶段允许大改框架,正式版阶段只能深化优化**
- 决策标志:commit message 开头加 `[MVP]` 或 `[STABLE]`

### ROADMAP 同步更新

- Step 1 验收标准加「**费曼挑战入口**至少跑通最小版本」
- Step 1 必做项加「**新建费曼挑战页面 /learn/[direction]/[chapter]/feynman**」
- Step 1 改动文件清单加 4 个费曼相关新建文件 + 1 个 state.ts 修改
- Step 3 新增「**3.4 教材 ↔ 持续学习区双向链接**」专项

### CLAUDE.md 新增禁止项

- 禁止行为 18:擅自加第 4 个导师(保持三导师品牌)
- 禁止行为 19:擅自让持续学习区直接改写教材正文(稳态 vs 动态分开)
- 产品核心原则 4 更新:从「苏格拉底优先」→「**苏格拉底优先 + 费曼检验**」(三种方法分工)

### 下一步

- 文档对齐完毕,**v0.4.2+ 开始 Step 1 实施**
- 等用户审完本轮 + 给开干信号

---

## v0.4.0-doc - 框架重做规划（仅文档,不动代码）

日期：2026-05-14

### ⚠️ 重大节点：v2.0 框架重构启动

**用户反馈核心问题**:v0.1-v0.3 是「**叠加式迭代**」,每次往上加东西,没有回到初衷重新审视产品骨架。结果是:

- 侧边栏 8 个平铺项,没有「**学习路径**」概念
- chat-first 让导师占首页 C 位,但「**和导师聊**」是手段不是目的
- 教材 32 章和 12 节课并存,逻辑重叠混乱
- **用户初衷里的 AI 工具 / AIPM 求职 / GitHub 周榜 / 博客访谈 / 沉淀出口全部缺失**

v0.4.0 是**框架重做的起点**。本轮**只动文档,不动代码**:对齐方案,形成单一真相。下一轮(v0.4.1+)才开始 Step 1 实施。

### 已完成

- ✅ **PRD.md v2.0 重写**(完全重写)
  - 4 大学习线框架(**AI 通识 / AIPM / AI 工具 / AIPM 求职**)
  - 持续学习区横切(**热点 / GitHub 周榜 / 博客访谈 / 论文**)
  - 资产沉淀出口(**Obsidian / 自媒体 / 简历作品集**)
  - 0-10 级和教材 32 章绑定(每章标 targetLevelMin/Max)
  - 三导师从首页 C 位 → 产品身份(标识 + 介绍页 + chat 内)
  - 5 类目标用户(新增「**想做 AI 内容输出的人**」)
  - 12 个关键页面原型(ASCII 级别)
  - 与 v0.x 现状的迁移路径
- ✅ **ROADMAP.md 新建**(详细 5 阶段路线)
  - Step 1(v0.4.x):信息架构重整 ★ 优先做
  - Step 2(v0.5.x):补 AI 工具线 + AIPM 求职线
  - Step 3(v0.6.x):补 GitHub 周榜 + 博客访谈
  - Step 4(v0.7.x):沉淀出口闭环(Obsidian / 自媒体)
  - Step 5(v0.8.x):老手快速通道
  - 每步都拆到「**新建什么文件 / 验收标准 / 不在范围**」
- ✅ **CLAUDE.md 规则更新**(对齐 v2.0)
- ✅ **LESSONS.md 标 deprecated**(12 节课不再是主线,作为参考保留)

### 关键决策(用户已确认)

- **Q1: 4 条主学习线** = AI 通识 / AIPM / AI 工具 / AIPM 求职。AI 工具线 MVP 期重 Claude Code,先不拆
- **Q2: 4 主线 + 持续学习区**(不做第 5 条线,持续学习是横切的)
- **Q3: 三导师保留为产品身份**(首页副标题保留,但不占 C 位)
- **Q4: 12 节课作废,32 章教材为唯一系统化内容**;0-10 级保留并与教材绑定
- **Q5: 先落文档再动代码**(本轮的范围)

### 下一步

- v0.4.1: 开始 Step 1 实施(/home / 学习线 / 侧边栏重写)
- 详见 `ROADMAP.md`

### 用户需要做的

1. **审阅 PRD.md v2.0** 和 **ROADMAP.md**
2. **确认 Step 1 可以动手**(或者告诉我哪里要改)
3. **推送代码**: `cd /Users/maiyatang2017/学习系统 && git push`

---

## v0.3.1 - /profile 加「今日主路径」轻量卡

日期：2026-05-14

### 新增

- ✅ `components/today-path-card.tsx`:**「今日主路径」轻量卡**(chat 之上、状态栏之下)
  - 一行高度,3 秒能扫完,不打断 chat-first
  - 优先级:**未完成会话 > 今日推荐课**
    - 有未完成会话:「**接着上次:卡帕西 · L8 学会提问 · 第 6 轮 [继续 →]**」
    - 无会话只有推荐:「**今天开始一节:推荐 L9 控制 AI 输出 [开始]**」
  - 右上角 ✕ 折叠:存 `als:today-path-dismissed:YYYY-M-D` localStorage,**当天不再弹**(跨天自动重置)
  - 导师名称取自会话里最后一条 mentor 消息的 mentor 字段(更准)
  - 轮数 = `messages.length / 2` 向上取整
- ✅ `components/learning-chat.tsx`:监听 `als:focus-chat` 事件
  - 点「继续/开始」按钮触发 chat 输入框 focus + 自动滚到底
  - 用 window CustomEvent 解耦(不需要 forwardRef)

### 修改

- ✅ `app/profile/page.tsx`:
  - 在 LearningChat 之上加 TodayPathCard
  - 新增 `currentSession` 状态(用于喂给 TodayPathCard 判断分支)
  - `onSessionEnd` 触发时清空 `currentSession`,卡片切换到推荐模式

### 设计取舍

- **不放业务功能在卡上**:卡只负责「**你现在在哪、下一步**」,不放沉淀 / 测试 / 等级跳转,保持 3 秒可扫
- **当天折叠不跨天**:用 YYYY-M-D 做 key,跨天自动重新出现,避免「**关一次永远看不到**」
- **导师名优先看最后一条消息**:`activeMentor` 字段可能过时,最后一条消息的 mentor 更准

---

## v0.3.0 - 两本教材全本完成（32 章约 16 万字）

日期：2026-05-14

### 里程碑：v0.2.0 启动的教材项目交付完成

教材项目从 v0.2.0 启动（C1 质量样板）→ v0.2.1（C2-C5）→ **v0.3.0 一次性补完剩余 27 章**。

最终交付:**两本完整教材,32 章,约 15-16 万字**。

### AI 通识教材（16 章）全本完成

Part I · 看清 AI 这件事
- C1 AI 不是魔法,也不是电影:60 年简史
- C2 大模型在做什么:一切只为猜下一个字
- C3 Transformer:AI 大脑长什么样
- C4 训练 vs 推理:AI 怎么学会和怎么回答

Part II · 用得起来
- C5 Prompt 的力量:你问得对它才答得对
- C6 RAG:给 AI 一份资料
- C7 Agent:让 AI 多步做事
- C8 从一次性使用到工作流

Part III · 看穿系统
- C9 多 Agent 协作:让 AI 团队替你干活
- C10 大模型的幻觉、偏见、知识截止
- C11 评估:怎么知道 AI 答得好不好
- C12 自己搭一个 Agent

Part IV · 走向系统构建者
- C13 把 AI 嵌进你每天的工作
- C14 个人知识库 + AI = 个人方法论
- C15 多模态 / Embodied AI / 未来形态
- C16 AGI 路线图:业内最严肃的几个判断

### AIPM 教材（16 章）全本完成

Part I · AI 产品的本质
- C1 AI 产品和传统产品的根本不同
- C2 AI 产品需求分析:从模糊愿景到可做需求
- C3 AI 产品的可靠性 + 置信度设计
- C4 AI 产品的评估方法

Part II · 设计 AI 产品
- C5 Prompt 产品化:把 Prompt 当产品来设计
- C6 Agent 产品设计:从工作流到 Agent
- C7 数据飞轮:AI 产品的护城河
- C8 多模型策略 + 成本控制

Part III · 落地 + 上线
- C9 从 PRD 到上线:AI 项目管理
- C10 跨职能协作:与工程师 / 设计师 / 法务
- C11 AI 产品的定价与商业模式
- C12 AI 产品的风险与边界

Part IV · 高阶 AIPM
- C13 拆解 AI 产品:5 层逆向工程框架
- C14 用决策思维做 AI 产品
- C15 AI 产品案例集(精读 5 个)
- C16 AI PM 的成长路径

### 风格一致性

全 32 章保持统一风格:
- 反常识开场 + 第二人称 + 零数学公式
- 真实数据点(具体年份 / 数字 / 公司 / 案例)
- 跨章呼应（C2 设伏 → C3 揭示 → C4 训练 → C5 操作权）
- 章末「本章你学到了什么」收束
- 苏格拉底式提问 3 题 + 输出任务 1 题
- 默认导师:技术章节卡帕西,系统/工程/产品章节钱学森

### 关键案例覆盖

真实案例横跨全书:
- AI 通识:McCarthy / Minsky / AlexNet / Hinton / Sutskever / 历次寒冬
- 反常识技术拆穿:Transformer / RNN / attention / 三阶段训练 / Sora / o1 / scaling law
- AIPM 实战:Air Canada / Cursor / Devin / NotebookLM / Notion AI / ChatGPT / Claude / Anthropic 工程哲学

### 已更新

- ✅ `lib/textbooks/loader.ts` AVAILABLE_CHAPTERS 扩展到 AI 16 + AIPM 16
- ✅ `lib/textbooks/aipm/` 新建,16 个 JSON 全部成稿
- ✅ `lib/textbooks/ai/` 补完 c06-c16

### 用户需要做的

1. **推送代码**: `cd /Users/maiyatang2017/学习系统 && git push`
2. **试读任意章节**(教材入口在侧边栏「📖 教材」)
3. **反馈 UX 问题**(用户提到要反馈 UX,这次交付完后)
4. **任何想改的告诉我**:风格 / 节奏 / 深度 / 例子 / 跨章呼应

### 后续路线

v0.3.0 完成「**教材内容**」,下一步是:
- v0.3.x:UX 优化(根据用户反馈)
- v0.4.x:教材与课程 / 三导师对话的更深集成
- 公开上线前 8 件事(见 PHASE_LAUNCH.md)

---

## v0.2.1 - AI 通识 C2-C5（Part I 收尾 + Part II 启动）

日期：2026-05-13

### 已完成 —— 一次性写完 4 章

- ✅ `lib/textbooks/ai/c02.json`:**「大模型在做什么：一切只为猜下一个字」5400 字**
  - 开场游戏（「今天天气真…」「李白是唐朝著名的…」）让读者亲手体验大模型在做的事
  - 拆穿「思考」幻觉:接续规律 vs 知识存储
  - 自回归生成（autoregressive）一字一字「猜+续」机制
  - Temperature 三档酒量类比（0 清醒 / 0.7 微醺 / 1.5 喝高了）
  - 幻觉是「采样的副作用」而非「AI 在说谎」
  - 反常识金句：「理解可能不是神秘智能，而是大量正确接续预测的累积」
- ✅ `lib/textbooks/ai/c03.json`:**「Transformer：AI 大脑长什么样」5500 字**
  - 反常识立判：「Transformer 不是大脑，是一种并行查找规则」
  - 先讲 RNN 走入死胡同的两个原因（长距离依赖丢失 + 必须串行）
  - Attention 用「在会议室开会」类比 —— 每个发言看所有发言，自决关注谁
  - 多头注意力 = CEO/CFO/HR/法务同时听一段话的多视角
  - 数学本质：每个字的新表示 = 所有字加权求和（可并行 + 矩阵乘法 = GPU 友好）
  - 跨章呼应:GPT-3 = 96 层 × 96 头 Transformer 堆叠
- ✅ `lib/textbooks/ai/c04.json`:**「训练 vs 推理：AI 怎么学会和怎么回答」5800 字**
  - 区分两个完全独立的阶段（训练 = 学；推理 = 用）
  - 三阶段训练三类比：Pre-training（图书馆 4 年）/ SFT（考研班 3 个月）/ RLHF（老板手把手带 3 周）
  - 训练完参数冻结:解释为什么 GPT-3 永远停在 2021 年
  - Memory 是「外挂记忆」不是「重新学」:讲清产品层 vs 模型层的界限
  - 跨章呼应：和 C3 attention 共同回答「为什么大模型能跑起来」
- ✅ `lib/textbooks/ai/c05.json`:**「Prompt 的力量：你问得对它才答得对」5800 字**
  - 核心比喻：AI = 实习生 + 全互联网（不是大师）
  - 四段式 prompt 结构（角色 + 任务 + 约束 + 输出格式），含完整改造前后对比
  - CoT 思维链:从 17%→78% 数学题正确率的真实研究
  - 逃生通道防幻觉:「不知道就说不知道」一句话
  - 自己用的 prompt vs 产品里的 prompt:工程化要求的本质不同
  - 跨章呼应:回扣 C2「猜下一个字」「采样幻觉」、C4「RLHF 偏好」
- ✅ `lib/textbooks/loader.ts` AVAILABLE_CHAPTERS 更新到 c01-c05

### 风格延续

- 卡帕西/李宏毅/Jay Alammar 三家融合风格继续：反常识开场、第二人称、零公式、真实数据点（GPT-3 参数 / CoT 论文数字 / 训练成本 / token 量）
- 跨章呼应清晰：C2 设伏（"猜字"），C3 揭示机制（attention 怎么猜），C4 讲怎么练（三阶段），C5 给用户操作权（怎么写 prompt 让它猜得更准）
- 每章 socratic 问题指向「能跑通这章逻辑就能答」的真问题，不是套话

### 待后续轮次

- v0.2.2: AI 通识 C6-C9（RAG / Agent / Workflow / Multi-Agent）
- v0.2.3: AI 通识 C10-C13
- v0.2.4: AI 通识 C14-C16 + AI 通识全本完成
- v0.3.x: AIPM 16 章

### 用户需要做的

1. **推送代码**: `cd /Users/maiyatang2017/学习系统 && git push`
2. **试读 C2-C5**，挑你最有感的一章给反馈
3. **任何想改的告诉我**:某段太硬 / 类比换一个 / 漏了一个点 / 想加什么例子，都行

---

## v0.2.0 - 教材框架 + AI 通识 C1（质量样板）

日期：2026-05-13

### 重大变化:启动教材专项

- 产品定位升级：原 12 节互动课为 MVP 简化版,现在升级为**两本完整教材 32 章**,每章「教程版（读）+ 对话版（学）」双模式
- 12 节精选课变成"推荐学习路径"标记

### 写作策略转向:Claude 直接撰写

- **试错过 DeepSeek 一次性生成 16 章** → 质量"够用但不卓越",归档到 `_deepseek_v0_archive/` 仅作参考
- **新策略**: Claude (Opus 4.5+) 直接撰写,每轮 3-4 章高质量成稿,用户审 + 加料
- 优势:产品哲学一致、跨章呼应、风格统一、跨技术流派批判性视角

### 已完成

- ✅ `lib/textbooks/types.ts` 教材类型定义（章节正文 + 互动配置）
- ✅ `lib/textbooks/registry.ts` 完整 32 章 outline（AI 通识 16 + AIPM 16）
- ✅ `lib/textbooks/loader.ts` 章节加载器 + 可用性追踪
- ✅ `lib/textbooks/ai/c01.json`:**AI 通识 C1「AI 不是魔法，也不是电影：60 年简史」由 Claude 撰写完成,5400 字**
  - 反常识开场（"AI 是 70 岁的概念"）
  - 真实人名 / 时间 / 引语（McCarthy / Minsky / AlexNet / Hinton / Sutskever 等）
  - 跨流派批判性视角（每一波 AI 大热都说"这次不一样"）
  - 跨章呼应（结尾自然引向 C2"猜下一个字"）
- ✅ `/textbooks` 两本教材入口页
- ✅ `/textbooks/[bookId]` 单本教材目录（按 Part 分组,每章带"已成稿/即将上线"标记）
- ✅ `/textbooks/[bookId]/[chapterId]` 章节阅读页（react-markdown 渲染 + 自定义中文排版样式）
- ✅ 章节末尾「让导师讲解」CTA → `/learn?source=textbook&id=<book>-<chapter>`
- ✅ `/learn` 支持 source=textbook,把章节合成 lesson 进入对话模式
- ✅ 侧边栏新增「📖 教材」入口
- ✅ react-markdown + remark-gfm 装入,中文阅读样式（粗体高亮 / blockquote / 标题分级）
- ✅ DeepSeek 生成的 16 章 v0 草稿归档到 `_deepseek_v0_archive/`（不删,留作风格对比）

### 待后续轮次

- v0.2.1: AI 通识 C2-C5（4 章）
- v0.2.2: AI 通识 C6-C9（4 章）
- v0.2.3: AI 通识 C10-C13（4 章）
- v0.2.4: AI 通识 C14-C16 + 收尾（3 章 + AI 通识全本完成）
- v0.3.0-v0.3.4: AIPM 16 章
- v0.4: 全 32 章可在 /textbooks 全本阅读 + 全章可对话学习

### 用户需要做的

1. **推送代码**: `cd /Users/maiyatang2017/学习系统 && git push`
2. **试读 C1**,判断质量是否达到「最伟大教材」标准
3. **反馈**:风格 / 节奏 / 深度 / 细节,任何想改的告诉我

---

## v0.1.6.1 - UI 修复 + 热点新版布局 + 论文导读 15 篇

日期：2026-05-13

### 已完成 —— 3 件事

#### 1. UI 修复:悬浮胶囊输入框

- ✅ 输入栏改为 `sticky bottom-0` + 圆角胶囊 + 白底阴影
- ✅ 移除"本节输出任务"独立横条
- ✅ 新增**"进阶 ▼"下拉**菜单：完成沉淀 / 看本节任务 / 暂停本节
- ✅ 发送按钮改为圆形（参考豆包 / 主流 AI 产品）
- ✅ 上方加 fade 渐变，让滚动消息不直接顶到输入栏

#### 2. /hot 热点布局重构（沿用 AI HOT 站结构）

- ✅ **三大 tab**：精选 / 全部 AI 动态 / AI 日报
- ✅ 精选 tab：分类筛选（全部 / 模型 / 产品 / 行业 / 论文 / 技巧）
- ✅ 全部 AI 动态 tab：双层筛选（来源 + 分类）
- ✅ AI 日报 tab：按月分组的日期归档列表
- ✅ `lib/hot/client.ts` 扩展：支持 `mode` / `category` / `sourceFilter` 参数 + `fetchDailyDigests`
- ✅ 新增 `/api/hot/daily` 端点
- ✅ 全局搜索 + 兜底显示（API 失败时本地示例）

#### 3. 论文导读 Phase 1（15 篇手动 curate）

- ✅ `lib/papers/papers.ts` curated 15 篇 AIPM 必读论文：
  - 基础模型：Attention / GPT-3 / GPT-4 / Claude 3
  - 对齐与微调：InstructGPT / Constitutional AI / DPO
  - 推理与提示：CoT / o1
  - Agent 与工具：ReAct
  - RAG 与知识：RAG (Lewis 2020)
  - 多模态：Sora
  - 效率与开源：Llama 2 / Mixtral / DeepSeek-V3
- ✅ 每篇含：标题 / 作者 / 年份 / 类别 / 中文摘要 / **为什么 AIPM 该读** / 核心贡献 / 推荐导师 / 难度
- ✅ `/papers` 列表页：分类筛选 + 搜索 + 难度标签
- ✅ `/papers/[id]` 详情页：完整摘要 + AIPM 视角 + 「让卡帕西讲解」CTA
- ✅ `/learn?source=paper&id=xxx` 支持：把论文合成为可对话学习的 lesson
- ✅ 侧边栏新增「📜 论文导读」入口

### 用户需要做的

1. **推送代码**：`cd /Users/maiyatang2017/学习系统 && git push`

### 下一步（v0.2 教材专项）

- 教材待启动：AI 通识 16 章 + AIPM 16 章 = 32 章 ≈ 14-18 万字
- 写作策略：v0 LLM 全本生成（3-5 天）→ 用户按章审 / 加料 → v1 / v2 迭代
- 教材每章配套互动学习模式（教程 tab + 对话 tab）
- 12 节精选课变成"推荐学习路径"标记

---

## v0.1.6 - chat-first UI + 原子笔记 + 上传资料拆课 + 学习偏好

日期：2026-05-13

### 已完成 —— UI 重构

- ✅ 抽取 `components/learning-chat.tsx`:学习对话主体组件,/profile 和 /learn 共用
- ✅ `/profile` 改为 **chat-first**:右侧主区直接显示当前学习的对话,无在学时显示状态卡 + 入口
- ✅ `/learn` 重构为薄壳:用 LearningChat 全屏模式,支持 lesson / hot_item / material 三种 source
- ✅ 输入栏增强:
  - 左 **`+` 按钮**:上传 .txt / .md 作为本轮上下文（不污染整节课）
  - 右 **🎙 听写**:Web Speech API 中文语音转文字（按下听,再按停）
  - 每条 mentor 消息可点 **🔊 播放**（SpeechSynthesis,再点暂停）

### 已完成 —— 原子笔记 + 个人知识库

- ✅ `OutputRecord` 升级为 `AtomicNote`:加 title / tags / source / linkedNoteIds 字段（兼容旧版）
- ✅ 沉淀混合模式（方案 C）:点「完成沉淀」→ `/api/sediment/draft` 让 LLM 起草 → 用户编辑标题/正文/标签 → 保存
- ✅ `/records` 改造为 **个人知识库视图**：
  - 三 tab:原子笔记 / 学习会话 / 概览
  - 笔记 tab:搜索 + 标签筛选 + 卡片网格,每张卡可单独导出
  - 概览 tab:统计 + 学习领域分布 + 标签云
- ✅ Markdown 导出 `lib/records/export.ts`:
  - 每条笔记一个 .md 文件,含 frontmatter（title/tags/source/suggested-wiki-path）
  - JSZip 打包成 zip 下载
  - frontmatter 的 `suggested-wiki-path` 提示导入用户 wiki 哪个目录（与个人 wiki 互通,不强写）

### 已完成 —— 导师 prompt 升级

- ✅ SHARED_CONTEXT_PREAMBLE 加两条:
  - **主动引用旧笔记**:用户问的话题在历史输出沉淀里有关联时主动引用
  - **主动促沉淀**:检测 insight signal（”所以我觉得 X”等）时建议存知识库

### 已完成 —— 上传资料自动拆课

- ✅ `/materials` 真正实现:粘贴文本或 .txt/.md 文件 → 调 `/api/materials/split` → LLM 拆成合成微课
- ✅ 拆课产出:摘要 + 合成 lesson（标题/核心概念/3 个紧扣资料的苏格拉底问题/输出任务）
- ✅ 资料存 localStorage,通过 `/learn?source=material&id=xxx` 学习
- ✅ 兼容内置课 + 热点 + 资料三种 source 统一在 LearningChat

### 已完成 —— 学习偏好（轻量用户 Skills）

- ✅ `/settings` 新增「学习偏好」section:
  - 学习风格（先具体例子 / 先抽象框架 / 平衡）
  - 讲解深度（精简 / 平衡 / 深挖）
  - 温度（克制 / 平衡 / 温暖）
  - 自由文本「额外指令」
- ✅ `lib/preferences/preferences.ts` localStorage 存储 + `preferencesToPromptSegment` 渲染
- ✅ LearningContext 加 `userPreferences` 字段,自动注入 mentor system prompt（在 caching 友好的位置）

### 架构决策

- **个人知识库的”sweet spot”**：不重复用户外部 wiki,**做学习过程的副产品**。导出 markdown 含 `suggested-wiki-path` 让用户决定要不要进自己的 wiki。系统永远不强写入用户外部 wiki（边界）。
- **学习偏好作为轻量 Skills**:不是用户自创复杂 Skill,而是几个开关 + 自由文本,门槛低,效果立竿见影。
- **上传资料 v0.1.6 用 localStorage**:跨设备同步留给 v0.1.7（Supabase 完全迁移时一起）。

### 用户需要做的

1. **推送代码**：`cd /Users/maiyatang2017/学习系统 && git push`
2. **不需要新环境变量**:本轮纯前端 + LLM 调用增强,后端不变。

### v0.1.7（下一轮）路线

- 双向链接 `[[note title]]` + 图谱视图
- 全文检索（FTS5 风格,前端 fuse.js 或 Supabase pg_trgm）
- localStorage → Supabase 完全迁移（含 materials + preferences）
- PDF 解析（上传资料支持 PDF / Word 等）

---

## v0.1.6 - 待开发（已被本版本替代）

计划内容：

- 接入 AI HOT 精选热点。
- 实现 AI 热点学习舱。
- 实现热点”帮我讲解”。

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
