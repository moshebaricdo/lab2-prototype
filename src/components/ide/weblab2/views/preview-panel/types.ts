import type { ReactNode } from "react";
import type { PreviewHtmlFile } from "../buildPreviewSrcDoc";

export type PreviewMode = "desktop" | "mobile";

export interface FilePreviewConfig {
  kind: "file";
  srcDoc?: string;
  path: string;
  htmlFiles: PreviewHtmlFile[];
  onPathChange: (path: string) => void;
}

export interface ReactPreviewConfig {
  kind: "react";
  content: ReactNode;
}

export type WebLabPreviewConfig = FilePreviewConfig | ReactPreviewConfig;

