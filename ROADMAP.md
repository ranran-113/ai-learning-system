# ROADMAP.md - v2.0 框架重构路线图

最后更新：2026-05-14

---

## 背景

从 v0.1.0 到 v0.3.1 我们一路「**叠加式迭代**」：每次往上加东西，没回到产品初衷重新审视。结果是：
- 侧边栏 8 个平铺项无主线
- chat-first 让导师占首页 C 位但「**和导师聊**」是手段不是目的
- 教材 32 章和 12 节课并存逻辑混乱
- 用户初衷里的「**AI 工具 / AIPM 求职 / GitHub 周榜 / 博客访谈 / 沉淀出口**」全部缺失

v2.0 是**框架重做**。详细愿景见 `PRD.md`。

这份路线图把改动拆成 5 个 Step，**每个 Step 独立可交付、可上线、可被用户感知**。

---

## 总览

```
v0.4.x  Step 1: 信息架构重整      (1-2 周)  ★ 优先做
v0.5.x  Step 2: 补两条缺失学习线   (4-6 周)
v0.6.x  Step 3: 补缺失知识源       (2-3 周)
v0.7.x  Step 4: 沉淀出口闭环       (2-3 周)
v0.8.x  Step 5: 老手快速通道       (1 周)
v1.0.0  公开上线
```

---

## Step 1（v0.4.x）：信息架构重整

**目标**：内容不变，但产品骨架完全按 v2.0 PRD 重组。一上线用户立刻感受到「**这个产品想清楚了**」。

**预计周期**：1-2 周

### 1.1 必做

- [ ] **重写首页 /profile → /home（或 /profile 继续用但重写）**
  - 顶部：欢迎语 + Lv.X + 沉淀计数
  - 「**接着上次**」+「**今日推荐**」（保留 v0.3.1 的 TodayPathCard 思路但放大）
  - **4 大学习线卡片**（AI 通识 / AIPM / AI 工具 / AIPM 求职）
  - **持续学习区**（热点 / GitHub / 博客 / 论文）
  - **资产区**（笔记数 / 自媒体 / 草稿）
  - **移除**：chat 占主区的设计

- [ ] **重写侧边栏 LearningCenterShell**
  - 从 8 平铺 → 4 分组（学习线 / 持续学习 / 资产 / 系统）
  - AI 工具 + AIPM 求职先建空导航占位

- [ ] **新建学习线页 /learn/[direction]**
  - 4 个 direction：ai / aipm / tools / aipm-job
  - 每条线显示进度 + 章节列表 + 子线入口
  - 章节级三动作（读 / 聊 / 沉淀）
  - 求职子线在 AIPM 线下

- [ ] **改造 chat 路径**
  - 从「**首页主区**」改为「**某一章的深化模式**」
  - 现在 /learn?source=... 的 URL 模式保留
  - chat 顶部加「**返回章节**」清晰的退出路径

- [ ] **重组现有内容**
  - 教材 16+16 章 → 归位到 AI 通识 / AIPM 学习线
  - 论文 15 篇 → 持续学习区
  - 热点 → 持续学习区
  - 上传资料 → 学习线内的子能力（不再独立侧栏）

- [ ] **路由兼容**
  - /profile 保留并跳转 /home（或继续用 /profile 但内容是新首页）
  - /textbooks 路由保留作为「**全教材浏览**」入口（不主推）
  - /courses 路由保留兼容（v0.5 完全废除）
  - /papers /hot /materials /records 全部保留

- [ ] **测试结果页改造**
  - 测完之后跳转目的地从「**进 chat**」改为「**进首页**」
  - 首页根据测试结果**高亮某条线**作为推荐

### 1.2 验收标准

- [ ] 用户登录后第一眼能看到「**4 条学习线**」而不是 chat 框
- [ ] 新用户测完测试题，**第一眼能看清自己该走哪条线**
- [ ] 任何一个学习线点进去能看到「**进度 + 章节列表 + 三动作**」
- [ ] chat 不再是首页 C 位，但用户进某一章后能方便地进 chat
- [ ] 侧边栏分 4 组，**视觉上一眼能看出层级**
- [ ] 沉淀的笔记入口归到「**资产**」分组

### 1.3 不在 Step 1 范围

- AI 工具线的具体内容（**Step 2**）
- AIPM 求职线的具体内容（**Step 2**）
- GitHub 周榜抓取（**Step 3**）
- 博客 / 访谈策展（**Step 3**）
- 自媒体草稿生成（**Step 4**）
- Obsidian 导出（**Step 4**）

### 1.4 改动文件清单（预估）

