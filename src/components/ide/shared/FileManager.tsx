import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ScrollArea } from "../../ui/scroll-area";
import { AppActionDropdown } from "../../ui/AppDropdown";
import { FaIcon } from "../../ui/icons/FaIcon";
import { AppButton } from "../../ui/AppButton";
import { Tooltip } from "../../ui/Tooltip";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import type { FileItem } from "../../../types/file";
import { getFileTypeIconConfigForFileItem } from "../../../lib/fileTypeIcons";
import styles from "./FileManager.module.scss";

const FILE_TREE_DRAG_MIME = "application/x-weblab-file-tree-item";
const PLAN_FOLDER_NAME = "Plans";
const PLAN_FILE_EXTENSION = ".md";

interface FileManagerProps {
  fileStructure: FileItem[];
  selectedFile: FileItem | null;
  openFolders: Set<string>;
  onFileSelect: (file: FileItem) => void;
  onToggleFolder: (folderName: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onNewPlan?: () => void;
  onUploadFiles?: (files: FileList) => Promise<true | string | void> | true | string | void;
  uploadAccept?: string;
  onRenameFile?: (file: FileItem, path: string) => void;
  onAddFileToChat?: (file: FileItem, path: string) => void;
  onDeleteFile?: (file: FileItem, path: string) => void;
  onMoveItem?: (sourcePath: string, targetFolderPath: string) => true | string | void;
  enableDragToTutor?: boolean;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
  builtPlanPaths?: Set<string>;
  /** Hide placeholder tree entries that are not backed by editable file content. */
  showOnlyFilesWithContent?: boolean;
  showRightBorder?: boolean;
  transparentCollapsedBackground?: boolean;
}

function hasFileContent(item: FileItem): boolean {
  return "content" in item || "proposedContent" in item;
}

function filterFilesWithContent(items: FileItem[]): FileItem[] {
  return items.flatMap((item) => {
    if (item.type !== "folder") {
      return hasFileContent(item) ? [item] : [];
    }

    const children = item.children ? filterFilesWithContent(item.children) : [];
    const isNewEmptyFolder = !item.children || item.children.length === 0;
    return children.length > 0 || isNewEmptyFolder ? [{ ...item, children }] : [];
  });
}

function isPlanFolder(item: FileItem) {
  return item.type === "folder" && item.name === PLAN_FOLDER_NAME;
}

function isPlanFile(item: FileItem) {
  return item.type !== "folder" && item.name.toLowerCase().endsWith(PLAN_FILE_EXTENSION);
}

function splitPlanFiles(items: FileItem[]): {
  projectItems: FileItem[];
  planFiles: Array<{ file: FileItem; path: string }>;
} {
  const planFiles: Array<{ file: FileItem; path: string }> = [];

  const projectItems = items.flatMap((item) => {
    if (isPlanFolder(item)) {
      for (const child of item.children ?? []) {
        if (isPlanFile(child)) {
          planFiles.push({ file: child, path: `${PLAN_FOLDER_NAME}/${child.name}` });
        }
      }
      return [];
    }

    if (item.children) {
      const split = splitPlanFiles(item.children);
      planFiles.push(...split.planFiles);
      return [{ ...item, children: split.projectItems }];
    }

    return [item];
  });

  return { projectItems, planFiles };
}

function mimeTypeForFile(fileName: string, fileType: FileItem["type"]): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "html" || extension === "htm" || fileType === "html") return "text/html";
  if (extension === "css" || fileType === "css") return "text/css";
  if (extension === "js" || extension === "mjs") return "text/javascript";
  if (extension === "py" || fileType === "python") return "text/x-python";
  if (extension === "json") return "application/json";
  if (extension === "md" || extension === "txt" || fileType === "text") return "text/plain";
  if (extension === "csv") return "text/csv";
  return "text/plain";
}

function downloadFile(item: FileItem) {
  if (typeof document === "undefined") return;
  const content = item.proposedContent ?? item.content ?? "";
  const shouldUseDataUrl = item.type === "image" && content.startsWith("data:");
  const url = shouldUseDataUrl
    ? content
    : URL.createObjectURL(new Blob([content], { type: mimeTypeForFile(item.name, item.type) }));
  const link = document.createElement("a");
  link.href = url;
  link.download = item.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (!shouldUseDataUrl) URL.revokeObjectURL(url);
}

