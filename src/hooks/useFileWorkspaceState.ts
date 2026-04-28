import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FileItem, FileKind } from "../types/file";
import type { ViewMode } from "../types/ui";

const FALLBACK_ROOT_FOLDER = "My Project";
type FileActionResult = true | string;

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

function addFolderToProjectRoot(tree: FileItem[], folderName: string, rootName: string): FileItem[] {
  return tree.map((node) => {
    if (node.type === "folder" && node.name === rootName && node.children) {
      const alreadyExists = node.children.some((child) => child.name === folderName);
      if (alreadyExists) return node;
      return {
        ...node,
        children: [...node.children, { name: folderName, type: "folder", children: [] }],
      };
    }
    return node;
  });
}

function findFileByName(tree: FileItem[] | undefined, name: string): FileItem | null {
  if (!tree) return null;
  for (const item of tree) {
    if (item.name === name && item.type !== "folder") return item;
    if (item.children) {
      const found = findFileByName(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

function findFileByPath(tree: FileItem[] | undefined, path: string, parentPath = ""): FileItem | null {
  if (!tree) return null;
  for (const item of tree) {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === path && item.type !== "folder") return item;
    if (item.children) {
      const found = findFileByPath(item.children, path, itemPath);
      if (found) return found;
    }
  }
  return null;
}

function findItemByPath(tree: FileItem[] | undefined, path: string, parentPath = ""): FileItem | null {
  if (!tree) return null;
  for (const item of tree) {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === path) return item;
    if (item.children) {
      const found = findItemByPath(item.children, path, itemPath);
      if (found) return found;
    }
  }
  return null;
}

function hasInvalidPathCharacters(name: string): boolean {
  return /[\\/]/.test(name);
}

function siblingNameExists(tree: FileItem[], targetPath: string, newName: string): boolean {
  const pathParts = targetPath.split("/");
  const parentPath = pathParts.slice(0, -1).join("/");

  function visit(items: FileItem[], currentParentPath = ""): boolean {
    if (currentParentPath === parentPath) {
      return items.some((item) => item.name === newName && `${currentParentPath ? `${currentParentPath}/` : ""}${item.name}` !== targetPath);
    }

    for (const item of items) {
      if (!item.children) continue;
      const itemPath = currentParentPath ? `${currentParentPath}/${item.name}` : item.name;
      if (visit(item.children, itemPath)) return true;
    }
    return false;
  }

  return visit(tree);
}

function renameFileInTree(
  tree: FileItem[],
  targetPath: string,
  newName: string,
  parentPath = "",
): { tree: FileItem[]; renamedFile: FileItem | null } {
  let renamedFile: FileItem | null = null;
  const nextTree = tree.map((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === targetPath && item.type !== "folder") {
      renamedFile = { ...item, name: newName };
      return renamedFile;
    }
    if (item.children) {
      const result = renameFileInTree(item.children, targetPath, newName, itemPath);
      if (result.renamedFile) {
        renamedFile = result.renamedFile;
        return { ...item, children: result.tree };
      }
    }
    return item;
  });

  return { tree: nextTree, renamedFile };
}

function deleteFileFromTree(
  tree: FileItem[],
  targetPath: string,
  parentPath = "",
): { tree: FileItem[]; deletedFile: FileItem | null } {
  let deletedFile: FileItem | null = null;
  const nextTree = tree.flatMap((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === targetPath && item.type !== "folder") {
      deletedFile = item;
      return [];
    }
    if (item.children) {
      const result = deleteFileFromTree(item.children, targetPath, itemPath);
      if (result.deletedFile) {
        deletedFile = result.deletedFile;
        return [{ ...item, children: result.tree }];
      }
    }
    return [item];
  });

  return { tree: nextTree, deletedFile };
}

function removeItemFromTree(
  tree: FileItem[],
  targetPath: string,
  parentPath = "",
): { tree: FileItem[]; removedItem: FileItem | null } {
  let removedItem: FileItem | null = null;
  const nextTree = tree.flatMap((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === targetPath) {
      removedItem = item;
      return [];
    }
    if (item.children) {
      const result = removeItemFromTree(item.children, targetPath, itemPath);
      if (result.removedItem) {
        removedItem = result.removedItem;
        return [{ ...item, children: result.tree }];
      }
    }
    return [item];
  });

  return { tree: nextTree, removedItem };
}

function appendItemToFolder(
  tree: FileItem[],
  targetFolderPath: string,
  itemToMove: FileItem,
  parentPath = "",
): FileItem[] {
  return tree.map((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === targetFolderPath && item.type === "folder") {
      return {
        ...item,
        children: [...(item.children ?? []), itemToMove],
      };
    }
    if (item.children) {
      return {
        ...item,
        children: appendItemToFolder(item.children, targetFolderPath, itemToMove, itemPath),
      };
    }
    return item;
  });
}

