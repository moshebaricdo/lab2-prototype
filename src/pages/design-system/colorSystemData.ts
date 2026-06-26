/**
 * Color-system model for the design-system sandbox.
 *
 * The sandbox is driven by the real exported design tokens (DTCG / Figma
 * format) rather than the repo's CSS, because the repo is not 1:1 with prod.
 * Primitives are grouped `collection → family → step` (full ramps), and the
 * light/dark semantic themes carry the real primitive references
 * (`com.figma.aliasData.targetVariableName`).
 *
 * The parsed `ColorSystem` is a plain, serialisable *document*: the sandbox
 * edits it in place (tweak hexes, remap semantics, rename / add / remove
 * families and collections) and persists the whole thing per brand.
 */

import primitivesCodeOrg from "./tokens/codeOrgPrimitives.json";
import semanticsLightJson from "./tokens/semanticsLight.json";
import semanticsDarkJson from "./tokens/semanticsDark.json";

export type ThemeKey = "light" | "dark";

export interface PrimitiveStep {
  /** Stable id `${familyId}::${step}`. */
  id: string;
  step: string;
  hex: string;
}

export interface PrimitiveFamily {
  /** Stable id `${collectionId}::${name}` (kept constant across renames). */
  id: string;
  collectionId: string;
  name: string;
  steps: PrimitiveStep[];
}

export interface Collection {
  /** Stable id, kept constant across renames. */
  id: string;
  name: string;
}

export interface SemanticFamily {
  /** Stable id (matches `familyKey` on semantic tokens). */
  id: string;
  name: string;
}

export interface SemanticToken {
  /** Stable id (the original token path, e.g. `background/brand/teal/primary`). */
  id: string;
  surface: string;
  familyKey: string;
  role: string;
  /** Mapped primitive step id, per theme (null when unresolved). */
  ref: Record<ThemeKey, string | null>;
  /** Original exported hex, per theme (fallback when a ref is missing). */
  fallbackHex: Record<ThemeKey, string>;
}

export interface ColorSystem {
  collections: Collection[];
  families: PrimitiveFamily[];
  semanticCollections: Collection[];
  semanticSubGroups: Collection[];
  semanticFamilies: SemanticFamily[];
  /** Optional overrides for which sub-group a semantic family belongs to. */
  semanticFamilySubGroups?: Record<string, string>;
  /** Per primitive collection, ordered family ids. */
  primitiveFamilyOrders?: Record<string, string[]>;
  /** Per semantic sub-group slot (`surface::subGroupId`), ordered family keys. */
  semanticFamilyOrders?: Record<string, string[]>;
  semantics: SemanticToken[];
}

export const SURFACE_ORDER = ["background", "text", "borders"];

export const SEMANTIC_COLLECTION_LABELS: Record<string, string> = {
  background: "Background",
  text: "Text",
  borders: "Borders",
};

export const SEMANTIC_SUBGROUP_ORDER = ["neutral", "brand", "sentiment", "accent"];

export const SEMANTIC_SUBGROUP_LABELS: Record<string, string> = {
  neutral: "Neutral",
  brand: "Brand",
  sentiment: "Sentiment",
  accent: "Accent",
};

const SEMANTIC_FAMILY_SUBGROUP: Record<string, string> = {
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
};

const COLLECTION_ORDER = ["neutral", "brand", "sentiment", "accent"];
const SEMANTIC_FAMILY_ORDER = [
  "neutral",
  "teal",
  "purple",
  "aqua",
  "strawberry",
  "orange",
  "error",
  "warning",
  "success",
  "info",
];

interface DtcgLeaf {
  $type?: string;
  $value?: { hex?: string; alpha?: number };
  $extensions?: {
    "com.figma.aliasData"?: { targetVariableName?: string };
  };
}

type DtcgNode = Record<string, unknown>;

function isLeaf(value: unknown): value is DtcgLeaf {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as DtcgLeaf).$type === "color"
  );
}

function leafHex(leaf: DtcgLeaf): string {
  const value = leaf.$value;
  if (!value?.hex) return "#000000";
  const base = normalizeHex(value.hex) ?? value.hex.toUpperCase();
  const alpha = value.alpha;
  if (alpha == null || alpha >= 0.999) return base;
  return `${base}${hexChannel(alpha * 255)}`;
}

function parseHexChannels(hex: string): { r: number; g: number; b: number; a: number } {
  const normalized = hex.replace("#", "").toUpperCase();
  if (/^[0-9A-F]{8}$/.test(normalized)) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: parseInt(normalized.slice(6, 8), 16) / 255,
    };
  }
  if (/^[0-9A-F]{6}$/.test(normalized)) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

// ── color math (shared) ────────────────────────────────────────────────

export function colorAlpha(hex: string): number {
  return parseHexChannels(hex).a;
}

export function isTransparentColor(hex: string): boolean {
  return colorAlpha(hex) < 0.999;
}

/** CSS color string, preserving alpha when present. */
export function cssColor(hex: string): string {
  const { r, g, b, a } = parseHexChannels(hex);
  if (a >= 0.999) {
    const normalized = normalizeHex(hex);
    return normalized ?? hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b, a } = parseHexChannels(hex);
  const bg = 255;
  const red = a * r + (1 - a) * bg;
  const green = a * g + (1 - a) * bg;
  const blue = a * b + (1 - a) * bg;
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
}

export function readableTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.6
    ? "var(--ds-text-neutral-black-fixed)"
    : "var(--ds-text-neutral-white-fixed)";
}

export const A11Y_BLACK = "#000000";
export const A11Y_WHITE = "#FFFFFF";
export const WCAG_AA_NORMAL_TEXT_RATIO = 4.5;

export interface ContrastCheck {
  label: string;
  ratio: number;
  passesAA: boolean;
}

