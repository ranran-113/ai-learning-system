// 用户上传资料的 localStorage 存储（v0.1.6 用 localStorage,后续 v0.1.7 迁 Supabase）
import { lsGet, lsSet } from "@/lib/utils";
import type { UserMaterial } from "./types";
import { MATERIALS_LS_KEY } from "./types";

export function getAllMaterials(): UserMaterial[] {
  return lsGet<UserMaterial[]>(MATERIALS_LS_KEY) || [];
}

export function saveMaterial(material: UserMaterial): void {
  const list = getAllMaterials();
  // 去重:同 id 替换
  const filtered = list.filter((m) => m.id !== material.id);
  filtered.push(material);
  lsSet(MATERIALS_LS_KEY, filtered);
}

export function getMaterialById(id: string): UserMaterial | null {
  return getAllMaterials().find((m) => m.id === id) || null;
}

export function deleteMaterial(id: string): void {
  const list = getAllMaterials().filter((m) => m.id !== id);
  lsSet(MATERIALS_LS_KEY, list);
}
