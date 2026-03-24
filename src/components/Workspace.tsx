import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faEye,
  faColumns,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { FileManager, type FileItem } from "./FileManager";
import { CodeEditor } from "./CodeEditor";
import { PreviewPanel } from "./PreviewPanel";
import { ResizableHandle } from "./ResizableHandle";
import { VersionBanner } from "./VersionBanner";
import { SavedTag } from "./SavedTag";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { versionLabels } from "../data/mockData";

interface WorkspaceProps {
  viewMode: "code" | "preview" | "split";
  setViewMode: (mode: "code" | "preview" | "split") => void;
  fileStructure: FileItem[];
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem | null) => void;
  openFiles: FileItem[];
  setOpenFiles: (files: FileItem[]) => void;
  openFolders: Set<string>;
  toggleFolder: (folderPath: string) => void;
  openFile: (file: FileItem) => void;
  closeFile: (file: FileItem) => void;
  handleReorderFiles: (files: FileItem[]) => void;
  isFileManagerCollapsed: boolean;
  setIsFileManagerCollapsed: (collapsed: boolean) => void;
  setIsCreateFileModalOpen: (open: boolean) => void;
  selectedHistoryVersion: string;
  showSavedTag: boolean;
  onReturnToCurrentVersion: () => void;
}

export function Workspace({
  viewMode,
  setViewMode,
  fileStructure,
  selectedFile,
  setSelectedFile,
  openFiles,
  openFolders,
  toggleFolder,
  openFile,
  closeFile,
  handleReorderFiles,
  isFileManagerCollapsed,
  setIsFileManagerCollapsed,
  setIsCreateFileModalOpen,
  selectedHistoryVersion,
  showSavedTag,
  onReturnToCurrentVersion,
}: WorkspaceProps) {
  const [splitViewCodeWidth, setSplitViewCodeWidth] = useState<number | null>(
    null
  );

  const viewModeOptions: SegmentedOption<"code" | "preview" | "split">[] = [
    { value: "code", label: "Code", icon: faCode },
    { value: "preview", label: "Preview", icon: faEye },
    { value: "split", label: "Split View", icon: faColumns },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Workspace Header */}
      <div className="h-10 flex items-center justify-between px-2 border-b border-[#d4dae1] bg-white relative">
        <SegmentedControl
          options={viewModeOptions}
          value={viewMode}
          onChange={setViewMode}
        />
        <label className="absolute left-1/2 -translate-x-1/2 text-xs text-[#69788a] font-semibold tracking-wide uppercase">
          WORKSPACE
        </label>
        {showSavedTag ? (
          <SavedTag />
        ) : (
          // <button
          //   ref={setSaveButtonRef}
          //   onClick={() => setIsSaveVersionModalOpen(true)}
          //   className="box-border bg-white content-stretch flex gap-[4px] h-[24px] items-center min-w-[32px] px-[8px] py-[2px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] active:bg-[#e0f8f9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
          // >
          //   <div
          //     aria-hidden="true"
          //     className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
          //   />
          //   <div className="flex flex-row items-center justify-center min-w-inherit size-full">
          //     <div className="box-border content-stretch flex gap-[4px] items-center justify-center min-w-inherit relative">
          //       <div
          //         className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]"
          //         style={{ fontFamily: "var(--font-body)" }}
          //       >
          //         <FontAwesomeIcon icon={faSave} className="leading-[1.25]" />
          //       </div>
          //       <p
          //         className="leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap whitespace-pre"
          //         style={{
          //           fontFamily: "var(--font-body)",
          //           fontWeight: "var(--font-weight-semibold)",
          //         }}
          //       >
          //         Save Version
          //       </p>
          //     </div>
          //   </div>
          // </button>
          <div /> // Placeholder to maintain layout
        )}
      </div>

      {/* Version Banner - shown when viewing a previous version */}
      {selectedHistoryVersion !== "current" && (
        <VersionBanner
          versionLabel={
            versionLabels[selectedHistoryVersion] ||
            selectedHistoryVersion
          }
          onClose={onReturnToCurrentVersion}
        />
      )}

      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Code View or Split View */}
        {(viewMode === "code" || viewMode === "split") && (
          <div
            data-code-panel="true"
            className={`${viewMode === "split" ? (splitViewCodeWidth !== null ? "shrink-0 flex" : "flex-1 flex") : "flex-1 flex"} min-w-0`}
            style={
              viewMode === "split" && splitViewCodeWidth !== null
                ? {
                    width: `${splitViewCodeWidth}px`,
                    minWidth: "300px",
                  }
                : viewMode === "split"
                  ? { minWidth: "300px" }
                  : undefined
            }
          >
            {/* File Manager */}
            <div
              className={`${isFileManagerCollapsed ? "w-[32px]" : "w-[200px]"} shrink-0 transition-all duration-200`}
            >
              <FileManager
                fileStructure={fileStructure}
                selectedFile={selectedFile}
                openFolders={openFolders}
                onFileSelect={openFile}
                onToggleFolder={toggleFolder}
                collapsed={isFileManagerCollapsed}
                onToggleCollapse={() =>
                  setIsFileManagerCollapsed(!isFileManagerCollapsed)
                }
                onNewFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-w-0">
              <CodeEditor
                openFiles={openFiles}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCloseFile={closeFile}
                onReorderFiles={handleReorderFiles}
                isFileManagerCollapsed={isFileManagerCollapsed}
                onCreateFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Split View Resize Handle */}
        {viewMode === "split" && (
          <ResizableHandle
            onResize={(delta) => {
              setSplitViewCodeWidth((prev) => {
                // If not yet set, calculate current width from the element
                if (prev === null) {
                  const codePanel = document.querySelector(
                    '[data-code-panel="true"]'
                  );
                  if (codePanel) {
                    const currentWidth =
                      codePanel.getBoundingClientRect().width;
                    return Math.max(300, currentWidth + delta);
                  }
                  // Fallback to a reasonable default
                  return Math.max(300, 600 + delta);
                }
                const newWidth = prev + delta;
                // Ensure both panels maintain at least 300px
                return Math.max(300, newWidth);
              });
            }}
          />
        )}

        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`${viewMode === "split" ? "flex-1" : "flex-1"} min-w-0`}
            style={viewMode === "split" ? { minWidth: "300px" } : undefined}
          >
            <PreviewPanel hasContent={openFiles.length > 0} />
          </div>
        )}
      </div>
    </div>
  );
}