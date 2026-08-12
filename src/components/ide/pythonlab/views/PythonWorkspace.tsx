import { useState, useRef, useEffect, type CSSProperties, type FormEvent } from "react";
import { FileManager } from "../../shared/FileManager";
import { CodeEditor } from "../../shared/code-editor";
import { VersionBanner } from "../../shared/VersionBanner";
import { ResizableHandle } from "../../../ui/ResizableHandle";
import { Button, Tooltip } from "@moshebaricdo/cads-react";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ScrollArea } from "../../../ui/scroll-area";
import type { FileItem } from "../../../../types/file";
import { startPythonRun, type PythonRunSession } from "../runtime/pythonRunner";
import styles from "./PythonWorkspace.module.scss";

const DEFAULT_FILE_MANAGER_WIDTH = 158;
const MIN_FILE_MANAGER_WIDTH = 128;
const MAX_FILE_MANAGER_WIDTH = 320;
const FILE_MANAGER_ANIMATION_MS = 220;
const DEFAULT_CONSOLE_HEIGHT_RATIO = 0.4;

type ConsoleLineTone = "output" | "error" | "meta" | "input";
type ConsoleLayout = "horizontal" | "vertical";

interface ConsoleLine {
  text: string;
  tone: ConsoleLineTone;
}

interface PythonWorkspaceProps {
  fileStructure: FileItem[];
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem | null) => void;
  openFiles: FileItem[];
  openFolders: Set<string>;
  toggleFolder: (folderPath: string) => void;
  openFile: (file: FileItem) => void;
  closeFile: (file: FileItem) => void;
  handleReorderFiles: (files: FileItem[]) => void;
  isFileManagerCollapsed: boolean;
  setIsFileManagerCollapsed: (collapsed: boolean) => void;
  setIsCreateFileModalOpen: (open: boolean) => void;
  onFileContentChange?: (fileName: string, content: string) => void;
  readOnly?: boolean;
  selectedHistoryVersion?: string;
  selectedHistoryVersionLabel?: string;
  onReturnToCurrentVersion?: () => void;
}

function formatRunTimestamp() {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `-------- Run at ${timestamp} --------`;
}

function splitConsoleLines(text: string, tone: ConsoleLineTone): ConsoleLine[] {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ text: line, tone }));
}

