import type { FileItem } from "../types/file";
import type { TutorContextFile } from "../types/tutor";

export interface FindFileEntryOptions {
  nonRootWrapperFolders?: ReadonlySet<string>;
}

export interface FileEntryMatch {
  file: FileItem;
  path: string;
}

export function findFileByNameInTree(tree: FileItem[], name: string): FileItem | null {
  for (const item of tree) {
    if (item.name === name && item.type !== "folder") return item;
    if (item.children) {
      const found = findFileByNameInTree(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

export function normalizeFileLookupPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

export function pathBasename(path: string) {
  const normalized = normalizeFileLookupPath(path);
  return normalized.split("/").filter(Boolean).at(-1) ?? normalized;
}

export function findFileEntryInTree(
  tree: FileItem[],
  fileName: string,
  options: FindFileEntryOptions = {},
): FileEntryMatch | null {
  const nonRootWrapperFolders = options.nonRootWrapperFolders ?? new Set<string>();
  const rootName = tree.length === 1 &&
    tree[0].type === "folder" &&
    !nonRootWrapperFolders.has(tree[0].name)
    ? tree[0].name
    : "";

  return findFileEntryInTreeRecursive(tree, fileName, rootName);
}

function findFileEntryInTreeRecursive(
  tree: FileItem[],
  fileName: string,
  rootName: string,
  parentPath = "",
): FileEntryMatch | null {
  const normalizedFileName = normalizeFileLookupPath(fileName);
  const fileBaseName = pathBasename(normalizedFileName);

  for (const item of tree) {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const rootlessPath = rootName && itemPath.startsWith(`${rootName}/`)
      ? itemPath.slice(rootName.length + 1)
      : itemPath;

    if (item.type !== "folder") {
      if (
        item.name === normalizedFileName ||
        item.name === fileBaseName ||
        itemPath === normalizedFileName ||
        rootlessPath === normalizedFileName
      ) {
        return { file: item, path: rootlessPath };
      }
    }

    if (item.children) {
      const found = findFileEntryInTreeRecursive(
        item.children,
        normalizedFileName,
        rootName,
        itemPath,
      );
      if (found) return found;
    }
  }

  return null;
}

export function mapFilesToTree(files: FileItem[], tree: FileItem[]) {
  return files.flatMap((file) => {
    const syncedFile = findFileByNameInTree(tree, file.name);
    return syncedFile ? [syncedFile] : [];
  });
}

export function findFirstFile(tree: FileItem[]): FileItem | null {
  for (const item of tree) {
    if (item.type !== "folder") return item;
    const childFile = findFirstFile(item.children ?? []);
    if (childFile) return childFile;
  }
  return null;
}

export function fileTreeHasProjectFiles(tree: FileItem[]): boolean {
  return tree.some((item) =>
    item.type === "folder"
      ? fileTreeHasProjectFiles(item.children ?? [])
      : true
  );
}

export function flattenTutorContextFiles(files: FileItem[], parentPath = ""): TutorContextFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenTutorContextFiles(item.children, path);
    }
    if (item.proposedStatus === "deleted") return [];
    if (item.type === "image") return [];
    return [{
      fileName: item.name,
      path,
      type: item.type,
      content: item.proposedStatus ? item.proposedContent ?? "" : item.content ?? "",
    }];
  });
}
