import { DragDropWorkspace } from "../../components/assessment/drag-drop";
import { mockDragDropParsonsLevel } from "../../data/assessment";
import { dragDropLevelLinks } from "../levelTypeLinks";

export function DragDropParsonsLevelPage() {
  return (
    <DragDropWorkspace
      payload={mockDragDropParsonsLevel}
      levelLinks={dragDropLevelLinks}
      currentLevelPath="/levels/drag-drop-parsons"
    />
  );
}
