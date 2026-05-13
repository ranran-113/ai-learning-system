// Markdown 导出 —— 把用户的原子笔记导出为 wiki 友好的 markdown 文件夹。
// 设计:
//   - 每条笔记一个 .md 文件,frontmatter 含来源元数据
//   - 文件名: YYYYMMDD-标题slug.md
//   - 用 JSZip 打包成 zip 下载
//   - frontmatter 提示 suggested-wiki-path 让用户决定放进自己 wiki 哪里
import type { OutputRecord } from "@/lib/langgraph/state";
import { MENTOR_NAMES } from "@/types/mentor";

// 简单 slug 化（中文保留,空格转 -,去掉特殊字符）
function slugify(title: string): string {
  return title
    .trim()
    .slice(0, 30)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function suggestWikiPath(note: OutputRecord): string {
  // 根据 lesson category 推荐 wiki 子路径
  const lessonId = note.lessonId || "";
  if (lessonId.startsWith("L1") || lessonId.startsWith("L2") || lessonId.startsWith("L3") || lessonId.startsWith("L4")) {
    return "aipm/product-design/";
  }
  if (lessonId.startsWith("L5") || lessonId.startsWith("L6") || lessonId.startsWith("L7")) {
    return "aipm/ai-tech/";
  }
  if (lessonId.startsWith("L8") || lessonId.startsWith("L9") || lessonId.startsWith("L10")) {
    return "aipm/ai-tech/prompt/";
  }
  if (lessonId.startsWith("L11")) {
    return "aipm/ai-tech/research/";
  }
  if (lessonId.startsWith("L12") || lessonId.startsWith("hot-")) {
    return "aipm/info-sources/";
  }
  if (lessonId.startsWith("material-")) {
    return "aipm/";
  }
  return "aipm/";
}

// 把一条笔记格式化为 markdown
export function noteToMarkdown(note: OutputRecord): string {
  const title = note.title || "未命名笔记";
  const tags = note.tags || [];
  const mentorName = note.source?.mentor ? MENTOR_NAMES[note.source.mentor] : "—";
  const lessonTitle = note.source?.lessonTitle || note.lessonId;

  const frontmatter = [
    "---",
    `title: ${title}`,
    `created: ${note.createdAt}`,
    `tags: [${tags.map((t) => `"${t.replace(/^#/, "")}"`).join(", ")}]`,
    `source-lesson: ${lessonTitle}`,
    `source-lesson-id: ${note.lessonId}`,
    `source-mentor: ${mentorName}`,
    `suggested-wiki-path: ${suggestWikiPath(note)}`,
    `from: 三导师 AI 学习成长系统`,
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${title}`,
    "",
    note.content,
    "",
    "---",
    "",
    `**来源**：${lessonTitle} · ${mentorName}`,
    `**时间**：${new Date(note.createdAt).toLocaleString("zh-CN")}`,
    tags.length > 0 ? `**标签**：${tags.join(" ")}` : "",
    "",
    "> 这条笔记由「三导师 AI 学习成长系统」导出。建议放进你的 wiki 对应位置，并加上你自己的批注。",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return frontmatter + body;
}

// 文件名
export function noteFilename(note: OutputRecord): string {
  return `${formatDate(note.createdAt)}-${slugify(note.title || note.id)}.md`;
}

// 导出所有笔记到 ZIP（动态加载 JSZip）
export async function exportNotesToZip(notes: OutputRecord[]): Promise<void> {
  if (notes.length === 0) {
    alert("还没有沉淀,导出什么呢?");
    return;
  }
  // 动态导入 JSZip
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder("三导师-知识库导出") || zip;

  // 索引文件
  const indexLines = [
    "# 导出索引",
    "",
    `> 共 ${notes.length} 条原子笔记 · 导出于 ${new Date().toLocaleString("zh-CN")}`,
    "",
    "## 使用建议",
    "",
    "把这个文件夹放到你 wiki 的对应目录下（每条笔记的 frontmatter 里有 `suggested-wiki-path` 字段给你参考）。",
    "",
    "## 笔记列表",
    "",
  ];

  for (const note of notes) {
    const filename = noteFilename(note);
    folder.file(filename, noteToMarkdown(note));
    indexLines.push(`- [[${note.title || note.id}]] · ${note.source?.lessonTitle || note.lessonId}`);
  }
  folder.file("_index.md", indexLines.join("\n"));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `知识库导出-${formatDate(new Date().toISOString())}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 单条笔记直接下载（不打包）
export function exportSingleNote(note: OutputRecord): void {
  const md = noteToMarkdown(note);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = noteFilename(note);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
