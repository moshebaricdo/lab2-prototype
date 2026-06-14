import { agenticPortfolioFileStructure } from "../../data/weblab2/projects/agentic-portfolio";
import { agenticProgressionLinks } from "../levelTypeLinks";

export const agenticProgressionPaths = {
  crew: "/levels/agentic-crew",
  inspect: "/levels/agentic-inspect",
  configure: "/levels/agentic-configure",
  orchestrate: "/levels/agentic-orchestrate",
  standalone: "/levels/agentic-standalone",
} as const;

const AGENTIC_PROGRESSION_TOTAL_LEVELS = 5;

export function agenticProgressionCommonProps(
  currentLevelPath: string,
  currentLevel: number,
) {
  return {
    currentLevelPath,
    levelLinks: agenticProgressionLinks,
    currentLevel,
    totalLevels: AGENTIC_PROGRESSION_TOTAL_LEVELS,
    completedLevelPaths: agenticProgressionLinks
      .slice(0, currentLevel - 1)
      .map((link) => link.path),
    tutorMode: { kind: "functional" as const },
    useFilePreview: true,
    initialViewMode: "split" as const,
    initialOpenFiles: "index.html",
    fileStructureOverride: agenticPortfolioFileStructure,
    storageKeySuffix: "agentic-progression-v1",
    collapseSidebarByDefault: false,
    enableSidebarCollapse: true,
    instructionsDrawerInitialHeightRatio: 0.45,
  };
}
