import { useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  addLevelShareModeSearchParam,
  type ActiveLevelShareMode,
} from "./useLevelShareMode";

const PARAM_KEY = "o";

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, unknown>,
): T {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overVal = overrides[key];
    if (
      overVal !== null &&
      typeof overVal === "object" &&
      !Array.isArray(overVal) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overVal as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = overVal;
    }
  }
  return result;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split(".");
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }
  const [head, ...rest] = keys;
  const child = (obj[head] ?? {}) as Record<string, unknown>;
  return {
    ...obj,
    [head]: setNestedValue(child, rest.join("."), value),
  };
}

function deleteNestedValue(
  obj: Record<string, unknown>,
  path: string,
): Record<string, unknown> {
  const keys = path.split(".");
  const [head, ...rest] = keys;
  const next = { ...obj };

  if (rest.length === 0) {
    delete next[head];
    return next;
  }

  const child = next[head];
  if (child === null || typeof child !== "object" || Array.isArray(child)) {
    return next;
  }

  const nextChild = deleteNestedValue(
    child as Record<string, unknown>,
    rest.join("."),
  );

  if (Object.keys(nextChild).length === 0) {
    delete next[head];
  } else {
    next[head] = nextChild;
  }

  return next;
}

export function encodePropsOverride(overrides: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(overrides));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decode(encoded: string): Record<string, unknown> {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {};
  }
}

function buildAbsoluteRouteUrl(
  location: ReturnType<typeof useLocation>,
  searchParams: URLSearchParams,
) {
  const search = searchParams.toString();
  const route = `${location.pathname}${search ? `?${search}` : ""}${location.hash}`;

  if (typeof window === "undefined") return route;

  if (window.location.hash.startsWith("#")) {
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${route}`;
  }

  return `${window.location.origin}${route}`;
}

type ExtraSearchParams = Record<string, string | null | undefined>;

function applyExtraSearchParams(
  searchParams: URLSearchParams,
  extraSearchParams?: ExtraSearchParams,
) {
  if (!extraSearchParams) return searchParams;
  for (const [key, value] of Object.entries(extraSearchParams)) {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  }
  return searchParams;
}

export interface PropsOverrideResult<T> {
  props: T;
  overrides: Record<string, unknown>;
  getValue: (path: string) => unknown;
  setValue: (path: string, value: unknown) => void;
  resetAll: () => void;
  resetKey: (path: string) => void;
  resetKeys: (paths: string[]) => void;
  copyLink: (options?: { extraSearchParams?: ExtraSearchParams }) => void;
  copyShareLink: (
    mode?: ActiveLevelShareMode,
    options?: { extraSearchParams?: ExtraSearchParams },
  ) => void;
  hasOverrides: boolean;
}

export function usePropsOverride<T extends Record<string, unknown>>(
  defaults: T,
): PropsOverrideResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const overrides = useMemo<Record<string, unknown>>(() => {
    const raw = searchParams.get(PARAM_KEY);
    if (!raw) return {};
    return decode(raw);
  }, [searchParams]);

  const props = useMemo(() => deepMerge(defaults, overrides), [defaults, overrides]);

  const hasOverrides = Object.keys(overrides).length > 0;

  const getValue = useCallback(
    (path: string): unknown => {
      const overrideVal = getNestedValue(overrides, path);
      if (overrideVal !== undefined) return overrideVal;
      return getNestedValue(defaults as Record<string, unknown>, path);
    },
    [overrides, defaults],
  );

  const writeOverrides = useCallback(
    (next: Record<string, unknown>) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        if (Object.keys(next).length === 0) {
          updated.delete(PARAM_KEY);
        } else {
          updated.set(PARAM_KEY, encodePropsOverride(next));
        }
        return updated;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setValue = useCallback(
    (path: string, value: unknown) => {
      const defaultVal = getNestedValue(defaults as Record<string, unknown>, path);
      if (value === defaultVal) {
        writeOverrides(deleteNestedValue(overrides, path));
        return;
      }
      const next = setNestedValue(overrides, path, value);
      writeOverrides(next);
    },
    [overrides, defaults, writeOverrides],
  );

  const resetAll = useCallback(() => {
    writeOverrides({});
  }, [writeOverrides]);

  const resetKey = useCallback(
    (path: string) => {
      writeOverrides(deleteNestedValue(overrides, path));
    },
    [overrides, writeOverrides],
  );

  const resetKeys = useCallback(
    (paths: string[]) => {
      const next = paths.reduce(
        (result, path) => deleteNestedValue(result, path),
        overrides,
      );
      writeOverrides(next);
    },
    [overrides, writeOverrides],
  );

  const copyLink = useCallback((options: { extraSearchParams?: ExtraSearchParams } = {}) => {
    const nextSearchParams = applyExtraSearchParams(
      new URLSearchParams(searchParams),
      options.extraSearchParams,
    );
    navigator.clipboard.writeText(buildAbsoluteRouteUrl(location, nextSearchParams));
  }, [location, searchParams]);

  const copyShareLink = useCallback((
    mode: ActiveLevelShareMode = "locked-level",
    options: { extraSearchParams?: ExtraSearchParams } = {},
  ) => {
    const shareSearchParams = applyExtraSearchParams(
      addLevelShareModeSearchParam(searchParams, mode),
      options.extraSearchParams,
    );
    navigator.clipboard.writeText(buildAbsoluteRouteUrl(location, shareSearchParams));
  }, [location, searchParams]);

  return {
    props,
    overrides,
    getValue,
    setValue,
    resetAll,
    resetKey,
    resetKeys,
    copyLink,
    copyShareLink,
    hasOverrides,
  };
}
