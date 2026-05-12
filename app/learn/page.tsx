"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { lsGet, LS_KEYS, cn } from "@/lib/utils";
import type { TestResult } from "@/types/profile";
import type { MentorKey } from "@/types/mentor";
import { MENTOR_NAMES } from "@/types/mentor";
import { getLessonById, recommendFirstLesson } from "@/lib/courses/built-in-courses";
import {
  getCurrentSession,
  setCurrentSession,
  startNewSession,
  getOutputHistory,
  appendOutput,
  endCurrentSession,
} from "@/lib/records/records";
import type { ChatMessage, LearningContext } from "@/lib/langgraph/state";
import { buildOpeningMessage } from "@/lib/agents/builders";
import type { BuiltInLesson } from "@/types/lesson";
import type { HotItem } from "@/lib/hot/client";

// 把热点条目构造成合成 lesson（让导师 prompt builder 可以复用）
function buildSyntheticLessonFromHot(item: HotItem): BuiltInLesson {
  const shortTitle = item.title.length > 40 ? item.title.slice(0, 40) + "…" : item.title;
  return {
    id: `hot-${item.id}`,
    courseId: "ai-hot",
    title: item.title,
    category: "hot",
    targetLevelMin: 3,
    targetLevelMax: 7,
    defaultMentor: ["karpathy", "qian"],
    summary: item.summary,
    keyConcepts: ["是什么", "解决什么问题", "和已知什么相似 / 不同", "对 AIPM 的启发"],
    socraticQuestions: [
      `「${shortTitle}」—— 你第一眼看到这个，最想问的是什么？`,
      `这个东西要解决的问题，和你已经知道的什么很像？`,
      `如果你做 AI 产品，这条热点对你有什么具体启发？`,
    ],
    outputTask: `用一句话写下：「${shortTitle}」对你最有启发的一点`,
    extensionRoadmap: [],
  };
}

type LessonSourceInfo = {
  lesson: BuiltInLesson;
  sourceLabel: string;        // "课程"/"热点"/"资料"
  backHref: string;            // 头部返回链接指向哪
  backLabel: string;
};

