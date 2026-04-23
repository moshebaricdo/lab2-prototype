import { useCallback, useMemo, useState } from "react";
import type { FileItem, FileKind } from "../types/file";
import type { ViewMode } from "../types/ui";

const FALLBACK_ROOT_FOLDER = "My Project";

function getRootFolderName(tree?: FileItem[]): string {
  const root = tree?.find((f) => f.type === "folder");
  return root?.name ?? FALLBACK_ROOT_FOLDER;
}
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

function inferFileKind(fileName: string): FileKind {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return "file";
  const ext = fileName.slice(dot + 1).toLowerCase();
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "css") return "css";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image";
  if (ext === "txt") return "text";
  return "file";
}

function addToProjectRoot(tree: FileItem[], newFile: FileItem, rootName: string): FileItem[] {
  return tree.map((node) => {
    if (node.type === "folder" && node.name === rootName && node.children) {
      const alreadyExists = node.children.some((c) => c.name === newFile.name);
      if (alreadyExists) return node;
      return { ...node, children: [...node.children, newFile] };
    }
    return node;
  });
}

export function useFileWorkspaceState(initialFileStructure?: FileItem[]) {
  const rootFolder = getRootFolderName(initialFileStructure);
  const [fileStructureState, setFileStructureState] = useState<FileItem[] | null>(
    initialFileStructure ? [...initialFileStructure] : null,
  );
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set([rootFolder]),
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

  const addFileToProject = useCallback((fileName: string, fileType?: string) => {
    const kind = fileType ? toFileKind(fileType) : inferFileKind(fileName);
    const newFile: FileItem = { name: fileName, type: kind };

    setFileStructureState((prev) => {
      if (!prev) return prev;
      return addToProjectRoot(prev, newFile, rootFolder);
    });

    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.add(rootFolder);
      return next;
    });
  }, [rootFolder]);

  return useMemo(
    () => ({
      fileStructureState,
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
      addFileToProject,
    }),
    [
      fileStructureState,
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
      addFileToProject,
    ],
  );
}
