import { DragDropWorkspace } from "../../components/assessment/drag-drop";
import { mockDragDropCategorizationLevel } from "../../data/assessment";
import { dragDropLevelLinks } from "../levelTypeLinks";

export function DragDropCategorizationLevelPage() {
  return (
    <DragDropWorkspace
      payload={mockDragDropCategorizationLevel}
      levelLinks={dragDropLevelLinks}
      currentLevelPath="/levels/drag-drop-categorization"
    />
  );
}
