import { useCallback, useMemo, useState } from "react";
import type { FileItem, FileKind } from "../types/file";
import type { ViewMode } from "../types/ui";

const DEFAULT_ROOT_FOLDER = "My Project";
const FILE_KIND_BY_INPUT: Record<string, FileKind> = {
  html: "html",
  css: "css",
  image: "image",
  text: "text",
  file: "file",
};

function toFileKind(fileType: string): FileKind {
  const normalized = fileType.trim().toLowerCase();
  return FILE_KIND_BY_INPUT[normalized] ?? "file";
}

export function useFileWorkspaceState() {
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set([DEFAULT_ROOT_FOLDER]),
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [isFileManagerCollapsed, setIsFileManagerCollapsed] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);

  const toggleFolder = useCallback((folderPath: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const openFile = useCallback((file: FileItem) => {
    setSelectedFile(file);
    setOpenFiles((prev) =>
      prev.some((existingFile) => existingFile.name === file.name)
        ? prev
        : [...prev, file],
    );
  }, []);

  const closeFile = useCallback((file: FileItem) => {
    setOpenFiles((prev) => {
      const remainingFiles = prev.filter((existingFile) => existingFile.name !== file.name);
      setSelectedFile((currentSelected) =>
        currentSelected?.name === file.name ? (remainingFiles[0] ?? null) : currentSelected,
      );
      return remainingFiles;
    });
  }, []);

  const handleReorderFiles = useCallback((reorderedFiles: FileItem[]) => {
    setOpenFiles(reorderedFiles);
  }, []);

  const handleCreateFile = useCallback((fileName: string, fileType: string) => {
    const newFile: FileItem = {
      name: fileName,
      type: toFileKind(fileType),
      content: "",
    };
    setOpenFiles((prev) => [...prev, newFile]);
    setSelectedFile(newFile);
  }, []);

  return useMemo(
    () => ({
      openFolders,
      selectedFile,
      openFiles,
      viewMode,
      isFileManagerCollapsed,
      isCreateFileModalOpen,
      setSelectedFile,
      setOpenFiles,
      setViewMode,
      setIsFileManagerCollapsed,
      setIsCreateFileModalOpen,
      toggleFolder,
      openFile,
      closeFile,
      handleReorderFiles,
      handleCreateFile,
    }),
    [
      openFolders,
      selectedFile,
      openFiles,
      viewMode,
      isFileManagerCollapsed,
      isCreateFileModalOpen,
      toggleFolder,
      openFile,
      closeFile,
      handleReorderFiles,
      handleCreateFile,
    ],
  );
}
