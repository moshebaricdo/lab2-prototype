import type { DevPanelUploadedFile } from "../../lab2/dev";
import type { FileItem, FileKind } from "../../../types/file";
import { NON_ROOT_WRAPPER_FOLDERS } from "./webLab2FileTree";

export const STARTER_CODE_UPLOAD_ACCEPT = ".html,.htm,.css,.js,.json,.txt,.md";
export const PROJECT_FILE_UPLOAD_ACCEPT =
  `${STARTER_CODE_UPLOAD_ACCEPT},.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico`;
export const STARTER_UPLOAD_MAX_FILES = 32;
export const STARTER_UPLOAD_MAX_TOTAL_SIZE_BYTES = 500_000;
export const PROJECT_UPLOAD_MAX_TOTAL_SIZE_BYTES = 2_500_000;

export interface StarterCodeUploadValue {
  files?: DevPanelUploadedFile[];
  uploadedAt?: string;
}

const PROJECT_TEXT_UPLOAD_EXTENSIONS = new Set([
  "css",
  "csv",
  "htm",
  "html",
  "js",
  "json",
  "md",
  "txt",
]);
const PROJECT_IMAGE_UPLOAD_EXTENSIONS = new Set([
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

function inferStarterFileKind(fileName: string): FileKind {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "html" || extension === "htm") return "html";
  if (extension === "css") return "css";
  if (extension && PROJECT_IMAGE_UPLOAD_EXTENSIONS.has(extension)) return "image";
  if (extension === "txt" || extension === "md" || extension === "csv") return "text";
  return "file";
}

function getUploadExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isProjectImageUpload(file: File) {
  const extension = getUploadExtension(file.name);
  return file.type.startsWith("image/") || PROJECT_IMAGE_UPLOAD_EXTENSIONS.has(extension);
}

function isProjectTextUpload(file: File) {
  return PROJECT_TEXT_UPLOAD_EXTENSIONS.has(getUploadExtension(file.name));
}

function isShareableStarterFile(file: DevPanelUploadedFile) {
  return PROJECT_TEXT_UPLOAD_EXTENSIONS.has(getUploadExtension(file.path || file.name));
}

export function getShareableStarterUpload(upload: StarterCodeUploadValue | null) {
  const files = upload?.files?.filter(isShareableStarterFile) ?? [];
  return files.length > 0
    ? { ...upload, files }
    : null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error(`Unable to read ${file.name}.`));
    };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function normalizeStarterPath(path: string) {
  return path.replace(/\\/g, "/").split("/").filter(Boolean);
}

function stripSharedRootFolder(paths: string[][]) {
  if (paths.length === 0) return paths;
  const firstSegment = paths[0][0];
  if (!firstSegment) return paths;
  const hasSharedRoot = paths.every((path) => path.length > 1 && path[0] === firstSegment);
  return hasSharedRoot ? paths.map((path) => path.slice(1)) : paths;
}

function sortFileItems(items: FileItem[]): FileItem[] {
  return [...items]
    .map((item) => item.children ? { ...item, children: sortFileItems(item.children) } : item)
    .sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
}

export function buildFileTreeFromUploadedStarter(files: DevPanelUploadedFile[]): FileItem[] {
  const root: FileItem = { name: "My Project", type: "folder", children: [] };
  const normalizedPaths = stripSharedRootFolder(files.map((file) => normalizeStarterPath(file.path)));

  files.forEach((file, index) => {
    const pathParts = normalizedPaths[index] ?? [file.name];
    const fileName = pathParts.at(-1) ?? file.name;
    let currentChildren = root.children ?? [];
    root.children = currentChildren;

    for (const folderName of pathParts.slice(0, -1)) {
      let folder = currentChildren.find(
        (item) => item.type === "folder" && item.name === folderName,
      );
      if (!folder) {
        folder = { name: folderName, type: "folder", children: [] };
        currentChildren.push(folder);
      }
      folder.children ??= [];
      currentChildren = folder.children;
    }

    currentChildren.push({
      name: fileName,
      type: inferStarterFileKind(fileName),
      content: file.content,
    });
  });

  return [{ ...root, children: sortFileItems(root.children ?? []) }];
}

export function buildFileTreeWithUploadedFiles(
  tree: FileItem[],
  files: DevPanelUploadedFile[],
): FileItem[] {
  const uploadedItems: FileItem[] = files.map((file) => ({
    name: file.name,
    type: inferStarterFileKind(file.name),
    content: file.content,
  }));
  const root =
    tree.length === 1 &&
    tree[0].type === "folder" &&
    !NON_ROOT_WRAPPER_FOLDERS.has(tree[0].name)
      ? tree[0]
      : null;
  const siblings = root?.children ?? tree;
  const uploadedNames = new Set<string>();
  const duplicatedUpload = uploadedItems.find((uploaded) => {
    if (uploadedNames.has(uploaded.name)) return true;
    uploadedNames.add(uploaded.name);
    return false;
  });
  const duplicate = uploadedItems.find((uploaded) =>
    siblings.some((item) => item.name === uploaded.name)
  );

  if (duplicatedUpload) {
    throw new Error(`Upload contains more than one file named ${duplicatedUpload.name}.`);
  }

  if (duplicate) {
    throw new Error(`A file or folder named ${duplicate.name} already exists.`);
  }

  if (root) {
    return [{
      ...root,
      children: sortFileItems([...(root.children ?? []), ...uploadedItems]),
    }];
  }

  return sortFileItems([...tree, ...uploadedItems]);
}

export async function readStarterUploadedFiles(fileList: FileList): Promise<DevPanelUploadedFile[]> {
  const files = Array.from(fileList);
  if (files.length > STARTER_UPLOAD_MAX_FILES) {
    throw new Error(`Upload up to ${STARTER_UPLOAD_MAX_FILES} files.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > PROJECT_UPLOAD_MAX_TOTAL_SIZE_BYTES) {
    throw new Error("Uploaded files are too large.");
  }

  const unsupportedFile = files.find(
    (file) => !isProjectTextUpload(file) && !isProjectImageUpload(file),
  );
  if (unsupportedFile) {
    throw new Error(`Unsupported file type: ${unsupportedFile.name}.`);
  }

  return Promise.all(files.map(async (file) => ({
    name: file.name,
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    type: file.type,
    size: file.size,
    content: isProjectImageUpload(file) ? await readFileAsDataUrl(file) : await file.text(),
  })));
}
