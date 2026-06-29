/**
 * Resolve a ColorSystem export JSON into flat --ds-* CSS variable maps.
 * Shared by scripts/generate-tokens.mjs.
 */

const DEFAULT_SEMANTIC_FAMILY_SUBGROUP = {
  neutral: "neutral",
  teal: "brand",
  purple: "brand",
  aqua: "brand",
  strawberry: "brand",
  orange: "brand",
  error: "sentiment",
  warning: "sentiment",
  success: "sentiment",
  info: "sentiment",
  alpha: "neutral",
  "alpha-2": "neutral",
};

function slugify(value) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "family"
  );
}

function semanticSubGroupForFamily(system, familyKey) {
  return (
    system.semanticFamilySubGroups?.[familyKey] ??
    DEFAULT_SEMANTIC_FAMILY_SUBGROUP[familyKey] ??
    "accent"
  );
}

function semanticFamilyPathSegment(system, familyKey) {
  const family = system.semanticFamilies?.find((item) => item.id === familyKey);
  return slugify(family?.name ?? familyKey);
}

function semanticTokenVariableName(system, token) {
  const subGroupId = semanticSubGroupForFamily(system, token.familyKey);
  const familySegment = semanticFamilyPathSegment(system, token.familyKey);
  if (subGroupId === "brand" || subGroupId === "accent") {
    return `${token.surface}/${subGroupId}/${familySegment}/${token.role}`;
  }
  return `${token.surface}/${familySegment}/${token.role}`;
}

function semanticTokenCssName(system, token) {
  const path = token.id || semanticTokenVariableName(system, token);
  return path.replace(/\//g, "-").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

function buildStepIndex(system) {
  const steps = new Map();
  for (const family of system.families ?? []) {
    for (const step of family.steps ?? []) {
      steps.set(step.id, step);
    }
  }
  return steps;
}

function semanticHex(system, token, mode, steps, cache = new Map(), stack = new Set()) {
  const cacheKey = `${token.id}::${mode}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (stack.has(token.id)) {
    return token.fallbackHex?.[mode]?.toUpperCase() ?? null;
  }
  stack.add(token.id);

  let resolved = null;
  const refId = token.ref?.[mode];
  if (refId) {
    const step = steps.get(refId);
    if (step?.hex) resolved = step.hex.toUpperCase();
  }
  if (!resolved) {
    const semanticRef = token.semanticRef?.[mode];
    if (semanticRef) {
      const target = system.semantics?.find((item) => item.id === semanticRef);
      if (target) {
        resolved = semanticHex(system, target, mode, steps, cache, stack);
      }
    }
  }
  if (!resolved) {
    const fallback = token.fallbackHex?.[mode];
    resolved = fallback ? fallback.toUpperCase() : null;
  }

  stack.delete(token.id);
  if (resolved) cache.set(cacheKey, resolved);
  return resolved;
}

/**
 * @param {import('../src/pages/design-system/colorSystemData').ColorSystem} system
 * @param {"light"|"dark"} mode
 * @returns {Map<string, string>}
 */
export function resolveColorSystemToCssVars(system, mode) {
  const steps = buildStepIndex(system);
  const output = new Map();

  for (const token of system.semantics ?? []) {
    const hex = semanticHex(system, token, mode, steps);
    if (!hex) continue;
    output.set(semanticTokenCssName(system, token), hex);
  }

  return output;
}

export function colorSystemToCssVarBlock(system, mode, indent = "  ") {
  const vars = resolveColorSystemToCssVars(system, mode);
  return [...vars.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${indent}--ds-${name}: ${value};`)
    .join("\n");
}
