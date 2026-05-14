"use client";

// LearningChat —— 学习对话主体组件。
// 被 /profile（chat-first 主视图）和 /learn（独立沉浸学习路由）共用。
//
// 包含:
// - 流式对话渲染（meta/chunk/rethink/replace/done/error 帧）
// - 输入栏:左 + 文件上传, 中 textarea, 右 听写/播放/发送
// - 输出沉淀（原子笔记）modal —— 混合模式: AI 起草 + 用户编辑
// - 深度指示器（不限时长哲学）
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MENTOR_NAMES, type MentorKey } from "@/types/mentor";
import type { TestResult } from "@/types/profile";
import type { ChatMessage, LearningContext } from "@/lib/langgraph/state";
import type { BuiltInLesson } from "@/types/lesson";
import { buildOpeningMessage } from "@/lib/agents/builders";
import {
  getCurrentSession,
  setCurrentSession,
  startNewSession,
  getOutputHistory,
  appendOutput,
  endCurrentSession,
  getArchivedSessionsForLesson,
  resumeArchivedSession,
} from "@/lib/records/records";
import type { AtomicNote } from "@/lib/langgraph/state";
import { getLearningPreferences, preferencesToPromptSegment } from "@/lib/preferences/preferences";

export type SourceInfo = {
  lesson: BuiltInLesson;
  sourceLabel: string;
  backHref?: string;
  backLabel?: string;
};

