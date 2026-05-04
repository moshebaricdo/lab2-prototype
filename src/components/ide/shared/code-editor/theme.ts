import { EditorView } from "@codemirror/view";

const surface = "var(--ds-background-neutral-primary)";
const activeLineBg =
  "color-mix(in srgb, var(--ds-background-neutral-secondary) 55%, transparent)";
const selectionBg =
  "color-mix(in srgb, var(--ds-background-brand-teal-extra-light) 80%, transparent)";

const addedLineBg = "var(--ds-background-success-extra-light)";
const removedLineBg = "var(--ds-background-error-extra-light)";
const modifiedLineBg = "var(--ds-background-brand-aqua-extra-light)";

const addedAccent = "var(--ds-background-success-primary)";
const removedAccent = "var(--ds-background-error-primary)";
const modifiedAccent = "var(--ds-background-brand-aqua-strong)";

/**
 * CodeMirror theme that pins all surfaces, gutters, selections and diff
 * highlights to design-system tokens. `!important` is used where the
 * `@codemirror/merge` baseTheme needs to be overridden.
 */
export const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-code)",
    height: "100%",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-code)",
    lineHeight: "20px",
    padding: "0",
    caretColor: "var(--ds-text-neutral-primary)",
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
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-code)",
    color: "var(--ds-text-neutral-quaternary)",
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
    color: "var(--ds-text-neutral-primary)",
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
    color: "var(--ds-text-error-primary)",
    textDecoration: "none",
  },

  "& .cm-deletedChunk": {
    backgroundColor: "transparent !important",
    color: "var(--ds-text-error-primary)",
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
