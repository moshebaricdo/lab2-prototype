import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faFileCode, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import emptyStateNoFilesOpen from "../../../../assets/empty-states/empty-state-no-files-open.svg";
import type { FileItem } from "../../../../types/file";
import { AppButton } from "../../../ui/AppButton";
import { EmptyState } from "../EmptyState";
import { CodeMirrorHost } from "./CodeMirrorHost";
import { useEditorReadOnlyOverride } from "../../../../hooks/useEditorReadOnly";
import styles from "./CodeEditor.module.scss";

interface CodeEditorProps {
  openFiles: FileItem[];
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onCloseFile: (file: FileItem) => void;
  onReorderFiles: (files: FileItem[]) => void;
  isFileManagerCollapsed?: boolean;
  onCreateFile?: () => void;
  /** When true, tabs set the same native drag payload as the file manager for AI Tutor. */
  enableDragToTutor?: boolean;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
  /**
   * Notified whenever the editor doc changes. Edits are blocked while AI
   * change diffs are showing, so this only fires for the user's own edits.
   */
  onFileContentChange?: (fileName: string, content: string) => void;
  /** Explicit read-only override. Defaults to undefined (auto-derived). */
  readOnly?: boolean;
  planActionBar?: ReactNode;
  hideFileTabs?: boolean;
  contentOverride?: (props: {
    code: string;
    file: FileItem;
    hasProposed: boolean;
  }) => ReactNode;
}

interface DraggableTabProps {
  file: FileItem;
  index: number;
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onCloseFile: (file: FileItem) => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  getFileIcon: (file: FileItem) => IconDefinition;
  enableDragToTutor?: boolean;
  isAiChanged?: boolean;
}

const ItemType = {
  TAB: "tab",
};

