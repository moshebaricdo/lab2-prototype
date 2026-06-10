import type { BackpackImportLab, BackpackItem } from "../../types/backpack";

export const BACKPACK_IMPORT_UNSUPPORTED_TOOLTIP = "Not supported in this lab";

/** File extensions a Web Lab 2 project can import from the backpack. */
export const WEBLAB2_BACKPACK_IMPORT_EXTENSIONS = [
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "cjs",
  "json",
  "txt",
  "md",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
] as const;

/** File extensions a Python Lab project can import from the backpack. */
export const PYTHONLAB_BACKPACK_IMPORT_EXTENSIONS = [
  "py",
  "txt",
  "md",
  "csv",
] as const;

/** File extensions Sketch Lab exports can import into (future Sketch Lab target). */
export const SKETCH_LAB_BACKPACK_IMPORT_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
] as const;

const ALLOWLISTS: Record<BackpackImportLab, ReadonlySet<string>> = {
  weblab2: new Set(WEBLAB2_BACKPACK_IMPORT_EXTENSIONS),
  pythonlab: new Set(PYTHONLAB_BACKPACK_IMPORT_EXTENSIONS),
  "sketch-lab": new Set(SKETCH_LAB_BACKPACK_IMPORT_EXTENSIONS),
};

export function extensionFromBackpackItemName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(dot + 1).toLowerCase();
}

export function canImportBackpackItemToLab(
  item: BackpackItem,
  lab: BackpackImportLab,
): boolean {
  const extension = extensionFromBackpackItemName(item.name);
  if (!extension) {
    return false;
  }
  return ALLOWLISTS[lab].has(extension);
}
