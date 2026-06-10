import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import type { FileItem } from "../../types/file";
import type { BackpackFilterExperiment } from "../../types/backpack";
import {
  BACKPACK_FILTER_EXPERIMENT_DEMO_ITEMS,
  BACKPACK_FILTER_EXPERIMENT_INSTRUCTIONS,
} from "../../data/weblab2/backpackFilterExperimentSeed";
import { backpackFilterProgressionLinks } from "../levelTypeLinks";
import { WebLab2LevelPage } from "./WebLab2LevelPage";

const backpackFilterStarterFileStructure: FileItem[] = [
  {
    name: "index.html",
    type: "html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Backpack Filter Demo</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <h1>Backpack filtering experiments</h1>
      <p>Open the Backpack tab to compare filter patterns across this progression.</p>
    </main>
  </body>
</html>`,
  },
  {
    name: "style.css",
    type: "css",
    content: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.page {
  padding: 2rem;
}`,
  },
];

const paths = {
  sections: "/levels/progression-backpack-filter-sections",
  pills: "/levels/progression-backpack-filter-pills",
  toggle: "/levels/progression-backpack-filter-toggle",
  dropdown: "/levels/progression-backpack-filter-dropdown",
} as const;

function commonProps(
  currentLevelPath: string,
  currentLevel: number,
  filterExperiment: BackpackFilterExperiment,
) {
  return {
    currentLevelPath,
    title: "Backpack Filtering",
    fileStructureOverride: backpackFilterStarterFileStructure,
    useFilePreview: true,
    showInstructionsDrawer: true,
    instructionsMarkdown: BACKPACK_FILTER_EXPERIMENT_INSTRUCTIONS,
    continueButtonPlacement: "header" as const,
    initialViewMode: "split" as const,
    initialOpenFiles: "index.html",
    levelLinks: backpackFilterProgressionLinks,
    currentLevel,
    totalLevels: backpackFilterProgressionLinks.length,
    completedLevelPaths: backpackFilterProgressionLinks
      .slice(0, currentLevel - 1)
      .map((link) => link.path),
    storageKeySuffix: "backpack-filter-v1",
    collapseSidebarByDefault: false,
    enableSidebarCollapse: true,
    backpackFilterExperiment: filterExperiment,
    backpackSeedItemsIfEmpty: BACKPACK_FILTER_EXPERIMENT_DEMO_ITEMS,
  };
}

export function BackpackFilterSectionsLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps(paths.sections, 1, "default")}
      continueLabel="Try filter pills"
      onContinue={() => navigate(paths.pills)}
    />
  );
}

export function BackpackFilterPillsLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps(paths.pills, 2, "content-pills")}
      continueLabel="Try supported toggle"
      onContinue={() => navigate(paths.toggle)}
    />
  );
}

export function BackpackFilterToggleLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps(paths.toggle, 3, "compatibility-toggle")}
      continueLabel="Try filter dropdown"
      onContinue={() => navigate(paths.dropdown)}
    />
  );
}

export function BackpackFilterDropdownLevelPage() {
  return (
    <WebLab2LevelPage
      {...commonProps(paths.dropdown, 4, "filter-dropdown")}
      continueLabel="Done"
    />
  );
}
