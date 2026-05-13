// 章节生成脚本。用 tsx 直接 import registry.ts,curl 调 DeepSeek。
// 用法: npx tsx scripts/generate-chapter.mjs <bookId> <chapterId>
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const [bookId, chapterId] = process.argv.slice(2);
if (!bookId || !chapterId) {
  console.error("用法: npx tsx scripts/generate-chapter.mjs <bookId> <chapterId>");
  process.exit(1);
}

// 读 .env.local
const envPath = path.join(projectRoot, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("错误: 找不到 .env.local");
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const LLM_API_KEY = env.LLM_API_KEY;
const LLM_BASE_URL = env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const LLM_MODEL = env.LLM_MODEL || "deepseek-chat";
if (!LLM_API_KEY) {
  console.error("错误: .env.local 里 LLM_API_KEY 为空");
  process.exit(1);
}

// 用 tsx 直接 import .ts
const registry = await import(path.join(projectRoot, "lib/textbooks/registry.ts"));

const book = registry.TEXTBOOKS[bookId];
if (!book) {
  console.error(`错误: 找不到 book ${bookId}`);
  process.exit(1);
}
const chapters = bookId === "ai" ? registry.AI_CHAPTERS : registry.AIPM_CHAPTERS;
const outline = chapters.find((c) => c.id === chapterId);
if (!outline) {
  console.error(`错误: 找不到 ${bookId}/${chapterId}`);
  process.exit(1);
}

const mentorName =
  outline.recommendedMentor === "karpathy"
    ? "卡帕西（AI 技术祛魅）"
    : outline.recommendedMentor === "qian"
    ? "钱学森（系统工程）"
    : "阿德勒（情绪陪伴）";

const systemPrompt = `你是「${book.title}」教材的撰稿人。本书面向：${book.audience}

风格要求：
${book.styleGuide}

输出格式（严格遵守，三部分）：
第一部分：章节内容（markdown 格式），3500-5500 字，以 # 章节标题开头
第二部分：单独一行 ---META---
第三部分：严格的 JSON 格式（不要 \`\`\`json 包裹），字段必须齐全：
{
  "keyConcepts": ["3-4 个核心概念，每个不超 8 字"],
  "socraticQuestions": ["3 个紧扣本章具体内容的苏格拉底起点问题"],
  "outputTask": "本章学完用一句话沉淀什么",
  "defaultMentor": "karpathy" 或 "qian" 或 "adler"
}

直接输出，不要任何"以下是"之类的开场白。`;

const userPrompt = `# 本章信息

- 书名：${book.title}
- 章节：第 ${outline.index} 章 / 共 ${book.totalChapters} 章
- 所在部分：${outline.part}
- 章节标题：${outline.title}
- 本章弄清楚什么：${outline.description}
- 对应 AI 能力等级：Lv.${outline.targetLevelMin} - Lv.${outline.targetLevelMax}
- 推荐导师：${mentorName}
${outline.linkedLessonId ? `- 对应互动课：${outline.linkedLessonId}` : ""}

# 详细大纲（必须按这个写，不能跑题）

${outline.detailedOutline}

# 具体写作要求

- 3500-5500 字，markdown 格式
- 反常识开场（200-300 字），先打破成见
- 3-4 个核心小节，每节都有具体例子或类比
- 与前后章节的链接（上承下启）
- 章末收束：本章你学到了什么（第二人称，不夸张）
- 不放数学公式，除非必要
- 中文母语节奏，术语保留英文原文并括注中文（首次出现）

现在请按格式输出。`;

const payload = {
  model: LLM_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  temperature: 0.6,
  max_tokens: 8000,
  stream: false,
};

console.log(`📝 ${bookId}/${chapterId} - ${outline.title}`);
console.log(`   ${outline.part} · Lv.${outline.targetLevelMin}-${outline.targetLevelMax} · ${mentorName}`);

const tmpPayloadFile = `/tmp/payload-${bookId}-${chapterId}-${Date.now()}.json`;
fs.writeFileSync(tmpPayloadFile, JSON.stringify(payload));

const startAt = Date.now();
const curlResult = spawnSync(
  "curl",
  [
    "-sS",
    "-X", "POST",
    `${LLM_BASE_URL}/chat/completions`,
    "-H", `Authorization: Bearer ${LLM_API_KEY}`,
    "-H", "Content-Type: application/json",
    "-d", `@${tmpPayloadFile}`,
    "--max-time", "240",
  ],
  { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
);
fs.unlinkSync(tmpPayloadFile);

if (curlResult.status !== 0) {
  console.error("curl 失败:", curlResult.stderr);
  process.exit(1);
}

let response;
try {
  response = JSON.parse(curlResult.stdout);
} catch (e) {
  console.error("响应不是 JSON:", curlResult.stdout.slice(0, 500));
  process.exit(1);
}
if (response.error) {
  console.error("API 错误:", JSON.stringify(response.error));
  process.exit(1);
}
const content = response.choices?.[0]?.message?.content;
if (!content) {
  console.error("LLM 返回空内容");
  process.exit(1);
}

const elapsedSec = Math.round((Date.now() - startAt) / 1000);
console.log(`   ⏱  ${elapsedSec}s · ${response.usage?.total_tokens || "?"} tokens`);

const parts = content.split("---META---");
let markdown, meta;
if (parts.length >= 2) {
  markdown = parts[0].trim();
  let metaStr = parts[1].trim();
  metaStr = metaStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  try {
    meta = JSON.parse(metaStr);
  } catch (e) {
    console.warn("⚠️  META JSON 解析失败，使用占位:", e.message);
    meta = {
      keyConcepts: ["待补"],
      socraticQuestions: ["这一章你最想问的是什么？"],
      outputTask: "用一句话写下本章对你最有启发的一点",
      defaultMentor: outline.recommendedMentor,
    };
  }
} else {
  console.warn("⚠️  没找到 ---META--- 分隔符");
  markdown = content.trim();
  meta = {
    keyConcepts: ["待补"],
    socraticQuestions: ["这一章你最想问的是什么？"],
    outputTask: "用一句话写下本章对你最有启发的一点",
    defaultMentor: outline.recommendedMentor,
  };
}

const outputDir = path.join(projectRoot, "lib/textbooks", bookId);
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${chapterId}.json`);
const out = {
  id: chapterId,
  bookId,
  title: markdown.split("\n")[0].replace(/^#\s*/, "").trim() || outline.title,
  markdown,
  version: "v0_draft",
  generatedAt: new Date().toISOString(),
  keyConcepts: meta.keyConcepts || [],
  socraticQuestions: meta.socraticQuestions || [],
  outputTask: meta.outputTask || "",
  defaultMentor: meta.defaultMentor || outline.recommendedMentor,
};
fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));

console.log(`✅ ${outputFile}`);
console.log(`   字数: ${markdown.length} · keyConcepts: ${JSON.stringify(meta.keyConcepts)}`);
console.log("");
