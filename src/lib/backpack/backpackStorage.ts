import type { BackpackItem } from "../../types/backpack";

export const BACKPACK_STORAGE_KEY = "lab2:backpack";

export function loadBackpackItems(): BackpackItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BACKPACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBackpackItem);
  } catch {
    return [];
  }
}

export function persistBackpackItems(items: BackpackItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(items));
}

function isBackpackItem(value: unknown): value is BackpackItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BackpackItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.savedAt === "string" &&
    typeof item.content === "string" &&
    typeof item.fileKind === "string"
  );
}
