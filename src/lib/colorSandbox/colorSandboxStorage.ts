import type { BrandTheme } from "../../hooks/useTheme";
import {
  buildCodeAiColorSystem,
  buildColorSystem,
  ensureSemanticStructure,
  isTransparentColor,
  mergeSemanticRefs,
  type ColorSystem,
} from "../../pages/design-system/colorSystemData";

export const COLOR_SANDBOX_DOC_STORAGE_KEY = "lab2:color-sandbox:doc";
export const COLOR_SANDBOX_APPLY_RUNTIME_KEY = "lab2:color-sandbox:apply-runtime";
export const COLOR_SANDBOX_RUNTIME_EVENT = "lab2:color-sandbox:updated";

export type StoredColorSandboxDocs = Partial<Record<BrandTheme, ColorSystem>>;

export function readColorSandboxDocs(): StoredColorSandboxDocs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLOR_SANDBOX_DOC_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredColorSandboxDocs) : {};
  } catch {
    return {};
  }
}

export function persistColorSandboxDoc(brand: BrandTheme, system: ColorSystem): void {
  const docs = readColorSandboxDocs();
  docs[brand] = system;
  window.localStorage.setItem(COLOR_SANDBOX_DOC_STORAGE_KEY, JSON.stringify(docs));
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

/** Load the sandbox working document for a brand, merging persisted draft with bundled defaults. */
export function loadColorSandboxSystem(brand: BrandTheme): ColorSystem {
  const fresh =
    brand === "codeAi" ? buildCodeAiColorSystem() : buildColorSystem();
  const stored = readColorSandboxDocs()[brand];
  if (!stored?.families?.length) return fresh;
  const structured = ensureSemanticStructure(stored);
  const withSemanticRefs = mergeSemanticRefs(structured, fresh);
  return restoreAlphaHexFromBuiltIn(withSemanticRefs, fresh);
}

export function notifyColorSandboxUpdated(): void {
  window.dispatchEvent(new CustomEvent(COLOR_SANDBOX_RUNTIME_EVENT));
}
