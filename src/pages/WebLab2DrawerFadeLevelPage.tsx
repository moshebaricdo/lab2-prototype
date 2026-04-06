import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2DrawerFadeLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-drawer-fade"
      instructionsDrawerInitialHeightRatio={0.6}
      instructionsDrawerVisualCue="fade"
      autoSeedTutorConversation
    />
  );
}
