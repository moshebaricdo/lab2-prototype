import {
  fileChipActionMockTutor,
} from "../data/weblab2";
import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2FileChipActionLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-file-chip-action"
      aiTutorInputExperiment="file-chip-action"
      tutorMode={{ kind: "mock", config: fileChipActionMockTutor }}
    />
  );
}
