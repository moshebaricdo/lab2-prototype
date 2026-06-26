import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import emptyStateNoFilesOpen from "../../../../assets/empty-states/empty-state-no-files-open.svg";
import type { FileItem } from "../../../../types/file";
import { getFileTypeIconConfigForFileItem } from "../../../../lib/fileTypeIcons";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { Tooltip } from "../../../ui/Tooltip";
import { EmptyState } from "../EmptyState";
import { CodeMirrorHost } from "./CodeMirrorHost";
import { useEditorReadOnlyOverride } from "../../../../hooks/useEditorReadOnly";
import type { FileTabVariant } from "../../../../types/ui";
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
  /** Chip tabs (default) or full-row edge tabs (Cursor-style). */
  fileTabVariant?: FileTabVariant;
  /** Edge tabs only — square file-manager opener when the panel is collapsed. */
  onFileManagerExpand?: () => void;
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
  enableDragToTutor?: boolean;
  isAiChanged?: boolean;
  variant?: FileTabVariant;
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
  enableDragToTutor = false,
  isAiChanged = false,
  variant = "chip",
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
  const fileIcon = getFileTypeIconConfigForFileItem(file);
  const isEdge = variant === "edge";

  const tabStateClass = isEdge
    ? isAiChanged
      ? isActive
        ? styles.tabEdgeAiChangedActive
        : styles.tabEdgeAiChanged
      : isActive
        ? styles.tabEdgeActive
        : styles.tabEdgeIdle
    : isAiChanged
      ? isActive
        ? styles.tabAiChangedActive
        : styles.tabAiChanged
      : isActive
        ? styles.tabActive
        : styles.tabIdle;

  const iconStateClass = isEdge
    ? isActive
      ? styles.tabEdgeIconActive
      : styles.tabEdgeIconInactive
    : isActive
      ? styles.tabIconActive
      : styles.tabIconInactive;

  const nameStateClass = isEdge
    ? isActive
      ? styles.tabEdgeNameActive
      : styles.tabEdgeNameInactive
    : isActive
      ? styles.tabNameActive
      : styles.tabNameInactive;

  return (
    <div
      ref={ref}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onFileSelect(file)}
      onDragStart={handleTabDragStart}
      className={`${isEdge ? styles.tabEdge : styles.tab} ${
        enableDragToTutor ? styles.tabDragToTutor : ""
      } ${tabStateClass} ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className={styles.tabIconWrap}>
        <FaIcon
          family={fileIcon.family}
          name={fileIcon.name}
          size="s"
          className={`${styles.tabIcon} ${iconStateClass}`}
        />
      </div>
      <p className={`${styles.tabName} ${nameStateClass}`}>
        {file.name}
      </p>
      <button
        type="button"
        aria-label={`Close ${file.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onCloseFile(file);
        }}
        className={isEdge ? styles.tabEdgeClose : styles.tabClose}
      >
        <span className={`${styles.tabCloseIcon} ${iconStateClass}`}>
          <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
        </span>
      </button>
    </div>
  );
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
  fileTabVariant = "chip",
  onFileManagerExpand,
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

  const showTabBar =
    !hideFileTabs &&
    (localOpenFiles.length > 0 ||
      (fileTabVariant === "edge" && onFileManagerExpand));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.root}>
        {showTabBar ? (
          <div
            className={`${styles.tabsViewport} ${
              fileTabVariant === "edge" ? styles.tabsViewportEdge : ""
            } ${
              fileTabVariant === "edge" && onFileManagerExpand
                ? styles.tabsViewportEdgeWithFileManager
                : ""
            } ${
              showTabsStartFade ? styles.tabsViewportStartFadeVisible : ""
            } ${
              showTabsEndFade ? styles.tabsViewportFadeVisible : ""
            }`}
          >
            {fileTabVariant === "edge" && onFileManagerExpand ? (
              <Tooltip
                content="Open file manager"
                position="bottom"
                sideOffset={4}
              >
                <button
                  type="button"
                  className={styles.tabEdgeFileManager}
                  onClick={onFileManagerExpand}
                  aria-label="Open file manager"
                >
                  <FaIcon
                    name="folder"
                    size="s"
                    className={styles.tabEdgeFileManagerIcon}
                  />
                </button>
              </Tooltip>
            ) : null}
            <div
              ref={tabsRowRef}
              role="tablist"
              aria-label="Open files"
              className={`${styles.tabsRow} ${
                fileTabVariant === "edge" ? styles.tabsRowEdge : ""
              } ${
                isFileManagerCollapsed
                  ? fileTabVariant === "edge"
                    ? styles.tabsRowEdgeCollapsed
                    : styles.tabsRowCollapsed
                  : fileTabVariant === "edge"
                    ? styles.tabsRowEdgeExpanded
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
                  enableDragToTutor={enableDragToTutor}
                  isAiChanged={!!(file.name && aiChangedFiles?.[file.name])}
                  variant={fileTabVariant}
                />
              ))}
            </div>
          </div>
        ) : null}

        {planActionBar ? (
          <div
            className={`${styles.planActionBar} ${
              isFileManagerCollapsed ? styles.planActionBarCollapsed : ""
            }`}
          >
            {planActionBar}
          </div>
        ) : null}

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
