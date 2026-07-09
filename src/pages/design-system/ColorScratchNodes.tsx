import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NodeResizer,
  type NodeProps,
} from "@xyflow/react";
import type { ScratchNodeData } from "../../lib/colorSandbox/scratchLayer";
import styles from "./ColorScratchNodes.module.scss";

interface ScratchActions {
  updateScratchNode: (id: string, partial: Partial<ScratchNodeData>) => void;
}

const ScratchActionsContext = createContext<ScratchActions | null>(null);

export function ScratchActionsProvider({
  value,
  children,
}: {
  value: ScratchActions;
  children: React.ReactNode;
}) {
  return (
    <ScratchActionsContext.Provider value={value}>
      {children}
    </ScratchActionsContext.Provider>
  );
}

function useScratchActions(): ScratchActions {
  const context = useContext(ScratchActionsContext);
  if (!context) {
    throw new Error("Scratch node rendered outside ScratchActionsProvider");
  }
  return context;
}

const RESIZER_LINE_STYLE = {
  borderColor: "var(--ds-border-selected-primary)",
  borderWidth: 1,
} as const;

const RESIZER_HANDLE_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 2,
  background: "var(--ds-background-neutral-primary)",
  borderColor: "var(--ds-border-selected-primary)",
} as const;

function ScratchResizer({
  selected,
  onResizeStart,
}: {
  selected: boolean;
  onResizeStart?: () => void;
}) {
  return (
    <NodeResizer
      isVisible={selected}
      minWidth={24}
      minHeight={24}
      onResizeStart={onResizeStart}
      lineStyle={RESIZER_LINE_STYLE}
      handleStyle={RESIZER_HANDLE_STYLE}
    />
  );
}

export function ScratchSwatchNode({ data, selected }: NodeProps) {
  const { fill, border = "" } = data as ScratchNodeData;
  const borderColor = border.trim().length > 0 ? border : undefined;
  return (
    <div
      className={`${styles.swatch} ${styles.scratchSurface} ${selected ? styles.selected : ""}`}
      style={{
        background: fill,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    >
      <ScratchResizer selected={Boolean(selected)} />
    </div>
  );
}

export function ScratchTextNode({ id, data, selected }: NodeProps) {
  const { fill, text, textAlign = "left" } = data as ScratchNodeData;
  const { updateScratchNode } = useScratchActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [text, editing]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const next = draft.trim().length > 0 ? draft : "Text";
    if (next !== text) updateScratchNode(id, { text: next });
    else setDraft(text);
  }, [draft, text, id, updateScratchNode]);

  return (
    <div
      className={`${styles.text} ${styles.scratchSurface} ${selected ? styles.selected : ""}`}
      style={{ textAlign }}
      onDoubleClick={() => setEditing(true)}
    >
      <ScratchResizer
        selected={Boolean(selected)}
        onResizeStart={() => updateScratchNode(id, { textSizing: "fixed" })}
      />
      {editing ? (
        <textarea
          ref={textareaRef}
          className={`${styles.textInput} nodrag nopan`}
          value={draft}
          style={{ color: fill, textAlign }}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraft(text);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className={styles.textValue} style={{ color: fill }}>
          {text || "Text"}
        </span>
      )}
    </div>
  );
}

export const scratchNodeTypes = {
  scratchSwatch: ScratchSwatchNode,
  scratchText: ScratchTextNode,
};
