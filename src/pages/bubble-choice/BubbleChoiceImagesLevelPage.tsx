import { BubbleChoiceWorkspace } from "../../components/assessment/bubble-choice";
import { mockBubbleChoiceLevelWithImages } from "../../data/assessment";
import { bubbleChoiceLevelLinks } from "../levelTypeLinks";

export function BubbleChoiceImagesLevelPage() {
  return (
    <BubbleChoiceWorkspace
      levelLinks={bubbleChoiceLevelLinks}
      currentLevelPath="/levels/bubble-choice-images"
      payload={mockBubbleChoiceLevelWithImages}
    />
  );
}
