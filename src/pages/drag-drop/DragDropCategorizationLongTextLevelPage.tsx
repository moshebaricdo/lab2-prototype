import { DragDropWorkspace } from "../../components/assessment/drag-drop";
import { mockDragDropCategorizationLongTextLevel } from "../../data/assessment";
import { dragDropLevelLinks } from "../levelTypeLinks";

export function DragDropCategorizationLongTextLevelPage() {
  return (
    <DragDropWorkspace
      payload={mockDragDropCategorizationLongTextLevel}
      levelLinks={dragDropLevelLinks}
      currentLevelPath="/levels/drag-drop-categorization-long-text"
    />
  );
}
