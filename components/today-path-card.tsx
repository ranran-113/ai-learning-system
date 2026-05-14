"use client";

// /profile 主区"今日主路径"轻量卡 —— 放在 LearningChat 之上、状态栏之下。
// 设计目标:3 秒能扫完,不打断 chat-first。
//
// 数据优先级:未完成会话 > 今日推荐课。
// 可折叠:✕ 后存 localStorage,当天不再弹。
// 紧凑:一行高度(窄屏可能折成两行)。
import { useEffect, useState } from "react";
import type { LearningSession } from "@/lib/langgraph/state";
import type { BuiltInLesson } from "@/types/lesson";
import { MENTOR_NAMES } from "@/types/mentor";

type Props = {
  // 未完成的当前会话(有就走"接着上次")
  currentSession: LearningSession | null;
  // chat 当前加载的课(无论是会话里的还是推荐的)
  lesson: BuiltInLesson;
};

// 今日的折叠状态 key —— 每天独立(跨天自动重置)
function todayDismissKey() {
  const now = new Date();
  const ymd = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return `als:today-path-dismissed:${ymd}`;
}

export function TodayPathCard({ currentSession, lesson }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 只在客户端读 localStorage,避免 SSR mismatch
  useEffect(() => {
    setHydrated(true);
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(todayDismissKey())) {
        setDismissed(true);
      }
    } catch {
      /* localStorage 不可用就当作未折叠 */
    }
  }, []);

  if (!hydrated || dismissed) return null;

  const isContinuing = !!currentSession && !currentSession.endedAt && currentSession.messages.length > 0;

  // 轮数 = user + mentor 配对数(向上取整)
  const turnCount =
    currentSession && currentSession.messages.length > 0
      ? Math.ceil(currentSession.messages.length / 2)
      : 0;

  // 上次的导师 —— 优先用最后一条 mentor 消息的 mentor 字段
  let mentorKey = currentSession?.activeMentor ?? "karpathy";
  if (currentSession) {
    for (let i = currentSession.messages.length - 1; i >= 0; i--) {
      const m = currentSession.messages[i];
      if (m.role === "mentor" && m.mentor) {
        mentorKey = m.mentor;
        break;
      }
    }
  }
  const mentorName = MENTOR_NAMES[mentorKey];

  function handleDismiss() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(todayDismissKey(), "1");
      }
    } catch {
      /* localStorage 失败也直接关 */
    }
    setDismissed(true);
  }

  function handleAction() {
    // 触发 LearningChat 把输入框 focus
    try {
      window.dispatchEvent(new CustomEvent("als:focus-chat"));
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mb-3 flex items-center gap-3 rounded-lg border border-bg-warm/60 bg-bg-subtle/50 px-4 py-2.5">
      <div className="min-w-0 flex-1 text-sm">
        {isContinuing ? (
          <span className="text-ink-soft">
            <span className="text-ink-mute">接着上次:</span>{" "}
            <span className="font-medium text-ink">{mentorName}</span>
            <span className="text-ink-mute"> · </span>
            <span className="text-ink">
              {lesson.id} {lesson.title}
            </span>
            <span className="text-ink-mute"> · 第 {turnCount} 轮</span>
          </span>
        ) : (
          <span className="text-ink-soft">
            <span className="text-ink-mute">今天开始一节:</span>{" "}
            <span className="text-ink-mute">推荐</span>{" "}
            <span className="font-medium text-ink">
              {lesson.id} {lesson.title}
            </span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleAction}
        className="shrink-0 rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/20"
      >
        {isContinuing ? "继续 →" : "开始"}
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="今日不再显示"
        title="今日不再显示"
        className="shrink-0 rounded p-1 text-ink-mute transition hover:bg-bg-warm/40 hover:text-ink-soft"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
