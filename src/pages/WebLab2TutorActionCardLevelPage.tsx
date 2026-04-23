import {
  tutorActionCardPrefilledInput,
  tutorActionCardPrefilledAttachments,
  sharedAttachmentMeta,
} from "../data/weblab2";
import { WebLab2LevelPage } from "./WebLab2LevelPage";

export function WebLab2TutorActionCardLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-tutor-action-card"
      aiTutorInputExperiment="tutor-action-card"
      initialChatInput={tutorActionCardPrefilledInput}
      initialAttachedFiles={tutorActionCardPrefilledAttachments}
      attachmentMeta={sharedAttachmentMeta}
    />
  );
}
