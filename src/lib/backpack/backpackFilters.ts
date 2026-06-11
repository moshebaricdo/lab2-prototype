import type { BackpackImportLab, BackpackItem } from "../../types/backpack";
import {
  canImportBackpackItemToLab,
  extensionFromBackpackItemName,
} from "./backpackImportAllowlist";
import { isAgentBackpackItem } from "./agentBackpack";

/** Backpack panel filter ids — content-based, not source-lab based. */
export type BackpackFilterId = "all" | "supported" | "images" | "code" | "documents";

export interface BackpackFilterOption {
  id: BackpackFilterId;
  label: string;
  count: number;
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);

const CODE_EXTENSIONS = new Set([
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "cjs",
  "py",
  "json",
]);

const DOCUMENT_EXTENSIONS = new Set(["txt", "md", "csv"]);

function isBackpackItemImage(item: BackpackItem) {
  if (item.thumbnailSrc) return true;
  if (item.fileKind === "image") return true;
  const extension = extensionFromBackpackItemName(item.name);
  return IMAGE_EXTENSIONS.has(extension);
}

export function backpackItemContentCategory(
  item: BackpackItem,
): Exclude<BackpackFilterId, "all" | "supported"> {
  if (isBackpackItemImage(item)) {
    return "images";
  }

  const extension = extensionFromBackpackItemName(item.name);
  if (CODE_EXTENSIONS.has(extension)) {
    return "code";
  }
  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return "documents";
  }

  if (
    item.fileKind === "python" ||
    item.fileKind === "html" ||
    item.fileKind === "css"
  ) {
    return "code";
  }
  if (item.fileKind === "text") {
    return "documents";
  }

  return "code";
}

export function filterBackpackItems(
  items: BackpackItem[],
  filter: BackpackFilterId,
  importLab?: BackpackImportLab,
): BackpackItem[] {
  if (filter === "all") {
    return items;
  }

  if (filter === "supported") {
    if (!importLab) {
      return items;
    }
    return items.filter((item) => canImportBackpackItemToLab(item, importLab));
  }

  return items.filter(
    (item) => backpackItemContentCategory(item) === filter,
  );
}

/** File-type filter id — "all", a lowercase extension (e.g. "html"), or "other" for extensionless items. */
export type BackpackTypeFilterId = string;

export const BACKPACK_TYPE_FILTER_ALL: BackpackTypeFilterId = "all";
/** Image and other media files — grouped instead of per-extension filters. */
export const BACKPACK_TYPE_FILTER_MEDIA: BackpackTypeFilterId = "media";
const BACKPACK_TYPE_FILTER_OTHER: BackpackTypeFilterId = "other";
/** Saved agents are typed by their file kind, not a filename extension. */
const BACKPACK_TYPE_FILTER_AGENT: BackpackTypeFilterId = "agent";

export interface BackpackTypeFilterOption {
  id: BackpackTypeFilterId;
  label: string;
  count: number;
}

export function backpackItemTypeId(item: BackpackItem): BackpackTypeFilterId {
  if (isAgentBackpackItem(item)) return BACKPACK_TYPE_FILTER_AGENT;
  if (isBackpackItemImage(item)) return BACKPACK_TYPE_FILTER_MEDIA;
  return extensionFromBackpackItemName(item.name) || BACKPACK_TYPE_FILTER_OTHER;
}

function backpackTypeFilterLabel(id: BackpackTypeFilterId): string {
  if (id === BACKPACK_TYPE_FILTER_OTHER) return "Other";
  if (id === BACKPACK_TYPE_FILTER_AGENT) return "Agents";
  if (id === BACKPACK_TYPE_FILTER_MEDIA) return "Media";
  return `.${id}`;
}

/** One option per non-media file extension present, plus always-visible "All types" and "Media". */
export function getBackpackTypeFilterOptions(
  items: BackpackItem[],
): BackpackTypeFilterOption[] {
  const counts = new Map<BackpackTypeFilterId, number>();
  let mediaCount = 0;

  for (const item of items) {
    const typeId = backpackItemTypeId(item);
    if (typeId === BACKPACK_TYPE_FILTER_MEDIA) {
      mediaCount += 1;
      continue;
    }
    counts.set(typeId, (counts.get(typeId) ?? 0) + 1);
  }

  const typeOptions = [...counts.entries()]
    .map(([id, count]) => ({
      id,
      label: backpackTypeFilterLabel(id),
      count,
    }))
    .sort((a, b) => {
      if (a.id === BACKPACK_TYPE_FILTER_OTHER) return 1;
      if (b.id === BACKPACK_TYPE_FILTER_OTHER) return -1;
      return a.label.localeCompare(b.label);
    });

  return [
    { id: BACKPACK_TYPE_FILTER_ALL, label: "All types", count: items.length },
    { id: BACKPACK_TYPE_FILTER_MEDIA, label: "Media", count: mediaCount },
    ...typeOptions,
  ];
}

/** Name sort direction for the type-availability filter row. */
export type BackpackSortDirection = "asc" | "desc";

export function sortBackpackItemsByName(
  items: BackpackItem[],
  direction: BackpackSortDirection,
): BackpackItem[] {
  const sorted = [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  return direction === "desc" ? sorted.reverse() : sorted;
}

export function filterBackpackItemsByType(
  items: BackpackItem[],
  typeFilter: BackpackTypeFilterId,
): BackpackItem[] {
  if (typeFilter === BACKPACK_TYPE_FILTER_ALL) {
    return items;
  }
  return items.filter((item) => backpackItemTypeId(item) === typeFilter);
}

/**
 * Stable partition by lab import availability — supported items keep their
 * order at the top, unsupported items sink to the bottom of the list.
 */
export function partitionBackpackItemsByAvailability(
  items: BackpackItem[],
  importLab?: BackpackImportLab,
): { supported: BackpackItem[]; unsupported: BackpackItem[] } {
  if (!importLab) {
    return { supported: items, unsupported: [] };
  }

  const supported: BackpackItem[] = [];
  const unsupported: BackpackItem[] = [];
  for (const item of items) {
    // Agents aren't tree imports, but they ARE usable here (recalled into the
    // roster), so they keep their place rather than sinking under "not
    // supported in this lab".
    if (isAgentBackpackItem(item) || canImportBackpackItemToLab(item, importLab)) {
      supported.push(item);
    } else {
      unsupported.push(item);
    }
  }
  return { supported, unsupported };
}

export function getBackpackFilterOptions(
  items: BackpackItem[],
  importLab?: BackpackImportLab,
): BackpackFilterOption[] {
  const supportedCount = importLab
    ? items.filter((item) => canImportBackpackItemToLab(item, importLab)).length
    : 0;
  const imagesCount = items.filter(
    (item) => backpackItemContentCategory(item) === "images",
  ).length;
  const codeCount = items.filter(
    (item) => backpackItemContentCategory(item) === "code",
  ).length;
  const documentsCount = items.filter(
    (item) => backpackItemContentCategory(item) === "documents",
  ).length;

  const options: BackpackFilterOption[] = [
    { id: "all", label: "All files", count: items.length },
    { id: "images", label: "Media", count: imagesCount },
  ];

  if (importLab && supportedCount > 0) {
    options.push({
      id: "supported",
      label: "Supported here",
      count: supportedCount,
    });
  }

  if (codeCount > 0) {
    options.push({ id: "code", label: "Code", count: codeCount });
  }
  if (documentsCount > 0) {
    options.push({
      id: "documents",
      label: "Documents",
      count: documentsCount,
    });
  }

  return options;
}
