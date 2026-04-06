import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2FileDropLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-file-drop"
      aiTutorInputExperiment="file-drop"
      autoSeedTutorConversation
    />
  );
}
