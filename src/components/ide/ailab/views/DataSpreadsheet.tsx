import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
} from "react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { useVirtualRange } from "../../../../hooks/useVirtualRange";
import { formatCell, uniqueValues } from "../../../../lib/aiLab";
import type {
  AiLabCellValue,
  AiLabColumn,
  AiLabDataRow,
} from "../../../../types/aiLab";
import styles from "./DataStudio.module.scss";

/** Must match `.th, .td { height }` in DataStudio.module.scss. */
const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;

interface CellRef {
  rowIndex: number;
  columnId: string;
}

interface DataSpreadsheetProps {
  lab: AiLabController;
}

function parseValue(column: AiLabColumn, raw: string): AiLabCellValue | null {
  if (column.type !== "numerical") return raw;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : null;
}

function datalistId(columnId: string) {
  return `ai-lab-col-${columnId}`;
}

export function DataSpreadsheet({ lab }: DataSpreadsheetProps) {
  const columns = lab.config.dataset.columns;
  const rows = lab.rows;
  const gridRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);
  const [active, setActive] = useState<CellRef | undefined>();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const { start, end, topPad, bottomPad, scrollIntoView } = useVirtualRange({
    scrollRef,
    itemCount: rows.length,
    itemSize: ROW_HEIGHT,
    leadingOffset: HEADER_HEIGHT,
    overscan: 8,
  });

  // Row handlers are stable (they read the latest state through this ref) so
  // `SheetRow` can be memoized and only the touched rows re-render.
  const latest = useRef({ active, editing, draft, columns, rows, lab });
  latest.current = { active, editing, draft, columns, rows, lab };

  const activeColumn = active
    ? columns.find((entry) => entry.id === active.columnId)
    : undefined;
  const editingSuggestions =
    editing && activeColumn?.type === "categorical"
      ? uniqueValues(rows, activeColumn.id)
      : undefined;

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing, active?.columnId, active?.rowIndex]);

  useEffect(() => {
    if (!lab.selectedColumnId) return;
    const header = gridRef.current?.querySelector(
      `[data-col="${lab.selectedColumnId}"]`,
    );
    header?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [lab.selectedColumnId]);

  const focusCell = useCallback(
    (cell: CellRef) => {
      setActive(cell);
      latest.current.lab.setSelectedColumnId(cell.columnId);
      scrollIntoView(cell.rowIndex);
    },
    [scrollIntoView],
  );

  const move = useCallback(
    (rowDelta: number, columnDelta: number) => {
      const { active: current, columns: cols, rows: all } = latest.current;
      if (!current) {
        const first = cols[0];
        if (first) focusCell({ rowIndex: 0, columnId: first.id });
        return;
      }
      const columnIndex = cols.findIndex((column) => column.id === current.columnId);
      const nextColumn = cols[columnIndex + columnDelta];
      const nextRow = current.rowIndex + rowDelta;
      if (!nextColumn || nextRow < 0 || nextRow >= all.length) return;
      focusCell({ rowIndex: nextRow, columnId: nextColumn.id });
    },
    [focusCell],
  );

  const beginEdit = useCallback((cell: CellRef, seed?: string) => {
    const { rows: all, columns: cols, lab: controller } = latest.current;
    if (controller.config.allowDataEdit === false) return;
    const row = all[cell.rowIndex];
    const column = cols.find((entry) => entry.id === cell.columnId);
    if (!row || !column) return;
    setActive(cell);
    setDraft(seed ?? formatCell(row[column.id]));
    setEditing(true);
  }, []);

  const commit = useCallback(() => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    const { active: current, columns: cols, draft: value, lab: controller } =
      latest.current;
    if (!current) return;
    const column = cols.find((entry) => entry.id === current.columnId);
    if (!column) return;
    const parsed = parseValue(column, value);
    if (parsed !== null) {
      controller.updateCell(current.rowIndex, current.columnId, parsed);
    }
    setEditing(false);
  }, []);
  // The editor unmounts if its row scrolls out of the window; commit first so
  // the typed value is not silently lost.
  useEffect(() => {
    if (!editing || !active) return;
    if (active.rowIndex < start || active.rowIndex >= end) commit();
  }, [active, commit, editing, end, start]);

  const cancel = useCallback(() => {
    skipCommitRef.current = true;
    setEditing(false);
    gridRef.current?.focus();
  }, []);

  const onCellClick = useCallback(
    (cell: CellRef) => {
      setActive(cell);
      latest.current.lab.setSelectedColumnId(cell.columnId);
      gridRef.current?.focus();
    },
    [],
  );

  const onCellDoubleClick = useCallback(
    (cell: CellRef) => {
      latest.current.lab.setSelectedColumnId(cell.columnId);
      beginEdit(cell);
    },
    [beginEdit],
  );

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing) return;

    if (event.key === "Escape") {
      event.preventDefault();
      if (active) {
        setActive(undefined);
        return;
      }
      if (lab.selectedColumnId) lab.setSelectedColumnId(undefined);
      return;
    }

    if (!active) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        move(0, 0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(0, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(0, -1);
    } else if (event.key === "Tab") {
      event.preventDefault();
      move(0, event.shiftKey ? -1 : 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const first = columns[0];
      if (first) focusCell({ rowIndex: active.rowIndex, columnId: first.id });
    } else if (event.key === "End") {
      event.preventDefault();
      const last = columns[columns.length - 1];
      if (last) focusCell({ rowIndex: active.rowIndex, columnId: last.id });
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault();
      const pageRows = Math.max(
        1,
        Math.floor(
          ((scrollRef.current?.clientHeight ?? 0) - HEADER_HEIGHT) / ROW_HEIGHT,
        ) - 1,
      );
      const target = Math.min(
        rows.length - 1,
        Math.max(
          0,
          active.rowIndex + (event.key === "PageDown" ? pageRows : -pageRows),
        ),
      );
      focusCell({ rowIndex: target, columnId: active.columnId });
    } else if (event.key === "Enter" || event.key === "F2") {
      if (lab.config.allowDataEdit === false) return;
      event.preventDefault();
      beginEdit(active);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      if (lab.config.allowDataEdit === false) return;
      event.preventDefault();
      if (!activeColumn) return;
      lab.updateCell(
        active.rowIndex,
        active.columnId,
        activeColumn.type === "numerical" ? 0 : "",
      );
    } else if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      if (lab.config.allowDataEdit === false) return;
      event.preventDefault();
      beginEdit(active, event.key);
    }
  };

  const onEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
        move(1, 0);
        gridRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        commit();
        move(0, event.shiftKey ? -1 : 1);
        gridRef.current?.focus();
      }
    },
    [cancel, commit, move],
  );

  const onDraftChange = useCallback((value: string) => setDraft(value), []);

  const visibleRows: ReactElement[] = [];
  for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
    const isActiveRow = active?.rowIndex === rowIndex;
    visibleRows.push(
      <SheetRow
        key={rowIndex}
        rowIndex={rowIndex}
        row={rows[rowIndex]}
        columns={columns}
        selectedColumnId={lab.selectedColumnId}
        activeColumnId={isActiveRow ? active?.columnId : undefined}
        editing={isActiveRow && editing}
        draft={isActiveRow && editing ? draft : ""}
        inputRef={inputRef}
        onCellClick={onCellClick}
        onCellDoubleClick={onCellDoubleClick}
        onDraftChange={onDraftChange}
        onEditorBlur={commit}
        onEditorKeyDown={onEditorKeyDown}
      />,
    );
  }

  return (
    <div className={styles.sheet}>
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.scrollBody}>
          <table
            ref={gridRef}
            className={styles.grid}
            tabIndex={0}
            role="grid"
            aria-label={lab.config.dataset.name}
            aria-readonly={lab.config.allowDataEdit === false}
            aria-colcount={columns.length + 1}
            aria-rowcount={rows.length + 1}
            onKeyDown={onGridKeyDown}
          >
          <colgroup>
            <col className={styles.colIndex} />
            {columns.map((column) => (
              <col
                key={column.id}
                className={
                  column.type === "numerical" ? styles.colNumber : styles.colText
                }
              />
            ))}
          </colgroup>
          <thead>
            <tr aria-rowindex={1}>
              <th className={`${styles.th} ${styles.thIndex}`} />
              {columns.map((column) => {
                const inspecting = lab.selectedColumnId === column.id;
                const isLabel = lab.labelColumn === column.id;
                const isFeature = lab.selectedFeatures.includes(column.id);
                return (
                  <th
                    key={column.id}
                    data-col={column.id}
                    className={`${styles.th} ${
                      column.type === "numerical" ? styles.thNumeric : ""
                    } ${inspecting ? styles.thSelected : ""} ${
                      isLabel ? styles.thLabel : ""
                    } ${isFeature ? styles.thFeature : ""}`}
                  >
                    <button
                      type="button"
                      className={styles.thButton}
                      aria-pressed={inspecting}
                      onClick={() => {
                        setActive(undefined);
                        lab.selectColumn(column.id);
                      }}
                    >
                      <span className={styles.thLead}>
                        <span className={styles.thName}>{column.name}</span>
                        {isLabel || isFeature ? (
                          <span
                            className={`${styles.roleDot} ${
                              isLabel
                                ? styles.roleDotLabel
                                : styles.roleDotFeature
                            }`}
                            aria-hidden
                          />
                        ) : null}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {topPad > 0 ? (
              <tr aria-hidden className={styles.spacerRow}>
                <td colSpan={columns.length + 1} style={{ height: topPad }} />
              </tr>
            ) : null}
            {visibleRows}
            {bottomPad > 0 ? (
              <tr aria-hidden className={styles.spacerRow}>
                <td colSpan={columns.length + 1} style={{ height: bottomPad }} />
              </tr>
            ) : null}
          </tbody>
          </table>
          {editingSuggestions && activeColumn ? (
            <datalist id={datalistId(activeColumn.id)}>
              {editingSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          ) : null}
          {lab.config.allowDataEdit === false ? null : (
            <button type="button" className={styles.addRow} onClick={() => lab.addRow()}>
              Add row
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SheetRowProps {
  rowIndex: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  selectedColumnId: string | undefined;
  /** Set only when this row holds the active cell. */
  activeColumnId: string | undefined;
  editing: boolean;
  draft: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onCellClick: (cell: CellRef) => void;
  onCellDoubleClick: (cell: CellRef) => void;
  onDraftChange: (value: string) => void;
  onEditorBlur: () => void;
  onEditorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const SheetRow = memo(function SheetRow({
  rowIndex,
  row,
  columns,
  selectedColumnId,
  activeColumnId,
  editing,
  draft,
  inputRef,
  onCellClick,
  onCellDoubleClick,
  onDraftChange,
  onEditorBlur,
  onEditorKeyDown,
}: SheetRowProps) {
  const rowSelected = activeColumnId !== undefined;
  return (
    <tr aria-rowindex={rowIndex + 2}>
      <td className={`${styles.td} ${styles.tdIndex}`}>{rowIndex + 1}</td>
      {columns.map((column) => {
        const isActive = activeColumnId === column.id;
        const isColumn = selectedColumnId === column.id;
        const isEditing = isActive && editing;
        return (
          <td
            key={column.id}
            className={`${styles.td} ${
              column.type === "numerical" ? styles.tdNumeric : ""
            } ${isColumn ? styles.tdSelectedColumn : ""} ${
              rowSelected ? styles.tdSelectedRow : ""
            } ${isActive ? styles.tdActive : ""}`}
            aria-selected={isActive}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className={styles.cellInput}
                type={column.type === "numerical" ? "number" : "text"}
                value={draft}
                list={
                  column.type === "categorical" ? datalistId(column.id) : undefined
                }
                aria-label={`${column.name}, row ${rowIndex + 1}`}
                onChange={(event) => onDraftChange(event.target.value)}
                onBlur={onEditorBlur}
                onKeyDown={onEditorKeyDown}
              />
            ) : (
              <button
                type="button"
                className={styles.cellButton}
                tabIndex={-1}
                onClick={() => onCellClick({ rowIndex, columnId: column.id })}
                onDoubleClick={() =>
                  onCellDoubleClick({ rowIndex, columnId: column.id })
                }
              >
                {formatCell(row[column.id])}
              </button>
            )}
          </td>
        );
      })}
    </tr>
  );
});