function folderContainsName(folder: FileItem | null, name: string): boolean {
  return folder?.children?.some((item) => item.name === name) ?? false;
}

function updateFileContentInTree(
  tree: FileItem[],
  fileName: string,
  content: string,
): FileItem[] {
  return tree.map((item) => {
    if (item.children) {
      return {
        ...item,
        children: updateFileContentInTree(item.children, fileName, content),
      };
    }
    if (item.name !== fileName) return item;
    return { ...item, content };
  });
}

function updateFileContentValue(file: FileItem, content: string): FileItem {
  return { ...file, content };
}

export interface AiProposalChange {
  fileName: string;
  content?: string;
  status?: "new" | "modified" | "deleted";
}

function cloneFileTree(tree: FileItem[]): FileItem[] {
  return tree.map((item) => ({
    ...item,
    children: item.children ? cloneFileTree(item.children) : undefined,
  }));
}

function clearProposedContent(tree: FileItem[]): FileItem[] {
  return tree.map((item) => {
    if (item.children) {
      return { ...item, children: clearProposedContent(item.children) };
    }
    const { proposedContent: _proposedContent, proposedStatus: _proposedStatus, ...rest } = item;
    return rest;
  });
}

function acceptProposedContent(tree: FileItem[]): FileItem[] {
  return tree.flatMap((item) => {
    if (item.children) {
      return [{ ...item, children: acceptProposedContent(item.children) }];
    }
    if (!item.proposedStatus) return [item];
    if (item.proposedStatus === "deleted") return [];
    const { proposedContent, proposedStatus: _proposedStatus, ...rest } = item;
    return [{ ...rest, content: proposedContent ?? "" }];
  });
}

function applyProposalToTree(
  tree: FileItem[],
  changes: AiProposalChange[],
  rootName: string,
  parentPath = "",
  appliedNames = new Set<string>(),
): FileItem[] {
  const next = tree.map((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return {
        ...item,
        children: applyProposalToTree(item.children, changes, rootName, itemPath, appliedNames),
      };
    }

    const change = changes.find((c) =>
      c.fileName === item.name ||
      c.fileName === itemPath ||
      itemPath === `${rootName}/${c.fileName}`
    );
    if (!change) return item;
    appliedNames.add(change.fileName);
    return {
      ...item,
      proposedContent: change.status === "deleted" ? "" : change.content ?? "",
      proposedStatus: change.status ?? "modified",
    };
  });

  const additions = changes.filter(
    (change) => change.status === "new" && !appliedNames.has(change.fileName),
  );
  if (additions.length === 0) return next;

  const addProposalToChildren = (children: FileItem[], pathParts: string[], change: AiProposalChange): FileItem[] => {
    const [part, ...rest] = pathParts;
    if (!part) return children;
    if (rest.length === 0) {
      if (children.some((child) => child.name === part)) return children;
      return [
        ...children,
        {
          name: part,
          type: inferFileKind(part),
          content: "",
          proposedContent: change.content ?? "",
          proposedStatus: "new",
        } satisfies FileItem,
      ];
    }

    const folderIndex = children.findIndex((child) => child.type === "folder" && child.name === part);
    if (folderIndex === -1) {
      return [
        ...children,
        {
          name: part,
          type: "folder",
          children: addProposalToChildren([], rest, change),
        } satisfies FileItem,
      ];
    }

    return children.map((child, index) => {
      if (index !== folderIndex || !child.children) return child;
      return {
        ...child,
        children: addProposalToChildren(child.children, rest, change),
      };
    });
  };

  return next.map((item) => {
    if (item.type !== "folder" || item.name !== rootName || !item.children) return item;
    const children = additions.reduce((currentChildren, change) => {
      const pathParts = change.fileName.split("/").filter(Boolean);
      return addProposalToChildren(currentChildren, pathParts, change);
    }, item.children);
    return {
      ...item,
      children,
    };
  });
}

