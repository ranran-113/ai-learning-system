"use client";

import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";

export default function MaterialsPage() {
  return (
    <LearningCenterShell current="materials">
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">上传资料学习</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            把你的资料拆成微课
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            你读的书、收藏的文章、行业报告、自己写的笔记 —— 上传它，让 AI 拆成微课，再让三导师陪你学。
          </p>
        </div>

        <div className="card space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-bg-warm px-3 py-1 text-xs text-ink-soft">
              <span>⏳</span>
              <span>即将开放</span>
            </div>
            <h2 className="text-lg font-medium">这一块正在搭</h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">这一块要做的事比看起来复杂：</p>
          <ul className="space-y-1 text-sm leading-relaxed text-ink-soft">
            <li>· 支持复制文本 / .txt / .md / 简单文字型 .pdf</li>
            <li>· AI 自动读取、生成摘要、拆成 3-8 节微课</li>
            <li>· 每节微课自动生成核心概念、苏格拉底问题、输出任务</li>
            <li>· 然后用三导师方式陪你过一遍</li>
          </ul>
          <p className="text-sm leading-relaxed text-ink-soft">
            <strong className="font-medium">现在可以做的：</strong>
            如果你有想学的具体内容，可以把它复制粘贴到下一节学习对话里，三导师能直接和你聊那段内容。或者去 AI 热点学习舱看精选热点。
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/hot" className="btn-primary text-sm">
              去 AI 热点学习舱
            </Link>
            <Link href="/courses" className="btn-ghost text-sm">
              先看内置课程
            </Link>
          </div>
        </div>
      </section>
    </LearningCenterShell>
  );
}
