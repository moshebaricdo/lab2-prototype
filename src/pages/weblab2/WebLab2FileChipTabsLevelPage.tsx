import { WebLab2LevelPage } from "./WebLab2LevelPage";

const FILE_CHIP_TABS_DEMO_OPEN_FILES = [
  "index.html",
  "styles.css",
  "assets/logo.svg",
  "assets/icon.png",
  "assets/script.js",
  "assets/config.json",
] as const;

export function WebLab2FileChipTabsLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-file-chip-tabs"
      title="File chip tabs: edge row"
      fileTabVariant="edge"
      initialOpenFiles={FILE_CHIP_TABS_DEMO_OPEN_FILES}
      hideProgression
    />
  );
}
