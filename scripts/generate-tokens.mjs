import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { colorSystemToCssVarBlock } from "./colorSystemToCss.mjs";

const ROOT_DIR = process.cwd();
const DEFAULT_LIGHT_PATH =
  "/Users/MosheFrost/Desktop/Semantic Colors/Light.tokens.json";
const DEFAULT_DARK_PATH =
  "/Users/MosheFrost/Desktop/Semantic Colors/Dark.tokens.json";

const LIGHT_PATH =
  process.env.WL2_LIGHT_TOKENS_PATH ??
  path.join(ROOT_DIR, "tokens", "semantic", "light.tokens.json");
const DARK_PATH =
  process.env.WL2_DARK_TOKENS_PATH ??
  path.join(ROOT_DIR, "tokens", "semantic", "dark.tokens.json");

const CODEAI_COLOR_SYSTEM_PATH = path.join(
  ROOT_DIR,
  "src",
  "pages",
  "design-system",
  "tokens",
  "codeAiColorSystem.json",
);

const OUTPUT_PATH = path.join(ROOT_DIR, "src", "styles", "tokens.css");

function readJson(tokenPath, fallbackPath) {
  if (fs.existsSync(tokenPath)) {
    return JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  }
  if (fs.existsSync(fallbackPath)) {
    return JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
  }
  console.warn(
    `Token file not found. Checked: ${tokenPath} and ${fallbackPath}. Falling back to existing generated CSS.`,
  );
  return null;
}

function normalizeName(segments) {
  return segments.join("-").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

function getNodeAtPath(root, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => acc?.[key], root);
}

function resolveTokenValue(root, node, stack = new Set()) {
  if (!node || typeof node !== "object") {
    return null;
  }

  const value = node.$value;
  if (typeof value === "string") {
    const match = value.match(/^\{(.+)\}$/);
    if (!match) {
      return null;
    }
    const referencePath = match[1];
    if (stack.has(referencePath)) {
      throw new Error(`Circular token reference detected: ${referencePath}`);
    }
    stack.add(referencePath);
    const targetNode = getNodeAtPath(root, referencePath);
    const resolved = resolveTokenValue(root, targetNode, stack);
    stack.delete(referencePath);
    return resolved;
  }

  if (value && typeof value === "object" && typeof value.hex === "string") {
    return value.hex.toUpperCase();
  }

  return null;
}

function flattenTokens(root, node, segments = [], output = new Map()) {
  if (!node || typeof node !== "object") {
    return output;
  }

  if (node.$type === "color") {
    const resolved = resolveTokenValue(root, node);
    if (resolved) {
      output.set(normalizeName(segments), resolved);
    }
    return output;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) {
      continue;
    }
    flattenTokens(root, value, [...segments, key], output);
  }

  return output;
}

function toCssVars(map) {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  --ds-${name}: ${value};`)
    .join("\n");
}

function readExistingCssTokenMap(selector) {
  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(
      `Token source files are unavailable and no generated CSS exists at ${OUTPUT_PATH}`,
    );
  }

  const css = fs.readFileSync(OUTPUT_PATH, "utf-8");
  const selectorStart = css.indexOf(`${selector} {`);
  if (selectorStart === -1) {
    throw new Error(`Could not find ${selector} token block in ${OUTPUT_PATH}`);
  }

  const blockStart = css.indexOf("{", selectorStart);
  const blockEnd = css.indexOf("\n}", blockStart);
  if (blockStart === -1 || blockEnd === -1) {
    throw new Error(`Could not parse ${selector} token block in ${OUTPUT_PATH}`);
  }

  const tokenMap = new Map();
  const block = css.slice(blockStart + 1, blockEnd);
  for (const match of block.matchAll(/--ds-([^:]+):\s*([^;]+);/g)) {
    tokenMap.set(match[1], match[2].trim());
  }

  return tokenMap;
}

function getTokenMap(semanticTokens, selector) {
  if (semanticTokens) {
    return flattenTokens(semanticTokens, semanticTokens);
  }

  return readExistingCssTokenMap(selector);
}

function loadCodeAiColorSystem() {
  if (!fs.existsSync(CODEAI_COLOR_SYSTEM_PATH)) {
    throw new Error(
      `CodeAI ColorSystem not found at ${CODEAI_COLOR_SYSTEM_PATH}`,
    );
  }
  return JSON.parse(fs.readFileSync(CODEAI_COLOR_SYSTEM_PATH, "utf-8"));
}

const CODEAI_LEGACY_BRAND_FAMILIES = ["teal", "aqua"];

function buildCodeAiLegacyBrandAliases(cssVarBlock) {
  const aliases = [];

  for (const line of cssVarBlock.split("\n")) {
    const match = line.match(
      /^  (--ds-(?:background|borders|text)-brand-)purple(-[a-z0-9-]+):/,
    );
    if (!match) {
      continue;
    }

    const [, prefix, role] = match;
    const purpleVar = `${prefix}purple${role}`;
    for (const legacyFamily of CODEAI_LEGACY_BRAND_FAMILIES) {
      aliases.push(
        `  ${prefix}${legacyFamily}${role}: var(${purpleVar});`,
      );
    }
  }

  return aliases.join("\n");
}

function toCodeAiBrandThemeCss(codeAiSystem) {
  const lightBlock = colorSystemToCssVarBlock(codeAiSystem, "light");
  const darkBlock = colorSystemToCssVarBlock(codeAiSystem, "dark");
  const lightAliases = buildCodeAiLegacyBrandAliases(lightBlock);
  const darkAliases = buildCodeAiLegacyBrandAliases(darkBlock);

  return `
:root[data-brand-theme="codeAi"] {
${lightBlock}
${lightAliases}
}

:root[data-brand-theme="codeAi"] .dark {
${darkBlock}
${darkAliases}
}`;
}

function extendCodeOrgCanonicalBrandNames(map) {
  const accentToBrand = [
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
    map.set("text-neutral-primary-inverse", map.get("text-neutral-inverse"));
  }

  if (map.has("borders-neutral-strong")) {
    map.set("borders-neutral-secondary", map.get("borders-neutral-strong"));
  } else if (map.has("borders-neutral-light")) {
    map.set("borders-neutral-secondary", map.get("borders-neutral-light"));
  }

  return map;
}

function buildCss(lightTokens, darkTokens, codeAiSystem) {
  return `/* Auto-generated by scripts/generate-tokens.mjs. Do not edit manually. */
:root {
${toCssVars(lightTokens)}
}

.dark {
${toCssVars(darkTokens)}
}
${toCodeAiBrandThemeCss(codeAiSystem)}
`;
}

const lightSemantic = readJson(LIGHT_PATH, DEFAULT_LIGHT_PATH);
const darkSemantic = readJson(DARK_PATH, DEFAULT_DARK_PATH);
const codeAiSystem = loadCodeAiColorSystem();

const lightMap = extendCodeOrgCanonicalBrandNames(
  getTokenMap(lightSemantic, ":root"),
);
const darkMap = extendCodeOrgCanonicalBrandNames(
  getTokenMap(darkSemantic, ".dark"),
);
const css = buildCss(lightMap, darkMap, codeAiSystem);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, css, "utf-8");

console.log(`Generated token CSS: ${OUTPUT_PATH}`);
