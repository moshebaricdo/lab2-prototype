import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import type { FileItem } from "../../types/file";
import {
  uploadActionCardMockTutor,
  uploadFileChipMockTutor,
} from "../../data/weblab2";
import { uploadMechanismsProgressionLinks } from "../levelTypeLinks";
import { WebLab2LevelPage } from "./WebLab2LevelPage";

const uploadMechanismStarterFileStructure: FileItem[] = [
  {
    name: "index.html",
    type: "html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Upload Mechanism Demo</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Web Lab upload demo</p>
        <h1>Try adding images through Tutor chat</h1>
        <p>
          Use the Tutor panel to upload one or more photos, then compare how each
          upload mechanism asks whether those files should become project assets.
        </p>
      </section>

      <section class="gallery" aria-label="Uploaded image placeholders">
        <article class="card">Cover photo</article>
        <article class="card">Product photo</article>
        <article class="card">Reference image</article>
      </section>
    </main>
    <script src="script.js"></script>
  </body>
</html>`,
  },
  {
    name: "style.css",
    type: "css",
    content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.page {
  display: grid;
  gap: 2rem;
  min-height: 100vh;
  padding: 3rem;
}

.hero {
  max-width: 42rem;
}

.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero h1 {
  font-size: clamp(2rem, 6vw, 4rem);
  line-height: 1;
  margin: 0;
}

.gallery {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.card {
  align-items: center;
  border: 1px solid currentColor;
  border-radius: 1rem;
  display: flex;
  min-height: 12rem;
  justify-content: center;
  padding: 1rem;
}`,
  },
  {
    name: "script.js",
    type: "file",
    content: `console.log("Upload mechanism demo loaded");`,
  },
];

const paths = {
  staged: "/levels/progression-upload-mechanisms-staged",
  actionCard: "/levels/progression-upload-mechanisms-action-card",
  fileChip: "/levels/progression-upload-mechanisms-file-chip",
} as const;

function commonProps(currentLevelPath: string, currentLevel: number) {
  return {
    currentLevelPath,
    title: "Upload Mechanisms",
    fileStructureOverride: uploadMechanismStarterFileStructure,
    useFilePreview: true,
    showInstructionsDrawer: false,
    continueButtonPlacement: "sidebar" as const,
    initialViewMode: "split" as const,
    initialOpenFiles: "index.html",
    levelLinks: uploadMechanismsProgressionLinks,
    currentLevel,
    totalLevels: uploadMechanismsProgressionLinks.length,
    completedLevelPaths: uploadMechanismsProgressionLinks
      .slice(0, currentLevel - 1)
      .map((link) => link.path),
    storageKeySuffix: "upload-mechanisms-v4",
    collapseSidebarByDefault: false,
    enableSidebarCollapse: true,
  };
}

export function UploadMechanismsStagedLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps(paths.staged, 1)}
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="standalone-project"
      continueLabel="Try add-files message"
      onContinue={() => navigate(paths.actionCard)}
    />
  );
}

export function UploadMechanismsActionCardLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps(paths.actionCard, 2)}
      aiTutorInputExperiment="tutor-action-card"
      tutorMode={{ kind: "mock", config: uploadActionCardMockTutor }}
      enableTutorUploadStaging={false}
      continueLabel="Try plus-button chips"
      onContinue={() => navigate(paths.fileChip)}
    />
  );
}

export function UploadMechanismsFileChipLevelPage() {
  return (
    <WebLab2LevelPage
      {...commonProps(paths.fileChip, 3)}
      aiTutorInputExperiment="file-chip-action"
      tutorMode={{ kind: "mock", config: uploadFileChipMockTutor }}
      enableTutorUploadStaging={false}
      continueLabel="Done"
    />
  );
}
