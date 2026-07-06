/**
 * Prod-shaped CSS export for the color sandbox.
 *
 * Generates the two files the product design system actually ships:
 *  - primitiveColors.css — flat `:root` of primitive hex values
 *  - colors.css          — semantic tokens referencing primitives via var(),
 *                          with Light (`:root, [data-theme='Light']`) and
 *                          Dark (`[data-theme='Dark']`) blocks
 *
 * Names are derived from the *current* sandbox structure (collection, family
 * and subgroup display names), never from internal stable ids — so renames,
 * duplicated families ("pink-2" etc.) and moved subgroups export under the
 * names visible in the sandbox UI.
 */

import type {
  ColorSystem,
  PrimitiveFamily,
  PrimitiveStep,
  SemanticToken,
  ThemeKey,
} from "./colorSystemData";
import {
  isUnsetPrimitiveHex,
  semanticFamilyPathSegment,
  semanticSubGroupForFamily,
} from "./colorSystemData";

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-") || "unnamed"
  );
}

export function primitiveVarName(
  family: PrimitiveFamily,
  step: PrimitiveStep,
): string {
  return `${slug(family.collectionId)}-${slug(family.name)}-${slug(step.step)}`;
}

/** Prod ships `border-*` (singular); the sandbox surface id is `borders`. */
function exportSurface(surface: string): string {
  const s = slug(surface);
  return s === "borders" ? "border" : s;
}

/** Subgroups whose name is omitted from semantic variable names (prod convention). */
const FLAT_SUBGROUPS = new Set(["sentiment"]);

/**
 * Subgroups with a single, by-design family whose name is omitted so the
 * token stays color-agnostic (e.g. `background-brand-primary`, not
 * `background-brand-purple-primary`). Future brand colors go into accents.
 */
const SINGLE_FAMILY_SUBGROUPS = new Set(["brand"]);

/**
 * Prod-style semantic variable name derived from current display names:
 * `{surface}-{subgroup?}-{family?}-{role}`.
 *
 * - `sentiment` subgroup is flat (e.g. `background-error-primary`).
 * - Other subgroups keep their name (e.g. `background-neutral-primary`,
 *   `background-state-selected-primary`).
 * - `brand` collapses its (single) family name so the token stays
 *   color-agnostic: `background-brand-primary`. Also collapses whenever the
 *   family name equals the subgroup name (e.g. the neutral gray family).
 */
export function semanticExportVarName(
  system: ColorSystem,
  token: SemanticToken,
): string {
  const subGroupId = semanticSubGroupForFamily(system, token.familyKey);
  const subGroup = system.semanticSubGroups?.find((item) => item.id === subGroupId);
  const subName = slug(subGroup?.name ?? subGroupId);
  const familySegment = slug(semanticFamilyPathSegment(system, token.familyKey));

  const parts: string[] = [exportSurface(token.surface)];
  if (!FLAT_SUBGROUPS.has(subName)) parts.push(subName);
  if (
    !SINGLE_FAMILY_SUBGROUPS.has(subName) &&
    familySegment !== subName &&
    familySegment !== parts[parts.length - 1]
  ) {
    parts.push(familySegment);
  }
  parts.push(slug(token.role));
  return parts.join("-");
}

/* ---------------------------------------------------------------------------
 * Ordering
 *
 * Semantic tokens are grouped (not alphabetized) for readability:
 *   surface:  background, border, text
 *   group:    neutral, brand, sentiment (error, warning, success, info),
 *             accent, state
 *   roles:    primary first, then the ramp (light, mid, strong), then the
 *             neutral ordinals, then special cases (fixed, inverse, disabled,
 *             …), with neutral alphas last (numeric, 5 before 10).
 * ------------------------------------------------------------------------- */

