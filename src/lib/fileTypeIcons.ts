import type { FaBrandIconName } from "../icons/faBrandsCodepoints";
import type { FaIconName } from "../icons/faProRegularCodepoints";
import type { FileItem, FileKind } from "../types/file";

export type FileTypeIconConfig =
  | { family: "solid"; name: FaIconName }
  | { family: "brands"; name: FaBrandIconName };

export type CreateFileModalType = "HTML" | "CSS" | "JS" | "PY" | "MD" | "TXT" | "CSV";

function basename(pathOrName: string): string {
  const index = pathOrName.lastIndexOf("/");
  return index >= 0 ? pathOrName.slice(index + 1) : pathOrName;
}

function extensionFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function getFileTypeIconConfigForExtension(
  ext: string,
): FileTypeIconConfig {
  switch (ext) {
    case "html":
    case "htm":
      return { family: "solid", name: "file-code" };
    case "css":
      return { family: "brands", name: "css" };
    case "js":
    case "mjs":
    case "cjs":
      return { family: "brands", name: "js" };
    case "py":
      return { family: "brands", name: "python" };
    case "json":
      return { family: "solid", name: "file-brackets-curly" };
    case "jsx":
    case "tsx":
      return { family: "brands", name: "react" };
    case "md":
      return { family: "brands", name: "markdown" };
    case "svg":
      return { family: "solid", name: "file-svg" };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "bmp":
    case "ico":
      return { family: "solid", name: "image" };
    case "csv":
      return { family: "solid", name: "file-csv" };
    case "txt":
      return { family: "solid", name: "file-lines" };
    case "pdf":
      return { family: "solid", name: "file-pdf" };
    default:
      return { family: "solid", name: "file" };
  }
}

export function getFileTypeIconConfigForCreateFileType(
  type: CreateFileModalType,
): FileTypeIconConfig {
  switch (type) {
    case "HTML":
      return { family: "solid", name: "file-code" };
    case "CSS":
      return { family: "brands", name: "css" };
    case "JS":
      return { family: "brands", name: "js" };
    case "PY":
      return { family: "brands", name: "python" };
    case "MD":
      return { family: "brands", name: "markdown" };
    case "TXT":
      return { family: "solid", name: "file-lines" };
    case "CSV":
      return { family: "solid", name: "file-csv" };
  }
}

export function getFileTypeIconConfigForKind(
  kind: FileKind,
  fileName?: string,
): FileTypeIconConfig {
  switch (kind) {
    case "html":
      return { family: "solid", name: "file-code" };
    case "css":
      return { family: "brands", name: "css" };
    case "python":
      return { family: "brands", name: "python" };
    case "image": {
      const ext = fileName ? extensionFromName(fileName) : "";
      return ext === "svg"
        ? { family: "solid", name: "file-svg" }
        : { family: "solid", name: "image" };
    }
    case "text":
    case "file":
      return getFileTypeIconConfigForExtension(
        fileName ? extensionFromName(fileName) : "",
      );
    case "folder":
      return { family: "solid", name: "folder" };
    default:
      return { family: "solid", name: "file" };
  }
}

export function getFileTypeIconConfigForFileItem(
  item: FileItem,
  isFolderOpen = false,
): FileTypeIconConfig {
  if (item.type === "folder") {
    return {
      family: "solid",
      name: isFolderOpen ? "folder-open" : "folder",
    };
  }

  return getFileTypeIconConfigForKind(item.type, item.name);
}

export function getFileTypeIconConfigForPath(pathOrName: string): FileTypeIconConfig {
  return getFileTypeIconConfigForExtension(extensionFromName(basename(pathOrName)));
}
