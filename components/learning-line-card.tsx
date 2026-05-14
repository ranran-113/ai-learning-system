"use client";

// 4 大学习线在首页的卡片 —— v0.4 新建
// 显示:emoji + 标题 + 副标题 + 进度(已有内容时)/ 状态 + 按钮
import Link from "next/link";
import type { LearningLine } from "@/lib/learning-lines/registry";
import type { LineProgress } from "@/lib/learning-lines/progress";

type Props = {
  line: LearningLine;
  progress?: LineProgress; // 可选,coming-soon 的线没有
  highlighted?: boolean;   // 测试结果推荐时高亮
};

export function LearningLineCard({ line, progress, highlighted }: Props) {
  const isComingSoon = line.status === "coming-soon";
  const totalChapters = progress?.totalChapters ?? 0;
  const startedChapters = progress?.startedChapters ?? 0;
  const percentage = progress?.percentage ?? 0;
  const understood = progress?.fullyUnderstoodChapters ?? 0;

  // 按钮文案
  let actionLabel = "开始";
  if (isComingSoon) actionLabel = "了解";
  else if (startedChapters > 0 && startedChapters < totalChapters) actionLabel = "继续 →";
  else if (startedChapters === totalChapters && totalChapters > 0) actionLabel = "复习";

  return (
    <Link
      href={`/learn/${line.id}`}
      className={`group block rounded-xl border p-4 transition ${
        highlighted
          ? "border-accent/60 bg-accent/5 ring-1 ring-accent/30"
          : "border-bg-warm/60 bg-white/60 hover:border-accent/40 hover:bg-bg-subtle/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{line.emoji}</span>
            <h3 className="font-medium text-ink truncate">{line.title}</h3>
            {highlighted && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">
                推荐
              </span>
            )}
            {isComingSoon && (
              <span className="rounded-full bg-bg-warm/60 px-1.5 py-0.5 text-[10px] text-ink-mute">
                soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-mute line-clamp-1">{line.subtitle}</p>
        </div>
      </div>

      {/* 进度条 或 状态 */}
      <div className="mt-3">
        {isComingSoon ? (
          <p className="text-xs text-ink-mute">即将上线 · {line.audience}</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-ink-mute mb-1">
              <span>
                {startedChapters}/{totalChapters}
                {understood > 0 && (
                  <span className="ml-1 text-moss">· 真懂 {understood}</span>
                )}
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-warm/50">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* 行动按钮 */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-ink-mute line-clamp-1">{line.oneLineGoal}</p>
        <span className="shrink-0 text-xs font-medium text-accent group-hover:underline">
          {actionLabel}
        </span>
      </div>
    </Link>
  );
}