const SURFACE_RANK: Record<string, number> = { background: 0, border: 1, text: 2 };
const GROUP_RANK: Record<string, number> = {
  neutral: 0,
  brand: 1,
  sentiment: 2,
  accent: 3,
  state: 4,
};
const SENTIMENT_FAMILY_RANK: Record<string, number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
};
const ROLE_RANK: string[] = [
  "primary",
  "light",
  "mid",
  "strong",
  "secondary",
  "tertiary",
  "quaternary",
  "quinary",
  "senary",
  "septenary",
  "octonary",
  "hover",
  "primary-fixed",
  "primary-inverse",
  "disabled",
  "disabled-inverse",
  "placeholder",
  "solid",
  "true-base",
  "black-fixed",
  "white-fixed",
];

interface ParsedSemanticName {
  surfaceRank: number;
  groupRank: number;
  familyRank: number;
  roleRank: number;
  role: string;
}

function parseSemanticExportName(name: string): ParsedSemanticName {
  const segments = name.split("-");
  const surface = segments[0];
  const surfaceRank = SURFACE_RANK[surface] ?? 99;

  let group: string;
  let familyRank = 0;
  let roleSegments: string[];

  if (segments[1] === "neutral") {
    group = "neutral";
    if (segments[2] === "alpha") {
      // Alphas sort after every named neutral role, numerically (5 first).
      return {
        surfaceRank,
        groupRank: GROUP_RANK.neutral,
        familyRank: 1,
        roleRank: 1000 + Number(segments[3] ?? 0),
        role: segments.slice(3).join("-"),
      };
    }
    roleSegments = segments.slice(2);
  } else if (segments[1] === "brand") {
    group = "brand";
    roleSegments = segments.slice(2);
  } else if (segments[1] === "accent" || segments[1] === "state") {
    group = segments[1];
    familyRank = 0; // families tie-broken alphabetically via `role` fallback below
    roleSegments = segments.slice(3);
    const family = segments[2] ?? "";
    return {
      surfaceRank,
      groupRank: GROUP_RANK[group] ?? 99,
      familyRank: family.charCodeAt(0) || 0,
      roleRank: roleRankOf(roleSegments.join("-")),
      role: roleSegments.join("-"),
    };
  } else {
    group = "sentiment";
    familyRank = SENTIMENT_FAMILY_RANK[segments[1]] ?? 99;
    roleSegments = segments.slice(2);
  }

  const role = roleSegments.join("-");
  return {
    surfaceRank,
    groupRank: GROUP_RANK[group] ?? 99,
    familyRank,
    roleRank: roleRankOf(role),
    role,
  };
}

function roleRankOf(role: string): number {
  const index = ROLE_RANK.indexOf(role);
  return index === -1 ? 500 : index;
}

/** Grouped, prod-readable ordering for exported semantic variable names. */
export function compareSemanticExportNames(a: string, b: string): number {
  const pa = parseSemanticExportName(a);
  const pb = parseSemanticExportName(b);
  return (
    pa.surfaceRank - pb.surfaceRank ||
    pa.groupRank - pb.groupRank ||
    pa.familyRank - pb.familyRank ||
    pa.roleRank - pb.roleRank ||
    a.localeCompare(b)
  );
}

/**
 * Primitive ordering: families alphabetical, steps numeric within a family
 * (5 before 10 — no zero-padding rename needed), non-numeric steps last.
 */
export function comparePrimitiveExportNames(a: string, b: string): number {
  const splitStep = (name: string): [string, number] => {
    const match = name.match(/^(.*)-(\d+)$/);
    return match ? [match[1], Number(match[2])] : [name, Number.NaN];
  };
  const [famA, stepA] = splitStep(a);
  const [famB, stepB] = splitStep(b);
  if (famA !== famB) {
    // The brand hue (purple) leads the brand collection; accents follow.
    const purpleA = famA === "brand-purple" ? 0 : 1;
    const purpleB = famB === "brand-purple" ? 0 : 1;
    if (purpleA !== purpleB) return purpleA - purpleB;
    return a.localeCompare(b);
  }
  if (Number.isNaN(stepA) || Number.isNaN(stepB)) return a.localeCompare(b);
  return stepA - stepB;
}

/**
 * Renders a CSS rule from pre-sorted lines. Rationale comments come from the
 * sandbox document itself (token `comments`, per theme) — the sandbox is the
 * source of truth for both values and the "why" behind them.
 */
