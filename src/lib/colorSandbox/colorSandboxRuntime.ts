import {
  buildCodeAiColorSystem,
  mergeSemanticRefs,
  resolveColorSystemToCssVars,
  type ColorSystem,
  type ThemeKey,
} from "../../pages/design-system/colorSystemData";
import {
  COLOR_SANDBOX_APPLY_RUNTIME_KEY,
  COLOR_SANDBOX_DOC_STORAGE_KEY,
  COLOR_SANDBOX_RUNTIME_EVENT,
  readColorSandboxApplyRuntime,
  readColorSandboxDoc,
  setColorSandboxApplyRuntime,
} from "./colorSandboxStorage";

const STYLE_ELEMENT_ID = "lab2-color-sandbox-runtime-overrides";

function cssVarBlockFromMap(map: Map<string, string>, indent = "  "): string {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${indent}--ds-${name}: ${value};`)
    .join("\n");
}

function resolveSystemCssVars(system: ColorSystem, mode: ThemeKey): Map<string, string> {
  return resolveColorSystemToCssVars(
    mergeSemanticRefs(system, buildCodeAiColorSystem()),
    mode,
  );
}

export function buildColorSandboxRuntimeCss(system: ColorSystem): string {
  const lightBlock = cssVarBlockFromMap(resolveSystemCssVars(system, "light"));
  const darkBlock = cssVarBlockFromMap(resolveSystemCssVars(system, "dark"));

  return `/* Lab2 color sandbox runtime preview — not committed source of truth */
:root {
${lightBlock}
}

.dark {
${darkBlock}
}
`;
}

function getOrCreateStyleElement(): HTMLStyleElement {
  let element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!element) {
    element = document.createElement("style");
    element.id = STYLE_ELEMENT_ID;
    element.dataset.source = "color-sandbox-runtime";
    document.head.appendChild(element);
  }
  return element;
}

export function clearColorSandboxRuntimeOverrides(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

export function applyColorSandboxRuntimeFromStorage(): void {
  if (!readColorSandboxApplyRuntime()) {
    clearColorSandboxRuntimeOverrides();
    return;
  }

  const doc = readColorSandboxDoc();
  if (!doc?.families?.length) {
    clearColorSandboxRuntimeOverrides();
    return;
  }

  getOrCreateStyleElement().textContent = buildColorSandboxRuntimeCss(doc);
}

export function setColorSandboxRuntimePreview(enabled: boolean): void {
  setColorSandboxApplyRuntime(enabled);
  applyColorSandboxRuntimeFromStorage();
}

export function initColorSandboxRuntime(): () => void {
  applyColorSandboxRuntimeFromStorage();

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key !== COLOR_SANDBOX_DOC_STORAGE_KEY &&
      event.key !== COLOR_SANDBOX_APPLY_RUNTIME_KEY
    ) {
      return;
    }
    applyColorSandboxRuntimeFromStorage();
  };

  const handleCustomUpdate = () => {
    applyColorSandboxRuntimeFromStorage();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(COLOR_SANDBOX_RUNTIME_EVENT, handleCustomUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COLOR_SANDBOX_RUNTIME_EVENT, handleCustomUpdate);
  };
}
