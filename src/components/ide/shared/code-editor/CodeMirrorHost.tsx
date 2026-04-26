import { useEffect, useRef, useState, useCallback } from "react";
import {
  EditorView,
  lineNumbers,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  ViewUpdate,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { syntaxHighlighting } from "@codemirror/language";
import { unifiedMergeView } from "@codemirror/merge";
import { AppButton } from "../../../ui/AppButton";
import type { FileKind } from "../../../../types/file";
import { dsHighlightStyle } from "./highlightStyle";
import { editorTheme } from "./theme";
import { getLanguageExtension } from "./extensions";
import styles from "./CodeEditor.module.scss";

interface CodeMirrorHostProps {
  code: string;
  language: FileKind;
  fileName?: string;
  /**
   * When provided, renders a unified diff against this baseline and forces
   * read-only behavior (the editor cannot be edited while AI changes are
   * being shown).
   */
  originalCode?: string;
  /**
   * Explicit read-only override. When `undefined`, read-only is derived from
   * `originalCode !== undefined`. Pass `true`/`false` to force the state.
   */
  readOnly?: boolean;
  onChange?: (code: string) => void;
  className?: string;
}

interface FloatingBarState {
  top: number;
  left: number;
  startLine: number;
  endLine: number;
}

/**
 * Inner CodeMirror surface. Owns the editor view, the diff view when
 * `originalCode` is provided, and the floating "Add to AI Tutor" bar that
 * appears below a non-empty selection.
 */
export function CodeMirrorHost({
  code,
  language,
  fileName,
  originalCode,
  readOnly,
  onChange,
  className,
}: CodeMirrorHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [floatingBar, setFloatingBar] = useState<FloatingBarState | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isReadOnly = readOnly ?? originalCode !== undefined;

  const updateFloatingBar = useCallback((view: EditorView) => {
    const sel = view.state.selection.main;
    if (sel.empty) {
      setFloatingBar(null);
      return;
    }

    const startLine = view.state.doc.lineAt(sel.from).number;
    const endLine = view.state.doc.lineAt(sel.to).number;

    const endCoords = view.coordsAtPos(sel.to);
    const wrapperEl = containerRef.current?.parentElement;
    if (!endCoords || !wrapperEl) {
      setFloatingBar(null);
      return;
    }

    const wrapperRect = wrapperEl.getBoundingClientRect();
    const top = endCoords.bottom - wrapperRect.top + 4;

    if (top < 0 || top > wrapperRect.height) {
      setFloatingBar(null);
      return;
    }

    const gutterEl = view.dom.querySelector(".cm-gutters");
    const left = gutterEl ? gutterEl.getBoundingClientRect().width : 0;

    setFloatingBar({ top, left, startLine, endLine });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const selectionListener = EditorView.updateListener.of(
      (update: ViewUpdate) => {
        if (
          update.selectionSet ||
          update.geometryChanged ||
          update.viewportChanged
        ) {
          updateFloatingBar(update.view);
        }
        if (update.docChanged && !isReadOnly) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      },
    );

    const state = EditorState.create({
      doc: code,
      extensions: [
        EditorView.editable.of(true),
        EditorState.readOnly.of(isReadOnly),
        EditorView.editorAttributes.of({
          class: isReadOnly ? "cm-readonly" : "cm-editable",
        }),
        drawSelection(),
        ...(isReadOnly
          ? []
          : [highlightActiveLine(), highlightActiveLineGutter()]),
        lineNumbers(),
        getLanguageExtension(language),
        originalCode !== undefined
          ? unifiedMergeView({
              original: originalCode,
              mergeControls: false,
              gutter: true,
              allowInlineDiffs: true,
            })
          : [],
        syntaxHighlighting(dsHighlightStyle),
        editorTheme,
        selectionListener,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    const scroller = view.scrollDOM;
    const onScroll = () => updateFloatingBar(view);
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      view.destroy();
      viewRef.current = null;
    };
    // Recreate the editor view whenever language, diff baseline or read-only
    // mode flips — these all require a new extension array. `code` is synced
    // via the dispatch effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, originalCode, isReadOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === code) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: code },
    });
  }, [code]);

  const handleAddToTutor = useCallback(() => {
    if (!floatingBar || !fileName) return;
    const view = viewRef.current;
    const selectedText = view
      ? view.state.sliceDoc(
          view.state.selection.main.from,
          view.state.selection.main.to,
        )
      : "";

    window.dispatchEvent(
      new CustomEvent("weblab:add-to-tutor", {
        detail: {
          fileName,
          startLine: floatingBar.startLine,
          endLine: floatingBar.endLine,
          selectedText,
        },
      }),
    );
    if (view) {
      view.dispatch({
        selection: { anchor: view.state.selection.main.head },
      });
    }
    setFloatingBar(null);
  }, [floatingBar, fileName]);

  return (
    <div
      className={className}
      style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative" }}
    >
      <div ref={containerRef} style={{ height: "100%" }} />
      {floatingBar && (
        <div
          data-floating-bar
          className={styles.floatingActionBar}
          style={{ top: floatingBar.top, left: floatingBar.left }}
        >
          <AppButton
            variant="tertiary"
            tone="black"
            size="xs"
            iconName="message-code"
            onClick={handleAddToTutor}
          >
            Add to AI Tutor Chat
          </AppButton>
        </div>
      )}
    </div>
  );
}