function cssBlock(
  selector: string,
  sortedLines: Array<[string, string, string?]>,
): string {
  const body = sortedLines
    .flatMap(([name, value, comment]) => [
      ...(comment ? [`  /* ${comment} */`] : []),
      `  --${name}: ${value};`,
    ])
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

export function buildPrimitiveColorsCss(system: ColorSystem): string {
  const lines: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const family of system.families ?? []) {
    for (const step of family.steps ?? []) {
      if (isUnsetPrimitiveHex(step.hex)) continue;
      let name = primitiveVarName(family, step);
      while (seen.has(name)) name = `${name}-dup`;
      seen.add(name);
      lines.push([name, step.hex.toLowerCase()]);
    }
  }

  return [
    "/* Primitive Colors */",
    "",
    "/* This file consists of primitive color tokens. These values are fixed, theme-agnostic and defined at the level of the brand guidelines. */",
    "",
    "/* Aim to use semantic color tokens (colors.css) over primitive colors in the majority of cases. Primitive colors may be used for components that are truly theme-agnostic and have no semantic meaning. */",
    "",
    "/* Generated by the CADS Color Sandbox — do not hand-edit; check with the design team first and then re-export from the sandbox. */",
    "",
    "/* stylelint-disable color-hex-length */",
    cssBlock(
      ":root",
      [...lines].sort(([a], [b]) => comparePrimitiveExportNames(a, b)),
    ),
    "",
  ].join("\n");
}

function tokenValue(
  system: ColorSystem,
  token: SemanticToken,
  mode: ThemeKey,
  stepById: Map<string, PrimitiveStep>,
  familyByStepId: Map<string, PrimitiveFamily>,
): string {
  const refId = token.ref?.[mode];
  if (refId) {
    const step = stepById.get(refId);
    const family = familyByStepId.get(refId);
    if (step && family) return `var(--${primitiveVarName(family, step)})`;
  }
  const semanticRefId = token.semanticRef?.[mode];
  if (semanticRefId) {
    const target = system.semantics?.find((item) => item.id === semanticRefId);
    if (target) return `var(--${semanticExportVarName(system, target)})`;
  }
  const fallback = token.fallbackHex?.[mode];
  return fallback ? fallback.toLowerCase() : "transparent";
}

export function buildSemanticColorsCss(system: ColorSystem): string {
  const stepById = new Map<string, PrimitiveStep>();
  const familyByStepId = new Map<string, PrimitiveFamily>();
  for (const family of system.families ?? []) {
    for (const step of family.steps ?? []) {
      stepById.set(step.id, step);
      familyByStepId.set(step.id, family);
    }
  }

  const buildLines = (mode: ThemeKey): Array<[string, string, string?]> => {
    const lines: Array<[string, string, string?]> = [];
    const seen = new Set<string>();
    for (const token of system.semantics ?? []) {
      let name = semanticExportVarName(system, token);
      while (seen.has(name)) name = `${name}-dup`;
      seen.add(name);
      lines.push([
        name,
        tokenValue(system, token, mode, stepById, familyByStepId),
        token.comments?.[mode],
      ]);
    }
    return lines.sort(([a], [b]) => compareSemanticExportNames(a, b));
  };

  return [
    "/* CADS Semantic Colors */",
    "",
    "/* This file consists of Semantic colors, if you need color tokens that support multiple themes, you need to import and use this file. */",
    "",
    "/* Raw values for Semantic colors are defined in Primitive Colors (primitiveColors.css), while semantic color values are specified for every theme. */",
    "",
    "/* Generated by the CADS Color Sandbox — do not hand-edit; check with the design team first and then re-export from the sandbox. */",
    "",
    "/* Light Theme Semantic Colors (light is the default theme, that's why :root rule is included) */",
    cssBlock(":root,\n[data-theme='Light']", buildLines("light")),
    "",
    "/* Dark Theme Semantic Colors */",
    cssBlock("[data-theme='Dark']", buildLines("dark")),
    "",
  ].join("\n");
}
