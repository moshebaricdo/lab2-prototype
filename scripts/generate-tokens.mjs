import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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

const OUTPUT_PATH = path.join(ROOT_DIR, "src", "styles", "tokens.css");

const BRAND_THEME_OVERRIDES = {
  codeAi: {
    "background-brand-purple-extra-light": "#EFEEFC",
    "background-brand-purple-hover": "#D8D5F6",
    "background-brand-purple-light": "#D8D5F6",
    "background-brand-purple-primary": "#6A62D9",
    "background-brand-purple-primary-fixed": "#6A62D9",
    "background-brand-purple-strong": "#4F48B8",
    "background-brand-teal-extra-light": "#EFEEFC",
    "background-brand-teal-light": "#D8D5F6",
    "background-brand-teal-primary": "#6A62D9",
    "background-brand-teal-strong": "#4F48B8",
    "background-brand-aqua-extra-light": "#EFEEFC",
    "background-brand-aqua-light": "#D8D5F6",
    "background-brand-aqua-primary": "#6A62D9",
    "background-brand-aqua-strong": "#4F48B8",
    "borders-brand-purple-light": "#D8D5F6",
    "borders-brand-purple-primary": "#6A62D9",
    "borders-brand-purple-strong": "#4F48B8",
    "borders-brand-teal-light": "#D8D5F6",
    "borders-brand-teal-primary": "#6A62D9",
    "borders-brand-teal-strong": "#4F48B8",
    "borders-brand-aqua-light": "#EFEEFC",
    "borders-brand-aqua-primary": "#6A62D9",
    "borders-brand-aqua-strong": "#4F48B8",
    "text-brand-purple-primary": "#6A62D9",
    "text-brand-purple-primary-fixed": "#6A62D9",
    "text-brand-purple-secondary": "#4F48B8",
    "text-brand-teal-primary": "#6A62D9",
    "text-brand-teal-primary-fixed": "#6A62D9",
    "text-brand-teal-secondary": "#4F48B8",
    "text-brand-aqua-primary": "#6A62D9",
    "text-brand-aqua-primary-fixed": "#6A62D9",
    "text-brand-aqua-secondary": "#4F48B8",
  },
};

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

function toBrandThemeCssVars(overrides) {
  return Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  --ds-${name}: ${value};`)
    .join("\n");
}

function toBrandThemeCss() {
  return Object.entries(BRAND_THEME_OVERRIDES)
    .map(
      ([themeName, overrides]) => `
:root[data-brand-theme="${themeName}"],
:root[data-brand-theme="${themeName}"] .dark {
${toBrandThemeCssVars(overrides)}
}`,
    )
    .join("\n");
}

function buildCss(lightTokens, darkTokens) {
  return `/* Auto-generated by scripts/generate-tokens.mjs. Do not edit manually. */
:root {
${toCssVars(lightTokens)}
}

.dark {
${toCssVars(darkTokens)}
}
${toBrandThemeCss()}
`;
}

const lightSemantic = readJson(
  LIGHT_PATH,
  DEFAULT_LIGHT_PATH,
);
const darkSemantic = readJson(
  DARK_PATH,
  DEFAULT_DARK_PATH,
);

const lightMap = getTokenMap(lightSemantic, ":root");
const darkMap = getTokenMap(darkSemantic, ".dark");
const css = buildCss(lightMap, darkMap);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, css, "utf-8");

console.log(`Generated token CSS: ${OUTPUT_PATH}`);
