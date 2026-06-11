import type { ChatAttachment } from "../../types/chat";
import type { BackpackItem } from "../../types/backpack";
import { extensionFromBackpackItemName } from "./backpackImportAllowlist";

function mimeTypeFromExtension(extension: string): string | undefined {
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "html":
    case "htm":
      return "text/html";
    case "css":
      return "text/css";
    case "js":
    case "mjs":
    case "cjs":
      return "text/javascript";
    case "json":
      return "application/json";
    case "md":
      return "text/markdown";
    case "txt":
      return "text/plain";
    case "csv":
      return "text/csv";
    case "py":
      return "text/x-python";
    default:
      return undefined;
  }
}

export function backpackItemToChatAttachment(item: BackpackItem): ChatAttachment {
  const extension = extensionFromBackpackItemName(item.name);
  const path = `backpack/${item.id}/${item.name}`;
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const imageDataUrl =
    item.thumbnailSrc?.startsWith("data:image/")
      ? item.thumbnailSrc
      : item.content.startsWith("data:image/")
        ? item.content
        : undefined;

  return {
    fileName: item.name,
    path,
    timestamp,
    source: "upload",
    mimeType: mimeTypeFromExtension(extension),
    imageSrc: imageDataUrl,
    imageDataUrl,
    content: imageDataUrl ? undefined : item.content,
  };
}
