import { EditorView } from "@codemirror/view";

const surface = "var(--background-neutral-primary)";
const activeLineBg =
  "color-mix(in srgb, var(--background-neutral-secondary) 55%, transparent)";
const selectionBg =
  "color-mix(in srgb, var(--background-brand-light) 80%, transparent)";

const addedLineBg = "var(--background-success-light)";
const removedLineBg = "var(--background-error-light)";
const modifiedLineBg = "var(--background-brand-light)";

const addedAccent = "var(--background-success-primary)";
const removedAccent = "var(--background-error-primary)";
const modifiedAccent = "var(--background-selected-strong)";

/**
 * CodeMirror theme that pins all surfaces, gutters, selections and diff
 * highlights to design-system tokens. `!important` is used where the
 * `@codemirror/merge` baseTheme needs to be overridden.
 */
export const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    fontFamily: "var(--font-family-mono)",
    fontSize: "var(--text-code)",
    height: "100%",
  },
  ".cm-content": {
    fontFamily: "var(--font-family-mono)",
    fontSize: "var(--text-code)",
    lineHeight: "20px",
    padding: "0",
    caretColor: "var(--text-neutral-primary)",
  },
  "&.cm-readonly .cm-content": {
    caretColor: "transparent",
  },
  "&.cm-readonly.cm-focused .cm-cursor": {
    display: "none",
  },
  ".cm-line": {
    padding: "0 8px 0 8px",
  },

  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: `${selectionBg} !important`,
  },
  ".cm-content ::selection": {
    backgroundColor: selectionBg,
  },
  "&.cm-hasUserSelection .cm-activeLine": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },

  ".cm-gutters": {
    backgroundColor: surface,
    border: "none",
    fontFamily: "var(--font-family-mono)",
    fontSize: "var(--text-code)",
    color: "var(--text-neutral-quaternary)",
    paddingLeft: "6px",
  },
  ".cm-gutter": {
    backgroundColor: surface,
  },
  ".cm-lineNumbers .cm-gutterElement": {
    lineHeight: "20px",
    minWidth: "32px",
    padding: "0 8px 0 0",
    textAlign: "right",
  },
  ".cm-scroller": {
    overflow: "auto",
  },

  ".cm-activeLine": {
    backgroundColor: activeLineBg,
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--text-neutral-primary)",
  },

  ".cm-changedLine": {
    backgroundColor: `${addedLineBg} !important`,
  },
  ".cm-inlineChangedLine": {
    backgroundColor: `${modifiedLineBg} !important`,
  },
  ".cm-deletedLine": {
    backgroundColor: `${removedLineBg} !important`,
    minHeight: "20px",
  },

  ".cm-changedText, del.cm-deletedText, .cm-deletedChunk .cm-deletedText": {
    background: "none !important",
    margin: "0",
    padding: "0",
  },

  "ins.cm-insertedLine": {
    backgroundColor: "transparent !important",
    margin: "0",
    padding: "0",
    textDecoration: "none",
  },
  ".cm-deletedLine del, del.cm-deletedText": {
    color: "var(--text-error-primary)",
    textDecoration: "none",
  },

  "& .cm-deletedChunk": {
    backgroundColor: "transparent !important",
    color: "var(--text-error-primary)",
    paddingLeft: "0 !important",
  },

  ".cm-changeGutter": {
    width: "1.5px",
    minWidth: "1.5px",
    padding: "0",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  ".cm-changeGutter .cm-gutterElement": {
    width: "1.5px",
    minWidth: "1.5px",
    height: "20px",
    lineHeight: "20px",
    padding: "0",
  },
  ".cm-changedLineGutter": {
    backgroundColor: `${addedAccent} !important`,
  },
  ".cm-deletedLineGutter": {
    backgroundColor: `${removedAccent} !important`,
  },
  ".cm-inlineChangedLineGutter": {
    backgroundColor: `${modifiedAccent} !important`,
  },
});