export function LearningChat({
  testResult,
  sourceInfo,
  onSessionEnd,
  fullScreen = false,
  attachedContext,
}: {
  testResult: TestResult;
  sourceInfo: SourceInfo;
  onSessionEnd?: () => void;
  fullScreen?: boolean;          // /learn 模式:无 sidebar 干扰
  attachedContext?: string;      // 用户通过 + 按钮上传的文件内容,作为下轮额外上下文
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMentor, setActiveMentor] = useState<MentorKey>("karpathy");
  const [mentorTurnCount, setMentorTurnCount] = useState(0);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMentor, setStreamingMentor] = useState<MentorKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 沉淀模态
  const [showSedimentModal, setShowSedimentModal] = useState(false);
  const [sedimentDraft, setSedimentDraft] = useState<Partial<AtomicNote>>({});
  const [sedimentSaving, setSedimentSaving] = useState(false);
  const [sedimentSaved, setSedimentSaved] = useState(false);

  // 文件附件
  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 听写
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 播放
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // 进阶下拉
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showTaskHint, setShowTaskHint] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ============ 初始化会话 ============
  useEffect(() => {
    const existing = getCurrentSession();
    if (existing && existing.lessonId === sourceInfo.lesson.id && !existing.endedAt) {
      setMessages(existing.messages);
      setActiveMentor(existing.activeMentor);
      setMentorTurnCount(existing.mentorTurnCount);
      return;
    }

    // 自动恢复同节归档会话
    const archivedSame = getArchivedSessionsForLesson(sourceInfo.lesson.id);
    if (archivedSame.length > 0) {
      const latest = archivedSame[archivedSame.length - 1];
      const resumed = resumeArchivedSession(latest.id);
      if (resumed) {
        setMessages(resumed.messages);
        setActiveMentor(resumed.activeMentor);
        setMentorTurnCount(resumed.mentorTurnCount);
        return;
      }
    }

    // 新会话
    const defaultMentor = Array.isArray(sourceInfo.lesson.defaultMentor)
      ? sourceInfo.lesson.defaultMentor[0]
      : sourceInfo.lesson.defaultMentor;
    const useAdlerOpen = testResult.aiLevel.evidenceConflict;
    const openingMentor: MentorKey = useAdlerOpen ? "adler" : defaultMentor;
    const session = startNewSession(sourceInfo.lesson.id, openingMentor);
    setActiveMentor(openingMentor);

    const ctx: LearningContext = {
      testResult,
      currentLesson: sourceInfo.lesson,
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
  }, [sourceInfo.lesson.id]);

  // 自动滚底
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // 外部触发 focus(TodayPathCard 的"继续/开始"按钮会派发这个事件)
  useEffect(() => {
    function onFocusChat() {
      textareaRef.current?.focus();
      // 同时滚动到底部,让用户看到最新对话
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    window.addEventListener("als:focus-chat", onFocusChat);
    return () => window.removeEventListener("als:focus-chat", onFocusChat);
  }, []);

  // 处理外部传入的附件
  useEffect(() => {
    if (attachedContext) {
      setAttachment({ name: "外部附件", content: attachedContext });
    }
  }, [attachedContext]);

  // ============ 发送消息 ============
  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    // 拼合用户消息 + 附件
    const userContent = attachment
      ? `${input.trim()}\n\n---\n📎 我贴了一份资料给你参考（${attachment.name}）:\n${attachment.content.slice(0, 4000)}${attachment.content.length > 4000 ? "\n…(已截断)" : ""}`
      : input.trim();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
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
      userPreferences: preferencesToPromptSegment(getLearningPreferences()),
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, userMessage: userMsg.content }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let collected = "";
      let respondingMentor: MentorKey = activeMentor;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const obj = JSON.parse(line.slice(6));
            if (obj.type === "meta") {
              respondingMentor = obj.mentor as MentorKey;
              setStreamingMentor(respondingMentor);
            } else if (obj.type === "chunk") {
              collected += obj.content;
              setStreamingText(collected);
            } else if (obj.type === "rethink") {
              setStreamingText(collected + "\n\n…(调整一下表达)…");
            } else if (obj.type === "replace") {
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
        content: collected || "（导师暂时没说话,再试一次?）",
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
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setStreaming(false);
      setStreamingText("");
      setStreamingMentor(null);
    }
  };

  // ============ 文件上传 ============
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".txt", ".md", ".markdown"];
    const isAllowed = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      alert("当前 MVP 仅支持 .txt / .md / .markdown 文件。PDF 解析在 v0.1.7 加入。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setAttachment({ name: file.name, content: text });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ============ 听写 (Web Speech API) ============
  const startListening = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      alert("当前浏览器不支持语音识别（建议用 Chrome / Edge / Safari 最新版）。可继续用文字输入。");
      return;
    }
    const recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setInput((prev) => (prev + " " + finalText).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e: any) => {
      console.warn("Speech recognition error:", e.error);
      setListening(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };
  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ============ 播放 mentor 消息 (SpeechSynthesis) ============
  const speakMessage = (msg: ChatMessage) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("当前浏览器不支持语音合成。");
      return;
    }
    if (speakingMessageId === msg.id) {
      // 再点一次停止
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(msg.content);
    utter.lang = "zh-CN";
    utter.rate = 1.0;
    utter.onend = () => setSpeakingMessageId(null);
    utter.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  // ============ 沉淀（混合模式）============
  const openSedimentModal = async () => {
    setShowSedimentModal(true);
    setSedimentDraft({});
    // 让 AI 起草
    setSedimentSaving(true);
    try {
      const res = await fetch("/api/sediment/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: sourceInfo.lesson,
          messages,
        }),
      });
      if (res.ok) {
        const draft = await res.json();
        setSedimentDraft({
          title: draft.title || "",
          content: draft.content || "",
          tags: draft.tags || [],
        });
      } else {
        setSedimentDraft({ title: "", content: "", tags: [] });
      }
    } catch {
      setSedimentDraft({ title: "", content: "", tags: [] });
    } finally {
      setSedimentSaving(false);
    }
  };

  const handleSaveSediment = () => {
    const title = (sedimentDraft.title || "").trim();
    const content = (sedimentDraft.content || "").trim();
    if (!title || !content) return;
    const tags = sedimentDraft.tags || [];

    appendOutput({
      id: `o-${Date.now()}`,
      lessonId: sourceInfo.lesson.id,
      type: "one_sentence",
      content,
      createdAt: new Date().toISOString(),
      // 扩展字段
      title,
      tags,
      source: {
        lessonTitle: sourceInfo.lesson.title,
        mentor: activeMentor,
      },
    } as any);

    setSedimentSaved(true);
    setTimeout(() => {
      setShowSedimentModal(false);
      setSedimentDraft({});
      setSedimentSaved(false);
    }, 1500);
  };

  const handleEndSession = () => {
    if (!confirm("暂停本节学习？记录会归档,下次进入同一节会自动续学。")) return;
    endCurrentSession();
    onSessionEnd?.();
  };

  // ============ 渲染 ============
  const userTurns = messages.filter((m) => m.role === "user").length;
  const depthLevel = Math.min(5, Math.floor(userTurns / 2));
  const lesson = sourceInfo.lesson;

  return (
    <div className={cn("flex flex-col", fullScreen ? "min-h-screen" : "h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]")}>
      {/* 顶部紧凑状态栏 */}
      <div className="flex flex-col gap-1.5 border-b border-bg-warm/60 pb-3 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-bg-warm px-1.5 py-0.5 text-xs text-ink-soft">{sourceInfo.sourceLabel}</span>
              <h2 className="line-clamp-1 text-base font-medium leading-snug sm:text-lg">{lesson.title}</h2>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{lesson.summary}</p>
          </div>
          <button onClick={handleEndSession} className="flex-shrink-0 text-xs text-ink-mute hover:text-ink-soft">
            暂停本节
          </button>
        </div>
        {userTurns > 0 && (
          <div className="flex items-center gap-2 text-xs text-ink-mute">
            <span>本节深度</span>
            <span className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("h-1.5 w-3 rounded-full", i < depthLevel ? "bg-moss" : "bg-bg-warm")} />
              ))}
            </span>
            <span>·</span>
            <span>{userTurns} 轮</span>
            <span className="text-ink-soft/60">· 想透不限时长</span>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            speaking={speakingMessageId === msg.id}
            onSpeak={() => speakMessage(msg)}
          />
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
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ===== 悬浮胶囊输入栏 ===== */}
      <div className="sticky bottom-0 left-0 right-0 z-10 -mx-2 mt-3">
        {/* 上方淡出渐变,让滚动消息不直接顶到输入栏 */}
        <div className="pointer-events-none h-6 bg-gradient-to-t from-bg via-bg/95 to-bg/0" />

        <div className="bg-bg px-2 pb-2">
          {/* 附件预览条 */}
          {attachment && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs">
              <span className="line-clamp-1 text-ink-soft">
                📎 {attachment.name}（{Math.round(attachment.content.length / 100) / 10}k 字符）
              </span>
              <button onClick={() => setAttachment(null)} className="flex-shrink-0 text-ink-mute hover:text-accent">
                移除
              </button>
            </div>
          )}

          {/* 任务提示气泡（点击 进阶 → 看任务 时浮现） */}
          {showTaskHint && (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-moss/40 bg-moss/5 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              <span>
                <strong className="font-medium text-moss">本节输出任务：</strong>
                {lesson.outputTask}
              </span>
              <button onClick={() => setShowTaskHint(false)} className="flex-shrink-0 text-ink-mute hover:text-ink-soft">
                ✕
              </button>
            </div>
          )}

          {/* 胶囊输入栏主体 */}
          <div className="rounded-3xl border border-bg-warm/70 bg-white shadow-md transition focus-within:shadow-lg">
            <div className="flex items-end gap-1 px-2 py-1.5">
              {/* + 文件 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg text-ink-soft transition hover:bg-bg-subtle disabled:opacity-50"
                title="上传 .txt / .md（作为本轮上下文）"
              >
                +
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown"
                onChange={handleFilePick}
                className="hidden"
              />

              {/* 文本输入 */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  listening
                    ? "正在听…（再点麦克风停止）"
                    : "跟导师说点什么…（⌘/Ctrl + Enter 发送）"
                }
                disabled={streaming}
                rows={1}
                className="min-h-[2.25rem] max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-mute focus:outline-none disabled:opacity-50"
              />

              {/* 进阶 dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  disabled={streaming}
                  className="flex h-9 items-center gap-0.5 rounded-full px-2.5 text-xs text-ink-soft transition hover:bg-bg-subtle disabled:opacity-50"
                  title="更多操作"
                >
                  进阶 <span className="text-[10px]">▾</span>
                </button>
                {advancedOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setAdvancedOpen(false)} />
                    <div className="absolute bottom-full right-0 z-30 mb-2 w-60 overflow-hidden rounded-xl border border-bg-warm/70 bg-white shadow-lg">
                      <button
                        onClick={() => {
                          setAdvancedOpen(false);
                          openSedimentModal();
                        }}
                        className="block w-full border-b border-bg-warm/40 px-3 py-2.5 text-left text-sm transition hover:bg-bg-subtle"
                      >
                        <div className="font-medium">完成沉淀</div>
                        <div className="mt-0.5 text-xs text-ink-mute">把刚学到的存进知识库</div>
                      </button>
                      <button
                        onClick={() => {
                          setAdvancedOpen(false);
                          setShowTaskHint(true);
                        }}
                        className="block w-full border-b border-bg-warm/40 px-3 py-2.5 text-left text-sm transition hover:bg-bg-subtle"
                      >
                        <div className="font-medium">看本节任务</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-ink-mute">{lesson.outputTask}</div>
                      </button>
                      <button
                        onClick={() => {
                          setAdvancedOpen(false);
                          handleEndSession();
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm transition hover:bg-bg-subtle"
                      >
                        <div className="font-medium">暂停本节</div>
                        <div className="mt-0.5 text-xs text-ink-mute">会自动归档，下次进入续学</div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 听写 */}
              <button
                onClick={listening ? stopListening : startListening}
                disabled={streaming}
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-50",
                  listening ? "bg-accent text-white animate-pulse" : "text-ink-soft hover:bg-bg-subtle"
                )}
                title={listening ? "停止听写" : "语音听写（中文）"}
              >
                🎙
              </button>

              {/* 发送（圆形）*/}
              <button
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base transition",
                  input.trim() && !streaming
                    ? "bg-accent text-white hover:bg-accent-deep"
                    : "bg-bg-warm text-ink-mute"
                )}
                title="发送（⌘/Ctrl + Enter）"
              >
                {streaming ? (
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                ) : (
                  "↑"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 沉淀 modal（混合模式: AI 起草 + 用户编辑）*/}
      {showSedimentModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center" onClick={() => !sedimentSaving && setShowSedimentModal(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-t-2xl bg-bg p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {sedimentSaved ? (
              <p className="py-8 text-center text-base text-moss">已沉淀进知识库 ✓</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-xs text-ink-mute">本节输出任务</p>
                  <p className="text-sm leading-relaxed">{lesson.outputTask}</p>
                </div>

                {sedimentSaving && !sedimentDraft.title ? (
                  <div className="space-y-2 py-4 text-center text-sm text-ink-soft">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-bg-warm border-t-accent" />
                    <p>AI 正在帮你起草原子笔记…</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-ink-mute">标题（一句话点明这条笔记解决什么问题）</label>
                      <input
                        type="text"
                        value={sedimentDraft.title || ""}
                        onChange={(e) => setSedimentDraft({ ...sedimentDraft, title: e.target.value })}
                        placeholder="例如:为什么 AI 需要 RAG"
                        className="w-full rounded-lg border border-bg-warm/70 bg-white/60 px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-ink-mute">正文（用你自己的话,3-5 句话）</label>
                      <textarea
                        value={sedimentDraft.content || ""}
                        onChange={(e) => setSedimentDraft({ ...sedimentDraft, content: e.target.value })}
                        placeholder="脱离原文上下文也要能看懂"
                        rows={5}
                        className="w-full resize-none rounded-lg border border-bg-warm/70 bg-white/60 p-3 text-sm focus:border-accent/40 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-ink-mute">标签（逗号或空格分隔）</label>
                      <input
                        type="text"
                        value={(sedimentDraft.tags || []).join(" ")}
                        onChange={(e) => setSedimentDraft({ ...sedimentDraft, tags: e.target.value.split(/[\s,，]+/).filter(Boolean) })}
                        placeholder="例如:#AI技术 #RAG"
                        className="w-full rounded-lg border border-bg-warm/70 bg-white/60 px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-ink-mute">来源：{sourceInfo.lesson.title} · {MENTOR_NAMES[activeMentor]}</p>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowSedimentModal(false)} disabled={sedimentSaving} className="btn-ghost text-sm">
                    先放一放
                  </button>
                  <button
                    onClick={handleSaveSediment}
                    disabled={sedimentSaving || !sedimentDraft.title?.trim() || !sedimentDraft.content?.trim()}
                    className="btn-primary text-sm"
                  >
                    保存进知识库
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  streaming,
  speaking,
  onSpeak,
}: {
  msg: ChatMessage;
  streaming?: boolean;
  speaking?: boolean;
  onSpeak?: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isUser ? "bg-bg-warm text-ink-soft" : msg.mentor === "karpathy" ? "bg-accent text-white" : msg.mentor === "qian" ? "bg-moss text-white" : "bg-accent-soft text-white"
        )}
      >
        {isUser ? "你" : msg.mentor ? MENTOR_NAMES[msg.mentor].charAt(0) : "?"}
      </div>
      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        {!isUser && msg.mentor && (
          <div className="flex items-center gap-2 text-xs text-ink-mute">
            <span>{MENTOR_NAMES[msg.mentor]}</span>
            {onSpeak && !streaming && (
              <button onClick={onSpeak} className={cn("text-ink-mute hover:text-accent", speaking && "text-accent")}>
                {speaking ? "⏸ 暂停" : "🔊 播放"}
              </button>
            )}
          </div>
        )}
        <div className={cn("whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed", isUser ? "bg-accent text-white" : "bg-bg-subtle/70 text-ink", streaming && "animate-pulse")}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}
