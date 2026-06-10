import type { FileKind } from "./file";

/** Lab environment that originally saved the item — drives section grouping in the panel. */
export type BackpackSourceLab = "sketch-lab" | "weblab2" | "pythonlab" | "generic";

/** Lab environment where the student is importing backpack files into a project. */
export type BackpackImportLab = "weblab2" | "pythonlab" | "sketch-lab";

/** Backpack panel layout experiments — default keeps prod-like source-lab sections. */
export type BackpackFilterExperiment =
  | "default"
  | "content-pills"
  | "compatibility-toggle"
  | "filter-dropdown";

export interface BackpackItem {
  id: string;
  name: string;
  savedAt: string;
  content: string;
  fileKind: FileKind;
  sourceLab?: BackpackSourceLab;
  /** Data URL thumbnail for image / sketch exports. */
  thumbnailSrc?: string;
}