export function useFileWorkspaceState(
  initialFileStructure?: FileItem[],
  options: { storageKey?: string } = {},
) {
  const storageKey = options.storageKey;
  const [fileStructureState, setFileStructureState] = useState<FileItem[] | null>(
    () => initialFileStructure ? cloneFileTree(initialFileStructure) : null,
  );
  const rootFolder = getRootFolderName(fileStructureState ?? initialFileStructure);
  const initialFile = useMemo(
    () => findFileByName(fileStructureState ?? initialFileStructure, "index.html"),
    [fileStructureState, initialFileStructure],
  );
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    new Set([rootFolder]),
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(initialFile);
  const [openFiles, setOpenFiles] = useState<FileItem[]>(initialFile ? [initialFile] : []);
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [isFileManagerCollapsed, setIsFileManagerCollapsed] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const preAiSnapshotRef = useRef<FileItem[] | null>(null);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey);
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  const syncOpenStateToTree = useCallback((tree: FileItem[]) => {
    setOpenFiles((prev) =>
      prev.map((file) => findFileByName(tree, file.name) ?? file),
    );
    setSelectedFile((current) =>
      current ? findFileByName(tree, current.name) ?? current : current,
    );
  }, []);

  const replaceFileStructure = useCallback((nextTree: FileItem[]) => {
    const cloned = cloneFileTree(nextTree);
    setFileStructureState(cloned);
    syncOpenStateToTree(cloned);
  }, [syncOpenStateToTree]);

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

  const handleCreateFile = useCallback((fileName: string, fileType: string): FileActionResult => {
    const trimmedName = fileName.trim();
    if (!trimmedName) return "Please enter a file name.";
    if (hasInvalidPathCharacters(trimmedName)) return "File names cannot include slashes.";

    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const root = baseTree.find((node) => node.type === "folder" && node.name === rootFolder);
    if (root?.children?.some((child) => child.name === trimmedName)) {
      return `A file or folder named ${trimmedName} already exists.`;
    }

    const newFile: FileItem = {
      name: trimmedName,
      type: toFileKind(fileType),
      content: "",
    };
    const nextTree = addToProjectRoot(baseTree, newFile, rootFolder);
    replaceFileStructure(nextTree);
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.add(rootFolder);
      return next;
    });
    setOpenFiles((prev) =>
      prev.some((existingFile) => existingFile.name === newFile.name)
        ? prev
        : [...prev, newFile],
    );
    setSelectedFile(newFile);
    return true;
  }, [fileStructureState, initialFileStructure, replaceFileStructure, rootFolder]);

  const handleCreateFolder = useCallback((folderName: string): FileActionResult => {
    const trimmedName = folderName.trim();
    if (!trimmedName) return "Please enter a folder name.";
    if (hasInvalidPathCharacters(trimmedName)) return "Folder names cannot include slashes.";

    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const root = baseTree.find((node) => node.type === "folder" && node.name === rootFolder);
    if (root?.children?.some((child) => child.name === trimmedName)) {
      return `A file or folder named ${trimmedName} already exists.`;
    }

    replaceFileStructure(addFolderToProjectRoot(baseTree, trimmedName, rootFolder));
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.add(rootFolder);
      return next;
    });
    return true;
  }, [fileStructureState, initialFileStructure, replaceFileStructure, rootFolder]);

  const addFileToProject = useCallback((fileName: string, fileType?: string) => {
    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const kind = fileType ? toFileKind(fileType) : inferFileKind(fileName);
    const newFile: FileItem = { name: fileName, type: kind, content: "" };
    replaceFileStructure(addToProjectRoot(baseTree, newFile, rootFolder));

    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.add(rootFolder);
      return next;
    });
  }, [fileStructureState, initialFileStructure, replaceFileStructure, rootFolder]);

  const renameFile = useCallback((filePath: string, newName: string): FileActionResult => {
    const trimmedName = newName.trim();
    if (!trimmedName) return "Please enter a file name.";
    if (hasInvalidPathCharacters(trimmedName)) return "File names cannot include slashes.";

    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const existingFile = findFileByPath(baseTree, filePath);
    if (!existingFile) return "That file could not be found.";
    if (existingFile.name === trimmedName) return true;
    if (siblingNameExists(baseTree, filePath, trimmedName)) {
      return `A file or folder named ${trimmedName} already exists here.`;
    }

    const { tree: nextTree, renamedFile } = renameFileInTree(baseTree, filePath, trimmedName);
    if (!renamedFile) return "That file could not be renamed.";

    replaceFileStructure(nextTree);
    setOpenFiles((prev) =>
      prev.map((file) => file.name === existingFile.name ? renamedFile : file),
    );
    setSelectedFile((current) =>
      current?.name === existingFile.name ? renamedFile : current,
    );
    return true;
  }, [fileStructureState, initialFileStructure, replaceFileStructure]);

  const deleteFile = useCallback((filePath: string): FileActionResult => {
    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const { tree: nextTree, deletedFile } = deleteFileFromTree(baseTree, filePath);
    if (!deletedFile) return "That file could not be found.";

    const syncedTree = cloneFileTree(nextTree);
    const remainingFiles = openFiles
      .filter((file) => file.name !== deletedFile.name)
      .map((file) => findFileByName(syncedTree, file.name) ?? file);
    const fallbackSelectedFile = remainingFiles[0] ?? null;

    setFileStructureState(syncedTree);
    setOpenFiles(remainingFiles);
    setSelectedFile((currentSelected) => {
      if (!currentSelected) return null;
      if (currentSelected.name === deletedFile.name) return fallbackSelectedFile;
      return findFileByName(syncedTree, currentSelected.name) ?? currentSelected;
    });
    return true;
  }, [fileStructureState, initialFileStructure, openFiles]);

  const moveFileTreeItem = useCallback((
    sourcePath: string,
    targetFolderPath: string,
  ): FileActionResult => {
    const baseTree = fileStructureState ?? initialFileStructure ?? [];
    const itemToMove = findItemByPath(baseTree, sourcePath);
    const targetFolder = findItemByPath(baseTree, targetFolderPath);

    if (!itemToMove) return "That item could not be found.";
    if (!targetFolder || targetFolder.type !== "folder") return "Drop items onto a folder.";
    if (sourcePath === targetFolderPath) return "Items cannot be moved into themselves.";
    if (targetFolderPath.startsWith(`${sourcePath}/`)) {
      return "Folders cannot be moved into their own subfolders.";
    }

    const sourceParentPath = sourcePath.split("/").slice(0, -1).join("/");
    if (sourceParentPath === targetFolderPath) return true;
    if (folderContainsName(targetFolder, itemToMove.name)) {
      return `A file or folder named ${itemToMove.name} already exists there.`;
    }

    const { tree: treeWithoutItem, removedItem } = removeItemFromTree(baseTree, sourcePath);
    if (!removedItem) return "That item could not be moved.";
    const nextTree = appendItemToFolder(treeWithoutItem, targetFolderPath, removedItem);
    replaceFileStructure(nextTree);

    const nextItemPath = `${targetFolderPath}/${removedItem.name}`;
    setOpenFolders((prev) => {
      const next = new Set<string>();
      for (const folderPath of prev) {
        if (folderPath === sourcePath || folderPath.startsWith(`${sourcePath}/`)) {
          next.add(folderPath.replace(sourcePath, nextItemPath));
        } else {
          next.add(folderPath);
        }
      }
      next.add(targetFolderPath);
      return next;
    });
    return true;
  }, [fileStructureState, initialFileStructure, replaceFileStructure]);

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setFileStructureState((prev) =>
      prev ? updateFileContentInTree(prev, fileName, content) : prev,
    );
    setOpenFiles((prev) =>
      prev.map((file) =>
        file.name === fileName ? updateFileContentValue(file, content) : file,
      ),
    );
    setSelectedFile((current) =>
      current?.name === fileName
        ? updateFileContentValue(current, content)
        : current,
    );
  }, []);

  const beginAiProposal = useCallback((changes: AiProposalChange[]) => {
    const baseTree = cloneFileTree(fileStructureState ?? initialFileStructure ?? []);
    preAiSnapshotRef.current = cloneFileTree(baseTree);
    const proposedTree = applyProposalToTree(baseTree, changes, rootFolder);
    replaceFileStructure(proposedTree);
  }, [fileStructureState, initialFileStructure, replaceFileStructure, rootFolder]);

  const acceptAiProposal = useCallback(() => {
    const baseTree = cloneFileTree(fileStructureState ?? initialFileStructure ?? []);
    const acceptedTree = acceptProposedContent(baseTree);
    preAiSnapshotRef.current = null;
    replaceFileStructure(acceptedTree);
    return acceptedTree;
  }, [fileStructureState, initialFileStructure, replaceFileStructure]);

  const rejectAiProposal = useCallback(() => {
    const restoredTree = preAiSnapshotRef.current
      ? cloneFileTree(preAiSnapshotRef.current)
      : clearProposedContent(cloneFileTree(fileStructureState ?? initialFileStructure ?? []));
    preAiSnapshotRef.current = null;
    replaceFileStructure(restoredTree);
  }, [fileStructureState, initialFileStructure, replaceFileStructure]);

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
      handleCreateFolder,
      addFileToProject,
      renameFile,
      deleteFile,
      moveFileTreeItem,
      updateFileContent,
      replaceFileStructure,
      beginAiProposal,
      acceptAiProposal,
      rejectAiProposal,
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
      handleCreateFolder,
      addFileToProject,
      renameFile,
      deleteFile,
      moveFileTreeItem,
      updateFileContent,
      replaceFileStructure,
      beginAiProposal,
      acceptAiProposal,
      rejectAiProposal,
    ],
  );
}
