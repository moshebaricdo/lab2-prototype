import type { FileKind } from "./file";

/** Lab environment that originally saved the item — drives section grouping in the panel. */
export type BackpackSourceLab = "sketch-lab" | "weblab2" | "pythonlab" | "generic";

/** Lab environment where the student is importing backpack files into a project. */
export type BackpackImportLab = "weblab2" | "pythonlab" | "sketch-lab" | "aichatlab";

/** Backpack panel layout experiments — production uses type-availability when unset. */
export type BackpackFilterExperiment =
  | "default"
  | "content-pills"
  | "compatibility-toggle"
  | "filter-dropdown"
  | "type-availability";

export interface BackpackItem {
  id: string;
  name: string;
  savedAt: string;
  content: string;
  /**
   * `FileKind` for project files, plus `"agent"` for saved custom agents
   * (spec V4 Decision D). The agent kind never enters the project file tree —
   * it lives only in the backpack and the agent recall sheet.
   */
  fileKind: FileKind | "agent";
  sourceLab?: BackpackSourceLab;
  /** Data URL thumbnail for image / sketch exports. */
  thumbnailSrc?: string;
}
