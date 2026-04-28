import { useMemo, useState } from "react";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { FileContextMenu } from "./FileContextMenu";
import { AppActionDropdown } from "../../ui/AppDropdown";
import { FaIcon } from "../../ui/icons/FaIcon";
import { AppButton } from "../../ui/AppButton";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import type { FileItem } from "../../../types/file";
import styles from "./FileManager.module.scss";

const FILE_TREE_DRAG_MIME = "application/x-weblab-file-tree-item";

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
  onRenameFile?: (file: FileItem, path: string) => void;
  onAddFileToChat?: (file: FileItem, path: string) => void;
  onDeleteFile?: (file: FileItem, path: string) => void;
  onMoveItem?: (sourcePath: string, targetFolderPath: string) => true | string | void;
  enableDragToTutor?: boolean;
  aiChangedFiles?: Record<string, "new" | "modified" | "deleted">;
  /** Hide placeholder tree entries that are not backed by editable file content. */
  showOnlyFilesWithContent?: boolean;
  showRightBorder?: boolean;
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

function mimeTypeForFile(fileName: string, fileType: FileItem["type"]): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "html" || extension === "htm" || fileType === "html") return "text/html";
  if (extension === "css" || fileType === "css") return "text/css";
  if (extension === "js" || extension === "mjs") return "text/javascript";
  if (extension === "json") return "application/json";
  if (extension === "md" || extension === "txt" || fileType === "text") return "text/plain";
  if (extension === "csv") return "text/csv";
  return "text/plain";
}

function downloadFile(item: FileItem) {
  if (typeof document === "undefined") return;
  const content = item.proposedContent ?? item.content ?? "";
  const blob = new Blob([content], { type: mimeTypeForFile(item.name, item.type) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  onRenameFile,
  onAddFileToChat,
  onDeleteFile,
  onMoveItem,
  enableDragToTutor = false,
  aiChangedFiles,
  showOnlyFilesWithContent = false,
  showRightBorder = true,
}: FileManagerProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(
    null,
  );
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(
    null,
  );
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const visibleFileStructure = useMemo(
    () => showOnlyFilesWithContent
      ? filterFilesWithContent(fileStructure)
      : fileStructure,
    [fileStructure, showOnlyFilesWithContent],
  );

  const getFileIconName = (item: FileItem, isOpen: boolean): FaIconName => {
    if (item.type === "folder") {
      return isOpen ? "folder-open" : "folder";
    }
    switch (item.type) {
      case "html":
        return "file-code";
      case "css":
        return "file-brackets-curly";
      case "text":
        return "file-lines";
      case "image":
        return "image";
      default:
        return "file-code";
    }
  };

  const canDropOnFolder = (sourcePath: string | null, targetPath: string) => {
    if (!sourcePath || !onMoveItem) return false;
    if (sourcePath === targetPath) return false;
    if (targetPath.startsWith(`${sourcePath}/`)) return false;
    return true;
  };

  const renderFileTree = (
    items: FileItem[],
    level = 0,
    parentPath = "",
  ) => {
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
      const isDraggableTreeItem = Boolean(onMoveItem && parentPath);
      const isFolderDropTarget =
        item.type === "folder" && dropTargetPath === itemPath;
      const aiChangeStatus = aiChangedFiles?.[item.name];
      const isAiChanged = !!aiChangeStatus;
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
            <button
              type="button"
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
            >
              <div className={styles.rowMain}>
                <div className={styles.fileIconWrap}>
                  {isAiChanged ? (
                    <span className={styles.changeDot} />
                  ) : (
                    <FaIcon
                      name={getFileIconName(item, isOpen)}
                      size="s"
                      className={styles.fileIcon}
                    />
                  )}
                </div>
                <p className={`${styles.fileName} ${isSelected ? styles.fileNameSelected : ""}`}>
                  {item.name}
                </p>
              </div>

              {isHovered &&
                !hasChildren &&
                item.type !== "folder" && (
                  <Popover
                    open={openMenuPath === itemPath}
                    onOpenChange={(open) => {
                      setOpenMenuPath(open ? itemPath : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={styles.menuTrigger}
                      >
                        <FaIcon
                          name="ellipsis-vertical"
                          size="s"
                          className={styles.menuIcon}
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border-0 shadow-none bg-transparent"
                      align="start"
                      sideOffset={4}
                    >
                      <FileContextMenu
                        onRename={onRenameFile
                          ? () => {
                              onRenameFile(item, itemPath);
                              setOpenMenuPath(null);
                            }
                          : undefined}
                        onAddToChat={onAddFileToChat
                          ? () => {
                              onAddFileToChat(item, itemPath);
                              setOpenMenuPath(null);
                            }
                          : undefined}
                        onDownload={() => {
                          downloadFile(item);
                          setOpenMenuPath(null);
                        }}
                        onSaveToBackpack={() => {
                          console.log("Save to backpack", item.name);
                          setOpenMenuPath(null);
                        }}
                        onDelete={onDeleteFile
                          ? () => {
                              onDeleteFile(item, itemPath);
                              setOpenMenuPath(null);
                            }
                          : undefined}
                      />
                    </PopoverContent>
                  </Popover>
                )}
            </button>
          </div>

          {hasChildren && isOpen && (
            <div className={styles.childrenWrap}>
              {/* Vertical line for children of this folder */}
              <div
                className={styles.childrenConnector}
                style={{
                  left: `${paddingLeft + 6}px`, // Center of parent icon
                  top: 0,
                  height: `${(item.children!.length - 1) * 24 + 12}px`,
                }}
              />
              {renderFileTree(
                item.children!,
                level + 1,
                itemPath,
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
      <div className={styles.collapsedRoot}>
        {/* Panel Header with folder button - aligned with code editor tabs */}
        <div className={styles.collapsedHeader}>
          <AppButton
            onClick={onToggleCollapse}
            iconName="folder"
            variant="secondary"
            tone="gray"
            size="xs"
          />
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
                  { id: "import-backpack", label: "Import from Backpack", iconName: "backpack" as FaIconName, onSelect: () => console.log("Import from backpack") },
                ]}
              />
              <AppButton
                onClick={onToggleCollapse}
                iconName="arrow-left-to-line"
                variant="tertiary"
                tone="gray"
                size="xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className={styles.listContainer}>
          <div className="size-full">
            <div className={styles.listContent}>
              {renderFileTree(visibleFileStructure)}
            </div>
          </div>
        </div>
      </ScrollArea>

      {showRightBorder && (
        <div aria-hidden="true" className={styles.borderOverlay} />
      )}
    </div>
  );
}
