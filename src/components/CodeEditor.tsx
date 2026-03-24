import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCode,
  faXmark,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "./ui/scroll-area";
import type { FileItem } from "./FileManager";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EmptyState } from "./EmptyState";

interface CodeEditorProps {
  openFiles: FileItem[];
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onCloseFile: (file: FileItem) => void;
  onReorderFiles: (files: FileItem[]) => void;
  isFileManagerCollapsed?: boolean;
  onCreateFile?: () => void;
}

interface DraggableTabProps {
  file: FileItem;
  index: number;
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onCloseFile: (file: FileItem) => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  getFileIcon: (file: FileItem) => any;
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
}: DraggableTabProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      onClick={() => onFileSelect(file)}
      className={`box-border content-stretch flex gap-2 items-center overflow-clip px-2 py-[2px] rounded cursor-pointer transition-colors ${
        selectedFile?.name === file.name
          ? "bg-[#0093a4]"
          : "bg-[#f0f2f5] hover:bg-[#dfe3e9]"
      } ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-0 shrink-0 w-3">
        <div
          className={`flex flex-col justify-center leading-[0] not-italic shrink-0 text-xs text-center text-nowrap ${
            selectedFile?.name === file.name
              ? "text-white"
              : "text-[#69788a]"
          }`}
        >
          <FontAwesomeIcon
            icon={getFileIcon(file)}
            className="leading-[normal]"
          />
        </div>
      </div>
      <div className="content-stretch flex gap-2 items-center shrink-0">
        <div
          className={`flex flex-col justify-center leading-[0] not-italic shrink-0 text-xs text-center text-nowrap ${
            selectedFile?.name === file.name
              ? "text-white font-semibold"
              : "text-[#576575]"
          }`}
        >
          <p className="leading-[19.68px] whitespace-pre">
            {file.name}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCloseFile(file);
        }}
        className="content-stretch flex items-center justify-center rounded shrink-0 hover:bg-black/10 transition-colors"
      >
        <div
          className={`flex flex-col justify-center leading-[0] not-italic shrink-0 text-[10px] text-center w-[13px] ${
            selectedFile?.name === file.name
              ? "text-white"
              : "text-[#69788a]"
          }`}
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="leading-[1.25]"
          />
        </div>
      </button>
    </div>
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
}: CodeEditorProps) {
  const [activeLine, setActiveLine] = useState<number>(0);
  const [localOpenFiles, setLocalOpenFiles] =
    useState(openFiles);
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const lineNumbersScrollRef = useRef<HTMLDivElement>(null);

  // Update local state when openFiles prop changes
  if (openFiles !== localOpenFiles) {
    setLocalOpenFiles(openFiles);
  }

  // Set first line as active when file changes
  useEffect(() => {
    if (selectedFile) {
      setActiveLine(0);
    }
  }, [selectedFile]);

  const getFileIcon = (file: FileItem) => {
    if (file.type === "css") {
      return faCss3;
    }
    return faFileCode;
  };

  const moveTab = (dragIndex: number, hoverIndex: number) => {
    const newFiles = [...localOpenFiles];
    const draggedFile = newFiles[dragIndex];
    newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedFile);
    setLocalOpenFiles(newFiles);
    onReorderFiles(newFiles);
  };

  // Synchronize scroll between line numbers and code
  const handleCodeScroll = () => {
    if (codeScrollRef.current && lineNumbersScrollRef.current) {
      lineNumbersScrollRef.current.scrollTop =
        codeScrollRef.current.scrollTop;
    }
  };

  const applySyntaxHighlighting = (line: string) => {
    // Simple syntax highlighting for HTML and CSS
    let highlightedLine = line
      // HTML Comments and DOCTYPE
      .replace(
        /(<!DOCTYPE[^>]*>)/g,
        '<span class="syntax-comment">$1</span>',
      )
      .replace(
        /(<!--[\s\S]*?-->)/g,
        '<span class="syntax-comment">$1</span>',
      )
      // HTML Tags - match < (escaped <) and wrap tag name in span
      .replace(
        /(<\/?)([\w]+)/g,
        '$1<span class="syntax-tag">$2</span>',
      )
      // HTML Attributes
      .replace(
        /\s([\w-]+)=/g,
        ' <span class="syntax-attribute">$1</span>=',
      )
      // Strings (quoted values)
      .replace(
        /&quot;([^&]*)&quot;/g,
        '&quot;<span class="syntax-string">$1</span>&quot;',
      )
      .replace(
        /&#x27;([^&]*)&#x27;/g,
        '&#x27;<span class="syntax-string">$1</span>&#x27;',
      )
      // CSS Properties (simple pattern for color, background, etc.)
      .replace(
        /\b(color|background|padding|margin|border|display|position|font-family|font-size|font-weight|line-height|text-align|width|height|max-width|gap|flex|grid|justify-content|align-items|transition|border-radius|box-shadow|cursor|opacity|overflow|z-index|top|left|right|bottom):/g,
        '<span class="syntax-attribute">$1</span>:',
      )
      // CSS Values with units or keywords
      .replace(
        /:\s*([^;{}\"]+);/g,
        ': <span class="syntax-string">$1</span>;',
      );

    return highlightedLine;
  };

  const renderCodeLines = (code: string) => {
    const lines = code.split("\n");

    return (
      <div className="flex flex-1 min-w-0 overflow-hidden pt-[1px] gap-[4px] pr-[0px] pb-[0px] pl-[0px]">
        {/* Sticky Line Numbers Column */}
        <div
          ref={lineNumbersScrollRef}
          className={`shrink-0 overflow-hidden ${
            isFileManagerCollapsed
              ? "min-w-[32px]"
              : "min-w-[32px]"
          }`}
          style={{ overflowY: "hidden" }}
        >
          <div className="flex flex-col gap-[2px] pt-[1.5px] pr-[0px] pb-[0px] pl-[0px]">
            {lines.map((_, lineIndex) => (
              <div
                key={`line-num-${lineIndex}`}
                onClick={() => setActiveLine(lineIndex)}
                className={`cursor-pointer transition-colors ${
                  lineIndex === activeLine
                    ? "bg-[#f0f2f5] border border-[#d4dae1] rounded"
                    : "hover:bg-[#f0f2f5]/50"
                }`}
              >
                <div
                  className={`box-border flex flex-col items-end justify-center ${
                    isFileManagerCollapsed
                      ? "pl-0 pr-1"
                      : "pl-0 pr-1"
                  }`}
                >
                  <p
                    className={`leading-[21.56px] text-[14px] text-right ${
                      lineIndex === activeLine
                        ? "text-foreground"
                        : "text-[#69788a]"
                    }`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {lineIndex + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Code Content Column */}
        <div
          ref={codeScrollRef}
          className="flex-1 gap-[2px] overflow-auto"
          onScroll={handleCodeScroll}
        >
          <div className="inline-flex flex-col gap-[2px] min-w-full">
            {lines.map((line, lineIndex) => (
              <div
                key={`code-line-${lineIndex}`}
                onClick={() => setActiveLine(lineIndex)}
                className={`cursor-pointer transition-colors ${
                  lineIndex === activeLine
                    ? "bg-[#f0f2f5] border border-[#d4dae1] rounded"
                    : "hover:bg-[#f0f2f5]/50"
                }`}
              >
                <div className="pl-[6px]">
                  <p
                    className="leading-[21.56px] text-[14px] text-foreground whitespace-pre"
                    style={{ fontFamily: "var(--font-mono)" }}
                    dangerouslySetInnerHTML={{
                      __html:
                        applySyntaxHighlighting(line) || " ",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Convert HTML entities for display
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 bg-white flex flex-col min-w-0 h-full">
        {/* File Tabs */}
        {localOpenFiles.length > 0 && (
          <div
            className={`flex pt-2 pb-1 ${
              isFileManagerCollapsed
                ? "px-0 gap-1 pl-1"
                : "px-2 gap-2"
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
              />
            ))}
          </div>
        )}

        {/* Code Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {localOpenFiles.length === 0 ? (
            <EmptyState
              heading="No files open"
              description="Create a new file or open one from the file manager to start coding your project."
            />
          ) : selectedFile?.content ? (
            <div
              className={`flex-1 pt-1 pb-2 flex overflow-hidden ${
                isFileManagerCollapsed ? "pl-1 pr-0" : "px-2"
              }`}
            >
              {renderCodeLines(
                escapeHtml(selectedFile.content),
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Select a file to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
