import { DragDropWorkspace } from "../../components/assessment/drag-drop";
import { mockDragDropParsonsCodeRefLevel } from "../../data/assessment";
import { dragDropLevelLinks } from "../levelTypeLinks";

export function DragDropParsonsCodeRefLevelPage() {
  return (
    <DragDropWorkspace
      payload={mockDragDropParsonsCodeRefLevel}
      codePanel={mockDragDropParsonsCodeRefLevel.codePanel}
      levelLinks={dragDropLevelLinks}
      currentLevelPath="/levels/drag-drop-parsons-code-ref"
    />
  );
}
