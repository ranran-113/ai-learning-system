# 三导师 AI 学习成长系统

> 一个帮助用户持续学习 AI，并把每次学习沉淀成能力资产的三导师学习系统。

当前版本：`v0.1.0 MVP 规划版`
最后更新：2026-05-11

---

## 1. 项目简介

本项目是一个网页版 AI 学习成长系统，面向 AI 小白、AI 爱好者、AIPM、职场学习者和希望持续学习 AI 的人群。

它不是普通课程平台，也不是普通 AI Chat，而是通过：

- 学习人格画像
- AI 能力 0-10 级进阶地图
- 三位导师：卡帕西、钱学森、阿德勒
- 苏格拉底式教学
- 内置 AI / AIPM 课程
- 用户上传资料自动拆课
- AI 热点学习舱
- 文字 + 语音辅助互动
- 成长档案与输出记录

帮助用户完成：

```text
持续学习 AI → 输出沉淀 → 能力成长
```

产品核心不是让用户收藏更多 AI 知识，而是陪用户真正学懂、说出来、用起来、沉淀下来。

---

## 2. 核心用户

本系统面向以下用户：

1. **AI 小白**：想学 AI，但不知道从哪里开始。
2. **AI 爱好者 / 自学者**：看很多热点和资料，但学得散、没有体系。
3. **AIPM / AI 产品经理**：想持续学习 AI 技术、产品、Agent、工作流、论文和热点。
4. **职场学习者**：进入职场后想持续学习，但精力有限、时间碎片化。
5. **高焦虑 / 易内耗学习者**：想成长，但容易信息过载、焦虑、拖延、断更、害怕输出。

---

## 3. MVP 核心功能

MVP 版本需要完成完整学习闭环：

```text
首页
→ 联合测试
→ 生成学习人格画像 + AI 能力等级
→ 进入成长档案
→ 选择内置课程 / 上传资料 / AI 热点
→ 三导师苏格拉底式学习
→ 用户文字或语音回答
→ 导师追问 / 提示 / 总结
→ 用户完成输出沉淀
→ 保存学习记录
```

MVP 必做功能：

- 网页版，部署到 Vercel，手机和电脑可用
- 15 题以内联合测试
- 学习人格画像
- AI 能力 0-10 级进阶地图
- 三导师系统：卡帕西、钱学森、阿德勒
- 苏格拉底式教学流程
- 文字对话 + 语音输入 + 导师回复播放
- 内置 AI / AIPM 课程结构
- 上传资料自动拆课
- AI 热点学习舱，默认展示 AI HOT 精选热点
- 成长档案，偏治愈风
- 学习记录与输出记录
- 先免登录体验，保存时邮箱登录

---

## 4. 技术栈

推荐 MVP 技术栈：

```text
Next.js + TypeScript + Tailwind CSS + shadcn/ui
LangGraph.js
Supabase
Vercel
```

模块分工：

| 模块 | 技术 | 作用 |
|---|---|---|
| 前端页面 | Next.js | 页面路由、渲染、交互 |
| UI | Tailwind + shadcn/ui | 快速搭建简洁治愈风界面 |
| Agent 工作流 | LangGraph.js | 三导师教学、状态流转、学习流程 |
| 数据库 / 登录 | Supabase | 用户、成长档案、课程、记录 |
| 部署 | Vercel | Web 部署上线 |
| 语音 | Web Speech API | MVP 语音输入、导师回复播放兜底 |
| 热点数据 | AI HOT API / RSS | 精选 AI 热点接入 |

---

## 5. 本地运行方式

> 以下命令是项目搭建后的推荐运行方式。当前文档用于指导后续开发。

### 5.1 安装依赖

```bash
npm install
```

### 5.2 配置环境变量

**第一阶段（本地静态版）不需要任何 key** —— 直接 `npm run dev` 就能跑通首页 → 联合测试 → 成长档案 → 能力地图。

第二阶段（接 LLM 和数据库后）才需要：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```env
# LLM Provider 抽象（默认 DeepSeek，可换 GLM / Claude / OpenAI）
LLM_PROVIDER=deepseek
LLM_API_KEY=
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI HOT
AIHOT_BASE_URL=https://aihot.virxact.com
```

完整环境变量见 `.env.example`。

### 5.3 启动开发服务

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

---

## 6. Vercel 部署方式

1. 将项目推送到 GitHub。
2. 在 Vercel 中导入 GitHub 仓库。
3. 设置环境变量。
4. 选择 Next.js 默认部署配置。
5. 点击 Deploy。

部署后需要检查：

- 首页是否能打开
- 联合测试是否能完成
- 成长档案是否能生成
- 三导师对话是否可用
- AI 热点学习舱是否能读取精选热点
- 上传资料是否能自动拆课
- 保存时邮箱登录是否正常

---

## 7. 项目核心文件

```text
README.md       # 项目说明、运行方式、部署方式
CLAUDE.md       # Claude Code 项目规则
PRD.md          # 产品需求文档
TECH.md         # 技术实现方案、数据结构、算法
CHANGELOG.md    # 版本记录
LESSONS.md      # MVP 12 节微课完整内容 + 36 个 Phase 2 延伸课题
QUESTIONS.md    # 15 题联合测试完整题目 + 指标映射
MENTORS.md      # 三导师 System Prompts + 路由规则
HARNESS.md      # Agent Harness 工程升级路线（7 个升级项 + 状态）
PHASE_LAUNCH.md # 公开上线前必须完成的清单
.env.example    # 环境变量示例
```

三份内容文档（LESSONS / QUESTIONS / MENTORS）是**人类可读的真理源**。后续项目初始化后会转写到对应 `lib/` 代码文件，但本文件版本始终是单一真相来源，任何改动先改文档再同步代码。

---

## 8. 当前版本状态

**当前阶段：v0.1.1 完成（第一阶段本地静态版）**

已可在本地跑通：

- ✅ 首页 `/`
- ✅ 联合测试 `/onboarding`（15 题 + 多选 + 进度保存 + 冲突确认）
- ✅ 成长档案 `/profile`（4 类型 + 等级 + 置信度 + 三导师 mix + ±1 微调）
- ✅ AI 能力地图 `/levels`（Lv.0-Lv.10 + 当前位置高亮）
- ✅ 评分算法 `lib/profile/scoring.ts`
- ✅ 12 节微课数据 `lib/courses/built-in-courses.ts`
- ✅ 三导师 System Prompts `lib/prompts/mentor-personas.ts`（为第二阶段备用）

**第一阶段所有数据存 localStorage，不依赖 LLM 或数据库**。

下一步（v0.1.2 第二阶段）：

1. 接入 DeepSeek（或其他 LLM）实现三导师 LangGraph 工作流
2. 实现 `/learn` 学习对话页
3. 接入 Supabase 存储用户数据
4. 推送 GitHub + 部署 Vercel 给朋友测试
5. AI HOT 接入
6. 上传资料自动拆课

第三阶段（公开上线）见 `PHASE_LAUNCH.md`。
