import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

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

function encode(overrides: Record<string, unknown>): string {
  return btoa(JSON.stringify(overrides));
}

function decode(encoded: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return {};
  }
}

export interface PropsOverrideResult<T> {
  props: T;
  overrides: Record<string, unknown>;
  getValue: (path: string) => unknown;
  setValue: (path: string, value: unknown) => void;
  resetAll: () => void;
  resetKey: (path: string) => void;
  copyLink: () => void;
  hasOverrides: boolean;
}

export function usePropsOverride<T extends Record<string, unknown>>(
  defaults: T,
): PropsOverrideResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

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
          updated.set(PARAM_KEY, encode(next));
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
        const next = { ...overrides };
        const keys = path.split(".");
        if (keys.length === 1) {
          delete next[keys[0]];
        } else {
          const cleaned = setNestedValue(next, path, undefined);
          writeOverrides(cleaned);
          return;
        }
        writeOverrides(next);
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
      const next = { ...overrides };
      const keys = path.split(".");
      if (keys.length === 1) {
        delete next[keys[0]];
      }
      writeOverrides(next);
    },
    [overrides, writeOverrides],
  );

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return { props, overrides, getValue, setValue, resetAll, resetKey, copyLink, hasOverrides };
}