```
新建:
  app/home/page.tsx (或重写 app/profile/page.tsx)
  app/learn/[direction]/page.tsx
  app/learn/[direction]/[chapter]/page.tsx (可能复用 textbooks 路由)
  components/learning-line-card.tsx
  components/today-focus-card.tsx (扩展自 TodayPathCard)
  lib/learning-lines/registry.ts (4 条线的元数据)
  lib/learning-lines/progress.ts (跨线进度计算)

修改:
  components/learning-center-shell.tsx (侧边栏重写)
  app/profile/page.tsx (改为首页或重定向)
  app/onboarding/result/page.tsx (跳转目的地)
  app/learn/page.tsx (chat 顶部加返回章节)

废弃但保留路由:
  app/courses/* (重定向到 /learn/ai 或 /learn/aipm)
  LESSONS.md 标 deprecated
```

---

## Step 2（v0.5.x）：补两条缺失学习线

**目标**：把 AI 工具线（Claude Code 8 节）和 AIPM 求职线写出来。

**预计周期**：4-6 周

### 2.1 AI 工具线 - Claude Code 8 节

| 节 | 标题 | 适合 Lv. |
|---|---|---|
| T1 | 安装 + 第一次跑起来 | 0-3 |
| T2 | 配置文件 + 我的常用设置（CLAUDE.md / settings.json） | 1-4 |
| T3 | Skills / Hooks / Slash Commands | 2-5 |
| T4 | MCP 接入（Desktop Commander / Filesystem 等） | 3-6 |
| T5 | 在真实项目里用 CC 的 10 个套路 | 3-7 |
| T6 | 拆解 CC 的设计哲学（可以学到什么） | 5-8 |
| T7 | CC vs Cursor vs Devin 对比 | 4-7 |
| T8 | 用 CC 搭一个个人 Agent | 5-8 |

**写法**：每节 4000-5000 字，按教材风格（反常识开场 / 第二人称 / 真实截图 / 命令行示例）。

**默认导师**：卡帕西 + 钱学森各占一半（T1-T4 偏工具用法 = 卡帕西，T5-T8 偏系统设计 = 钱学森）。

**新建文件**：`lib/textbooks/tools/t01-t08.json`

### 2.2 AIPM 求职线

**简历模块**：

| 节 | 标题 |
|---|---|
| R1 | AIPM 简历和传统 PM 简历的差异 |
| R2 | 怎么把「我懂 AI」写出可信的具体感 |
| R3 | 投递策略 + 简历审核 checklist |

**模拟面试模块**（动态生成的对话场景）：

- 用户进入「**模拟面试**」→ 选择「**初级 / 中级 / 高级**」+「**技术导向 / 商业导向**」
- 钱学森扮演面试官，根据用户回答动态出后续问题
- 卡帕西在用户答完后给「**技术深度反馈**」
- 阿德勒在用户卡壳时介入安抚
- 30 分钟后生成「**面试报告**」：哪里好 / 哪里要补 / 推荐补哪几章教材

**入职模块**：

| 节 | 标题 |
|---|---|
| O1 | AIPM 入职 30 天上手 checklist |
| O2 | 第一次写 AI PRD 怎么写 |
| O3 | 和工程师 / 设计师 / 法务的第一次协作 |

**新建文件**：
- `lib/textbooks/job/r01-r03.json`（简历）
- `lib/textbooks/job/o01-o03.json`（入职）
- `lib/job-interview/scenarios.ts`（模拟面试场景）
- `app/learn/aipm-job/interview/page.tsx`（模拟面试入口）

### 2.3 验收标准

- AI 工具线 8 节全部成稿，质量对标 AI 通识 / AIPM 教材
- AIPM 求职线简历 + 入职模块成稿
- 模拟面试能跑通一次完整对话
- 4 条主线在首页都有内容（不再是空占位）

---

## Step 3（v0.6.x）：补缺失知识源

**目标**：持续学习区从「**只有热点 + 论文**」变成「**热点 + GitHub + 博客 + 论文**」完整。

**预计周期**：2-3 周

### 3.1 GitHub 周榜（自动抓取）

- 每周一自动抓 GitHub trending（AI 相关）
- 取前 5 个项目
- 自动生成 200 字「**为什么值得看**」摘要（调 LLM 生成）
- 项目卡片：name / stars 增量 / language / license / 摘要 / 「**让导师拆解**」按钮

**新建文件**：
- `app/github-weekly/page.tsx`
- `lib/github-trending/fetcher.ts`
- `lib/github-trending/summarizer.ts`
- `app/api/github-weekly/route.ts`（cron 触发抓取）

### 3.2 博客 / 访谈策展

- 人工策展（每周 2-3 篇）—— v0.6 阶段先**人工录入 + 编辑**
- 数据格式：title / source / url / 策展语 / tags / curated_at
- 来源建议清单（写在 `lib/blog-curation/sources.md`）：
  - Karpathy blog
  - Lex Fridman / Dwarkesh / Lenny / Latent Space podcast
  - Chip Huyen / Eugene Yan / Jason Wei 博客
  - 国内：思考问题的熊 / 量子位深度 / 智源 / 知乎大 V 文章

