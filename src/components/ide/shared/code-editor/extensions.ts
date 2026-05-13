import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import type { FileKind } from "../../../../types/file";

/** Map a file kind to its CodeMirror language extension. */
export function getLanguageExtension(lang: FileKind, fileName?: string) {
  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (lang === "file") {
    if (["js", "mjs", "cjs", "jsx"].includes(extension ?? "")) {
      return javascript({ jsx: extension === "jsx" });
    }
    if (["ts", "tsx"].includes(extension ?? "")) {
      return javascript({ typescript: true, jsx: extension === "tsx" });
    }
    if (extension === "html" || extension === "htm") return html();
    if (extension === "css") return css();
    if (extension === "py") return python();
  }

  switch (lang) {
    case "html":
      return html();
    case "css":
      return css();
    case "python":
      return python();
    case "image":
    case "text":
    case "file":
      return [];
    default:
      return javascript();
  }
}
