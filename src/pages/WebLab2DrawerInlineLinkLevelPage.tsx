import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2DrawerInlineLinkLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-drawer-inline-link"
      instructionsDrawerInitialHeightRatio={0.6}
      instructionsDrawerVisualCue="inline-link"
      autoSeedTutorConversation
    />
  );
}
