// 教材内容加载器 —— 从 lib/textbooks/<bookId>/<chapterId>.json 读取
// 用 import() 动态加载,只在被请求时才载入对应章节
import type { ChapterContent, TextbookId } from "./types";

// 列出可用的章节 id（启动时不读内容,只看哪些 json 存在）
// 这个数组要手动维护或在构建脚本里生成
export const AVAILABLE_CHAPTERS: Record<TextbookId, string[]> = {
  ai: ["c01"], // v0.2 起逐章添加。已写完的章节列在这里
  aipm: [],
};

// 加载单章
export async function loadChapter(
  bookId: TextbookId,
  chapterId: string
): Promise<ChapterContent | null> {
  try {
    const mod = await import(`./${bookId}/${chapterId}.json`);
    return mod.default as ChapterContent;
  } catch {
    return null;
  }
}

// 检查章节是否可读
export function isChapterAvailable(bookId: TextbookId, chapterId: string): boolean {
  return AVAILABLE_CHAPTERS[bookId]?.includes(chapterId) ?? false;
}
