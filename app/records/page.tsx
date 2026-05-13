"use client";

// /records —— 个人知识库视图（v0.1.6 重构）
// 三个 tab:
// - 笔记（原子笔记网格 + 标签筛选 + 搜索）
// - 会话（学习会话列表,跟旧版一致）
// - 概览（统计 + 标签云）
import { useEffect, useMemo, useState } from "react";
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
import { LearningCenterShell } from "@/components/learning-center-shell";
import { exportNotesToZip, exportSingleNote } from "@/lib/records/export";

type Tab = "notes" | "sessions" | "overview";

export default function RecordsPage() {
  const [tab, setTab] = useState<Tab>("notes");
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [outputs, setOutputs] = useState<OutputRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setSessions(getAllArchivedSessions());
    setCurrentSession(getCurrentSession());
    setOutputs(getOutputHistory());
    setLoaded(true);
  }, []);

  // 所有标签统计
  const tagStats = useMemo(() => {
    const counter = new Map<string, number>();
    for (const o of outputs) {
      for (const tag of o.tags || []) {
        counter.set(tag, (counter.get(tag) || 0) + 1);
      }
    }
    return Array.from(counter.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [outputs]);

  // 按标签 + 搜索筛选
  const filteredNotes = useMemo(() => {
    let list = outputs.slice().reverse(); // 倒序最近的在前
    if (selectedTag) {
      list = list.filter((o) => (o.tags || []).includes(selectedTag));
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (o) =>
          (o.title || "").toLowerCase().includes(q) ||
          o.content.toLowerCase().includes(q) ||
          (o.source?.lessonTitle || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [outputs, selectedTag, searchQ]);

  const totalSessions = sessions.length + (currentSession ? 1 : 0);
  const totalNotes = outputs.length;

  const handleExportAll = async () => {
    try {
      await exportNotesToZip(outputs);
    } catch (e) {
      alert("导出失败：" + (e instanceof Error ? e.message : "未知错误"));
    }
  };

  return (
    <LearningCenterShell current="records">
      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm tracking-wide text-ink-mute">个人知识库</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">你走过的路</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            学习过程中沉淀的笔记 + 会话归档。可导出为 Markdown 文件夹放进你的 Obsidian。
          </p>
        </div>

        {/* 三 tab */}
        <div className="flex flex-wrap gap-1 border-b border-bg-warm/60">
          <TabButton active={tab === "notes"} onClick={() => setTab("notes")} label={`原子笔记 (${totalNotes})`} />
          <TabButton active={tab === "sessions"} onClick={() => setTab("sessions")} label={`学习会话 (${totalSessions})`} />
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")} label="概览" />
        </div>

        {!loaded ? (
          <p className="py-12 text-center text-sm text-ink-mute">加载中…</p>
        ) : tab === "notes" ? (
          <NotesView
            notes={filteredNotes}
            allTags={tagStats}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            searchQ={searchQ}
            onSearchChange={setSearchQ}
            onExportAll={handleExportAll}
            totalCount={totalNotes}
          />
        ) : tab === "sessions" ? (
          <SessionsView sessions={sessions} currentSession={currentSession} />
        ) : (
          <OverviewView
            totalNotes={totalNotes}
            totalSessions={totalSessions}
            tagStats={tagStats}
            outputs={outputs}
            sessions={[...sessions, ...(currentSession ? [currentSession] : [])]}
          />
        )}
      </section>
    </LearningCenterShell>
  );
}

// ============= 三 tab 子组件 =============
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

function NotesView({
  notes,
  allTags,
  selectedTag,
  onSelectTag,
  searchQ,
  onSearchChange,
  onExportAll,
  totalCount,
}: {
  notes: OutputRecord[];
  allTags: Array<{ tag: string; count: number }>;
  selectedTag: string | null;
  onSelectTag: (t: string | null) => void;
  searchQ: string;
  onSearchChange: (q: string) => void;
  onExportAll: () => void;
  totalCount: number;
}) {
  return (
    <div className="space-y-4">
      {/* 搜索 + 导出 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索标题 / 内容 / 来源…"
          className="flex-1 min-w-[200px] rounded-lg border border-bg-warm/70 bg-white/60 px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
        />
        <button
          onClick={onExportAll}
          disabled={totalCount === 0}
          className="rounded-lg border border-accent/40 px-3 py-2 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          ⬇ 导出全部为 Markdown
        </button>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectTag(null)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition",
              !selectedTag ? "border-accent bg-accent text-white" : "border-bg-warm/70 text-ink-soft hover:bg-bg-subtle"
            )}
          >
            全部
          </button>
          {allTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag === selectedTag ? null : tag)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition",
                selectedTag === tag
                  ? "border-accent bg-accent text-white"
                  : "border-bg-warm/70 text-ink-soft hover:bg-bg-subtle"
              )}
            >
              {tag} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 笔记网格 */}
      {notes.length === 0 ? (
        totalCount === 0 ? (
          <div className="card text-center">
            <p className="text-sm text-ink-soft">还没有原子笔记</p>
            <p className="mt-1 text-xs text-ink-mute">完成第一节学习并点「完成沉淀」后,这里会出现你的笔记</p>
            <Link href="/courses" className="btn-primary mt-4 inline-block text-sm">
              去课程中心
            </Link>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-ink-mute">这个筛选下没有笔记</p>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: OutputRecord }) {
  const date = new Date(note.createdAt);
  const dateStr = date.toLocaleString("zh-CN", { month: "short", day: "numeric" });
  const mentorName = note.source?.mentor ? MENTOR_NAMES[note.source.mentor] : "";

  return (
    <div className="card group flex flex-col gap-2">
      <h3 className="text-sm font-medium leading-snug">{note.title || "（无标题）"}</h3>
      <p className="line-clamp-4 text-xs leading-relaxed text-ink-soft">{note.content}</p>
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(note.tags || []).map((tag) => (
            <span key={tag} className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-ink-soft">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-bg-warm/40 pt-2 text-xs text-ink-mute">
        <span className="line-clamp-1">
          {note.source?.lessonTitle || note.lessonId}
          {mentorName && ` · ${mentorName}`}
        </span>
        <div className="flex items-center gap-2">
          <span>{dateStr}</span>
          <button
            onClick={() => exportSingleNote(note)}
            className="opacity-0 transition group-hover:opacity-100 hover:text-accent"
            title="导出这一条为 Markdown"
          >
            ⬇
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionsView({
  sessions,
  currentSession,
}: {
  sessions: LearningSession[];
  currentSession: LearningSession | null;
}) {
  if (!currentSession && sessions.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-ink-soft">还没有学习会话</p>
        <Link href="/courses" className="btn-primary mt-4 inline-block text-sm">去课程中心</Link>
      </div>
    );
  }

  const all = [
    ...(currentSession ? [{ ...currentSession, _ongoing: true }] : []),
    ...sessions.slice().reverse().map((s) => ({ ...s, _ongoing: false })),
  ];

  return (
    <div className="space-y-2.5">
      {all.map((session) => {
        const lesson = getLessonById(session.lessonId);
        const date = new Date(session.startedAt);
        const dateStr = date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const turns = Math.floor(session.messages.filter((m) => m.role === "user").length);
        const mentorUsed = new Set(session.messages.filter((m) => m.role === "mentor").map((m) => m.mentor!));

        return (
          <div
            key={session.id}
            className={cn(
              "rounded-lg border bg-white/40 p-4",
              session._ongoing ? "border-moss/50 bg-moss/5" : "border-bg-warm/70"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="line-clamp-1 text-sm font-medium">{lesson?.title || `课程 ${session.lessonId}`}</h3>
                  {session._ongoing && <span className="flex-shrink-0 rounded-full bg-moss px-2 py-0.5 text-xs text-white">进行中</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-mute">
                  <span>{dateStr}</span>
                  <span>·</span>
                  <span>{turns} 轮</span>
                  <span>·</span>
                  <span>导师：{Array.from(mentorUsed).map((m) => MENTOR_NAMES[m]).join(" / ") || "—"}</span>
                </div>
              </div>
              {session._ongoing && (
                <Link href={`/learn?lesson=${session.lessonId}`} className="flex-shrink-0 text-xs text-accent hover:underline">
                  继续 →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverviewView({
  totalNotes,
  totalSessions,
  tagStats,
  outputs,
  sessions,
}: {
  totalNotes: number;
  totalSessions: number;
  tagStats: Array<{ tag: string; count: number }>;
  outputs: OutputRecord[];
  sessions: LearningSession[];
}) {
  // 按学习领域分组
  const byTopic = useMemo(() => {
    const groups = new Map<string, number>();
    for (const o of outputs) {
      const lesson = getLessonById(o.lessonId);
      const cat = lesson?.category || "other";
      const label =
        cat === "aipm" ? "AIPM 主线" :
        cat === "ai_tech" ? "AI 技术" :
        cat === "ai_level" ? "等级进阶" :
        cat === "paper" ? "论文导读" :
        cat === "hot" ? "热点学习" :
        "其他";
      groups.set(label, (groups.get(label) || 0) + 1);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [outputs]);

  // 总发言轮数
  const totalUserTurns = sessions.reduce(
    (sum, s) => sum + s.messages.filter((m) => m.role === "user").length,
    0
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="原子笔记" value={totalNotes} suffix="条" />
        <StatCard label="学习会话" value={totalSessions} suffix="次" />
        <StatCard label="累计发言" value={totalUserTurns} suffix="轮" />
        <StatCard label="覆盖领域" value={byTopic.length} suffix="个" />
      </div>

      {byTopic.length > 0 && (
        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">学习领域分布</p>
          {byTopic.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="text-ink-mute">{count} 条</span>
            </div>
          ))}
        </div>
      )}

      {tagStats.length > 0 && (
        <div className="card space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-mute">标签云（出现次数）</p>
          <div className="flex flex-wrap gap-1.5">
            {tagStats.map(({ tag, count }) => (
              <span
                key={tag}
                className="rounded-full bg-bg-warm px-2.5 py-0.5 text-ink-soft"
                style={{ fontSize: `${Math.min(0.95, 0.7 + count * 0.05)}rem` }}
              >
                {tag} <span className="opacity-60">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
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
