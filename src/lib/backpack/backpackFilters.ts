import type { BackpackImportLab, BackpackItem } from "../../types/backpack";
import {
  canImportBackpackItemToLab,
  extensionFromBackpackItemName,
} from "./backpackImportAllowlist";

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
  ];

  if (importLab && supportedCount > 0) {
    options.push({
      id: "supported",
      label: "Supported here",
      count: supportedCount,
    });
  }

  if (imagesCount > 0) {
    options.push({ id: "images", label: "Images", count: imagesCount });
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