export function FileManager({
  fileStructure,
  selectedFile,
  openFolders,
  onFileSelect,
  onToggleFolder,
  collapsed = false,
  onToggleCollapse,
  onNewFile,
  onNewFolder,
  onNewPlan,
  onUploadFiles,
  uploadAccept,
  onRenameFile,
  onAddFileToChat,
  onDeleteFile,
  onMoveItem,
  enableDragToTutor = false,
  aiChangedFiles,
  builtPlanPaths,
  showOnlyFilesWithContent = false,
  showRightBorder = true,
  transparentCollapsedBackground = false,
}: FileManagerProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(
    null,
  );
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(
    null,
  );
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const visibleFileStructure = useMemo(
    () => showOnlyFilesWithContent
      ? filterFilesWithContent(fileStructure)
      : fileStructure,
    [fileStructure, showOnlyFilesWithContent],
  );
  const { projectItems, planFiles } = useMemo(
    () => splitPlanFiles(visibleFileStructure),
    [visibleFileStructure],
  );

  const isBuiltPlanFile = (item: FileItem, itemPath: string) => {
    if (!itemPath.startsWith(`${PLAN_FOLDER_NAME}/`) || !isPlanFile(item)) {
      return false;
    }
    const content = item.content ?? "";
    return builtPlanPaths?.has(itemPath) || /\bStatus:\s*Completed\b/i.test(content);
  };

  const getFileIcon = (item: FileItem, isOpen: boolean) =>
    getFileTypeIconConfigForFileItem(item, isOpen);

  const canDropOnFolder = (sourcePath: string | null, targetPath: string) => {
    if (!sourcePath || !onMoveItem) return false;
    if (sourcePath === targetPath) return false;
    if (targetPath.startsWith(`${sourcePath}/`)) return false;
    return true;
  };

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0 || !onUploadFiles) return;

    setIsUploadingFiles(true);
    setUploadError(null);
    void Promise.resolve(onUploadFiles(files))
      .then((result) => {
        if (typeof result === "string") {
          setUploadError(result);
        }
      })
      .catch((error) => {
        console.error("[FileManager] File upload failed", error);
        setUploadError("Unable to upload those files.");
      })
      .finally(() => {
        setIsUploadingFiles(false);
        event.currentTarget.value = "";
      });
  };

  const renderFileTree = (
    items: FileItem[],
    level = 0,
    parentPath = "",
    options: { allowTreeItemDrag?: boolean } = {},
  ) => {
    const { allowTreeItemDrag = true } = options;
    return items.map((item, idx) => {
      const itemPath = parentPath
        ? `${parentPath}/${item.name}`
        : item.name;
      const isOpen = openFolders.has(itemPath);
      const isSelected = selectedFile?.name === item.name;
      const isHovered = hoveredItem === itemPath;
      const hasChildren =
        item.children && item.children.length > 0;
      const isDraggableFile =
        enableDragToTutor && item.type !== "folder" && !hasChildren;
      const isDraggableTreeItem = Boolean(allowTreeItemDrag && onMoveItem && parentPath);
      const isFolderDropTarget =
        item.type === "folder" && dropTargetPath === itemPath;
      const aiChangeStatus = aiChangedFiles?.[item.name];
      const isAiChanged = !!aiChangeStatus;
      const isPlanTreeFile = itemPath.startsWith(`${PLAN_FOLDER_NAME}/`) && isPlanFile(item);
      const showConnector = level > 0;
      const isLast = idx === items.length - 1;

      // totalIndent = where content (icon) starts, used for connector positioning.
      // For nested items, the button's left edge aligns to the tree connector
      // line so the hover fill touches it flush.
      const totalIndent = level === 0 ? 8 : 28 + (level - 1) * 20;
      const connectorPos = totalIndent - 14;
      const indentMargin = level === 0 ? 0 : connectorPos;
      const innerPadding = totalIndent - indentMargin;
      const paddingLeft = totalIndent;

      return (
        <div key={itemPath} className={styles.treeItemWrap}>
          {/* Vertical connector line from parent to siblings */}
          {showConnector && !isLast && (
            <div
              className={styles.siblingConnector}
              style={{
                left: `${paddingLeft - 14}px`, // 14px before the icon
                top: "24px", // Start after this item
                height: "calc(100% + 2px)", // Extend to cover gap
              }}
            />
          )}

          <div
            className={styles.rowOuter}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setHoveredItem(itemPath);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setHoveredItem(null);
            }}
          >
            <div
              role="button"
              tabIndex={0}
              className={`${styles.rowButton} ${level > 0 ? styles.rowButtonNested : ""} ${isHovered ? styles.rowHovered : ""} ${isFolderDropTarget ? styles.rowDropTarget : ""}`}
              draggable={isDraggableFile || isDraggableTreeItem}
              data-draggable-file={isDraggableFile ? "true" : undefined}
              data-draggable-tree-item={isDraggableTreeItem ? "true" : undefined}
              style={{
                marginLeft: `${indentMargin}px`,
                paddingLeft: `${innerPadding}px`,
                gap: level === 0 ? "10px" : "8px",
              }}
              onDragStart={(event) => {
                if (!isDraggableFile && !isDraggableTreeItem) {
                  return;
                }
                setDraggingPath(itemPath);
                event.dataTransfer.effectAllowed = isDraggableFile ? "copyMove" : "move";
                if (isDraggableTreeItem) {
                  event.dataTransfer.setData(
                    FILE_TREE_DRAG_MIME,
                    JSON.stringify({
                      path: itemPath,
                      name: item.name,
                      type: item.type,
                    }),
                  );
                }
                if (isDraggableFile) {
                  event.dataTransfer.setData(
                    "application/x-weblab-file",
                    JSON.stringify({
                      name: item.name,
                      path: itemPath,
                      type: item.type,
                    }),
                  );
                  event.dataTransfer.setData("text/plain", itemPath);
                } else {
                  event.dataTransfer.setData("text/plain", itemPath);
                }
              }}
              onDragEnd={() => {
                setDraggingPath(null);
                setDropTargetPath(null);
              }}
              onDragOver={(event) => {
                if (item.type !== "folder" || !canDropOnFolder(draggingPath, itemPath)) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                setDropTargetPath(itemPath);
              }}
              onDragLeave={() => {
                setDropTargetPath((current) => current === itemPath ? null : current);
              }}
              onDrop={(event) => {
                if (item.type !== "folder") return;
                const rawPayload = event.dataTransfer.getData(FILE_TREE_DRAG_MIME);
                const sourcePath = draggingPath || (() => {
                  try {
                    return (JSON.parse(rawPayload) as { path?: string }).path ?? null;
                  } catch {
                    return null;
                  }
                })();

                if (!canDropOnFolder(sourcePath, itemPath)) return;
                event.preventDefault();
                event.stopPropagation();
                const result = onMoveItem?.(sourcePath, itemPath);
                if (typeof result === "string") {
                  console.warn(result);
                }
                setDraggingPath(null);
                setDropTargetPath(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (item.type === "folder") {
                  onToggleFolder(itemPath);
                } else {
                  onFileSelect(item);
                }
              }}
              onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (event.target !== event.currentTarget) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                if (item.type === "folder") {
                  onToggleFolder(itemPath);
                } else {
                  onFileSelect(item);
                }
              }}
            >
              <div className={styles.rowMain}>
                <div className={styles.fileIconWrap}>
                  {isAiChanged && !isPlanTreeFile ? (
                    <span className={styles.changeDot} />
                  ) : isPlanTreeFile && !isBuiltPlanFile(item, itemPath) ? (
                    <span className={styles.planFileIconOutline} />
                  ) : (
                    (() => {
                      const icon = isPlanTreeFile
                        ? { family: "solid" as const, name: "circle-check" as const }
                        : getFileIcon(item, isOpen);
                      return (
                        <FaIcon
                          family={icon.family}
                          name={icon.name}
                          size="s"
                          className={`${styles.fileIcon} ${isBuiltPlanFile(item, itemPath) ? styles.planFileIconBuilt : ""}`}
                        />
                      );
                    })()
                  )}
                </div>
                <p className={`${styles.fileName} ${isSelected ? styles.fileNameSelected : ""}`}>
                  {item.name}
                </p>
              </div>

              {(isHovered || openMenuPath === itemPath) &&
                !hasChildren &&
                item.type !== "folder" && (
                  <AppActionDropdown
                    open={openMenuPath === itemPath}
                    onOpenChange={(open) => {
                      setOpenMenuPath(open ? itemPath : null);
                    }}
                    align="start"
                    sideOffset={4}
                    size="xs"
                    menuWidth={180}
                    listLabel={`${item.name} actions`}
                    trigger={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={styles.menuTrigger}
                        aria-label={`${item.name} actions`}
                      >
                        <FaIcon
                          name="ellipsis-vertical"
                          size="s"
                          className={styles.menuIcon}
                        />
                      </button>
                    }
                    items={[
                      ...(onRenameFile
                        ? [{
                            id: "rename",
                            label: "Rename",
                            iconName: "pencil" as FaIconName,
                            onSelect: () => onRenameFile(item, itemPath),
                          }]
                        : []),
                      ...(onAddFileToChat
                        ? [{
                            id: "add-to-chat",
                            label: "Add to AI Tutor Chat",
                            iconName: "comment" as FaIconName,
                            onSelect: () => onAddFileToChat(item, itemPath),
                          }]
                        : []),
                      {
                        id: "download",
                        label: "Download",
                        iconName: "download" as FaIconName,
                        onSelect: () => downloadFile(item),
                      },
                      {
                        id: "save-to-backpack",
                        label: "Save to Backpack",
                        iconName: "backpack" as FaIconName,
                        onSelect: () => console.log("Save to backpack", item.name),
                      },
                      ...(onDeleteFile
                        ? [{
                            id: "delete",
                            label: "Delete",
                            iconName: "trash" as FaIconName,
                            destructive: true,
                            onSelect: () => onDeleteFile(item, itemPath),
                          }]
                        : []),
                    ]}
                  />
                )}
            </div>
          </div>

          {hasChildren && isOpen && (
            <div
              className={`${styles.childrenWrap} ${
                item.children!.length === 1 ? styles.childrenWrapSingle : ""
              }`}
            >
              {/* Vertical line for children of this folder */}
              <div
                className={styles.childrenConnector}
                style={{
                  left: `${paddingLeft + 6}px`, // Center of parent icon
                }}
              />
              {renderFileTree(
                item.children!,
                level + 1,
                itemPath,
                options,
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // Collapsed view
  if (collapsed) {
    return (
      <div className={`${styles.collapsedRoot} ${
        transparentCollapsedBackground ? styles.collapsedRootTransparent : ""
      }`}
      >
        {/* Panel Header with folder button - aligned with code editor tabs */}
        <div className={styles.collapsedHeader}>
          <Tooltip content="Open file manager" position="bottom">
            <AppButton
              onClick={onToggleCollapse}
              iconName="folder"
              variant="secondary"
              tone="gray"
              size="xs"
              aria-label="Open file manager"
            />
          </Tooltip>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={styles.expandedRoot}>
      {/* Panel Header */}
      <div className={styles.panelHeader}>
        <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
          <div className={styles.panelHeaderInner}>
            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
              <div>
                <p className={styles.title}>
                  My Files
                </p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <AppActionDropdown
                align="start"
                side="bottom"
                size="xs"
                sideOffset={4}
                trigger={
                  <AppButton
                    iconName="plus"
                    variant="tertiary"
                    tone="gray"
                    size="xs"
                  />
                }
                items={[
                  ...(onNewFile
                    ? [{ id: "new-file", label: "New File", iconName: "file" as FaIconName, onSelect: onNewFile }]
                    : []),
                  ...(onNewFolder
                    ? [{ id: "new-folder", label: "New Folder", iconName: "folder" as FaIconName, onSelect: onNewFolder }]
                    : []),
                  ...(onNewPlan
                    ? [{ id: "new-plan", label: "New Plan", iconName: "file-lines" as FaIconName, onSelect: onNewPlan }]
                    : []),
                  ...(onUploadFiles
                    ? [{
                        id: "upload-files",
                        label: isUploadingFiles ? "Uploading..." : "Upload Files",
                        iconName: "file-arrow-up" as FaIconName,
                        disabled: isUploadingFiles,
                        onSelect: () => uploadInputRef.current?.click(),
                      }]
                    : []),
                  { id: "import-backpack", label: "Import from Backpack", iconName: "backpack" as FaIconName, onSelect: () => console.log("Import from backpack") },
                ]}
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept={uploadAccept}
                multiple
                className={styles.uploadInput}
                tabIndex={-1}
                onChange={handleUploadChange}
              />
              <Tooltip content="Hide file manager" position="bottom">
                <AppButton
                  onClick={onToggleCollapse}
                  iconName="arrow-left-to-line"
                  variant="tertiary"
                  tone="gray"
                  size="xs"
                  aria-label="Hide file manager"
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadError ? (
        <p className={styles.uploadError} role="alert">
          {uploadError}
        </p>
      ) : null}
      <ScrollArea className="flex-1">
        <div className={styles.listContainer}>
          <div className="size-full">
            <div className={styles.listContent}>
              {projectItems.length === 0 ? (
                <p className={styles.emptyListText}>No files in this project</p>
              ) : (
                renderFileTree(projectItems)
              )}
            </div>
            {planFiles.length > 0 && (
              <div className={styles.planSection}>
                <div className={styles.sectionHeader}>
                  <p className={styles.title}>Plans</p>
                </div>
                <div className={styles.listContent}>
                  {renderFileTree(
                    planFiles.map(({ file }) => file),
                    0,
                    PLAN_FOLDER_NAME,
                    { allowTreeItemDrag: false },
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {showRightBorder && (
        <div aria-hidden="true" className={styles.borderOverlay} />
      )}
    </div>
  );
}
