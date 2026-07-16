import {
  buildCodeAiColorSystem,
  ensureSemanticStructure,
  isTransparentColor,
  mergeSemanticRefs,
  type ColorSystem,
} from "../../pages/design-system/colorSystemData";

export const COLOR_SANDBOX_DOC_STORAGE_KEY = "lab2:color-sandbox:doc";
export const COLOR_SANDBOX_DOC_VERSION_KEY = "lab2:color-sandbox:doc-version";
export const COLOR_SANDBOX_APPLY_RUNTIME_KEY = "lab2:color-sandbox:apply-runtime";
export const COLOR_SANDBOX_RUNTIME_EVENT = "lab2:color-sandbox:updated";

/**
 * Bump when the committed CodeAI baseline changes so stale localStorage drafts
 * are discarded and users load the bundled defaults instead.
 */
export const COLOR_SANDBOX_CODEAI_BASELINE_VERSION = 10;

type LegacyStoredDocs = { codeAi?: ColorSystem; codeOrg?: ColorSystem };

function readColorSandboxDocVersion(): number {
  if (typeof window === "undefined") return COLOR_SANDBOX_CODEAI_BASELINE_VERSION;
  const raw = window.localStorage.getItem(COLOR_SANDBOX_DOC_VERSION_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeColorSandboxDocVersion(version: number): void {
  window.localStorage.setItem(COLOR_SANDBOX_DOC_VERSION_KEY, String(version));
}

function readRawStoredDoc(): ColorSystem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COLOR_SANDBOX_DOC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ColorSystem | LegacyStoredDocs;
    // Flatten legacy per-brand map → single CodeAI doc
    if (parsed && typeof parsed === "object" && "families" in parsed) {
      return parsed as ColorSystem;
    }
    const legacy = parsed as LegacyStoredDocs;
    return legacy.codeAi ?? null;
  } catch {
    return null;
  }
}

/** Drop a stale draft when the bundled baseline has been updated. */
function discardStaleDraftIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (readColorSandboxDocVersion() >= COLOR_SANDBOX_CODEAI_BASELINE_VERSION) return;
  window.localStorage.removeItem(COLOR_SANDBOX_DOC_STORAGE_KEY);
  writeColorSandboxDocVersion(COLOR_SANDBOX_CODEAI_BASELINE_VERSION);
}

export function persistColorSandboxDoc(system: ColorSystem): void {
  window.localStorage.setItem(COLOR_SANDBOX_DOC_STORAGE_KEY, JSON.stringify(system));
  writeColorSandboxDocVersion(COLOR_SANDBOX_CODEAI_BASELINE_VERSION);
}

export function readColorSandboxDoc(): ColorSystem | null {
  discardStaleDraftIfNeeded();
  return readRawStoredDoc();
}

export const COLOR_SANDBOX_READ_ONLY_KEY = "lab2:color-sandbox:read-only";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/** Read-only is the default on deployed ("prod") hosts; localhost defaults to editable. */
export function defaultColorSandboxReadOnly(): boolean {
  if (typeof window === "undefined") return true;
  return !LOCAL_HOSTNAMES.has(window.location.hostname);
}

/** Session-scoped read-only preference; falls back to the host-based default. */
export function readColorSandboxReadOnly(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.sessionStorage.getItem(COLOR_SANDBOX_READ_ONLY_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return defaultColorSandboxReadOnly();
}

export function setColorSandboxReadOnly(enabled: boolean): void {
  window.sessionStorage.setItem(COLOR_SANDBOX_READ_ONLY_KEY, enabled ? "true" : "false");
}

export function readColorSandboxApplyRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLOR_SANDBOX_APPLY_RUNTIME_KEY) === "true";
}

export function setColorSandboxApplyRuntime(enabled: boolean): void {
  window.localStorage.setItem(
    COLOR_SANDBOX_APPLY_RUNTIME_KEY,
    enabled ? "true" : "false",
  );
}

function structuredCloneSystem(system: ColorSystem): ColorSystem {
  return JSON.parse(JSON.stringify(system)) as ColorSystem;
}

function restoreAlphaHexFromBuiltIn(stored: ColorSystem, fresh: ColorSystem): ColorSystem {
  const lookup = new Map<string, string>();
  for (const family of fresh.families) {
    for (const step of family.steps) {
      if (!isTransparentColor(step.hex)) continue;
      lookup.set(`${family.collectionId}::${family.name}::${step.step}`, step.hex);
    }
  }

  let changed = false;
  const next = structuredCloneSystem(stored);
  for (const family of next.families) {
    for (const step of family.steps) {
      if (isTransparentColor(step.hex)) continue;
      const sourceHex = lookup.get(`${family.collectionId}::${family.name}::${step.step}`);
      if (!sourceHex) continue;
      step.hex = sourceHex;
      changed = true;
    }
  }
  return changed ? next : stored;
}

/** Load the sandbox working document, merging persisted draft with bundled defaults. */
export function loadColorSandboxSystem(): ColorSystem {
  const fresh = buildCodeAiColorSystem();
  discardStaleDraftIfNeeded();
  const stored = readRawStoredDoc();
  if (!stored?.families?.length) return fresh;
  const structured = ensureSemanticStructure(stored);
  const withSemanticRefs = mergeSemanticRefs(structured, fresh);
  return restoreAlphaHexFromBuiltIn(withSemanticRefs, fresh);
}

export function notifyColorSandboxUpdated(): void {
  window.dispatchEvent(new CustomEvent(COLOR_SANDBOX_RUNTIME_EVENT));
}
