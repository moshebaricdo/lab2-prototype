import { PythonLabLevelPage } from "./PythonLabLevelPage";
import type { FileItem } from "../../types/file";

const blankPythonFileStructure: FileItem[] = [];

export function PythonLabBlankProjectLevelPage() {
  return (
    <PythonLabLevelPage
      currentLevelPath="/levels/pythonlab-blank"
      title="Python Lab: Blank Project"
      fileStructureOverride={blankPythonFileStructure}
      showInstructionsDrawer={false}
      showValidationTab={false}
      enableSidebarCollapse
      collapseSidebarByDefault
    />
  );
}
