import type { ReactNode } from "react";
import type { PreviewHtmlFile } from "../buildPreviewSrcDoc";

export type PreviewMode = "desktop" | "mobile";

export type PreviewDesignStyleProperty =
  | "backgroundColor"
  | "color"
  | "fontSize"
  | "fontWeight"
  | "fontStyle"
  | "textDecoration"
  | "textAlign"
  | "letterSpacing"
  | "lineHeight"
  | "display"
  | "flexDirection"
  | "flexWrap"
  | "justifyContent"
  | "alignItems"
  | "gap"
  | "rowGap"
  | "columnGap"
  | "gridTemplateColumns"
  | "gridTemplateRows"
  | "border"
  | "borderWidth"
  | "borderTopWidth"
  | "borderRightWidth"
  | "borderBottomWidth"
  | "borderLeftWidth"
  | "borderColor"
  | "borderRadius"
  | "padding"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

export type PreviewDesignStylePatch = Partial<
  Record<PreviewDesignStyleProperty, string>
>;

export interface PreviewDesignComputedStyles
  extends Record<PreviewDesignStyleProperty, string> {}

export interface PreviewDesignElementDescriptor {
  tagName: string;
  id: string;
  classList: string[];
  childElementCount: number;
  selector: string;
  selectionSelector?: string;
  text: string;
  outerHTML: string;
  rect: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
  computedStyles: PreviewDesignComputedStyles;
}

export interface PreviewDesignApplyRequest {
  targetSelector: string;
  elementId?: string;
  styles: PreviewDesignStylePatch;
  reset?: boolean;
}

export interface FilePreviewConfig {
  kind: "file";
  srcDoc?: string;
  path: string;
  htmlFiles: PreviewHtmlFile[];
  onPathChange: (path: string) => void;
  /** Hide Web Lab prototype authoring controls such as design selection. */
  showDesignTools?: boolean;
  canEditDesign?: boolean;
  designModeDisabled?: boolean;
  designDisabledReason?: string;
  onApplyDesignEdit?: (request: PreviewDesignApplyRequest) => void;
  onAddPreviewElementToTutor?: (element: PreviewDesignElementDescriptor) => void;
}

export interface ReactPreviewConfig {
  kind: "react";
  content: ReactNode;
}

export type WebLabPreviewConfig = FilePreviewConfig | ReactPreviewConfig;

