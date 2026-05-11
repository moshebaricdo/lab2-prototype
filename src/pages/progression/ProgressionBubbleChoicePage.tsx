import { BubbleChoiceWorkspace } from "../../components/assessment/bubble-choice";
import { progressionBubbleChoice } from "../../data/progression";
import { sampleProgressionLinks } from "../levelTypeLinks";

export function ProgressionBubbleChoicePage() {
  return (
    <BubbleChoiceWorkspace
      payload={progressionBubbleChoice}
      levelLinks={sampleProgressionLinks}
      currentLevelPath="/levels/progression-bubble-choice"
      completedLevelPaths={[
        "/levels/progression-weblab",
        "/levels/progression-free-response",
      ]}
    />
  );
}
