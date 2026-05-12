"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getAllArchivedSessions,
  getCurrentSession,
  getOutputHistory,
} from "@/lib/records/records";
import { MENTOR_NAMES } from "@/types/mentor";
import { getLessonById } from "@/lib/courses/built-in-courses";
import type { LearningSession, OutputRecord } from "@/lib/langgraph/state";

type Tab = "sessions" | "outputs";

export default function RecordsPage() {
  const [tab, setTab] = useState<Tab>("sessions");
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [outputs, setOutputs] = useState<OutputRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSessions(getAllArchivedSessions());
    setCurrentSession(getCurrentSession());
    setOutputs(getOutputHistory());
    setLoaded(true);
  }, []);

  const totalSessions = sessions.length + (currentSession ? 1 : 0);
  const totalOutputs = outputs.length;

  return (
    <main className="container-narrow py-8">
      <header className="mb-8">
        <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 学习中心
        </Link>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">学习记录</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            你走过的路
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            目前这些都存在你的浏览器里。等接入云端登录后会跨设备同步。
          </p>
        </div>

        {/* 概览 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="学习会话" value={totalSessions} suffix="次" />
          <StatCard label="输出沉淀" value={totalOutputs} suffix="条" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-bg-warm/60">
          <TabButton active={tab === "sessions"} onClick={() => setTab("sessions")} label={`会话 (${totalSessions})`} />
          <TabButton active={tab === "outputs"} onClick={() => setTab("outputs")} label={`沉淀 (${totalOutputs})`} />
        </div>

        {/* 内容 */}
        {!loaded ? (
          <p className="py-12 text-center text-sm text-ink-mute">加载中…</p>
        ) : tab === "sessions" ? (
          <SessionsList sessions={sessions} currentSession={currentSession} />
        ) : (
          <OutputsList outputs={outputs} />
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-lg border border-bg-warm/70 bg-white/40 p-4">
      <p className="text-xs text-ink-mute">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-medium text-ink">{value}</span>
        <span className="text-sm text-ink-soft">{suffix}</span>
      </p>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2 text-sm transition",
        active ? "border-accent font-medium text-ink" : "border-transparent text-ink-soft hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}

function SessionsList({ sessions, currentSession }: { sessions: LearningSession[]; currentSession: LearningSession | null }) {
  if (!currentSession && sessions.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-ink-soft">还没有学习记录</p>
        <p className="mt-1 text-xs text-ink-mute">完成第一节学习后这里会出现你的会话</p>
        <Link href="/courses" className="btn-primary mt-4 inline-block text-sm">
          去课程中心
        </Link>
      </div>
    );
  }

  // 倒序：最近的在前
  const all = [
    ...(currentSession ? [{ ...currentSession, _ongoing: true }] : []),
    ...sessions.slice().reverse().map((s) => ({ ...s, _ongoing: false })),
  ];

  return (
    <div className="space-y-2.5">
      {all.map((session) => (
        <SessionCard key={session.id} session={session} ongoing={session._ongoing} />
      ))}
    </div>
  );
}

function SessionCard({ session, ongoing }: { session: LearningSession; ongoing: boolean }) {
  const lesson = getLessonById(session.lessonId);
  const date = new Date(session.startedAt);
  const dateStr = date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const turns = Math.floor(session.messages.filter((m) => m.role === "user").length);
  const mentorUsed = new Set(session.messages.filter((m) => m.role === "mentor").map((m) => m.mentor!));

  return (
    <div
      className={cn(
        "rounded-lg border bg-white/40 p-4",
        ongoing ? "border-moss/50 bg-moss/5" : "border-bg-warm/70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-1 text-sm font-medium">
              {lesson?.title || `课程 ${session.lessonId}`}
            </h3>
            {ongoing && <span className="flex-shrink-0 rounded-full bg-moss px-2 py-0.5 text-xs text-white">进行中</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span>{dateStr}</span>
            <span>·</span>
            <span>{turns} 轮</span>
            <span>·</span>
            <span>导师：{Array.from(mentorUsed).map((m) => MENTOR_NAMES[m]).join(" / ") || "—"}</span>
            <span>·</span>
            <span>沉淀 {session.outputs?.length || 0} 条</span>
          </div>
        </div>
        {ongoing && (
          <Link href={`/learn?lesson=${session.lessonId}`} className="flex-shrink-0 text-xs text-accent hover:underline">
            继续 →
          </Link>
        )}
      </div>
    </div>
  );
}

function OutputsList({ outputs }: { outputs: OutputRecord[] }) {
  if (outputs.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-ink-soft">还没有输出沉淀</p>
        <p className="mt-1 text-xs text-ink-mute">每节课结束后用一句话写下你的总结，会保存在这里</p>
      </div>
    );
  }
  // 倒序
  const reversed = outputs.slice().reverse();
  return (
    <div className="space-y-2.5">
      {reversed.map((o) => {
        const lesson = getLessonById(o.lessonId);
        const date = new Date(o.createdAt);
        const dateStr = date.toLocaleString("zh-CN", { month: "short", day: "numeric" });
        return (
          <div key={o.id} className="rounded-lg border border-bg-warm/70 bg-white/40 p-4">
            <p className="text-sm leading-relaxed text-ink">{o.content}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-mute">
              <span>来自：{lesson?.title || o.lessonId}</span>
              <span>·</span>
              <span>{dateStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