function DraggableTab({
  file,
  index,
  selectedFile,
  onFileSelect,
  onCloseFile,
  moveTab,
  getFileIcon,
  enableDragToTutor = false,
  isAiChanged = false,
}: DraggableTabProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleTabDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!enableDragToTutor) {
      return;
    }
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      "application/x-weblab-file",
      JSON.stringify({
        name: file.name,
        path: file.name,
        type: file.type,
      }),
    );
  };

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.TAB,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType.TAB,
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveTab(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const isActive = selectedFile?.name === file.name;

  return (
    <div
      ref={ref}
      onClick={() => onFileSelect(file)}
      onDragStart={handleTabDragStart}
      className={`${styles.tab} ${
        enableDragToTutor ? styles.tabDragToTutor : ""
      } ${
        isAiChanged
          ? isActive
            ? styles.tabAiChangedActive
            : styles.tabAiChanged
          : isActive
            ? styles.tabActive
            : styles.tabIdle
      } ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className={styles.tabIconWrap}>
        <FontAwesomeIcon
          icon={getFileIcon(file)}
          className={`${styles.tabIcon} ${
            isActive ? styles.tabIconActive : styles.tabIconInactive
          }`}
        />
      </div>
      <p
        className={`${styles.tabName} ${
          isActive ? styles.tabNameActive : styles.tabNameInactive
        }`}
      >
        {file.name}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCloseFile(file);
        }}
        className={styles.tabClose}
      >
        <span
          className={`${styles.tabCloseIcon} ${
            isActive ? styles.tabIconActive : styles.tabIconInactive
          }`}
        >
          <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
        </span>
      </button>
    </div>
  );
}

function getFileIcon(file: FileItem): IconDefinition {
  if (file.type === "css") {
    return faCss3;
  }
  return faFileCode;
}

function isRenderableImageSource(source: string) {
  return (
    source.startsWith("data:") ||
    source.startsWith("/") ||
    source.startsWith("./") ||
    /^https?:\/\//i.test(source)
  );
}

export function CodeEditor({
  openFiles,
  selectedFile,
  onFileSelect,
  onCloseFile,
  onReorderFiles,
  isFileManagerCollapsed = false,
  onCreateFile,
  enableDragToTutor = false,
  aiChangedFiles,
  onFileContentChange,
  readOnly,
  planActionBar,
  hideFileTabs = false,
  contentOverride,
}: CodeEditorProps) {
  const [localOpenFiles, setLocalOpenFiles] = useState(openFiles);
  const [showTabsStartFade, setShowTabsStartFade] = useState(false);
  const [showTabsEndFade, setShowTabsEndFade] = useState(false);
  const [showEditorTopFade, setShowEditorTopFade] = useState(false);
  const [showEditorBottomFade, setShowEditorBottomFade] = useState(false);
  const tabsRowRef = useRef<HTMLDivElement>(null);
  const contentPadRef = useRef<HTMLDivElement>(null);
  const devReadOnlyOverride = useEditorReadOnlyOverride();

  useEffect(() => {
    setLocalOpenFiles(openFiles);
  }, [openFiles]);

  const updateTabsEndFade = useCallback(() => {
    const tabsRow = tabsRowRef.current;
    if (!tabsRow) {
      setShowTabsEndFade(false);
      return;
    }

    const maxScrollLeft = tabsRow.scrollWidth - tabsRow.clientWidth;
    setShowTabsStartFade(maxScrollLeft > 1 && tabsRow.scrollLeft > 1);
    setShowTabsEndFade(
      maxScrollLeft > 1 && tabsRow.scrollLeft < maxScrollLeft - 1,
    );
  }, []);

  useEffect(() => {
    const tabsRow = tabsRowRef.current;
    if (!tabsRow) return undefined;

    updateTabsEndFade();
    tabsRow.addEventListener("scroll", updateTabsEndFade);

    const resizeObserver = new ResizeObserver(updateTabsEndFade);
    resizeObserver.observe(tabsRow);

    return () => {
      tabsRow.removeEventListener("scroll", updateTabsEndFade);
      resizeObserver.disconnect();
    };
  }, [isFileManagerCollapsed, localOpenFiles, updateTabsEndFade]);

  const updateEditorFades = useCallback(() => {
    const scroller = contentPadRef.current?.querySelector<HTMLElement>(".cm-scroller");
    if (!scroller) {
      setShowEditorTopFade(false);
      setShowEditorBottomFade(false);
      return;
    }

    const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
    setShowEditorTopFade(maxScrollTop > 1 && scroller.scrollTop > 1);
    setShowEditorBottomFade(
      maxScrollTop > 1 && scroller.scrollTop < maxScrollTop - 1,
    );
  }, []);

  const moveTab = (dragIndex: number, hoverIndex: number) => {
    const newFiles = [...localOpenFiles];
    const draggedFile = newFiles[dragIndex];
    newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedFile);
    setLocalOpenFiles(newFiles);
    onReorderFiles(newFiles);
  };

  const selectedOpenFile = selectedFile
    ? localOpenFiles.find((file) => file.name === selectedFile.name) ?? null
    : null;
  const isAiChangedFile = !!(
    selectedOpenFile?.name && aiChangedFiles?.[selectedOpenFile.name]
  );
  const hasProposed =
    isAiChangedFile && selectedOpenFile?.proposedContent != null;
  const selectedCode = hasProposed
    ? selectedOpenFile!.proposedContent!
    : selectedOpenFile?.content;

  useEffect(() => {
    const scroller = contentPadRef.current?.querySelector<HTMLElement>(".cm-scroller");
    if (!scroller) {
      updateEditorFades();
      return undefined;
    }

    updateEditorFades();
    scroller.addEventListener("scroll", updateEditorFades);

    const resizeObserver = new ResizeObserver(updateEditorFades);
    resizeObserver.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", updateEditorFades);
      resizeObserver.disconnect();
    };
  }, [
    isFileManagerCollapsed,
    selectedCode,
    selectedOpenFile?.name,
    updateEditorFades,
  ]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.root}>
        {/* File Tabs */}
        {localOpenFiles.length > 0 && !hideFileTabs && (
          <div
            className={`${styles.tabsViewport} ${
              showTabsStartFade ? styles.tabsViewportStartFadeVisible : ""
            } ${
              showTabsEndFade ? styles.tabsViewportFadeVisible : ""
            }`}
          >
            <div
              ref={tabsRowRef}
              className={`${styles.tabsRow} ${
                isFileManagerCollapsed
                  ? styles.tabsRowCollapsed
                  : styles.tabsRowExpanded
              }`}
            >
              {localOpenFiles.map((file, idx) => (
                <DraggableTab
                  key={`${file.name}-${idx}`}
                  file={file}
                  index={idx}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                  onCloseFile={onCloseFile}
                  moveTab={moveTab}
                  getFileIcon={getFileIcon}
                  enableDragToTutor={enableDragToTutor}
                  isAiChanged={!!(file.name && aiChangedFiles?.[file.name])}
                />
              ))}
            </div>
          </div>
        )}

        {planActionBar ? (
          <div
            className={`${styles.planActionBar} ${
              isFileManagerCollapsed ? styles.planActionBarCollapsed : ""
            }`}
          >
            {planActionBar}
          </div>
        ) : null}

        {/* Code Content */}
        <div className={styles.contentWrap}>
          {localOpenFiles.length === 0 ? (
            <EmptyState
              heading="No files open"
              description="Open a file from the file manager to start coding your project."
              imageSrc={emptyStateNoFilesOpen}
              actions={onCreateFile ? (
                <AppButton
                  variant="primary"
                  tone="purple"
                  size="s"
                  iconName="plus"
                  onClick={onCreateFile}
                >
                  Create file
                </AppButton>
              ) : undefined}
            />
          ) : selectedOpenFile && selectedCode != null && contentOverride ? (
            contentOverride({
              code: selectedCode,
              file: selectedOpenFile,
              hasProposed: Boolean(hasProposed),
            })
          ) : selectedOpenFile?.type === "image" && selectedCode != null ? (
            <div className={styles.imagePreviewPane}>
              {isRenderableImageSource(selectedCode) ? (
                <img
                  src={selectedCode}
                  alt={selectedOpenFile.name}
                  className={styles.imagePreview}
                />
              ) : (
                <div className={styles.imagePreviewUnavailable}>
                  <p className={styles.imagePreviewTitle}>Image preview unavailable</p>
                  <p className={styles.imagePreviewText}>
                    This image file does not have a browser-readable source.
                  </p>
                </div>
              )}
            </div>
          ) : selectedOpenFile && selectedCode != null ? (
            <div
              ref={contentPadRef}
              className={`${styles.contentPad} ${
                isFileManagerCollapsed
                  ? styles.contentPadCollapsed
                  : styles.contentPadExpanded
              } ${
                showEditorTopFade ? styles.contentPadTopFadeVisible : ""
              } ${
                showEditorBottomFade ? styles.contentPadBottomFadeVisible : ""
              }`}
            >
              <CodeMirrorHost
                code={selectedCode}
                language={selectedOpenFile.type}
                fileName={selectedOpenFile.name}
                readOnly={readOnly ?? (isAiChangedFile || devReadOnlyOverride)}
                originalCode={hasProposed ? selectedOpenFile!.content : undefined}
                onChange={(nextCode) => {
                  onFileContentChange?.(selectedOpenFile.name, nextCode);
                }}
              />
            </div>
          ) : (
            <div className={styles.emptySelection}>
              <p>Select a file to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
