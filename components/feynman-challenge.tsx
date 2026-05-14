"use client";

// 费曼挑战交互组件 —— v0.4 新建
// 完整流程:
//   1. 显示挑战题 + 禁用术语 + 允许的类比
//   2. 用户输入讲解(30-60 秒)
//   3. AI 扮演 10 岁孩子反问 1-2 个问题
//   4. 用户跟进回答
//   5. LLM-as-Judge 评价(passed / almost / needs_work)
//   6. 保存为 OutputRecord type=feynman
//
// 不引入第 4 个导师 —— 「10 岁孩子」是 prompt 模式
import { useState } from "react";
import Link from "next/link";
import type { FeynmanChallenge } from "@/lib/feynman/prompts";
import type { FeynmanResult, OutputRecord } from "@/lib/langgraph/state";
import { appendOutput } from "@/lib/records/records";

type Props = {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  chapterSummary: string;
  challenge: FeynmanChallenge;
  backHref: string;
  onComplete?: () => void;
};

type Phase = "explain" | "child-asking" | "child-answering" | "judging" | "result";

export function FeynmanChallenge({
  bookId,
  chapterId,
  chapterTitle,
  chapterSummary,
  challenge,
  backHref,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("explain");
  const [startedAt] = useState(() => Date.now());

  // 用户初次讲解
  const [userExplanation, setUserExplanation] = useState("");

  // 小孩反问 + 用户跟进
  const [childQuestions, setChildQuestions] = useState<string[]>([]);
  const [userFollowUps, setUserFollowUps] = useState<string[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState("");
  const [followUpIndex, setFollowUpIndex] = useState(0);

  // 评价
  const [judgement, setJudgement] = useState<{
    result: FeynmanResult;
    review: string;
    highlights: string[];
    gaps: string[];
  } | null>(null);

  // 错误
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 → Step 2: 提交用户讲解,请求小孩反问
  async function submitExplanation() {
    if (!userExplanation.trim() || userExplanation.length < 20) {
      setError("讲解太短了,至少 20 字。");
      return;
    }
    setError(null);
    setLoading(true);
    setPhase("child-asking");

    try {
      const res = await fetch("/api/feynman/child-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, userExplanation }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`小孩反问失败: ${errText.slice(0, 100)}`);
      }
      const data = await res.json();
      const questions: string[] = data.questions || [];
      setChildQuestions(questions);
      setUserFollowUps(new Array(questions.length).fill(""));
      setPhase("child-answering");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setError(msg);
      setPhase("explain");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 → Step 3: 用户提交某个跟进回答
  function submitFollowUp() {
    if (!currentFollowUp.trim()) return;
    const newFollowUps = [...userFollowUps];
    newFollowUps[followUpIndex] = currentFollowUp.trim();
    setUserFollowUps(newFollowUps);
    setCurrentFollowUp("");

    if (followUpIndex + 1 < childQuestions.length) {
      setFollowUpIndex(followUpIndex + 1);
    } else {
      // 跟进全部完成,进入评判
      doJudge(newFollowUps);
    }
  }

  // 跳过当前反问
  function skipFollowUp() {
    const newFollowUps = [...userFollowUps];
    newFollowUps[followUpIndex] = "(跳过)";
    setUserFollowUps(newFollowUps);
    setCurrentFollowUp("");

    if (followUpIndex + 1 < childQuestions.length) {
      setFollowUpIndex(followUpIndex + 1);
    } else {
      doJudge(newFollowUps);
    }
  }

  // Step 3: LLM-as-Judge 评价
  async function doJudge(finalFollowUps: string[]) {
    setLoading(true);
    setPhase("judging");
    try {
      const res = await fetch("/api/feynman/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          userExplanation,
          childQuestions,
          userFollowUps: finalFollowUps,
          chapterSummary,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`评价失败: ${errText.slice(0, 100)}`);
      }
      const data = await res.json();
      setJudgement({
        result: data.result || "almost",
        review: data.review || "评估完成。",
        highlights: data.highlights || [],
        gaps: data.gaps || [],
      });

      // 保存为 OutputRecord
      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      const record: OutputRecord = {
        id: `f-${Date.now()}`,
        lessonId: `${bookId}-${chapterId}`,
        type: "feynman",
        content: userExplanation,
        title: `费曼挑战:${chapterTitle}`,
        tags: [`#费曼`, `#${bookId}`, `#${chapterId}`],
        createdAt: new Date().toISOString(),
        feynman: {
          chapterId: `${bookId}-${chapterId}`,
          challengeQuestion: challenge.question,
          forbiddenTerms: challenge.forbiddenTerms,
          userExplanation,
          childQuestions,
          userFollowUps: finalFollowUps,
          result: data.result || "almost",
          aiReview: data.review || "",
          durationSeconds,
        },
      };
      appendOutput(record);

      setPhase("result");
      onComplete?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setError(msg);
      setPhase("child-answering");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setUserExplanation("");
    setChildQuestions([]);
    setUserFollowUps([]);
    setCurrentFollowUp("");
    setFollowUpIndex(0);
    setJudgement(null);
    setError(null);
    setPhase("explain");
  }

  // 渲染
  return (
    <div className="space-y-4">
      {/* 顶部:章节信息 + 返回 */}
      <div className="flex items-center justify-between">
        <Link href={backHref} className="text-sm text-ink-mute hover:text-ink-soft">
          ← 返回章节
        </Link>
        <span className="text-xs text-ink-mute">
          {bookId.toUpperCase()} {chapterId.toUpperCase()} · 🎯 费曼挑战
        </span>
      </div>

      <h1 className="text-xl font-medium">🎯 费曼挑战:{chapterTitle}</h1>

      {/* 错误展示 */}
      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-2 text-sm text-ink-soft">
          {error}
        </div>
      )}

      {/* Phase 1: 用户讲解 */}
      {phase === "explain" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-bg-warm/60 bg-bg-subtle/40 p-5">
            <p className="text-sm text-ink-mute mb-2">假装你正在跟一个 10 岁孩子讲话。</p>
            <p className="text-base font-medium text-ink mb-4">{challenge.question}</p>

            {challenge.forbiddenTerms.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-ink-mute mb-1">不能用这些术语:</p>
                <div className="flex flex-wrap gap-1.5">
                  {challenge.forbiddenTerms.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {challenge.hintsAllowed.length > 0 && (
              <div>
                <p className="text-xs text-ink-mute mb-1">可以用这些比喻:</p>
                <ul className="space-y-0.5 text-xs text-ink-soft">
                  {challenge.hintsAllowed.map((h) => (
                    <li key={h}>· {h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <textarea
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            placeholder="开始讲...(30-60 秒/100-300 字)"
            rows={6}
            className="w-full resize-y rounded-lg border border-bg-warm/70 bg-white/80 px-4 py-3 text-sm focus:border-accent/60 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-mute">
              {userExplanation.length} 字
              {userExplanation.length < 20 && " · 至少 20 字"}
            </span>
            <button
              onClick={submitExplanation}
              disabled={loading || userExplanation.length < 20}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              我讲完了 →
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: 等小孩反问 */}
      {phase === "child-asking" && (
        <div className="rounded-xl border border-bg-warm/60 bg-bg-subtle/40 p-6 text-center">
          <p className="text-sm text-ink-mute">小学生正在想问什么...</p>
          <div className="mt-3 inline-flex items-center gap-2 text-2xl">
            <span className="animate-pulse">🧒</span>
            <span className="animate-pulse text-ink-mute">...</span>
          </div>
        </div>
      )}

      {/* Phase 3: 用户回答跟进 */}
      {phase === "child-answering" && childQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-bg-warm/60 bg-bg-subtle/40 p-5">
            <p className="text-xs text-ink-mute mb-2">
              小学生反问 {followUpIndex + 1}/{childQuestions.length}:
            </p>
            <div className="flex gap-2">
              <span className="shrink-0 text-2xl">🧒</span>
              <p className="text-base text-ink">{childQuestions[followUpIndex]}</p>
            </div>
          </div>

          <textarea
            value={currentFollowUp}
            onChange={(e) => setCurrentFollowUp(e.target.value)}
            placeholder="再用 10 岁孩子能听懂的话解释一下..."
            rows={4}
            className="w-full resize-y rounded-lg border border-bg-warm/70 bg-white/80 px-4 py-3 text-sm focus:border-accent/60 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={skipFollowUp}
              className="text-xs text-ink-mute hover:text-ink-soft underline"
            >
              答不上来,跳过
            </button>
            <button
              onClick={submitFollowUp}
              disabled={!currentFollowUp.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {followUpIndex + 1 < childQuestions.length ? "回答完,下一问 →" : "完成,看评价 →"}
            </button>
          </div>
        </div>
      )}

      {/* Phase 4: 评价中 */}
      {phase === "judging" && (
        <div className="rounded-xl border border-bg-warm/60 bg-bg-subtle/40 p-6 text-center">
          <p className="text-sm text-ink-mute">正在评价你的讲解...</p>
          <div className="mt-3 inline-flex items-center gap-2 text-2xl">
            <span className="animate-pulse">🎯</span>
            <span className="animate-pulse text-ink-mute">...</span>
          </div>
        </div>
      )}

      {/* Phase 5: 结果 */}
      {phase === "result" && judgement && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border p-5 ${
              judgement.result === "passed"
                ? "border-moss/40 bg-moss/5"
                : judgement.result === "almost"
                ? "border-accent/40 bg-accent/5"
                : "border-ink-mute/30 bg-bg-subtle/40"
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">
                {judgement.result === "passed"
                  ? "✅"
                  : judgement.result === "almost"
                  ? "🔄"
                  : "📚"}
              </span>
              <h2 className="text-lg font-medium">
                {judgement.result === "passed"
                  ? "费曼挑战通过 —— 这一章真懂了"
                  : judgement.result === "almost"
                  ? "还差一点 —— 大方向对,某处卡了"
                  : "需要再练 —— 回去看看再来"}
              </h2>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed mb-3">{judgement.review}</p>

            {judgement.highlights.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-ink-mute mb-1">亮点:</p>
                <ul className="space-y-0.5 text-xs text-ink-soft">
                  {judgement.highlights.map((h, i) => (
                    <li key={i}>✓ {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {judgement.gaps.length > 0 && (
              <div>
                <p className="text-xs text-ink-mute mb-1">卡点:</p>
                <ul className="space-y-0.5 text-xs text-ink-soft">
                  {judgement.gaps.map((g, i) => (
                    <li key={i}>△ {g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="rounded-lg border border-bg-warm/70 px-4 py-2 text-sm text-ink-soft hover:bg-bg-subtle/40"
            >
              ← 回章节
            </Link>
            <button
              onClick={restart}
              className="rounded-lg border border-bg-warm/70 px-4 py-2 text-sm text-ink-soft hover:bg-bg-subtle/40"
            >
              🔄 再来一次
            </button>
            <Link
              href="/records"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-deep"
            >
              💎 看我的费曼笔记
            </Link>
          </div>

          <p className="text-xs text-ink-mute">
            已自动保存为费曼笔记。可以在「我的资产」查看 / 编辑 / 导出。
          </p>
        </div>
      )}
    </div>
  );
}