export function PythonWorkspace({
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
  onFileContentChange,
  readOnly = false,
  selectedHistoryVersion = "current",
  selectedHistoryVersionLabel,
  onReturnToCurrentVersion,
}: PythonWorkspaceProps) {
  const [consoleOutput, setConsoleOutput] = useState<ConsoleLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleOnly, setConsoleOnly] = useState(false);
  const [consoleLayout, setConsoleLayout] = useState<ConsoleLayout>("horizontal");
  const [consoleHeight, setConsoleHeight] = useState<number | null>(null);
  const [consoleWidth, setConsoleWidth] = useState<number | null>(null);
  const [fileManagerWidth, setFileManagerWidth] = useState(DEFAULT_FILE_MANAGER_WIDTH);
  const [fileManagerTransition, setFileManagerTransition] = useState<
    "collapsing" | "expanding" | null
  >(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);
  const runSessionRef = useRef<PythonRunSession | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleOutput, isAwaitingInput]);

  useEffect(() => {
    if (isAwaitingInput) {
      consoleInputRef.current?.focus();
    }
  }, [isAwaitingInput]);

  useEffect(() => {
    if (!fileManagerTransition) return;
    const timeoutId = window.setTimeout(() => {
      setFileManagerTransition(null);
    }, FILE_MANAGER_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fileManagerTransition]);

  useEffect(() => {
    return () => {
      runSessionRef.current?.dispose();
    };
  }, []);

  const appendConsoleLines = (lines: string[], tone: ConsoleLineTone = "output") => {
    setConsoleOutput((prev) => [
      ...prev,
      ...lines.flatMap((line) => splitConsoleLines(line, tone)),
    ]);
  };

  const appendConsoleText = (text: string, tone: ConsoleLineTone = "output") => {
    if (!text) return;

    setConsoleOutput((prev) => {
      const next = [...prev];

      for (const character of text) {
        if (character === "\n") {
          next.push({ text: "", tone });
          continue;
        }

        const currentLine = next[next.length - 1];
        if (!currentLine || currentLine.tone !== tone) {
          next.push({ text: character, tone });
          continue;
        }

        next[next.length - 1] = {
          ...currentLine,
          text: `${currentLine.text}${character}`,
        };
      }

      return next;
    });
  };

  const handleRun = async () => {
    if (isRunning) return;

    appendConsoleLines([formatRunTimestamp()], "meta");

    if (!selectedFile || selectedFile.type === "folder") {
      appendConsoleLines(["Select a Python file to run."], "error");
      return;
    }

    const code = selectedFile.content ?? "";
    setIsRunning(true);
    setIsAwaitingInput(false);
    setConsoleInput("");

    const session = startPythonRun(code, {
      onStdout: (text) => appendConsoleText(text, "output"),
      onStderr: (text) => appendConsoleText(text, "error"),
      onStdinRequest: () => setIsAwaitingInput(true),
    });
    runSessionRef.current = session;

    try {
      const result = await session.result;
      if (result.error) {
        appendConsoleLines([result.error], "error");
      }
    } finally {
      if (runSessionRef.current === session) {
        runSessionRef.current = null;
      }
      setIsAwaitingInput(false);
      setIsRunning(false);
    }
  };

  const handleConsoleInputSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAwaitingInput || !runSessionRef.current) return;

    const value = consoleInput;
    setConsoleInput("");
    setIsAwaitingInput(false);
    appendConsoleText(`${value}\n`, "input");
    runSessionRef.current.submitInput(value);
  };

  const handleConsoleResize = (delta: number) => {
    if (consoleLayout === "vertical") {
      setConsoleWidth((prev) => {
        const bodyWidth = bodyRef.current?.getBoundingClientRect().width ?? 900;
        const currentConsoleWidth = bodyWidth * 0.36;
        const nextWidth = prev === null ? currentConsoleWidth - delta : prev - delta;
        return Math.max(220, Math.min(bodyWidth - 260, nextWidth));
      });
      return;
    }

    setConsoleHeight((prev) => {
      if (prev === null && bodyRef.current) {
        const bodyHeight = bodyRef.current.getBoundingClientRect().height;
        const dividerHeight = 44;
        const currentConsoleHeight = bodyHeight * DEFAULT_CONSOLE_HEIGHT_RATIO;
        return Math.max(60, Math.min(bodyHeight - dividerHeight - 100, currentConsoleHeight - delta));
      }
      if (prev === null) return 200;
      const bodyHeight = bodyRef.current?.getBoundingClientRect().height ?? 600;
      const dividerHeight = 44;
      return Math.max(60, Math.min(bodyHeight - dividerHeight - 100, prev - delta));
    });
  };

  const isVerticalLayout = !consoleOnly && consoleLayout === "vertical";
  const consoleRegionStyle = isVerticalLayout && consoleWidth !== null
    ? { width: `${consoleWidth}px`, flex: `0 0 ${consoleWidth}px` }
    : !consoleOnly && consoleLayout === "horizontal" && consoleHeight !== null
      ? { height: `${consoleHeight}px`, flex: "none" }
      : undefined;

  const handleFileManagerCollapseChange = (collapsed: boolean) => {
    if (collapsed === isFileManagerCollapsed) return;
    setFileManagerTransition(collapsed ? "collapsing" : "expanding");
    setIsFileManagerCollapsed(collapsed);
  };

  const renderExpandedFileManager = () => (
    <FileManager
      fileStructure={fileStructure}
      selectedFile={selectedFile}
      openFolders={openFolders}
      onFileSelect={openFile}
      onToggleFolder={toggleFolder}
      collapsed={false}
      onToggleCollapse={() => handleFileManagerCollapseChange(true)}
      onNewFile={readOnly ? undefined : () => setIsCreateFileModalOpen(true)}
      showRightBorder={false}
      backpackSourceLab="pythonlab"
    />
  );

  const renderHistoryBanner = () => (
    selectedHistoryVersion !== "current" && onReturnToCurrentVersion ? (
      <VersionBanner
        versionLabel={selectedHistoryVersionLabel ?? selectedHistoryVersion}
        onClose={onReturnToCurrentVersion}
      />
    ) : null
  );

  const renderWorkspaceHeader = () => (
    <PanelHeader
      label="WORKSPACE"
      right={
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          onClick={() => setConsoleOnly(!consoleOnly)}
        >
          {consoleOnly ? "Show editor" : "Console only"}
        </Button>
      }
    />
  );

  const renderEditorPane = () => (
    <div className={styles.editorPane}>
      <div
        className={`${styles.fileManagerRail} ${
          isFileManagerCollapsed ? styles.fileManagerRailCollapsed : ""
        }`}
        style={isFileManagerCollapsed ? undefined : { width: `${fileManagerWidth}px` }}
      >
        {isFileManagerCollapsed ? (
          <FileManager
            fileStructure={fileStructure}
            selectedFile={selectedFile}
            openFolders={openFolders}
            onFileSelect={openFile}
            onToggleFolder={toggleFolder}
            collapsed
            onToggleCollapse={() => handleFileManagerCollapseChange(false)}
          />
        ) : (
          <div
            className={`${styles.fileManagerContent} ${
              fileManagerTransition === "expanding"
                ? styles.fileManagerContentEntering
                : ""
            }`}
          >
            {renderExpandedFileManager()}
          </div>
        )}
      </div>

      {fileManagerTransition === "collapsing" && (
        <div
          className={styles.fileManagerCollapseOverlay}
          style={{ width: `${fileManagerWidth}px` }}
          aria-hidden
        >
          <div className={styles.fileManagerContent}>
            {renderExpandedFileManager()}
          </div>
        </div>
      )}

      {!isFileManagerCollapsed && fileManagerTransition !== "expanding" && (
        <ResizableHandle
          onResize={(delta) => {
            setFileManagerWidth((prev) =>
              Math.max(
                MIN_FILE_MANAGER_WIDTH,
                Math.min(MAX_FILE_MANAGER_WIDTH, prev + delta),
              )
            );
          }}
        />
      )}

      <div
        className={`${styles.editorArea} ${
          fileManagerTransition === "collapsing"
            ? styles.editorAreaCollapsing
            : fileManagerTransition === "expanding"
              ? styles.editorAreaExpanding
              : ""
        }`}
        style={{
          "--file-manager-width": `${fileManagerWidth}px`,
        } as CSSProperties}
      >
        <CodeEditor
          openFiles={openFiles}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onCloseFile={closeFile}
          onReorderFiles={handleReorderFiles}
          isFileManagerCollapsed={isFileManagerCollapsed}
          onCreateFile={readOnly ? undefined : () => setIsCreateFileModalOpen(true)}
          onFileContentChange={readOnly ? undefined : onFileContentChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );

  const renderConsoleHeader = () => (
    <PanelHeader
      label="CONSOLE"
      left={
        <Button
          variant="contained"
          color="primary"
          size="extraSmall"
          startIconName={isRunning ? "spinner" : "play"}
          className={isRunning ? styles.running : undefined}
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? "Running" : "Run"}
        </Button>
      }
      right={
        <div className={styles.consoleHeaderActions}>
          <Tooltip
            title={
              consoleLayout === "horizontal"
                ? "Move console to the right"
                : "Move console below editor"
            }
            placement="bottom"
          >
            <span>
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName={consoleLayout === "horizontal"
                  ? "square-half-stroke-horizontal"
                  : "square-half-stroke"}
                aria-label={
                  consoleLayout === "horizontal"
                    ? "Move console to the right"
                    : "Move console below editor"
                }
                onClick={() =>
                  setConsoleLayout((layout) =>
                    layout === "horizontal" ? "vertical" : "horizontal"
                  )
                }
              />
            </span>
          </Tooltip>
          <Tooltip title="Clear console output" placement="bottom">
            <span>
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="eraser"
                aria-label="Clear console output"
                disabled={consoleOutput.length === 0}
                onClick={() => setConsoleOutput([])}
              />
            </span>
          </Tooltip>
        </div>
      }
    />
  );

  const renderConsoleOutput = () => (
    <ScrollArea className={styles.consolePane}>
      <div className={styles.consoleContent}>
        {consoleOutput.map((line, i) => (
          <pre
            key={i}
            className={[
              styles.consoleLine,
              line.tone === "error" ? styles.consoleLineError : "",
              line.tone === "meta" ? styles.consoleLineMeta : "",
                    line.tone === "input" ? styles.consoleLineInput : "",
            ].filter(Boolean).join(" ")}
          >
            {line.text}
          </pre>
        ))}
              {isAwaitingInput ? (
                <form className={styles.consoleInputRow} onSubmit={handleConsoleInputSubmit}>
                  <span className={styles.consolePrompt} aria-hidden="true">
                    &gt;
                  </span>
                  <input
                    ref={consoleInputRef}
                    className={styles.consoleInput}
                    value={consoleInput}
                    onChange={(event) => setConsoleInput(event.target.value)}
                    aria-label="Program input"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </form>
              ) : null}
        <div ref={consoleEndRef} />
      </div>
    </ScrollArea>
  );

  return (
    <div className={styles.root}>
      {isVerticalLayout ? (
        <div className={styles.verticalShell} ref={bodyRef}>
          <div className={styles.verticalEditorRegion}>
            {renderWorkspaceHeader()}
            {renderHistoryBanner()}
            {renderEditorPane()}
          </div>

          <ResizableHandle
            onResize={handleConsoleResize}
            orientation="vertical"
          />

          <div className={styles.consoleRegion} style={consoleRegionStyle}>
            {renderConsoleHeader()}
            {renderConsoleOutput()}
          </div>
        </div>
      ) : (
        <>
          {renderWorkspaceHeader()}
          {renderHistoryBanner()}

          <div className={styles.body} ref={bodyRef}>
            {/* Editor area — shared CodeEditor + FileManager */}
            {!consoleOnly && renderEditorPane()}

            {/* Console divider with Run button + resizable handle */}
            {!consoleOnly && (
              <ResizableHandle
                onResize={handleConsoleResize}
                orientation="horizontal"
              />
            )}
            <div className={styles.consoleRegion} style={consoleRegionStyle}>
              {renderConsoleHeader()}
              {renderConsoleOutput()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
