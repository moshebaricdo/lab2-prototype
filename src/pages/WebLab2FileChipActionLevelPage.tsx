import {
  fileChipActionPrefilledInput,
  fileChipActionPrefilledAttachments,
  sharedAttachmentMeta,
} from "../data/weblab2";
import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2FileChipActionLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-file-chip-action"
      aiTutorInputExperiment="file-chip-action"
      initialChatInput={fileChipActionPrefilledInput}
      initialAttachedFiles={fileChipActionPrefilledAttachments}
      attachmentMeta={sharedAttachmentMeta}
    />
  );
}
