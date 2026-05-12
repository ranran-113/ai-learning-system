// 三导师定义。详见 MENTORS.md。
export type MentorKey = "karpathy" | "qian" | "adler";

export const MENTOR_NAMES: Record<MentorKey, string> = {
  karpathy: "卡帕西",
  qian: "钱学森",
  adler: "阿德勒",
};

export const MENTOR_ROLES: Record<MentorKey, string> = {
  karpathy: "AI 技术深度与理解",
  qian: "系统工程 + 决策思维",
  adler: "情绪接纳与重构",
};

export type MentorMix = {
  karpathy: number; // 百分比 0-100
  qian: number;
  adler: number;
};
