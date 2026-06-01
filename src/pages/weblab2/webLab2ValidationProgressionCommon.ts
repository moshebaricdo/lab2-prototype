import { DesignInspectorPanel } from "@/components/ide/weblab2/views/preview-panel/DesignInspectorPanel";
import { webLab2ValidationProgressionLinks } from "../levelTypeLinks";

export const validationProgressionPaths = {
  photoCarousel: "/levels/progression-weblab2-validation-fix",
  loopStylePolish: "/levels/progression-weblab2-validation-create",
  promiseTrace: "/levels/progression-weblab2-validation-refine",
  starshipLoader: "/levels/progression-weblab2-validation-sandbox",
  featureRoulette: "/levels/progression-weblab2-validation-feature-roulette",
} as const;

export const validationProgressionCommonProps = {
  useFilePreview: true,
  showOnlyFilesWithContent: true,
  tutorMode: { kind: "functional" as const },
  tutorSupportContext: "curriculum-level" as const,
  tutorInstructionsDelivery: true,
  continueButtonPlacement: "header" as const,
  instructionsDrawerInitialHeightRatio: 0.5,
  enableSidebarCollapse: true,
  initialViewMode: "split" as const,
  levelLinks: webLab2ValidationProgressionLinks,
  totalLevels: webLab2ValidationProgressionLinks.length,
  validationContinueMode: "require-successful-review" as const,
  enableDesignMode: false,
  collapseFileManagerByDefault: true,
};
