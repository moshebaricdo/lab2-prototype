import type { BrandTheme } from "../../hooks/useTheme";
import {
  buildCodeAiColorSystem,
  buildColorSystem,
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
  readColorSandboxDocs,
  setColorSandboxApplyRuntime,
} from "./colorSandboxStorage";

const STYLE_ELEMENT_ID = "lab2-color-sandbox-runtime-overrides";

function cssVarBlockFromMap(map: Map<string, string>, indent = "  "): string {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${indent}--ds-${name}: ${value};`)
    .join("\n");
}

/** Mirror `extendCodeOrgCanonicalBrandNames` in scripts/generate-tokens.mjs. */
function extendCodeOrgCanonicalBrandNames(map: Map<string, string>): Map<string, string> {
  const accentToBrand: Array<[string, string]> = [
    ["accent-strawberry", "brand-pink"],
    ["accent-orange", "brand-orange"],
  ];
  const surfaces = ["background", "text", "borders"];

  for (const [legacyFamily, canonicalFamily] of accentToBrand) {
    for (const [name, value] of [...map.entries()]) {
      for (const surface of surfaces) {
        const prefix = `${surface}-${legacyFamily}-`;
        if (name.startsWith(prefix)) {
          const role = name.slice(prefix.length);
          map.set(`${surface}-${canonicalFamily}-${role}`, value);
        }
      }
    }
  }

  if (map.has("text-neutral-inverse")) {
    map.set("text-neutral-primary-inverse", map.get("text-neutral-inverse")!);
  }

  if (map.has("borders-neutral-strong")) {
    map.set("borders-neutral-secondary", map.get("borders-neutral-strong")!);
  } else if (map.has("borders-neutral-light")) {
    map.set("borders-neutral-secondary", map.get("borders-neutral-light")!);
  }

  return map;
}

function resolveSystemCssVars(
  system: ColorSystem,
  mode: ThemeKey,
  brand: BrandTheme,
): Map<string, string> {
  const canonical =
    brand === "codeAi" ? buildCodeAiColorSystem() : buildColorSystem();
  const resolved = resolveColorSystemToCssVars(
    mergeSemanticRefs(system, canonical),
    mode,
  );
  if (brand === "codeOrg") {
    return extendCodeOrgCanonicalBrandNames(new Map(resolved));
  }
  return resolved;
}

function buildBrandRuntimeCss(brand: BrandTheme, system: ColorSystem): string {
  const lightMap = resolveSystemCssVars(system, "light", brand);
  const darkMap = resolveSystemCssVars(system, "dark", brand);
  const lightBlock = cssVarBlockFromMap(lightMap);
  const darkBlock = cssVarBlockFromMap(darkMap);

  if (brand === "codeOrg") {
    return `:root {
${lightBlock}
}

.dark {
${darkBlock}
}`;
  }

  // Do not emit teal/aqua → purple legacy aliases here. Those belong in committed
  // tokens.css (generator) and active-state remaps in globals.css; injecting them
  // would override globals.css because this style tag loads later in the cascade.
  return `:root[data-brand-theme="codeAi"] {
${lightBlock}
}

:root[data-brand-theme="codeAi"] .dark {
${darkBlock}
}`;
}

export function buildColorSandboxRuntimeCss(
  docs: Partial<Record<BrandTheme, ColorSystem>>,
): string {
  const sections: string[] = [];

  if (docs.codeOrg?.families?.length) {
    sections.push(buildBrandRuntimeCss("codeOrg", docs.codeOrg));
  }
  if (docs.codeAi?.families?.length) {
    sections.push(buildBrandRuntimeCss("codeAi", docs.codeAi));
  }

  if (sections.length === 0) return "";

  return `/* Lab2 color sandbox runtime preview — not committed source of truth */
${sections.join("\n\n")}
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

  const docs = readColorSandboxDocs();
  const css = buildColorSandboxRuntimeCss(docs);
  if (!css.trim()) {
    clearColorSandboxRuntimeOverrides();
    return;
  }

  getOrCreateStyleElement().textContent = css;
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
