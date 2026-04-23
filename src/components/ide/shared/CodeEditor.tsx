import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFileCode,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faCss3 } from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "../../ui/scroll-area";
import { AppButton } from "../../ui/AppButton";
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
  /** When true (file-drop experiment), tabs set the same native drag payload as the file manager for AI Tutor. */
  enableDragToTutor?: boolean;
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
    // Avoid text/plain so react-dnd-html5-backend doesn't cancel drop (native TEXT match).
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

  return (
    <div
      ref={ref}
      onClick={() => onFileSelect(file)}
      onDragStart={handleTabDragStart}
      className={`${styles.tab} ${
        enableDragToTutor ? styles.tabDragToTutor : ""
      } ${
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
  enableDragToTutor = false,
}: CodeEditorProps) {
  const [activeLine, setActiveLine] = useState<number>(0);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [codeScrollTop, setCodeScrollTop] = useState(0);
  const isDraggingRef = useRef(false);
  const dragAnchorRef = useRef<number>(0);
  const [localOpenFiles, setLocalOpenFiles] =
    useState(openFiles);
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const lineNumbersScrollRef = useRef<HTMLDivElement>(null);
  const codeLinesRef = useRef<HTMLDivElement>(null);

  // Update local state when openFiles prop changes
  if (openFiles !== localOpenFiles) {
    setLocalOpenFiles(openFiles);
  }

  // Clear selection + reset active line when file changes
  useEffect(() => {
    if (selectedFile) {
      setActiveLine(0);
      setSelectionRange(null);
    }
  }, [selectedFile]);

  // Dismiss selection on Escape or click outside code area
  useEffect(() => {
    if (!selectionRange) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectionRange(null);
    };
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-floating-bar]") || target.closest("[data-code-lines]") || target.closest("[data-line-numbers]")) return;
      setSelectionRange(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [selectionRange]);

  // End drag on global mouseup (handles cases where mouse leaves the code area)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleLineMouseDown = (lineIndex: number) => {
    isDraggingRef.current = true;
    dragAnchorRef.current = lineIndex;
    setActiveLine(lineIndex);
    setSelectionRange(null);
  };

  const handleLineMouseEnter = (lineIndex: number) => {
    setHoveredLine(lineIndex);
    if (isDraggingRef.current) {
      if (lineIndex !== dragAnchorRef.current) {
        setSelectionRange({ start: dragAnchorRef.current, end: lineIndex });
      } else {
        setSelectionRange(null);
      }
    }
  };

  const handleLineMouseUp = () => {
    isDraggingRef.current = false;
  };

  const isLineSelected = (lineIndex: number) => {
    if (!selectionRange) return false;
    const min = Math.min(selectionRange.start, selectionRange.end);
    const max = Math.max(selectionRange.start, selectionRange.end);
    return lineIndex >= min && lineIndex <= max;
  };

  const handleAddToTutor = () => {
    if (!selectionRange || !selectedFile) return;
    const start = Math.min(selectionRange.start, selectionRange.end) + 1;
    const end = Math.max(selectionRange.start, selectionRange.end) + 1;
    window.dispatchEvent(
      new CustomEvent("weblab:add-to-tutor", {
        detail: { fileName: selectedFile.name, startLine: start, endLine: end },
      }),
    );
    setSelectionRange(null);
  };

  const getFloatingBarPosition = () => {
    if (!selectionRange || !codeLinesRef.current || !codeScrollRef.current) {
      return { top: 0, visible: false };
    }
    const endIdx = Math.max(selectionRange.start, selectionRange.end);
    const lineEl = codeLinesRef.current.children[endIdx] as HTMLElement | undefined;
    if (!lineEl) return { top: 0, visible: false };
    const top = lineEl.offsetTop + lineEl.offsetHeight + 4 - codeScrollTop;
    const containerHeight = codeScrollRef.current.clientHeight;
    const visible = top > -10 && top < containerHeight;
    return { top, visible };
  };

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
    setCodeScrollTop(codeScrollRef.current?.scrollTop ?? 0);
  };

  // Placeholder characters used during regex passes to prevent later
  // passes from matching inside already-wrapped tokens.
  const PO = "\x01"; // span open:  \x01className\x02content\x03
  const PM = "\x02";
  const PC = "\x03";
  const W = (cls: string, text: string) => `${PO}${cls}${PM}${text}${PC}`;
  const unwrap = (s: string) =>
    s.replace(
      /\x01([^\x02]*)\x02([\s\S]*?)\x03/g,
      '<span class="syntax-$1">$2</span>',
    );

  const highlightHTML = (line: string): string => {
    if (/&lt;!--/.test(line) || /--&gt;/.test(line)) return unwrap(W("comment", line));
    if (/&lt;!DOCTYPE/i.test(line)) return unwrap(W("comment", line));

    const result = line
      .replace(
        /(&quot;)(.*?)(&quot;)/g,
        (_m, q1, val, q2) => W("punctuation", q1) + W("string", val) + W("punctuation", q2),
      )
      .replace(
        /(&#x27;)(.*?)(&#x27;)/g,
        (_m, q1, val, q2) => W("punctuation", q1) + W("string", val) + W("punctuation", q2),
      )
      .replace(
        /(&lt;\/?)([\w-]+)/g,
        (_m, bracket, tag) => W("punctuation", bracket) + W("tag", tag),
      )
      .replace(/(\/?&gt;)/g, W("punctuation", "$1"))
      .replace(
        /\s([\w-]+)(=)/g,
        (_m, attr, eq) => " " + W("attribute", attr) + W("punctuation", eq),
      );

    return unwrap(result);
  };

  const highlightCSSLine = (line: string, inComment: boolean): { out: string; inComment: boolean } => {
    if (inComment) {
      const closed = /\*\//.test(line);
      return { out: unwrap(W("comment", line)), inComment: !closed };
    }

    const trimmed = line.trimStart();

    if (/^\/\*/.test(trimmed)) {
      const closed = /\*\//.test(trimmed);
      return { out: unwrap(W("comment", line)), inComment: !closed };
    }

    if (/^\/\//.test(trimmed)) {
      return { out: unwrap(W("comment", line)), inComment: false };
    }

    // @-rules
    if (/^@/.test(trimmed)) {
      const r = line
        .replace(/(@[\w-]+)/g, W("keyword", "$1"))
        .replace(
          /(&#x27;|&quot;)(.*?)\1/g,
          (_m, q, val) => W("punctuation", q) + W("string", val) + W("punctuation", q),
        );
      return { out: unwrap(r), inComment: false };
    }

    // Property: value; lines
    const propMatch = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.+?)(;?\s*)$/);
    if (propMatch) {
      const [, indent, prop, colon, rawValue, semi] = propMatch;
      const value = rawValue
        .replace(
          /(&#x27;|&quot;)(.*?)\1/g,
          (_m, q, val) => W("punctuation", q) + W("string", val) + W("punctuation", q),
        )
        .replace(/(#[0-9a-fA-F]{3,8})\b/g, W("number", "$1"))
        .replace(
          /\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?\b/g,
          (_m, num, unit) => W("number", num) + (unit ? W("keyword", unit) : ""),
        );
      return {
        out: unwrap(indent + W("property", prop) + W("punctuation", colon) + W("value", value) + W("punctuation", semi)),
        inComment: false,
      };
    }

    // Brace-only lines
    if (/^\s*[{}]\s*$/.test(line)) {
      return { out: unwrap(line.replace(/([{}])/g, W("punctuation", "$1"))), inComment: false };
    }

    // String continuations (e.g. multi-line grid-template-areas)
    if (/^\s*(&quot;|&#x27;)/.test(line)) {
      return {
        out: unwrap(line.replace(/((&quot;|&#x27;).*?\2)/g, W("string", "$1"))),
        inComment: false,
      };
    }

    // Selector lines
    if (trimmed && !/^}/.test(trimmed)) {
      return {
        out: unwrap(line.replace(/([.#:[\]()>,+~*=\w-]+)/g, W("selector", "$1"))),
        inComment: false,
      };
    }

    return { out: line, inComment: false };
  };

  const highlightAllLines = (lines: string[]): string[] => {
    const fileType = selectedFile?.type;
    if (fileType === "css") {
      let inComment = false;
      return lines.map((line) => {
        const result = highlightCSSLine(line, inComment);
        inComment = result.inComment;
        return result.out;
      });
    }
    return lines.map(highlightHTML);
  };

  const renderCodeLines = (code: string) => {
    const lines = code.split("\n");
    const highlighted = highlightAllLines(lines);

    return (
      <div className={styles.lineLayout}>
        {/* Sticky Line Numbers Column */}
        <div ref={lineNumbersScrollRef} className={styles.lineNumbers} style={{ overflowY: "hidden" }}>
          <div className={styles.lineNumbersColumn} data-line-numbers>
            {lines.map((_, lineIndex) => (
              <div
                key={`line-num-${lineIndex}`}
                onMouseDown={() => handleLineMouseDown(lineIndex)}
                onMouseEnter={() => handleLineMouseEnter(lineIndex)}
                onMouseUp={handleLineMouseUp}
                onMouseLeave={() => setHoveredLine(null)}
                className={`${styles.lineNumberCell} ${
                  isLineSelected(lineIndex)
                    ? styles.lineNumberCellSelected
                    : lineIndex === activeLine || lineIndex === hoveredLine
                      ? styles.lineNumberCellActive
                      : ""
                }`}
              >
                <p
                  className={`${styles.lineNumberText} ${styles.lineNumberTextDefault}`}
                >
                  {lineIndex + 1}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Code Content Column */}
        <div className={styles.codeColumnWrap}>
          <div
            ref={codeScrollRef}
            className={styles.codeColumn}
            onScroll={handleCodeScroll}
          >
            <div ref={codeLinesRef} className={styles.codeLines} data-code-lines>
              {lines.map((line, lineIndex) => (
                <div
                  key={`code-line-${lineIndex}`}
                  onMouseDown={() => handleLineMouseDown(lineIndex)}
                  onMouseEnter={() => handleLineMouseEnter(lineIndex)}
                  onMouseUp={handleLineMouseUp}
                  onMouseLeave={() => setHoveredLine(null)}
                  className={`${styles.codeLineCell} ${
                    isLineSelected(lineIndex)
                      ? styles.codeLineCellSelected
                      : lineIndex === activeLine
                        ? styles.codeLineCellActive
                        : ""
                  }`}
                >
                  <p
                    className={styles.codeLineText}
                    dangerouslySetInnerHTML={{
                      __html: highlighted[lineIndex] || " ",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {(() => {
            if (!selectionRange) return null;
            const { top, visible } = getFloatingBarPosition();
            if (!visible) return null;
            return (
              <div
                data-floating-bar
                className={styles.floatingActionBar}
                style={{ top }}
              >
                <AppButton
                  variant="tertiary"
                  tone="black"
                  size="xs"
                  iconName="message-code"
                  onClick={handleAddToTutor}
                >
                  Add to AI Tutor Chat
                </AppButton>
              </div>
            );
          })()}
          <div className={styles.codeColumnFade} />
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
                enableDragToTutor={enableDragToTutor}
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
