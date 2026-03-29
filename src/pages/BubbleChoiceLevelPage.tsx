import { BubbleChoiceWorkspace } from "../components/assessment/bubble-choice";
import { bubbleChoiceLevelLinks } from "./levelTypeLinks";

export function BubbleChoiceLevelPage() {
  return (
    <BubbleChoiceWorkspace
      levelLinks={bubbleChoiceLevelLinks}
      currentLevelPath="/levels/bubble-choice"
    />
  );
}