async function loadLessonFromUrl(
  searchParams: URLSearchParams,
  testResult: TestResult
): Promise<LessonSourceInfo | null> {
  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const lessonParam = searchParams.get("lesson");

  // 热点学习
  if (source === "hot_item" && id) {
    try {
      const res = await fetch(`/api/hot?limit=50`);
      if (!res.ok) throw new Error("热点接口失败");
      const data = await res.json();
      const item: HotItem | undefined = data.items?.find((x: HotItem) => x.id === id);
      if (!item) return null;
      return {
        lesson: buildSyntheticLessonFromHot(item),
        sourceLabel: "热点学习",
        backHref: `/hot/${encodeURIComponent(id)}`,
        backLabel: "← 回热点",
      };
    } catch {
      return null;
    }
  }

  // 上传资料学习（占位，第三阶段做）
  if (source === "material" && id) {
    return null; // 触发未实现路径
  }

  // 默认：内置课程
  const resolvedId = lessonParam || recommendFirstLesson(testResult.aiLevel.level, testResult.recommendedPath);
  const lesson = getLessonById(resolvedId);
  if (!lesson) return null;
  return {
    lesson,
    sourceLabel: "课程",
    backHref: "/profile",
    backLabel: "← 学习中心",
  };
}

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [sourceInfo, setSourceInfo] = useState<LessonSourceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMentor, setActiveMentor] = useState<MentorKey>("karpathy");
  const [mentorTurnCount, setMentorTurnCount] = useState(0);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMentor, setStreamingMentor] = useState<MentorKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [outputSaved, setOutputSaved] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    const tr = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    if (!tr) {
      router.replace("/onboarding");
      return;
    }
    setTestResult(tr);

    (async () => {
      const info = await loadLessonFromUrl(searchParams, tr);
      if (!info) {
        const isMaterial = searchParams.get("source") === "material";
        setLoadError(
          isMaterial
            ? "上传资料学习还没开放（第三阶段功能）。先看看 AI 热点学习舱或课程中心。"
            : "找不到对应的学习内容。"
        );
        setLoading(false);
        return;
      }
      setSourceInfo(info);
      setLoading(false);

      // 看是否有未结束的同一会话
      const existing = getCurrentSession();
      if (existing && existing.lessonId === info.lesson.id && !existing.endedAt) {
        setMessages(existing.messages);
        setActiveMentor(existing.activeMentor);
        setMentorTurnCount(existing.mentorTurnCount);
        return;
      }

      // 新开一节
      const defaultMentor = Array.isArray(info.lesson.defaultMentor)
        ? info.lesson.defaultMentor[0]
        : info.lesson.defaultMentor;

      // 路由优先级 0: evidenceConflict
      const useAdlerOpen = tr.aiLevel.evidenceConflict;
      const openingMentor: MentorKey = useAdlerOpen ? "adler" : defaultMentor;

      const session = startNewSession(info.lesson.id, openingMentor);
      setActiveMentor(openingMentor);

      const ctx: LearningContext = {
        testResult: tr,
        currentLesson: info.lesson,
        messages: [],
        outputHistory: getOutputHistory(),
        activeMentor: openingMentor,
        mentorTurnCount: 0,
        isFirstTurnOfSession: true,
      };
      const opening = buildOpeningMessage(openingMentor, ctx);
      const openingMsg: ChatMessage = {
        id: `m-open-${Date.now()}`,
        role: "mentor",
        mentor: openingMentor,
        content: opening,
        createdAt: new Date().toISOString(),
      };
      session.messages = [openingMsg];
      session.mentorTurnCount = 1;
      setCurrentSession(session);
      setMessages([openingMsg]);
      setMentorTurnCount(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  // 自动滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || streaming || !testResult || !sourceInfo) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setStreamingText("");
    setError(null);

    const ctx: LearningContext = {
      testResult,
      currentLesson: sourceInfo.lesson,
      messages: nextMessages,
      outputHistory: getOutputHistory(),
      activeMentor,
      mentorTurnCount,
      isFirstTurnOfSession: false,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, userMessage: userMsg.content }),
      });

      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let collected = "";
      let respondingMentor: MentorKey = activeMentor;
      let didRewrite = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6);
          try {
            const obj = JSON.parse(payload);
            if (obj.type === "meta") {
              respondingMentor = obj.mentor as MentorKey;
              setStreamingMentor(respondingMentor);
            } else if (obj.type === "chunk") {
              collected += obj.content;
              setStreamingText(collected);
            } else if (obj.type === "rethink") {
              // 校验失败,即将重写
              didRewrite = true;
              setStreamingText(collected + "\n\n…(调整一下表达)…");
            } else if (obj.type === "replace") {
              // 用重写版本替换
              collected = obj.content;
              setStreamingText(collected);
            } else if (obj.type === "error") {
              throw new Error(obj.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      const mentorMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "mentor",
        mentor: respondingMentor,
        content: collected || "（导师暂时没说话，再试一次？）",
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, mentorMsg];
      setMessages(finalMessages);

      const nextTurnCount = respondingMentor === activeMentor ? mentorTurnCount + 1 : 1;
      setActiveMentor(respondingMentor);
      setMentorTurnCount(nextTurnCount);

      const cur = getCurrentSession();
      if (cur) {
        cur.messages = finalMessages;
        cur.activeMentor = respondingMentor;
        cur.mentorTurnCount = nextTurnCount;
        setCurrentSession(cur);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setError(message);
    } finally {
      setStreaming(false);
      setStreamingText("");
      setStreamingMentor(null);
    }
  };

  const handleSaveOutput = () => {
    if (!outputText.trim() || !sourceInfo) return;
    appendOutput({
      id: `o-${Date.now()}`,
      lessonId: sourceInfo.lesson.id,
      type: "one_sentence",
      content: outputText.trim(),
      createdAt: new Date().toISOString(),
    });
    setOutputSaved(true);
    setTimeout(() => {
      setShowOutputModal(false);
      setOutputText("");
      setOutputSaved(false);
    }, 1500);
  };

  const handleEndSession = () => {
    if (!confirm("结束这一节学习吗？记录会归档,你可以稍后回来开始新一节。")) return;
    endCurrentSession();
    router.push("/profile");
  };

  if (loading) {
    return (
      <main className="container-narrow flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-mute">加载中…</p>
      </main>
    );
  }

  if (loadError || !sourceInfo) {
    return (
      <main className="container-narrow flex min-h-screen flex-col items-center justify-center py-16">
        <div className="card max-w-md space-y-3 text-center">
          <p className="text-sm font-medium">无法开始这节学习</p>
          <p className="text-sm text-ink-soft">{loadError || "找不到对应内容"}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link href="/profile" className="btn-ghost text-sm">回学习中心</Link>
            <Link href="/courses" className="btn-primary text-sm">看课程</Link>
          </div>
        </div>
      </main>
    );
  }

  const lesson = sourceInfo.lesson;

  return (
    <main className="container-narrow flex min-h-screen flex-col py-6">
      <header className="mb-4 flex flex-col gap-2 border-b border-bg-warm/60 pb-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <Link href={sourceInfo.backHref} className="text-ink-mute hover:text-ink-soft">
            {sourceInfo.backLabel}
          </Link>
          <button onClick={handleEndSession} className="text-ink-mute hover:text-ink-soft">
            结束本节
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-bg-warm px-1.5 py-0.5 text-xs text-ink-soft">{sourceInfo.sourceLabel}</span>
          <h1 className="text-lg font-medium leading-snug sm:text-xl">{lesson.title}</h1>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{lesson.summary}</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {streaming && (
          <MessageBubble
            msg={{
              id: "streaming",
              role: "mentor",
              mentor: streamingMentor || activeMentor,
              content: streamingText || "…",
              createdAt: new Date().toISOString(),
            }}
            streaming
          />
        )}

        {error && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm text-ink-soft">
            <p className="font-medium">出错了：{error}</p>
            <p className="mt-1 text-xs text-ink-mute">
              如果是「LLM_API_KEY 未配置」，去 Vercel Project Settings → Environment Variables 添加，然后重新部署。
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="mb-3 rounded-lg border border-moss/40 bg-moss/5 px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
        <div className="flex items-start justify-between gap-3">
          <span>
            <strong className="font-medium">本节输出任务：</strong>
            {lesson.outputTask}
          </span>
          <button
            onClick={() => setShowOutputModal(true)}
            className="flex-shrink-0 rounded border border-moss/60 px-2.5 py-1 text-xs text-moss hover:bg-moss/10"
          >
            完成输出
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="跟导师说点什么…（⌘ / Ctrl + Enter 发送）"
          disabled={streaming}
          rows={2}
          className="w-full resize-none rounded-lg border border-bg-warm/70 bg-white/60 p-3 text-sm leading-relaxed text-ink placeholder:text-ink-mute focus:border-accent/40 focus:outline-none disabled:opacity-50"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="btn-primary text-sm"
          >
            {streaming ? "导师在想…" : "发送"}
          </button>
        </div>
      </div>

      {showOutputModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center">
          <div className="w-full max-w-md space-y-4 rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl">
            {outputSaved ? (
              <p className="py-8 text-center text-base text-moss">已沉淀 ✓</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-xs text-ink-mute">本节输出任务</p>
                  <p className="text-sm leading-relaxed">{lesson.outputTask}</p>
                </div>
                <textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  placeholder="用你自己的话写一句…"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-bg-warm/70 bg-white/60 p-3 text-sm focus:border-accent/40 focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowOutputModal(false)} className="btn-ghost text-sm">
                    先放一放
                  </button>
                  <button
                    onClick={handleSaveOutput}
                    disabled={!outputText.trim()}
                    className="btn-primary text-sm"
                  >
                    保存沉淀
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MessageBubble({ msg, streaming }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isUser
            ? "bg-bg-warm text-ink-soft"
            : msg.mentor === "karpathy"
            ? "bg-accent text-white"
            : msg.mentor === "qian"
            ? "bg-moss text-white"
            : "bg-accent-soft text-white"
        )}
      >
        {isUser ? "你" : msg.mentor ? MENTOR_NAMES[msg.mentor].charAt(0) : "?"}
      </div>
      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        {!isUser && msg.mentor && (
          <p className="text-xs text-ink-mute">{MENTOR_NAMES[msg.mentor]}</p>
        )}
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser ? "bg-accent text-white" : "bg-bg-subtle/70 text-ink",
            streaming && "animate-pulse"
          )}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <main className="container-narrow flex min-h-screen items-center justify-center">
          <p className="text-sm text-ink-mute">加载中…</p>
        </main>
      }
    >
      <LearnPageInner />
    </Suspense>
  );
}
