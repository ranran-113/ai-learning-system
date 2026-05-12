// 通用工具函数
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// localStorage 读写封装（SSR 安全）
export function lsGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function lsSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 满了或被禁用,静默失败
  }
}

export function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

// localStorage key 命名空间
export const LS_KEYS = {
  TEST_ANSWERS: "als:test-answers",
  TEST_START_AT: "als:test-start-at",
  TEST_RESULT: "als:test-result",
  USER_LEVEL_ADJUSTED: "als:user-level-adjusted", // 是否已经用过 ±1 微调
} as const;