function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance for opaque sRGB colors. */
export function wcagRelativeLuminance(hex: string): number {
  const { r, g, b } = parseHexChannels(hex);
  const red = srgbChannelToLinear(r);
  const green = srgbChannelToLinear(g);
  const blue = srgbChannelToLinear(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function compositeOntoBackground(fgHex: string, bgHex: string): string {
  const fg = parseHexChannels(fgHex);
  const bg = parseHexChannels(bgHex);
  const mix = (fgChannel: number, bgChannel: number) =>
    Math.round(fg.a * fgChannel + (1 - fg.a) * bgChannel);
  return `#${hexChannel(mix(fg.r, bg.r))}${hexChannel(mix(fg.g, bg.g))}${hexChannel(
    mix(fg.b, bg.b),
  )}`;
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = wcagRelativeLuminance(foreground);
  const bg = wcagRelativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function passesWcagAaNormalText(ratio: number): boolean {
  return ratio >= WCAG_AA_NORMAL_TEXT_RATIO;
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`;
}

function buildContrastCheck(label: string, foreground: string, background: string): ContrastCheck {
  const ratio = contrastRatio(foreground, background);
  return {
    label,
    ratio,
    passesAA: passesWcagAaNormalText(ratio),
  };
}

/** Black and white body text on a surface/background color. */
export function surfaceColorContrastChecks(hex: string): ContrastCheck[] {
  const surface = compositeOntoBackground(hex, A11Y_WHITE);
  return [
    buildContrastCheck("Black text", A11Y_BLACK, surface),
    buildContrastCheck("White text", A11Y_WHITE, surface),
  ];
}

/** Semantic text token contrast against default light/dark page backgrounds. */
export function textTokenContrastChecks(hex: string): ContrastCheck[] {
  return [
    buildContrastCheck("On white", compositeOntoBackground(hex, A11Y_WHITE), A11Y_WHITE),
    buildContrastCheck("On black", compositeOntoBackground(hex, A11Y_BLACK), A11Y_BLACK),
  ];
}

export function normalizeHex(value: string): string | null {
  const next = value.trim().toUpperCase();
  if (/^#[0-9A-F]{8}$/.test(next)) return next;
  if (/^#[0-9A-F]{6}$/.test(next)) return next;
  if (/^#[0-9A-F]{3}$/.test(next)) {
    const [r, g, b] = next.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

function parseStepNumber(step: string): number | null {
  const value = Number(step);
  return Number.isFinite(value) ? value : null;
}

export function comparePrimitiveSteps(a: PrimitiveStep, b: PrimitiveStep): number {
  const aNum = parseStepNumber(a.step);
  const bNum = parseStepNumber(b.step);
  if (aNum != null && bNum != null) return aNum - bNum;
  if (aNum != null) return -1;
  if (bNum != null) return 1;
  return a.step.localeCompare(b.step);
}

export function sortPrimitiveSteps(steps: PrimitiveStep[]): PrimitiveStep[] {
  return [...steps].sort(comparePrimitiveSteps);
}

function hexChannel(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function interpolateHex(fromHex: string, toHex: string, t: number): string {
  const from = normalizeHex(fromHex) ?? "#808080";
  const to = normalizeHex(toHex) ?? "#808080";
  const clamped = Math.max(0, Math.min(1, t));
  const mix = (start: number, end: number) => start + (end - start) * clamped;
  const fr = parseInt(from.slice(1, 3), 16);
  const fg = parseInt(from.slice(3, 5), 16);
  const fb = parseInt(from.slice(5, 7), 16);
  const tr = parseInt(to.slice(1, 3), 16);
  const tg = parseInt(to.slice(3, 5), 16);
  const tb = parseInt(to.slice(5, 7), 16);
  return `#${hexChannel(mix(fr, tr))}${hexChannel(mix(fg, tg))}${hexChannel(mix(fb, tb))}`;
}

function defaultHexForNewStep(family: PrimitiveFamily, stepLabel: string): string {
  const sorted = sortPrimitiveSteps(family.steps);
  if (sorted.length === 0) return "#808080";

  const target = parseStepNumber(stepLabel);
  if (target == null) return sorted[sorted.length - 1].hex;

  const numericSteps = sorted
    .map((step) => ({ step, value: parseStepNumber(step.step) }))
    .filter((entry): entry is { step: PrimitiveStep; value: number } => entry.value != null)
    .sort((a, b) => a.value - b.value);

  if (numericSteps.length === 0) return sorted[sorted.length - 1].hex;
  if (target <= numericSteps[0].value) {
    return numericSteps[0].step.hex;
  }
  if (target >= numericSteps[numericSteps.length - 1].value) {
    return numericSteps[numericSteps.length - 1].step.hex;
  }

  for (let index = 0; index < numericSteps.length - 1; index += 1) {
    const lower = numericSteps[index];
    const upper = numericSteps[index + 1];
    if (target < lower.value || target > upper.value) continue;
    const span = upper.value - lower.value;
    const t = span === 0 ? 0.5 : (target - lower.value) / span;
    return interpolateHex(lower.step.hex, upper.step.hex, t);
  }

  return sorted[sorted.length - 1].hex;
}

// ── parsing ─────────────────────────────────────────────────────────────

interface ParsedPrimitives {
  collections: Collection[];
  families: PrimitiveFamily[];
  /** `collection/family/step` → step id, for resolving semantic aliases. */
  pathToStepId: Map<string, string>;
}

function parsePrimitives(root: DtcgNode): ParsedPrimitives {
  const collections: Collection[] = [];
  const families: PrimitiveFamily[] = [];
  const pathToStepId = new Map<string, string>();

  const collectionNames = Object.keys(root).filter((key) => !key.startsWith("$"));
  collectionNames.sort((a, b) => {
    const ai = COLLECTION_ORDER.indexOf(a);
    const bi = COLLECTION_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const collectionName of collectionNames) {
    const collectionId = collectionName;
    collections.push({ id: collectionId, name: collectionName });

    const collectionNode = root[collectionName] as DtcgNode;
    for (const familyName of Object.keys(collectionNode)) {
      if (familyName.startsWith("$")) continue;
      const familyNode = collectionNode[familyName] as DtcgNode;
      const familyId = `${collectionId}::${familyName}`;
      const steps: PrimitiveStep[] = [];

      for (const stepName of Object.keys(familyNode)) {
        if (stepName.startsWith("$")) continue;
        const leaf = familyNode[stepName];
        if (!isLeaf(leaf)) continue;
        const stepId = `${familyId}::${stepName}`;
        steps.push({ id: stepId, step: stepName, hex: leafHex(leaf) });
        pathToStepId.set(`${collectionName}/${familyName}/${stepName}`, stepId);
      }

      families.push({ id: familyId, collectionId, name: familyName, steps });
    }
  }

  return { collections, families, pathToStepId };
}

function reorderIdList(list: string[], activeId: string, overId: string): string[] {
  if (activeId === overId) return list;
  const withoutActive = list.filter((id) => id !== activeId);
  const overIndex = withoutActive.indexOf(overId);
  if (overIndex === -1) return [...withoutActive, activeId];
  withoutActive.splice(overIndex, 0, activeId);
  return withoutActive;
}

function sortKeysByFallback(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ai = SEMANTIC_FAMILY_ORDER.indexOf(a);
    const bi = SEMANTIC_FAMILY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function semanticFamilyKeysInSubGroup(
  system: ColorSystem,
  surface: string,
  subGroupId: string,
): string[] {
  return [
    ...new Set(
      system.semantics
        .filter((token) => token.surface === surface)
        .map((token) => token.familyKey),
    ),
  ].filter((familyKey) => semanticSubGroupForFamily(system, familyKey) === subGroupId);
}

function ensurePrimitiveCollectionOrder(
  system: ColorSystem,
  collectionId: string,
): string[] {
  const familyIds = system.families
    .filter((family) => family.collectionId === collectionId)
    .map((family) => family.id);
  const existing = system.primitiveFamilyOrders?.[collectionId] ?? [];
  return [
    ...existing.filter((id) => familyIds.includes(id)),
    ...familyIds.filter((id) => !existing.includes(id)),
  ];
}

function ensureSemanticSubGroupOrder(
  system: ColorSystem,
  surface: string,
  subGroupId: string,
): string[] {
  const slotId = semanticSubGroupSlotId(surface, subGroupId);
  const keys = semanticFamilyKeysInSubGroup(system, surface, subGroupId);
  const existing = system.semanticFamilyOrders?.[slotId] ?? [];
  const ordered = [
    ...existing.filter((key) => keys.includes(key)),
    ...sortKeysByFallback(keys.filter((key) => !existing.includes(key))),
  ];
  return ordered;
}

function buildDefaultPrimitiveFamilyOrders(system: ColorSystem): Record<string, string[]> {
  const orders: Record<string, string[]> = {};
  for (const collection of system.collections) {
    orders[collection.id] = system.families
      .filter((family) => family.collectionId === collection.id)
      .map((family) => family.id);
  }
  return orders;
}

function buildDefaultSemanticFamilyOrders(system: ColorSystem): Record<string, string[]> {
  const orders: Record<string, string[]> = {};
  for (const surface of SURFACE_ORDER) {
    for (const subGroupId of SEMANTIC_SUBGROUP_ORDER) {
      const keys = sortKeysByFallback(semanticFamilyKeysInSubGroup(system, surface, subGroupId));
      if (keys.length > 0) {
        orders[semanticSubGroupSlotId(surface, subGroupId)] = keys;
      }
    }
  }
  return orders;
}

function defaultSemanticFamilySubGroups(familyKeys: string[]): Record<string, string> {
  return Object.fromEntries(
    familyKeys.map((familyKey) => [
      familyKey,
      SEMANTIC_FAMILY_SUBGROUP[familyKey] ?? "accent",
    ]),
  );
}

function buildSemanticSubGroups(): Collection[] {
  return SEMANTIC_SUBGROUP_ORDER.map((id) => ({
    id,
    name: SEMANTIC_SUBGROUP_LABELS[id] ?? titleCase(id),
  }));
}

function buildSemanticStructure(semantics: SemanticToken[]): {
  semanticCollections: Collection[];
  semanticSubGroups: Collection[];
  semanticFamilies: SemanticFamily[];
} {
  const familyKeys = [...new Set(semantics.map((token) => token.familyKey))];
  familyKeys.sort((a, b) => {
    const ai = SEMANTIC_FAMILY_ORDER.indexOf(a);
    const bi = SEMANTIC_FAMILY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const semanticCollections = SURFACE_ORDER.map((surface) => ({
    id: surface,
    name: SEMANTIC_COLLECTION_LABELS[surface] ?? titleCase(surface),
  }));

  const semanticFamilies = familyKeys.map((key) => ({
    id: key,
    name: titleCase(key),
  }));

  return {
    semanticCollections,
    semanticSubGroups: buildSemanticSubGroups(),
    semanticFamilies,
  };
}

function isSurfaceBasedSemanticCollections(collections: Collection[]): boolean {
  return (
    collections.length === SURFACE_ORDER.length &&
    SURFACE_ORDER.every((surface) =>
      collections.some((collection) => collection.id === surface),
    )
  );
}

/** Backfill / migrate semantic collections and family display names. */
export function ensureSemanticStructure(system: ColorSystem): ColorSystem {
  const next = clone(system);
  const nameByKey = new Map(
    (system.semanticFamilies ?? []).map((family) => [family.id, family.name]),
  );
  const subGroupNames = new Map(
    (system.semanticSubGroups ?? []).map((group) => [group.id, group.name]),
  );

  if (!isSurfaceBasedSemanticCollections(next.semanticCollections ?? [])) {
    const built = buildSemanticStructure(next.semantics);
    next.semanticCollections = built.semanticCollections.map((collection) => {
      const existing = system.semanticCollections?.find((item) => item.id === collection.id);
      return {
        id: collection.id,
        name: existing?.name ?? collection.name,
      };
    });
    next.semanticFamilies = built.semanticFamilies.map((family) => ({
      id: family.id,
      name: nameByKey.get(family.id) ?? family.name,
    }));
  } else {
    next.semanticFamilies = (next.semanticFamilies ?? []).map(({ id, name }) => ({ id, name }));
  }

  next.semanticSubGroups = buildSemanticSubGroups().map((group) => ({
    id: group.id,
    name: subGroupNames.get(group.id) ?? group.name,
  }));

  const familyKeys = semanticFamilyKeys(next);
  const defaults = defaultSemanticFamilySubGroups(familyKeys);
  next.semanticFamilySubGroups = {
    ...defaults,
    ...(system.semanticFamilySubGroups ?? {}),
  };

  next.primitiveFamilyOrders = {
    ...buildDefaultPrimitiveFamilyOrders(next),
    ...(system.primitiveFamilyOrders ?? {}),
  };
  for (const collection of next.collections) {
    next.primitiveFamilyOrders[collection.id] = ensurePrimitiveCollectionOrder(
      next,
      collection.id,
    );
  }

  next.semanticFamilyOrders = {
    ...buildDefaultSemanticFamilyOrders(next),
    ...(system.semanticFamilyOrders ?? {}),
  };
  for (const surface of SURFACE_ORDER) {
    for (const subGroupId of SEMANTIC_SUBGROUP_ORDER) {
      const slotId = semanticSubGroupSlotId(surface, subGroupId);
      if (semanticFamilyKeysInSubGroup(next, surface, subGroupId).length > 0) {
        next.semanticFamilyOrders[slotId] = ensureSemanticSubGroupOrder(
          next,
          surface,
          subGroupId,
        );
      }
    }
  }

  return next;
}

interface ParsedSemanticLeaf {
  path: string;
  surface: string;
  familyKey: string;
  role: string;
  hex: string;
  refPath: string | null;
}

function parseSemanticLeaves(root: DtcgNode): ParsedSemanticLeaf[] {
  const leaves: ParsedSemanticLeaf[] = [];

  function walk(node: DtcgNode, segments: string[]) {
    for (const key of Object.keys(node)) {
      if (key.startsWith("$")) continue;
      const value = node[key];
      const nextSegments = [...segments, key];
      if (isLeaf(value)) {
        const surface = nextSegments[0];
        const rest = nextSegments.slice(1);
        const familyKey =
          rest[0] === "brand" || rest[0] === "accent" ? rest[1] : rest[0];
        const roleStart =
          rest[0] === "brand" || rest[0] === "accent" ? 2 : 1;
        const role = rest.slice(roleStart).join("-") || "default";
        const alias =
          value.$extensions?.["com.figma.aliasData"]?.targetVariableName ?? null;
        leaves.push({
          path: nextSegments.join("/"),
          surface,
          familyKey,
          role,
          hex: leafHex(value),
          refPath: alias,
        });
      } else if (value && typeof value === "object") {
        walk(value as DtcgNode, nextSegments);
      }
    }
  }

  walk(root, []);
  return leaves;
}

export function buildColorSystem(): ColorSystem {
  const { collections, families, pathToStepId } = parsePrimitives(
    primitivesCodeOrg as DtcgNode,
  );

  const lightLeaves = parseSemanticLeaves(semanticsLightJson as DtcgNode);
  const darkLeaves = parseSemanticLeaves(semanticsDarkJson as DtcgNode);
  const darkByPath = new Map(darkLeaves.map((leaf) => [leaf.path, leaf]));

  const semantics: SemanticToken[] = lightLeaves.map((light) => {
    const dark = darkByPath.get(light.path) ?? light;
    const resolve = (refPath: string | null) =>
      refPath ? pathToStepId.get(refPath) ?? null : null;
    return {
      id: light.path,
      surface: light.surface,
      familyKey: light.familyKey,
      role: light.role,
      ref: { light: resolve(light.refPath), dark: resolve(dark.refPath) },
      fallbackHex: { light: light.hex, dark: dark.hex },
    };
  });

  const { semanticCollections, semanticSubGroups, semanticFamilies } =
    buildSemanticStructure(semantics);

  const draft: ColorSystem = {
    collections,
    families,
    semanticCollections,
    semanticSubGroups,
    semanticFamilies,
    semanticFamilySubGroups: defaultSemanticFamilySubGroups(
      semanticFamilies.map((family) => family.id),
    ),
    primitiveFamilyOrders: Object.fromEntries(
      collections.map((collection) => [
        collection.id,
        families
          .filter((family) => family.collectionId === collection.id)
          .map((family) => family.id),
      ]),
    ),
    semantics,
  };

  return {
    ...draft,
    semanticFamilyOrders: buildDefaultSemanticFamilyOrders(draft),
  };
}

// ── derived lookups & display helpers ────────────────────────────────────

export function stepIndex(system: ColorSystem): Map<string, PrimitiveStep> {
  const map = new Map<string, PrimitiveStep>();
  for (const family of system.families) {
    for (const step of family.steps) map.set(step.id, step);
  }
  return map;
}

export function familyOfStep(system: ColorSystem): Map<string, PrimitiveFamily> {
  const map = new Map<string, PrimitiveFamily>();
  for (const family of system.families) {
    for (const step of family.steps) map.set(step.id, family);
  }
  return map;
}

export function familiesByCollection(
  system: ColorSystem,
  collectionId: string,
): PrimitiveFamily[] {
  const order = ensurePrimitiveCollectionOrder(system, collectionId);
  const families = system.families.filter((family) => family.collectionId === collectionId);
  const index = new Map(order.map((id, position) => [id, position]));
  return [...families].sort(
    (a, b) => (index.get(a.id) ?? 9999) - (index.get(b.id) ?? 9999),
  );
}

export function semanticFamilyKeysForSurface(
  system: ColorSystem,
  surface: string,
): string[] {
  const keys = [
    ...new Set(
      system.semantics
        .filter((token) => token.surface === surface)
        .map((token) => token.familyKey),
    ),
  ];
  keys.sort((a, b) => {
    const ai = SEMANTIC_FAMILY_ORDER.indexOf(a);
    const bi = SEMANTIC_FAMILY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return keys;
}

export function semanticSubGroupForFamily(
  system: ColorSystem,
  familyKey: string,
): string {
  return (
    system.semanticFamilySubGroups?.[familyKey] ??
    SEMANTIC_FAMILY_SUBGROUP[familyKey] ??
    "accent"
  );
}

export function semanticFamilyKeysForSubGroup(
  system: ColorSystem,
  surface: string,
  subGroupId: string,
): string[] {
  return ensureSemanticSubGroupOrder(system, surface, subGroupId);
}

export function semanticSubGroupsForSurface(
  system: ColorSystem,
  surface: string,
): string[] {
  return SEMANTIC_SUBGROUP_ORDER.filter(
    (subGroupId) =>
      semanticFamilyKeysForSubGroup(system, surface, subGroupId).length > 0,
  );
}

export function semanticSubGroupSlotId(surface: string, subGroupId: string): string {
  return `${surface}::${subGroupId}`;
}

export function parseSemanticSubGroupSlotId(
  slotId: string,
): { surface: string; subGroupId: string } {
  const separator = slotId.indexOf("::");
  if (separator === -1) return { surface: "background", subGroupId: slotId };
  return {
    surface: slotId.slice(0, separator),
    subGroupId: slotId.slice(separator + 2),
  };
}

export function semanticFamilySlotId(surface: string, familyKey: string): string {
  return `${surface}::${familyKey}`;
}

export function parseSemanticFamilySlotId(
  slotId: string,
): { surface: string; familyKey: string } {
  const separator = slotId.indexOf("::");
  if (separator === -1) return { surface: "background", familyKey: slotId };
  return {
    surface: slotId.slice(0, separator),
    familyKey: slotId.slice(separator + 2),
  };
}

export function semanticFamilyLabel(
  system: ColorSystem,
  familyKey: string,
): string {
  return (
    system.semanticFamilies.find((family) => family.id === familyKey)?.name ??
    titleCase(familyKey)
  );
}

export function semanticFamilyKeys(system: ColorSystem): string[] {
  return system.semanticFamilies
    .map((family) => family.id)
    .sort((a, b) => {
      const ai = SEMANTIC_FAMILY_ORDER.indexOf(a);
      const bi = SEMANTIC_FAMILY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

export function familyMidHex(family: PrimitiveFamily): string {
  if (family.steps.length === 0) return "#69788A";
  const sorted = [...family.steps].sort(
    (a, b) => relativeLuminance(b.hex) - relativeLuminance(a.hex),
  );
  return sorted[Math.floor(sorted.length / 2)].hex;
}

export function titleCase(value: string): string {
  return value
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Hex a semantic token resolves to in a given theme (ref → step, else fallback). */
export function semanticHex(
  system: ColorSystem,
  token: SemanticToken,
  mode: ThemeKey,
  steps: Map<string, PrimitiveStep>,
): string {
  const refId = token.ref[mode];
  if (refId) {
    const step = steps.get(refId);
    if (step) return step.hex;
  }
  return token.fallbackHex[mode];
}

/** Slug used in DTCG variable paths for a semantic family. */
export function semanticFamilyPathSegment(
  system: ColorSystem,
  familyKey: string,
): string {
  const family = system.semanticFamilies.find((item) => item.id === familyKey);
  return slugify(family?.name ?? familyKey);
}

/** DTCG-style variable path for a semantic token from current structure. */
export function semanticTokenVariableName(
  system: ColorSystem,
  token: Pick<SemanticToken, "surface" | "familyKey" | "role">,
): string {
  const subGroupId = semanticSubGroupForFamily(system, token.familyKey);
  const familySegment = semanticFamilyPathSegment(system, token.familyKey);
  if (subGroupId === "brand" || subGroupId === "accent") {
    return `${token.surface}/${subGroupId}/${familySegment}/${token.role}`;
  }
  return `${token.surface}/${familySegment}/${token.role}`;
}

export function findSemanticToken(
  system: ColorSystem,
  surface: string,
  familyKey: string,
  role: string,
): SemanticToken | undefined {
  return system.semantics.find(
    (token) =>
      token.surface === surface &&
      token.familyKey === familyKey &&
      token.role === role,
  );
}

/** Resolved hex for `background/neutral/primary` or `background/neutral/secondary`. */
export function neutralBackgroundHex(
  system: ColorSystem,
  role: "primary" | "secondary",
  mode: ThemeKey,
  steps: Map<string, PrimitiveStep>,
): string {
  const token = findSemanticToken(system, "background", "neutral", role);
  if (!token) {
    return role === "primary" ? "#FFFFFF" : "#F0F2F5";
  }
  return semanticHex(system, token, mode, steps);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "family"
  );
}

function rebuildSemanticTokenIds(system: ColorSystem): ColorSystem {
  const next = clone(system);
  for (const token of next.semantics) {
    token.id = semanticTokenVariableName(next, token);
  }
  return next;
}

// ── editing operations (pure; return a new system) ───────────────────────

function clone(system: ColorSystem): ColorSystem {
  return JSON.parse(JSON.stringify(system)) as ColorSystem;
}

export function updatePrimitiveHex(
  system: ColorSystem,
  stepId: string,
  hex: string,
): ColorSystem {
  const next = clone(system);
  for (const family of next.families) {
    const step = family.steps.find((item) => item.id === stepId);
    if (step) {
      step.hex = hex;
      break;
    }
  }
  return next;
}

export function renamePrimitiveStep(
  system: ColorSystem,
  stepId: string,
  nextStepLabel: string,
): { system: ColorSystem; stepId: string | null } {
  const stepLabel = nextStepLabel.trim();
  if (!stepLabel) return { system, stepId: null };

  const next = clone(system);
  let targetFamily: PrimitiveFamily | undefined;
  let targetStep: PrimitiveStep | undefined;

  for (const family of next.families) {
    const step = family.steps.find((item) => item.id === stepId);
    if (step) {
      targetFamily = family;
      targetStep = step;
      break;
    }
  }

  if (!targetFamily || !targetStep) return { system, stepId: null };
  if (targetStep.step === stepLabel) return { system, stepId: targetStep.id };

  if (
    targetFamily.steps.some(
      (item) => item.id !== stepId && item.step === stepLabel,
    )
  ) {
    return { system, stepId: null };
  }

  const oldStepId = targetStep.id;
  const newStepId = `${targetFamily.id}::${stepLabel}`;
  targetStep.step = stepLabel;
  targetStep.id = newStepId;

  for (const token of next.semantics) {
    if (token.ref.light === oldStepId) token.ref.light = newStepId;
    if (token.ref.dark === oldStepId) token.ref.dark = newStepId;
  }

  targetFamily.steps = sortPrimitiveSteps(targetFamily.steps);
  return { system: next, stepId: newStepId };
}

export function remapSemantic(
  system: ColorSystem,
  semanticId: string,
  mode: ThemeKey,
  stepId: string,
): ColorSystem {
  const next = clone(system);
  const token = next.semantics.find((item) => item.id === semanticId);
  if (token) token.ref[mode] = stepId;
  return next;
}

export function renameCollection(
  system: ColorSystem,
  collectionId: string,
  name: string,
): ColorSystem {
  const next = clone(system);
  const collection = next.collections.find((item) => item.id === collectionId);
  if (collection) collection.name = name;
  return next;
}

export function renameFamily(
  system: ColorSystem,
  familyId: string,
  name: string,
): ColorSystem {
  const next = clone(system);
  const family = next.families.find((item) => item.id === familyId);
  if (family) family.name = name;
  return next;
}

export function renameSemanticFamily(
  system: ColorSystem,
  familyKey: string,
  name: string,
): ColorSystem {
  const next = clone(system);
  const family = next.semanticFamilies.find((item) => item.id === familyKey);
  if (!family) return system;
  family.name = name;
  return rebuildSemanticTokenIds(next);
}

export function renameSemanticCollection(
  system: ColorSystem,
  collectionId: string,
  name: string,
): ColorSystem {
  const next = clone(system);
  const collection = next.semanticCollections.find((item) => item.id === collectionId);
  if (collection) collection.name = name;
  return next;
}

export function renameSemanticSubGroup(
  system: ColorSystem,
  subGroupId: string,
  name: string,
): ColorSystem {
  const next = clone(system);
  const subGroup = next.semanticSubGroups.find((item) => item.id === subGroupId);
  if (subGroup) subGroup.name = name;
  return next;
}

function uniqueId(base: string, taken: Set<string>): string {
  let id = base;
  let suffix = 2;
  while (taken.has(id)) id = `${base}-${suffix++}`;
  return id;
}

export function addCollection(system: ColorSystem, name: string): {
  system: ColorSystem;
  collectionId: string;
} {
  const next = clone(system);
  const taken = new Set(next.collections.map((item) => item.id));
  const id = uniqueId(name.toLowerCase().replace(/\s+/g, "-") || "collection", taken);
  next.collections.push({ id, name });
  return { system: next, collectionId: id };
}

export function addSemanticCollection(system: ColorSystem, name: string): {
  system: ColorSystem;
  collectionId: string;
} {
  const next = clone(system);
  const taken = new Set(next.semanticCollections.map((item) => item.id));
  const id = uniqueId(name.toLowerCase().replace(/\s+/g, "-") || "collection", taken);
  next.semanticCollections.push({ id, name });
  return { system: next, collectionId: id };
}

const DEFAULT_RAMP = ["5", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];

export function addFamily(
  system: ColorSystem,
  collectionId: string,
  name: string,
  seedFromFamilyId?: string,
): { system: ColorSystem; familyId: string } {
  const next = clone(system);
  const taken = new Set(next.families.map((item) => item.id));
  const baseId = `${collectionId}::${name.toLowerCase().replace(/\s+/g, "-") || "family"}`;
  const familyId = uniqueId(baseId, taken);

  const seed = seedFromFamilyId
    ? next.families.find((item) => item.id === seedFromFamilyId)
    : undefined;
  const stepSpecs = seed
    ? seed.steps.map((step) => ({ step: step.step, hex: step.hex }))
    : DEFAULT_RAMP.map((step, index) => {
        const lightness = Math.round(245 - (index * 230) / (DEFAULT_RAMP.length - 1));
        const channel = lightness.toString(16).padStart(2, "0").toUpperCase();
        return { step, hex: `#${channel}${channel}${channel}` };
      });

  const steps: PrimitiveStep[] = stepSpecs.map((spec) => ({
    id: `${familyId}::${spec.step}`,
    step: spec.step,
    hex: spec.hex,
  }));

  next.families.push({ id: familyId, collectionId, name, steps });
  return { system: next, familyId };
}

export function duplicatePrimitiveFamily(
  system: ColorSystem,
  familyId: string,
  name?: string,
): { system: ColorSystem; familyId: string | null } {
  const source = system.families.find((item) => item.id === familyId);
  if (!source) return { system, familyId: null };

  const next = clone(system);
  const taken = new Set(next.families.map((item) => item.id));
  const copyName = name?.trim() || `${source.name} copy`;
  const baseId = `${source.collectionId}::${normalizeSemanticRole(copyName)}`;
  const newFamilyId = uniqueId(baseId, taken);

  next.families.push({
    id: newFamilyId,
    collectionId: source.collectionId,
    name: copyName,
    steps: source.steps.map((step) => ({
      id: `${newFamilyId}::${step.step}`,
      step: step.step,
      hex: step.hex,
    })),
  });

  next.primitiveFamilyOrders = { ...(next.primitiveFamilyOrders ?? {}) };
  const order = ensurePrimitiveCollectionOrder(next, source.collectionId);
  const sourceIndex = order.indexOf(familyId);
  const nextOrder = order.filter((id) => id !== newFamilyId);
  if (sourceIndex === -1) {
    nextOrder.push(newFamilyId);
  } else {
    nextOrder.splice(sourceIndex + 1, 0, newFamilyId);
  }
  next.primitiveFamilyOrders[source.collectionId] = nextOrder;

  return { system: next, familyId: newFamilyId };
}

export function addSemanticFamily(
  system: ColorSystem,
  name: string,
  subGroupId: string,
  seedFamilyKey?: string,
): { system: ColorSystem; familyKey: string } {
  if (!SEMANTIC_SUBGROUP_ORDER.includes(subGroupId)) {
    return { system, familyKey: "" };
  }

  const next = clone(system);
  const taken = new Set(next.semanticFamilies.map((item) => item.id));
  const familyKey = uniqueId(slugify(name), taken);
  next.semanticFamilies.push({ id: familyKey, name });

  next.semanticFamilySubGroups = {
    ...(next.semanticFamilySubGroups ??
      defaultSemanticFamilySubGroups(semanticFamilyKeys(next))),
    [familyKey]: subGroupId,
  };

  const seedRoles = seedFamilyKey
    ? [
        ...new Set(
          next.semantics
            .filter((token) => token.familyKey === seedFamilyKey)
            .map((token) => token.role),
        ),
      ]
    : [];
  if (seedRoles.length > 0) {
    const defaultHex = "#69788A";
    for (const surface of SURFACE_ORDER) {
      for (const role of seedRoles) {
        next.semantics.push({
          id: "",
          surface,
          familyKey,
          role,
          ref: { light: null, dark: null },
          fallbackHex: { light: defaultHex, dark: defaultHex },
        });
      }
    }
  }

  next.semanticFamilyOrders = { ...(next.semanticFamilyOrders ?? {}) };
  for (const surface of SURFACE_ORDER) {
    const slotId = semanticSubGroupSlotId(surface, subGroupId);
    next.semanticFamilyOrders[slotId] = [
      ...ensureSemanticSubGroupOrder(next, surface, subGroupId).filter(
        (key) => key !== familyKey,
      ),
      familyKey,
    ];
  }

  return { system: rebuildSemanticTokenIds(next), familyKey };
}

export function duplicateSemanticFamily(
  system: ColorSystem,
  familyKey: string,
  name?: string,
): { system: ColorSystem; familyKey: string | null } {
  const sourceFamily = system.semanticFamilies.find((item) => item.id === familyKey);
  if (!sourceFamily) return { system, familyKey: null };

  const next = clone(system);
  const taken = new Set(next.semanticFamilies.map((item) => item.id));
  const copyName = name?.trim() || `${sourceFamily.name} copy`;
  const newFamilyKey = uniqueId(normalizeSemanticRole(copyName), taken);
  const subGroupId = semanticSubGroupForFamily(system, familyKey);

  next.semanticFamilies.push({ id: newFamilyKey, name: copyName });
  next.semanticFamilySubGroups = {
    ...(next.semanticFamilySubGroups ??
      defaultSemanticFamilySubGroups(semanticFamilyKeys(next))),
    [newFamilyKey]: subGroupId,
  };

  for (const token of system.semantics.filter((item) => item.familyKey === familyKey)) {
    next.semantics.push({
      id: "",
      surface: token.surface,
      familyKey: newFamilyKey,
      role: token.role,
      ref: { light: token.ref.light, dark: token.ref.dark },
      fallbackHex: { light: token.fallbackHex.light, dark: token.fallbackHex.dark },
    });
  }

  next.semanticFamilyOrders = { ...(next.semanticFamilyOrders ?? {}) };
  for (const surface of SURFACE_ORDER) {
    const slotId = semanticSubGroupSlotId(surface, subGroupId);
    const order = ensureSemanticSubGroupOrder(next, surface, subGroupId);
    const sourceIndex = order.indexOf(familyKey);
    const nextOrder = order.filter((key) => key !== newFamilyKey);
    if (sourceIndex === -1) {
      nextOrder.push(newFamilyKey);
    } else {
      nextOrder.splice(sourceIndex + 1, 0, newFamilyKey);
    }
    next.semanticFamilyOrders[slotId] = nextOrder;
  }

  return { system: rebuildSemanticTokenIds(next), familyKey: newFamilyKey };
}

export function normalizeSemanticRole(name: string): string {
  return slugify(name);
}

export function addSemanticToken(
  system: ColorSystem,
  surface: string,
  familyKey: string,
  roleName: string,
): { system: ColorSystem; role: string | null } {
  const role = normalizeSemanticRole(roleName);
  if (!role) return { system, role: null };
  if (!system.semanticFamilies.some((item) => item.id === familyKey)) {
    return { system, role: null };
  }
  if (findSemanticToken(system, surface, familyKey, role)) {
    return { system, role: null };
  }

  const next = clone(system);
  const defaultHex = "#69788A";
  next.semantics.push({
    id: "",
    surface,
    familyKey,
    role,
    ref: { light: null, dark: null },
    fallbackHex: { light: defaultHex, dark: defaultHex },
  });
  return { system: rebuildSemanticTokenIds(next), role };
}

export function renameSemanticTokenRole(
  system: ColorSystem,
  surface: string,
  familyKey: string,
  currentRole: string,
  nextRoleName: string,
): { system: ColorSystem; role: string | null } {
  const nextRole = normalizeSemanticRole(nextRoleName);
  if (!nextRole) return { system, role: null };
  if (nextRole === currentRole) return { system, role: currentRole };
  if (findSemanticToken(system, surface, familyKey, nextRole)) {
    return { system, role: null };
  }

  const next = clone(system);
  const token = findSemanticToken(next, surface, familyKey, currentRole);
  if (!token) return { system, role: null };
  token.role = nextRole;
  return { system: rebuildSemanticTokenIds(next), role: nextRole };
}

export function deleteSemanticToken(
  system: ColorSystem,
  surface: string,
  familyKey: string,
  role: string,
): ColorSystem {
  const next = clone(system);
  next.semantics = next.semantics.filter(
    (token) =>
      !(
        token.surface === surface &&
        token.familyKey === familyKey &&
        token.role === role
      ),
  );
  return next;
}

export function addStep(
  system: ColorSystem,
  familyId: string,
  step: string,
  hex?: string,
): { system: ColorSystem; stepId: string | null } {
  const stepLabel = step.trim();
  if (!stepLabel) return { system, stepId: null };

  const next = clone(system);
  const family = next.families.find((item) => item.id === familyId);
  if (!family || family.steps.some((item) => item.step === stepLabel)) {
    return { system, stepId: null };
  }

  const stepId = `${familyId}::${stepLabel}`;
  const nextStep: PrimitiveStep = {
    id: stepId,
    step: stepLabel,
    hex: hex ?? defaultHexForNewStep(family, stepLabel),
  };
  family.steps = sortPrimitiveSteps([...family.steps, nextStep]);
  return { system: next, stepId };
}

function unmapStep(system: ColorSystem, stepIds: Set<string>) {
  for (const token of system.semantics) {
    if (token.ref.light && stepIds.has(token.ref.light)) token.ref.light = null;
    if (token.ref.dark && stepIds.has(token.ref.dark)) token.ref.dark = null;
  }
}

export function deleteStep(system: ColorSystem, stepId: string): ColorSystem {
  const next = clone(system);
  for (const family of next.families) {
    const index = family.steps.findIndex((item) => item.id === stepId);
    if (index !== -1) {
      family.steps.splice(index, 1);
      break;
    }
  }
  unmapStep(next, new Set([stepId]));
  return next;
}

export function deleteFamily(system: ColorSystem, familyId: string): ColorSystem {
  const next = clone(system);
  const family = next.families.find((item) => item.id === familyId);
  if (!family) return next;
  const stepIds = new Set(family.steps.map((step) => step.id));
  next.families = next.families.filter((item) => item.id !== familyId);
  unmapStep(next, stepIds);
  return next;
}

export function deleteCollection(
  system: ColorSystem,
  collectionId: string,
): ColorSystem {
  let next = clone(system);
  const familyIds = next.families
    .filter((family) => family.collectionId === collectionId)
    .map((family) => family.id);
  for (const familyId of familyIds) next = deleteFamily(next, familyId);
  next.collections = next.collections.filter((item) => item.id !== collectionId);
  return next;
}

export function deleteSemanticCollection(
  system: ColorSystem,
  surface: string,
): ColorSystem {
  const next = clone(system);
  const orphanedKeys = [
    ...new Set(
      next.semantics
        .filter((token) => token.surface === surface)
        .map((token) => token.familyKey),
    ),
  ];
  next.semantics = next.semantics.filter((token) => token.surface !== surface);
  for (const familyKey of orphanedKeys) {
    if (!next.semantics.some((token) => token.familyKey === familyKey)) {
      next.semanticFamilies = next.semanticFamilies.filter(
        (family) => family.id !== familyKey,
      );
    }
  }
  if (!SURFACE_ORDER.includes(surface)) {
    next.semanticCollections = next.semanticCollections.filter(
      (item) => item.id !== surface,
    );
  }
  return next;
}

export function deleteSemanticFamily(
  system: ColorSystem,
  familyKey: string,
): ColorSystem {
  const next = clone(system);
  next.semanticFamilies = next.semanticFamilies.filter((item) => item.id !== familyKey);
  next.semantics = next.semantics.filter((token) => token.familyKey !== familyKey);
  if (next.semanticFamilySubGroups) {
    const { [familyKey]: _removed, ...rest } = next.semanticFamilySubGroups;
    next.semanticFamilySubGroups = rest;
  }

  if (next.semanticFamilyOrders) {
    const orders: Record<string, string[]> = {};
    for (const [slotId, order] of Object.entries(next.semanticFamilyOrders)) {
      const filtered = order.filter((key) => key !== familyKey);
      if (filtered.length > 0) orders[slotId] = filtered;
    }
    next.semanticFamilyOrders = orders;
  }

  return next;
}

export function movePrimitiveFamily(
  system: ColorSystem,
  familyId: string,
  targetCollectionId: string,
): ColorSystem {
  const next = clone(system);
  const family = next.families.find((item) => item.id === familyId);
  if (!family || family.collectionId === targetCollectionId) return system;

  const oldFamilyId = family.id;
  const sourceCollectionId = family.collectionId;
  const suffix = oldFamilyId.includes("::")
    ? oldFamilyId.slice(oldFamilyId.indexOf("::") + 2)
    : family.name;
  const taken = new Set(
    next.families.filter((item) => item.id !== oldFamilyId).map((item) => item.id),
  );
  const nextFamilyId = uniqueId(`${targetCollectionId}::${suffix}`, taken);
  const stepIdMap = new Map<string, string>();

  for (const step of family.steps) {
    const nextStepId = `${nextFamilyId}::${step.step}`;
    stepIdMap.set(step.id, nextStepId);
    step.id = nextStepId;
  }

  family.id = nextFamilyId;
  family.collectionId = targetCollectionId;

  for (const token of next.semantics) {
    if (token.ref.light && stepIdMap.has(token.ref.light)) {
      token.ref.light = stepIdMap.get(token.ref.light)!;
    }
    if (token.ref.dark && stepIdMap.has(token.ref.dark)) {
      token.ref.dark = stepIdMap.get(token.ref.dark)!;
    }
  }

  next.primitiveFamilyOrders = { ...(next.primitiveFamilyOrders ?? {}) };
  next.primitiveFamilyOrders[sourceCollectionId] = ensurePrimitiveCollectionOrder(
    next,
    sourceCollectionId,
  ).filter((id) => id !== oldFamilyId);
  next.primitiveFamilyOrders[targetCollectionId] = [
    ...ensurePrimitiveCollectionOrder(next, targetCollectionId).filter(
      (id) => id !== nextFamilyId,
    ),
    nextFamilyId,
  ];

  return next;
}

export function moveSemanticFamilyToSubGroup(
  system: ColorSystem,
  familyKey: string,
  targetSubGroupId: string,
): ColorSystem {
  if (!SEMANTIC_SUBGROUP_ORDER.includes(targetSubGroupId)) return system;
  const current = semanticSubGroupForFamily(system, familyKey);
  if (current === targetSubGroupId) return system;

  const next = clone(system);
  next.semanticFamilySubGroups = {
    ...(next.semanticFamilySubGroups ??
      defaultSemanticFamilySubGroups(semanticFamilyKeys(next))),
    [familyKey]: targetSubGroupId,
  };

  next.semanticFamilyOrders = { ...(next.semanticFamilyOrders ?? {}) };
  for (const surface of SURFACE_ORDER) {
    if (!semanticFamilyKeysForSurface(next, surface).includes(familyKey)) continue;
    const oldSlot = semanticSubGroupSlotId(surface, current);
    const newSlot = semanticSubGroupSlotId(surface, targetSubGroupId);
    next.semanticFamilyOrders[oldSlot] = ensureSemanticSubGroupOrder(
      next,
      surface,
      current,
    ).filter((key) => key !== familyKey);
    next.semanticFamilyOrders[newSlot] = [
      ...ensureSemanticSubGroupOrder(next, surface, targetSubGroupId).filter(
        (key) => key !== familyKey,
      ),
      familyKey,
    ];
  }

  return rebuildSemanticTokenIds(next);
}

export function moveSemanticFamilyToSurface(
  system: ColorSystem,
  familyKey: string,
  fromSurface: string,
  toSurface: string,
): ColorSystem {
  if (fromSurface === toSurface || !SURFACE_ORDER.includes(toSurface)) return system;

  const next = clone(system);
  for (const token of next.semantics) {
    if (token.surface !== fromSurface || token.familyKey !== familyKey) continue;
    token.surface = toSurface;
  }
  return rebuildSemanticTokenIds(next);
}

export function reorderPrimitiveFamilyInCollection(
  system: ColorSystem,
  collectionId: string,
  familyId: string,
  targetFamilyId: string,
): ColorSystem {
  if (familyId === targetFamilyId) return system;
  const order = ensurePrimitiveCollectionOrder(system, collectionId);
  if (!order.includes(familyId) || !order.includes(targetFamilyId)) return system;

  const next = clone(system);
  next.primitiveFamilyOrders = {
    ...(next.primitiveFamilyOrders ?? {}),
    [collectionId]: reorderIdList(order, familyId, targetFamilyId),
  };
  return next;
}

export function reorderSemanticFamilyInSubGroup(
  system: ColorSystem,
  surface: string,
  subGroupId: string,
  familyKey: string,
  targetFamilyKey: string,
): ColorSystem {
  if (familyKey === targetFamilyKey) return system;
  const slotId = semanticSubGroupSlotId(surface, subGroupId);
  const order = ensureSemanticSubGroupOrder(system, surface, subGroupId);
  if (!order.includes(familyKey) || !order.includes(targetFamilyKey)) return system;

  const next = clone(system);
  next.semanticFamilyOrders = {
    ...(next.semanticFamilyOrders ?? {}),
    [slotId]: reorderIdList(order, familyKey, targetFamilyKey),
  };
  return next;
}
