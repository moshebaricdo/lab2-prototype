import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import type { FileItem } from "../../types/file";
import {
  CROSS_LAB_BACKPACK_SEED_ITEMS,
  crossLabBackpackInstructionsForLab,
} from "../../data/backpack/crossLabBackpackSeed";
import { backpackCrossLabProgressionLinks } from "../levelTypeLinks";
import { SketchLabLevelPage } from "../sketchlab/SketchLabLevelPage";
import { WebLab2LevelPage } from "../weblab2/WebLab2LevelPage";
import { AiChatLabLevelPage } from "../aichatlab/AiChatLabLevelPage";
import { PythonLabLevelPage } from "../pythonlab/PythonLabLevelPage";

export const backpackCrossLabPaths = {
  sketch: "/levels/progression-backpack-labs-sketch",
  web: "/levels/progression-backpack-labs-web",
  aichat: "/levels/progression-backpack-labs-aichat",
  python: "/levels/progression-backpack-labs-python",
} as const;

const webStarterFiles: FileItem[] = [
  {
    name: "index.html",
    type: "html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cross-lab backpack</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <h1>Cross-lab backpack</h1>
      <p>Open the Backpack tab. Import supported files, then continue to the next lab.</p>
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

const pythonStarterFiles: FileItem[] = [
  {
    name: "main.py",
    type: "python",
    content: `print("Open the Backpack tab and try importing greet.py or a document.")
`,
  },
];

function completedPaths(currentLevel: number) {
  return backpackCrossLabProgressionLinks
    .slice(0, currentLevel - 1)
    .map((link) => link.path);
}

const sharedChrome = {
  levelLinks: backpackCrossLabProgressionLinks,
  totalLevels: backpackCrossLabProgressionLinks.length,
  backpackEnsureSeedItems: CROSS_LAB_BACKPACK_SEED_ITEMS,
  initialResourceTab: "backpack" as const,
};

export function BackpackCrossLabWebLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      currentLevelPath={backpackCrossLabPaths.web}
      title="Backpack · Web Lab"
      fileStructureOverride={webStarterFiles}
      useFilePreview={true}
      showInstructionsDrawer={true}
      instructionsMarkdown={crossLabBackpackInstructionsForLab(
        "Web Lab 2",
        "Web Lab can import HTML, CSS, JS, JSON, documents (`.txt` `.md` `.csv`), and images. Python and PDF stay unsupported. Use **+** to copy a supported file into the project tree.",
      )}
      continueButtonPlacement="sidebar"
      initialViewMode="split"
      initialOpenFiles="index.html"
      currentLevel={1}
      completedLevelPaths={completedPaths(1)}
      continueLabel="Next: Python Lab"
      onContinue={() => navigate(backpackCrossLabPaths.python)}
      storageKeySuffix="backpack-cross-lab-v1"
      collapseSidebarByDefault={false}
      enableSidebarCollapse={true}
      {...sharedChrome}
    />
  );
}

export function BackpackCrossLabPythonLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <PythonLabLevelPage
      currentLevelPath={backpackCrossLabPaths.python}
      title="Backpack · Python Lab"
      fileStructureOverride={pythonStarterFiles}
      showInstructionsDrawer={true}
      showValidationTab={false}
      instructionsMarkdown={crossLabBackpackInstructionsForLab(
        "Python Lab",
        "Python Lab can import `.py`, `.txt`, `.md`, and `.csv` only. Images, web files, and PDF stay unsupported. Use **+** to copy a supported file into the project tree.",
      )}
      initialOpenFiles="main.py"
      currentLevel={2}
      completedLevelPaths={completedPaths(2)}
      continueLabel="Next: Sketch Lab"
      onContinue={() => navigate(backpackCrossLabPaths.sketch)}
      {...sharedChrome}
    />
  );
}

export function BackpackCrossLabSketchLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <SketchLabLevelPage
      currentLevelPath={backpackCrossLabPaths.sketch}
      title="Backpack · Sketch Lab"
      initialNodes={[]}
      initialEdges={[]}
      instructionsMarkdown={crossLabBackpackInstructionsForLab(
        "Sketch Lab",
        "Only images import here (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`). Everything else stays in **Not supported in this lab**. Use **+** on an image to place it on the canvas.",
      )}
      currentLevel={3}
      completedLevelPaths={completedPaths(3)}
      continueLabel="Next: AI Chat"
      onContinue={() => navigate(backpackCrossLabPaths.aichat)}
      {...sharedChrome}
    />
  );
}

export function BackpackCrossLabAiChatLevelPage() {
  return (
    <AiChatLabLevelPage
      currentLevelPath={backpackCrossLabPaths.aichat}
      defaults={{
        title: "Backpack · AI Chat Lab",
        continueLabel: "Done",
        showConfigPanel: false,
        showResourcesTab: false,
        instructionsMarkdown: crossLabBackpackInstructionsForLab(
          "AI Chat Lab",
          "AI Chat currently allows every file type. **+** is enabled on all seed files (tooltip: Add to chat). Compare this with the other labs, where the same files sit under **Not supported in this lab**.",
        ),
      }}
      currentLevel={4}
      completedLevelPaths={completedPaths(4)}
      {...sharedChrome}
    />
  );
}
