// 用户上传的资料 -> 自动拆出的合成课程
import type { BuiltInLesson } from "@/types/lesson";

export type UserMaterial = {
  id: string;                       // material-<timestamp>
  title: string;                    // 用户填或从文件名取
  rawText: string;                  // 原始文本
  fileName?: string;
  fileType?: "txt" | "md" | "paste";

  summary: string;                  // LLM 生成的摘要（200 字以内）
  syntheticLesson: BuiltInLesson;   // 合成的可学习课程
  createdAt: string;
};

export const MATERIALS_LS_KEY = "als:user-materials";
