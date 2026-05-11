import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2SendAffordanceLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-send-affordance"
      aiTutorInputExperiment="clarified-send"
      autoSeedTutorConversation
    />
  );
}
