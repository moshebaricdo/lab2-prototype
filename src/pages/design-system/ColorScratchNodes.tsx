import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
  syncScratchTextWidth: (id: string, text: string) => void;
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
  borderColor: "var(--ds-borders-brand-teal-primary)",
  borderWidth: 1,
} as const;

const RESIZER_HANDLE_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 2,
  background: "var(--ds-background-neutral-primary)",
  borderColor: "var(--ds-borders-brand-teal-primary)",
} as const;

function ScratchResizer({ selected }: { selected: boolean }) {
  return (
    <NodeResizer
      isVisible={selected}
      minWidth={24}
      minHeight={24}
      lineStyle={RESIZER_LINE_STYLE}
      handleStyle={RESIZER_HANDLE_STYLE}
    />
  );
}

export function ScratchSwatchNode({ data, selected }: NodeProps) {
  const { fill } = data as ScratchNodeData;
  return (
    <div
      className={`${styles.swatch} ${styles.scratchSurface} ${selected ? styles.selected : ""}`}
      style={{ background: fill }}
    >
      <ScratchResizer selected={Boolean(selected)} />
    </div>
  );
}

export function ScratchTextNode({ id, data, selected }: NodeProps) {
  const { fill, text } = data as ScratchNodeData;
  const { updateScratchNode, syncScratchTextWidth } = useScratchActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [text, editing]);

  useLayoutEffect(() => {
    if (editing) return;
    syncScratchTextWidth(id, text || "Text");
  }, [id, text, editing, syncScratchTextWidth]);

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
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className={`${styles.textInput} nodrag nopan`}
          value={draft}
          style={{ color: fill }}
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
