import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { FileManager } from "../../shared/FileManager";
import { CodeEditor } from "../../shared/code-editor";
import { ResizableHandle } from "../../../ui/ResizableHandle";
import { AppButton } from "../../../ui/AppButton";
import { PanelHeader } from "../../../ui/PanelHeader";
import { ScrollArea } from "../../../ui/scroll-area";
import type { FileItem } from "../../../../types/file";
import { SAMPLE_PYTHON_OUTPUT } from "../../../../data/pythonlab";
import styles from "./PythonWorkspace.module.scss";

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
}: PythonWorkspaceProps) {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOnly, setConsoleOnly] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState<number | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleOutput]);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setConsoleOutput((prev) => [...prev, SAMPLE_PYTHON_OUTPUT]);
      setIsRunning(false);
    }, 400);
  };

  const handleConsoleResize = (delta: number) => {
    setConsoleHeight((prev) => {
      if (prev === null && bodyRef.current) {
        const bodyHeight = bodyRef.current.getBoundingClientRect().height;
        const dividerHeight = 44;
        const currentConsoleHeight = bodyHeight * 0.35;
        return Math.max(60, Math.min(bodyHeight - dividerHeight - 100, currentConsoleHeight - delta));
      }
      if (prev === null) return 200;
      const bodyHeight = bodyRef.current?.getBoundingClientRect().height ?? 600;
      const dividerHeight = 44;
      return Math.max(60, Math.min(bodyHeight - dividerHeight - 100, prev - delta));
    });
  };

  return (
    <div className={styles.root}>
      <PanelHeader
        label="WORKSPACE"
        right={
          <AppButton
            variant="secondary"
            tone="gray"
            size="xs"
            onClick={() => setConsoleOnly(!consoleOnly)}
          >
            {consoleOnly ? "Show editor" : "Console only"}
          </AppButton>
        }
      />

      <div className={styles.body} ref={bodyRef}>
        {/* Editor area — shared CodeEditor + FileManager */}
        {!consoleOnly && (
          <div className={styles.editorPane}>
            <div
              className={`${styles.fileManagerRail} ${
                isFileManagerCollapsed ? styles.fileManagerRailCollapsed : ""
              }`}
            >
              <FileManager
                fileStructure={fileStructure}
                selectedFile={selectedFile}
                openFolders={openFolders}
                onFileSelect={openFile}
                onToggleFolder={toggleFolder}
                collapsed={isFileManagerCollapsed}
                onToggleCollapse={() =>
                  setIsFileManagerCollapsed(!isFileManagerCollapsed)
                }
                onNewFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>
            <div className={styles.editorArea}>
              <CodeEditor
                openFiles={openFiles}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCloseFile={closeFile}
                onReorderFiles={handleReorderFiles}
                isFileManagerCollapsed={isFileManagerCollapsed}
                onCreateFile={() => setIsCreateFileModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Console divider with Run button + resizable handle */}
        <ResizableHandle
          onResize={handleConsoleResize}
          orientation="horizontal"
        />
        <PanelHeader
          label="CONSOLE"
          left={
            <AppButton
              variant="primary"
              tone="purple"
              size="xs"
              icon={<FontAwesomeIcon icon={faPlay} />}
              onClick={handleRun}
              disabled={isRunning}
            >
              Run
            </AppButton>
          }
        />

        {/* Console output */}
        <ScrollArea
          className={styles.consolePane}
          style={consoleHeight !== null ? { height: `${consoleHeight}px`, flex: "none" } : undefined}
        >
          <div className={styles.consoleContent}>
            {consoleOutput.map((line, i) => (
              <pre key={i} className={styles.consoleLine}>{line}</pre>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
