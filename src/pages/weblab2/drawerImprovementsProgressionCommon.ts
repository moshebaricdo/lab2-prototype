import { drawerImprovementsExperimentLinks } from "../levelTypeLinks";

export const drawerImprovementsPaths = {
  closeOnFirstSend: "/levels/weblab2-drawer-improvements",
  instructionsTab: "/levels/weblab2-drawer-instructions-tab",
} as const;

export function drawerImprovementsCommonProps(
  currentLevelPath: string,
  currentLevel: number,
) {
  return {
    currentLevelPath,
    levelLinks: drawerImprovementsExperimentLinks,
    currentLevel,
    totalLevels: drawerImprovementsExperimentLinks.length,
    completedLevelPaths: drawerImprovementsExperimentLinks
      .slice(0, currentLevel - 1)
      .map((link) => link.path),
    continueButtonPlacement: "sidebar" as const,
  };
}
