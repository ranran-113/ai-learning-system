"use client";

// /materials —— 上传资料自动拆课（v0.1.6 真正实现）
// 流程: 用户上传文本（粘贴 / .txt / .md）→ 后端 LLM 拆成合成课程 → 存 localStorage → 入口 /learn?source=material&id=xxx
import { useEffect, useState } from "react";
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { MENTOR_NAMES } from "@/types/mentor";
import { getAllMaterials, saveMaterial, deleteMaterial } from "@/lib/materials/store";
import type { UserMaterial } from "@/lib/materials/types";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<UserMaterial[]>([]);
  const [mode, setMode] = useState<"list" | "create">("list");

  // create 表单状态
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(getAllMaterials());
  }, []);

  const refresh = () => setMaterials(getAllMaterials());

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".txt", ".md", ".markdown"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError("当前 MVP 仅支持 .txt / .md。PDF / 复杂格式在 v0.1.7 加入。");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(String(reader.result || ""));
      if (!title) setTitle(file.name.replace(/\.(md|markdown|txt)$/i, ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSplit = async () => {
    if (!title.trim() || !rawText.trim()) {
      setError("标题和资料内容都要填");
      return;
    }
    if (rawText.length < 200) {
      setError("资料太短了（少于 200 字符）—— 拆出来的课没料,先把资料补充一下吧。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/materials/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), rawText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "拆课失败");
      }
      const material: UserMaterial = {
        id: data.syntheticLesson.id,
        title: title.trim(),
        rawText,
        summary: data.summary,
        syntheticLesson: data.syntheticLesson,
        createdAt: new Date().toISOString(),
        fileType: "paste",
      };
      saveMaterial(material);
      setTitle("");
      setRawText("");
      setMode("list");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("删除这份资料？关联的合成课会一起删掉,已沉淀的笔记不会删。")) return;
    deleteMaterial(id);
    refresh();
  };

  return (
    <LearningCenterShell current="materials">
      {mode === "create" ? (
        <CreateView
          title={title}
          rawText={rawText}
          busy={busy}
          error={error}
          onTitleChange={setTitle}
          onRawTextChange={setRawText}
          onFilePick={handleFilePick}
          onSubmit={handleSplit}
          onCancel={() => setMode("list")}
        />
      ) : (
        <ListView
          materials={materials}
          onCreateNew={() => setMode("create")}
          onDelete={handleDelete}
        />
      )}
    </LearningCenterShell>
  );
}

function ListView({
  materials,
  onCreateNew,
  onDelete,
}: {
  materials: UserMaterial[];
  onCreateNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm tracking-wide text-ink-mute">上传资料学习</p>
        <h1 className="text-3xl font-medium leading-snug sm:text-4xl">把你的资料拆成微课</h1>
        <p className="text-base leading-relaxed text-ink-soft">
          你读的文章 / 笔记 / 行业资料 —— 上传它，AI 自动拆成微课，再用三导师方式陪你学。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onCreateNew} className="btn-primary text-sm">
          + 上传新资料
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="card space-y-3 text-center">
          <p className="text-sm text-ink-soft">还没有上传过资料</p>
          <p className="text-xs text-ink-mute">
            支持粘贴文本 / .txt / .md 文件。PDF / Word 等复杂格式会在 v0.1.7 加入。
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {materials.slice().reverse().map((m) => (
            <MaterialCard key={m.id} material={m} onDelete={() => onDelete(m.id)} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-bg-warm/60 bg-bg-subtle/30 p-4 text-xs leading-relaxed text-ink-soft">
        <p className="mb-1 font-medium text-ink">这块怎么工作的</p>
        <ol className="ml-4 list-decimal space-y-1">
          <li>你粘贴或上传一段文本（200 字以上）</li>
          <li>系统调 LLM 拆出: 摘要 + 微课标题 + 3 个核心概念 + 苏格拉底起点问题 + 输出任务</li>
          <li>合成课程存在你浏览器（localStorage）—— 点「开始学习」就和三导师聊这份资料</li>
          <li>沉淀的笔记跟内置课沉淀一样,会进你的知识库</li>
        </ol>
      </div>
    </section>
  );
}

function MaterialCard({ material, onDelete }: { material: UserMaterial; onDelete: () => void }) {
  const date = new Date(material.createdAt);
  const dateStr = date.toLocaleString("zh-CN", { month: "short", day: "numeric" });
  const mentor = Array.isArray(material.syntheticLesson.defaultMentor)
    ? material.syntheticLesson.defaultMentor.map(m => MENTOR_NAMES[m]).join(" / ")
    : MENTOR_NAMES[material.syntheticLesson.defaultMentor];

  return (
    <div className="rounded-lg border border-bg-warm/70 bg-white/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-medium">{material.title}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{material.summary}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-mute">
            <span>{dateStr}</span>
            <span>·</span>
            <span>{material.rawText.length} 字符</span>
            <span>·</span>
            <span>默认导师 {mentor}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <Link
            href={`/learn?source=material&id=${encodeURIComponent(material.id)}`}
            className="rounded-lg bg-accent px-3 py-1 text-xs text-white hover:bg-accent-deep"
          >
            开始学习
          </Link>
          <button onClick={onDelete} className="text-xs text-ink-mute hover:text-accent">
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateView({
  title,
  rawText,
  busy,
  error,
  onTitleChange,
  onRawTextChange,
  onFilePick,
  onSubmit,
  onCancel,
}: {
  title: string;
  rawText: string;
  busy: boolean;
  error: string | null;
  onTitleChange: (v: string) => void;
  onRawTextChange: (v: string) => void;
  onFilePick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-sm text-ink-mute hover:text-ink-soft">
          ← 返回资料列表
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-medium leading-snug">上传新资料</h1>
        <p className="text-sm text-ink-soft">
          支持粘贴文本，或上传 .txt / .md 文件。建议 200–50000 字符之间。
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-ink-mute">资料标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="例如:Karpathy 神经网络入门讲座 / 我整理的 AI 工作流方法"
            disabled={busy}
            className="w-full rounded-lg border border-bg-warm/70 bg-white/60 px-3 py-2 text-sm focus:border-accent/40 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-ink-mute">资料内容</label>
            <label className="cursor-pointer rounded border border-bg-warm/70 px-2 py-0.5 text-xs text-ink-soft hover:bg-bg-subtle">
              上传 .txt / .md
              <input type="file" accept=".txt,.md,.markdown" onChange={onFilePick} className="hidden" />
            </label>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder="直接粘贴文本,或者点上面的按钮上传文件…"
            disabled={busy}
            rows={14}
            className="w-full resize-y rounded-lg border border-bg-warm/70 bg-white/60 p-3 text-sm focus:border-accent/40 focus:outline-none disabled:opacity-50"
          />
          <p className="text-xs text-ink-mute">已输入 {rawText.length} 字符 · 推荐 200-50000</p>
        </div>

        {error && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm text-ink-soft">
            出错了：{error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={onSubmit} disabled={busy} className="btn-primary text-sm">
            {busy ? "AI 拆课中…（约 10-20 秒）" : "拆成微课"}
          </button>
          <button onClick={onCancel} disabled={busy} className="btn-ghost text-sm">
            取消
          </button>
        </div>

        <div className="rounded-lg border border-bg-warm/60 bg-bg-subtle/30 p-4 text-xs leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">拆课会产出什么</p>
          <ul className="mt-1 ml-4 list-disc space-y-0.5">
            <li>整段资料的核心摘要</li>
            <li>合成微课的标题、3-4 个核心概念</li>
            <li>3 个紧扣资料内容的苏格拉底式起点问题</li>
            <li>本节学完应该沉淀什么的输出任务</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
