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

/**
 * Persist the backpack to localStorage. Returns `false` (instead of throwing)
 * when the write fails — most commonly a `QuotaExceededError` from large image
 * data URLs — so callers can surface an error without crashing the app.
 */
export function persistBackpackItems(items: BackpackItem[]): boolean {
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("[backpack] Failed to persist items to localStorage", error);
    return false;
  }
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
