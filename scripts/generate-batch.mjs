// 批量生成多章
// 用法: npx tsx scripts/generate-batch.mjs <bookId> <fromN> <toN>
// 例: npx tsx scripts/generate-batch.mjs ai 2 6   生成 c02-c06
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [bookId, fromN, toN] = process.argv.slice(2);
if (!bookId || !fromN || !toN) {
  console.error("用法: npx tsx scripts/generate-batch.mjs <bookId> <fromN> <toN>");
  process.exit(1);
}

const from = parseInt(fromN, 10);
const to = parseInt(toN, 10);

const startBatch = Date.now();
let successCount = 0;
let failCount = 0;

for (let i = from; i <= to; i++) {
  const chapterId = "c" + String(i).padStart(2, "0");
  console.log(`\n[${i - from + 1}/${to - from + 1}] 开始 ${bookId}/${chapterId}`);
  const result = spawnSync(
    "npx",
    ["tsx", path.join(__dirname, "generate-chapter.mjs"), bookId, chapterId],
    { stdio: "inherit", encoding: "utf-8" }
  );
  if (result.status === 0) {
    successCount++;
  } else {
    failCount++;
    console.error(`  ❌ ${chapterId} 失败`);
  }
}

const totalSec = Math.round((Date.now() - startBatch) / 1000);
console.log(`\n========= 批次完成 =========`);
console.log(`成功: ${successCount} · 失败: ${failCount} · 总耗时: ${totalSec}s`);