**新建文件**：
- `app/blogs/page.tsx`
- `lib/blog-curation/registry.ts`（人工维护的策展列表）
- `lib/blog-curation/sources.md`（来源清单）

### 3.3 论文导读重新归位

- 从「侧边栏独立项」→ 「持续学习区子项」
- 路由 /papers 保留兼容
- 在持续学习首页加「📄 论文导读 15 篇 → 进入」入口

### 3.4 验收标准

- 持续学习区 4 个子板块（热点 / GitHub / 博客 / 论文）都有内容
- GitHub 周榜每周一自动更新
- 博客至少 6 篇策展
- 用户能从持续学习区任何一条内容一键沉淀 + 让导师拆解

---

## Step 4（v0.7.x）：沉淀出口闭环

**目标**：用户的笔记不再「**只能停在我们系统里**」，能流出去到 Obsidian / 自媒体 / 简历。

**预计周期**：2-3 周

### 4.1 资产中心改造 /notes

- 全部沉淀的笔记可筛选（按学习线 / 按时间 / 按 tag）
- 单条 / 批量操作
- 总览仪表盘：笔记数 / 自媒体数 / 草稿数

### 4.2 Markdown 导出 → Obsidian / Notion

- 单笔记：复制 Markdown / 下载 .md（已部分有，v0.7 优化）
- 批量：选中多条 → 打包 zip（按 tag 自动分文件夹）
- frontmatter 自动生成：
  ```yaml
  ---
  title: ...
  tags: [...]
  source: AI 学习系统
  created: 2026-05-14
  suggested-wiki-path: ai/concepts/  # 建议放到 wiki 哪
  ---
  ```

### 4.3 自媒体草稿生成

- 选中一条或几条笔记 → 「**转自媒体草稿**」
- 平台模板：
  - 微信公众号（标题 + 副标题 + 正文 + 配图建议）
  - 小红书（150 字短文 + 标签 + 配图）
  - X / Twitter（280 字 thread 拆解）
  - 即刻 / 知乎 / 微博
- LLM 调用生成草稿
- 用户编辑后可复制 / 下载（**不直接发布**，避免账号风险）

### 4.4 验收标准

- 用户能一键把所有笔记导成 Obsidian 可用的 zip
- 任意一条笔记能一键转成至少 3 个平台的草稿
- 自媒体草稿历史能查看 / 编辑 / 删除
- 单条笔记加 「**已用于自媒体**」标签

**新建文件**：
- `app/notes/page.tsx`（资产中心，升级版）
- `app/notes/export/page.tsx`
- `app/notes/social-draft/page.tsx`
- `lib/notes/export.ts`（Markdown + zip 生成）
- `lib/notes/social-templates/` （平台模板）

---

## Step 5（v0.8.x）：老手快速通道

**目标**：让 Lv.7+ 用户不被强制走「测试 → 推荐第一节」的新手路径，能直接进入持续学习。

**预计周期**：1 周

### 5.1 测试题分流改进

- 测试结果 Lv.6+ → 推荐直接进持续学习区
- 测试结果 Lv.0-3 → 推荐 AI 通识第一章
- 测试结果 Lv.4-6 → 推荐相应学习线的对应章

### 5.2 跳测入口

- 首页 / 登录页加「**老手快速进入**」按钮
- 老手回答 3 个问题（**会用什么 / 想学什么 / 你的痛点**）
- 系统直接给推荐线 + 持续学习区入口
- 不强制做完整 15 题测试

### 5.3 重测机制

- 设置页加「**重新做测试**」入口
- 重测后等级可以变（解锁更高级章节 或 回到补基础）

### 5.4 验收标准

- 新用户从注册到看到第一节内容 < 3 分钟
- 老手能在 30 秒内绕过测试直接进持续学习区
- 用户能随时重测（不锁死等级）

---

## 跨 Step 持续维护项

每个 Step 都要做（不写在 Step 内但要做）：

- **eval 跑通**：每次 prompt 改、模型换都跑黄金测试集
- **CHANGELOG.md** 每次发布都更新
- **CLAUDE.md** 任何工作流变化都同步
- **回归测试**：保证 v0.x 路由都还能跳转到正确位置
- **数据迁移**：v0.x 用户的笔记 / 测试结果 / 学习历史保留

---

## v1.0 公开上线前的 8 件事

详见 `PHASE_LAUNCH.md`。Step 5 完成后开始走这 8 件事。

---

## 重要原则（写在最后但优先级最高）

**任何改动开始前，问自己 4 个问题（PRD §16）**：

1. 这件事属于 4 大学习线 / 持续学习 / 资产沉淀 / 系统层 哪一块？
2. 涉及的用户路径是什么？
3. 改完之后用户能在哪个具体页面看到差别？
4. 有没有让某条主线更清晰、还是又把它弄乱了？

**没有回答这 4 个问题的改动不动手**。这是对 v0.x「叠加式迭代」的纠偏。
