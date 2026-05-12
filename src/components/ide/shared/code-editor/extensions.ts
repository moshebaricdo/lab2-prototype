import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import type { FileKind } from "../../../../types/file";

/** Map a file kind to its CodeMirror language extension. */
export function getLanguageExtension(lang: FileKind) {
  switch (lang) {
    case "html":
      return html();
    case "css":
      return css();
    case "python":
      return python();
    case "text":
    case "file":
      return [];
    default:
      return javascript();
  }
}
