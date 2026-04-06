import type { FaIconName } from "@/icons";

function basename(pathOrName: string): string {
  const i = pathOrName.lastIndexOf("/");
  return i >= 0 ? pathOrName.slice(i + 1) : pathOrName;
}

/** Uppercase extension label for the chip subtitle (e.g. HTML, PDF). */
export function fileExtensionLabelFromName(pathOrName: string): string {
  const name = basename(pathOrName);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) {
    return "FILE";
  }
  return name.slice(dot + 1).toUpperCase();
}

/** Icon for a file based on its name / extension (matches free-response upload behavior). */
export function faIconForFileName(pathOrName: string): FaIconName {
  const name = basename(pathOrName);
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";

  if (ext === "pdf") return "file-pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
    return "file-image";
  }
  if (
    ["html", "htm", "css", "js", "ts", "tsx", "jsx", "json", "java", "py"].includes(ext)
  ) {
    return "file-code";
  }
  if (ext === "csv") return "file-csv";
  if (["xlsx", "xls"].includes(ext)) return "file-excel";
  if (["doc", "docx"].includes(ext)) return "file-word";
  if (["ppt", "pptx"].includes(ext)) return "file-powerpoint";
  if (["zip", "rar", "7z"].includes(ext)) return "file-zipper";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "file-audio";
  if (["mp4", "webm", "mov"].includes(ext)) return "file-video";
  return "file";
}
