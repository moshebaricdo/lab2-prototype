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
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "./ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { FileContextMenu } from "./FileContextMenu";
import { FileManagerDropdown } from "./FileManagerDropdown";

export type FileItem = {
  name: string;
  type: "folder" | "file" | "html" | "css" | "image" | "text";
  children?: FileItem[];
  content?: string;
  locked?: boolean;
};

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
        <div key={itemPath} className="w-full relative">
          {/* Vertical connector line from parent to siblings */}
          {showConnector && !isLast && (
            <div
              className="absolute w-[1px] bg-[#B7C1CB] z-20"
              style={{
                left: `${paddingLeft - 14}px`, // 14px before the icon
                top: "24px", // Start after this item
                height: "calc(100% + 2px)", // Extend to cover gap
              }}
            />
          )}

          <div
            className={`h-[24px] relative shrink-0 w-full`}
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
              className="box-border content-stretch flex items-center h-[24px] relative w-full cursor-pointer pr-[8px]"
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
              {/* Hover background - full width */}
              {isHovered && (
                <div className="absolute inset-0 bg-[#dfe3e9] rounded z-0" />
              )}

              <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0 z-30">
                <div className="box-border content-stretch flex items-center justify-center h-[14px] pb-px pt-0 px-px relative shrink-0 w-[12px]">
                  <FontAwesomeIcon
                    icon={
                      item.type === "css"
                        ? faCss3
                        : getFileIcon(item, isOpen)
                    }
                    className="text-[12px] text-[#576575] leading-[normal]"
                  />
                </div>
                <div
                  className={`flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap ${
                    isSelected ? "font-semibold" : "font-normal"
                  }`}
                >
                  <p className="leading-[19.68px] whitespace-pre font-bold font-normal">
                    {item.name}
                  </p>
                </div>
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
                        className="content-stretch flex items-center justify-center relative rounded shrink-0 z-30 hover:bg-[#d4dae1] transition-colors p-1"
                      >
                        <FontAwesomeIcon
                          icon={faEllipsisVertical}
                          className="text-[10px] text-[#69788a] w-[13px]"
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
            </div>
          </div>

          {hasChildren && isOpen && (
            <div className="relative">
              {/* Vertical line for children of this folder */}
              <div
                className="absolute w-[1px] bg-[#B7C1CB] z-20"
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
      <div className="bg-white content-stretch flex flex-col h-full max-w-[32px] overflow-clip relative shrink-0 w-[32px] pt-[0px] pr-[0px] pb-[0px] pl-[2px]">
        {/* Panel Header with folder button - aligned with code editor tabs */}
        <div className="flex px-0 pt-[8px] pb-[4px] pl-[4px]">
          <button
            onClick={onToggleCollapse}
            className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded shrink-0 border border-[#b7c1cb] hover:bg-[#f0f2f5] transition-colors h-[24px] w-[24px]"
          >
            <FontAwesomeIcon
              icon={faFolder}
              className="text-[13px] text-[#292f36] w-[16px]"
            />
          </button>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="bg-[#f0f2f5] relative size-full flex flex-col">
      {/* Panel Header */}
      <div className="min-h-[32px] relative shrink-0 w-full">
        <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex items-center justify-between min-h-inherit pl-[16px] pr-[10px] py-[8px] relative w-full">
            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
              <div className="flex flex-col font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap">
                <p className="leading-[19.68px] whitespace-pre">
                  My Files
                </p>
              </div>
            </div>

            <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0">
              <Popover open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                <PopoverTrigger asChild>
                  <button className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded shrink-0 hover:bg-[#d4dae1] transition-colors h-[24px] w-[24px]">
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="text-[13px] text-[#69788a] w-[16px]"
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
                className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded shrink-0 hover:bg-[#d4dae1] transition-colors h-[24px] w-[24px]"
              >
                <FontAwesomeIcon
                  icon={faArrowLeft}
                  className="text-[13px] text-[#69788a] w-[16px]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex flex-col gap-[2px] items-start px-[8px] py-0 relative w-full">
              {renderFileTree(fileStructure)}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div
        aria-hidden="true"
        className="absolute border-[#d4dae1] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none"
      />
    </div>
  );
}