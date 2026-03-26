import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowLeft,
  faFolderOpen,
  faFolder,
  faFileCode,
  faFileLines,
  faImage,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { FileContextMenu } from "./FileContextMenu";
import { FileManagerDropdown } from "./FileManagerDropdown";
import type { FileItem } from "../../../types/file";
import styles from "./FileManager.module.scss";

interface FileManagerProps {
  fileStructure: FileItem[];
  selectedFile: FileItem | null;
  openFolders: Set<string>;
  onFileSelect: (file: FileItem) => void;
  onToggleFolder: (folderName: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewFile?: () => void;
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
}: FileManagerProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(
    null,
  );
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(
    null,
  );
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const getFileIcon = (item: FileItem, isOpen: boolean) => {
    if (item.type === "folder") {
      return isOpen ? faFolderOpen : faFolder;
    }
    switch (item.type) {
      case "html":
        return faFileCode;
      case "css":
        return faCss3;
      case "text":
        return faFileLines;
      case "image":
        return faImage;
      default:
        return faFileCode;
    }
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
      const showConnector = level > 0;
      const isLast = idx === items.length - 1;

      // Calculate indentation
      // Level 0: 8px padding, 10px gap
      // Level 1+: 28px base + 20px per additional level, 8px gap
      const paddingLeft =
        level === 0 ? 8 : 28 + (level - 1) * 20;

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
              className={`${styles.rowButton} ${isHovered ? styles.rowHovered : ""}`}
              style={{
                paddingLeft: `${paddingLeft}px`,
                gap: level === 0 ? "10px" : "8px",
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
                  <FontAwesomeIcon
                    icon={
                      item.type === "css"
                        ? faCss3
                        : getFileIcon(item, isOpen)
                    }
                    className={styles.fileIcon}
                  />
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
                        <FontAwesomeIcon
                          icon={faEllipsisVertical}
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
                        onRename={() => {
                          console.log("Rename", item.name);
                          setOpenMenuPath(null);
                        }}
                        onAddToChat={() => {
                          console.log("Add to chat", item.name);
                          setOpenMenuPath(null);
                        }}
                        onDownload={() => {
                          console.log("Download", item.name);
                          setOpenMenuPath(null);
                        }}
                        onSaveToBackpack={() => {
                          console.log("Save to backpack", item.name);
                          setOpenMenuPath(null);
                        }}
                        onDelete={() => {
                          console.log("Delete", item.name);
                          setOpenMenuPath(null);
                        }}
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
                  height: `${(item.children!.length - 1) * 26 + 12}px`, // Extend to center of last child (26px per item, stop at 12px center)
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
          <button
            onClick={onToggleCollapse}
            className={styles.collapsedToggle}
          >
            <FontAwesomeIcon
              icon={faFolder}
              className={styles.collapsedIcon}
            />
          </button>
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
              <Popover open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                <PopoverTrigger asChild>
                  <button className={styles.iconBtn}>
                    <FontAwesomeIcon
                      icon={faPlus}
                      className={styles.panelIcon}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-0 shadow-none"
                  align="end"
                  sideOffset={4}
                >
                  <FileManagerDropdown
                    onNewFile={() => {
                      setIsAddMenuOpen(false);
                      onNewFile?.();
                    }}
                    onNewFolder={() => {
                      console.log("New folder");
                      setIsAddMenuOpen(false);
                    }}
                    onDownload={() => {
                      console.log("Download");
                      setIsAddMenuOpen(false);
                    }}
                    onImportFromBackpack={() => {
                      console.log("Import from backpack");
                      setIsAddMenuOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <button
                onClick={onToggleCollapse}
                className={styles.iconBtn}
              >
                <FontAwesomeIcon
                  icon={faArrowLeft}
                  className={styles.panelIcon}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className={styles.listContainer}>
          <div className="size-full">
            <div className={styles.listContent}>
              {renderFileTree(fileStructure)}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div aria-hidden="true" className={styles.borderOverlay} />
    </div>
  );
}
