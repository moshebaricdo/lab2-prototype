import { useEffect, useState } from "react";

/**
 * Storage key used by URL overrides and mirrored into sessionStorage so shared
 * editor components can subscribe to one global read-only state.
 */
export const EDITOR_READ_ONLY_STORAGE_KEY = "devEditorReadOnly";

/**
 * Custom event fired whenever the read-only toggle changes within the
 * current tab. The browser only emits the native `storage` event for
 * *other* tabs, so we dispatch this manually to keep the same-tab editor
 * in sync.
 */
const READ_ONLY_CHANGE_EVENT = "weblab:editor-readonly-change";

function readToggle(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(EDITOR_READ_ONLY_STORAGE_KEY) === "true";
}

/**
 * Subscribe to the global "force read-only" dev toggle.
 *
 * Pages should call `setEditorReadOnlyOverride` with their resolved URL-backed
 * dev-panel value. The editor then re-renders from this shared mirror.
 */
export function useEditorReadOnlyOverride(): boolean {
  const [value, setValue] = useState<boolean>(() => readToggle());

  useEffect(() => {
    const sync = () => setValue(readToggle());
    window.addEventListener("storage", sync);
    window.addEventListener(READ_ONLY_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(READ_ONLY_CHANGE_EVENT, sync);
    };
  }, []);

  return value;
}

/**
 * Imperatively set the global read-only mirror.
 */
export function setEditorReadOnlyOverride(next: boolean): void {
  if (typeof window === "undefined") return;
  if (next) {
    window.sessionStorage.setItem(EDITOR_READ_ONLY_STORAGE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(EDITOR_READ_ONLY_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(READ_ONLY_CHANGE_EVENT));
}
