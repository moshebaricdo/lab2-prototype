import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFileCode,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "../../ui/scroll-area";
import type { FileItem } from "../../../types/file";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EmptyState } from "./EmptyState";
import styles from "./CodeEditor.module.scss";

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
  getFileIcon: (file: FileItem) => IconDefinition;
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
      className={`${styles.tab} ${
        selectedFile?.name === file.name ? styles.tabActive : styles.tabIdle
      } ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className={styles.tabIconWrap}>
        <FontAwesomeIcon
          icon={getFileIcon(file)}
          className={`${styles.tabIcon} ${
            selectedFile?.name === file.name ? styles.tabIconActive : styles.tabIconInactive
          }`}
        />
      </div>
      <p
        className={`${styles.tabName} ${
          selectedFile?.name === file.name ? styles.tabNameActive : styles.tabNameInactive
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
            selectedFile?.name === file.name ? styles.tabIconActive : styles.tabIconInactive
          }`}
        >
          <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
        </span>
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
      <div className={styles.lineLayout}>
        {/* Sticky Line Numbers Column */}
        <div ref={lineNumbersScrollRef} className={styles.lineNumbers} style={{ overflowY: "hidden" }}>
          <div className={styles.lineNumbersColumn}>
            {lines.map((_, lineIndex) => (
              <div
                key={`line-num-${lineIndex}`}
                onClick={() => setActiveLine(lineIndex)}
                className={`${styles.lineNumberCell} ${
                  lineIndex === activeLine ? styles.lineNumberCellActive : ""
                }`}
              >
                <p
                  className={`${styles.lineNumberText} ${
                    lineIndex === activeLine
                      ? styles.lineNumberTextActive
                      : styles.lineNumberTextInactive
                  }`}
                >
                  {lineIndex + 1}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Code Content Column */}
        <div
          ref={codeScrollRef}
          className={styles.codeColumn}
          onScroll={handleCodeScroll}
        >
          <div className={styles.codeLines}>
            {lines.map((line, lineIndex) => (
              <div
                key={`code-line-${lineIndex}`}
                onClick={() => setActiveLine(lineIndex)}
                className={`${styles.codeLineCell} ${
                  lineIndex === activeLine ? styles.codeLineCellActive : ""
                }`}
              >
                <p
                  className={styles.codeLineText}
                  dangerouslySetInnerHTML={{
                    __html:
                      applySyntaxHighlighting(line) || " ",
                  }}
                />
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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.root}>
        {/* File Tabs */}
        {localOpenFiles.length > 0 && (
          <div
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
              />
            ))}
          </div>
        )}

        {/* Code Content */}
        <div className={styles.contentWrap}>
          {localOpenFiles.length === 0 ? (
            <EmptyState
              heading="No files open"
              description="Create a new file or open one from the file manager to start coding your project."
            />
          ) : selectedFile?.content ? (
            <div
              className={`${styles.contentPad} ${
                isFileManagerCollapsed
                  ? styles.contentPadCollapsed
                  : styles.contentPadExpanded
              }`}
            >
              {renderCodeLines(
                escapeHtml(selectedFile.content),
              )}
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
