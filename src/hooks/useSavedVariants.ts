import { useCallback, useSyncExternalStore } from "react";
import type { ActiveLevelShareMode } from "./useLevelShareMode";
import { encodePropsOverride } from "./usePropsOverride";

const STORAGE_KEY = "lab2-variants";

export interface SavedVariant {
  id: string;
  name: string;
  /** The route path this variant is based on, e.g. "/levels/multi" */
  basePath: string;
  /** The override object (same shape written to the URL `?o=` param) */
  overrides: Record<string, unknown>;
  /** Additional URL params that are not part of the dev override object. */
  searchParams?: Record<string, string>;
  savedAt: number;
}

const EMPTY: SavedVariant[] = [];
let cachedRaw: string | null = null;
let cachedResult: SavedVariant[] = EMPTY;

function readVariants(): SavedVariant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): SavedVariant[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  cachedResult = raw ? JSON.parse(raw) : EMPTY;
  return cachedResult;
}

function writeVariants(variants: SavedVariant[]) {
  const json = JSON.stringify(variants);
  localStorage.setItem(STORAGE_KEY, json);
  cachedRaw = json;
  cachedResult = variants;
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useSavedVariants() {
  const variants = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const saveVariant = useCallback(
    (
      name: string,
      basePath: string,
      overrides: Record<string, unknown>,
      options: { searchParams?: Record<string, string> } = {},
    ) => {
      const current = readVariants();
      const variant: SavedVariant = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        basePath,
        overrides,
        ...(options.searchParams && Object.keys(options.searchParams).length > 0
          ? { searchParams: options.searchParams }
          : {}),
        savedAt: Date.now(),
      };
      writeVariants([variant, ...current]);
      return variant;
    },
    [],
  );

  const deleteVariant = useCallback((id: string) => {
    const current = readVariants();
    writeVariants(current.filter((v) => v.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    writeVariants([]);
  }, []);

  return { variants, saveVariant, deleteVariant, clearAll };
}

/**
 * Path + query for React Router `Link` `to` (HashRouter: omit `#`; the router adds it).
 * Matches `usePropsOverride` search param `o`.
 */
export function buildVariantUrl(
  basePath: string,
  overrides: Record<string, unknown>,
  options: {
    searchParams?: Record<string, string>;
    shareMode?: ActiveLevelShareMode;
  } = {},
): string {
  const path = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    searchParams.set(key, value);
  }

  if (options.shareMode) {
    searchParams.set("share", options.shareMode);
  }

  if (Object.keys(overrides).length > 0) {
    searchParams.set("o", encodePropsOverride(overrides));
  }

  const search = searchParams.toString();
  return search ? `${path}?${search}` : path;
}

export function buildVariantAbsoluteUrl(
  basePath: string,
  overrides: Record<string, unknown>,
  options: {
    searchParams?: Record<string, string>;
    shareMode?: ActiveLevelShareMode;
  } = {},
): string {
  const route = buildVariantUrl(basePath, overrides, options);
  if (typeof window === "undefined") return route;
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${route}`;
}
