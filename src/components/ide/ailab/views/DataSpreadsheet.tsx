import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
} from "react";
import { Button, Tooltip } from "@moshebari/cads-react";
import type { FaIconName } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { useTheme } from "../../../../hooks/useTheme";
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

export type SortDirection = "asc" | "desc";

export interface ColumnSort {
  columnId: string;
  direction: SortDirection;
}

function cellEmpty(value: AiLabCellValue | undefined) {
  return value === null || value === undefined || value === "";
}

/** Empty cells stay last in either direction. Ties keep the original row order. */
export function compareCells(
  a: AiLabCellValue | undefined,
  b: AiLabCellValue | undefined,
  numeric: boolean,
  direction: SortDirection,
): number {
  const emptyA = cellEmpty(a);
  const emptyB = cellEmpty(b);
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;
  const compared = numeric
    ? Number(a) - Number(b)
    : String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
  return direction === "asc" ? compared : -compared;
}

export function cycleSort(
  current: ColumnSort | null,
  columnId: string,
): ColumnSort | null {
  if (!current || current.columnId !== columnId) {
    return { columnId, direction: "asc" };
  }
  if (current.direction === "asc") return { columnId, direction: "desc" };
  return null;
}

function rowOrder(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  sort: ColumnSort | null,
  filteredRowIndexes: number[],
): number[] {
  const indexes = [...filteredRowIndexes];
  if (!sort) return indexes;
  const column = columns.find((entry) => entry.id === sort.columnId);
  if (!column) return indexes;
  const numeric = column.type === "numerical";
  return indexes.sort((a, b) => {
    const compared = compareCells(
      rows[a]?.[column.id],
      rows[b]?.[column.id],
      numeric,
      sort.direction,
    );
    return compared || a - b;
  });
}

/** Button icon is the current sort. Tooltip names the next click, with that step's icon. */
export function sortPresentation(
  column: Pick<AiLabColumn, "name" | "type">,
  direction: SortDirection | undefined,
): { buttonIcon: FaIconName; label: string; tooltipIcon?: FaIconName } {
  const numeric = column.type === "numerical";
  if (direction === "desc") {
    return {
      buttonIcon: numeric ? "arrow-up-1-9" : "arrow-up-a-z",
      label: "Original order",
    };
  }
  if (direction === "asc") {
    return {
      buttonIcon: numeric ? "arrow-down-1-9" : "arrow-down-a-z",
      label: numeric
        ? `Sort by ${column.name} 9-1`
        : `Sort by ${column.name} Z-A`,
      tooltipIcon: numeric ? "arrow-up-9-1" : "arrow-up-z-a",
    };
  }
  return {
    buttonIcon: "sort",
    label: numeric ? `Sort by ${column.name} 1-9` : `Sort by ${column.name} A-Z`,
    tooltipIcon: numeric ? "arrow-down-1-9" : "arrow-down-a-z",
  };
}

/** Sortable column header cell shared by read-only modal sheets. */
export function SortableSheetTh({
  column,
  sortId = column.id,
  sort,
  onSortChange,
  className = "",
}: {
  column: Pick<AiLabColumn, "id" | "name" | "type">;
  sortId?: string;
  sort: ColumnSort | null;
  onSortChange: (next: ColumnSort | null) => void;
  className?: string;
}) {
  const direction = sort?.columnId === sortId ? sort.direction : undefined;
  const sortUi = sortPresentation(column, direction);
  return (
    <th
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
      className={[
        styles.th,
        column.type === "numerical" ? styles.thNumeric : "",
        direction ? styles.thSorted : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.thLead}>
        <span className={styles.thName}>{column.name}</span>
      </span>
      <span className={styles.sortButton}>
        <Tooltip
          title={sortUi.label}
          iconName={sortUi.tooltipIcon}
          placement="bottom"
        >
          <Button
            type="button"
            size="extraSmall"
            variant="text"
            color="secondary"
            iconOnly
            startIconName={sortUi.buttonIcon}
            className={styles.sortControl}
            aria-label={sortUi.label}
            onClick={(event) => {
              const next = cycleSort(sort, sortId);
              if (!next) event.currentTarget.blur();
              onSortChange(next);
            }}
          />
        </Tooltip>
      </span>
    </th>
  );
}

export function DataSpreadsheet({ lab }: DataSpreadsheetProps) {
  const { theme } = useTheme();
  const columns = lab.config.dataset.columns;
  const rows = lab.rows;
  const readOnly = lab.config.allowDataEdit === false;
  /** Drives `--index-col-ch` so the row # column fits the longest index. */
  const indexColCh = Math.max(1, String(rows.length).length);
  const gridColumnCount = columns.length + 1;
  const gridRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);
  const [active, setActive] = useState<CellRef | undefined>();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState<ColumnSort | null>(null);
  const filteredRowIndexes = lab.filteredRowIndexes;
  const order = useMemo(
    () => rowOrder(rows, columns, sort, filteredRowIndexes),
    [rows, columns, sort, filteredRowIndexes],
  );
  const orderRef = useRef(order);
  orderRef.current = order;

  const { start, end, topPad, bottomPad, scrollIntoView } = useVirtualRange({
    scrollRef,
    itemCount: order.length,
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
      const visual = orderRef.current.indexOf(cell.rowIndex);
      scrollIntoView(visual >= 0 ? visual : cell.rowIndex);
    },
    [scrollIntoView],
  );

  const move = useCallback(
    (rowDelta: number, columnDelta: number) => {
      const { active: current, columns: cols } = latest.current;
      const currentOrder = orderRef.current;
      if (currentOrder.length === 0) return;
      if (!current) {
        const first = cols[0];
        if (first) {
          focusCell({
            rowIndex: currentOrder[0] ?? 0,
            columnId: first.id,
          });
        }
        return;
      }
      const columnIndex = cols.findIndex((column) => column.id === current.columnId);
      const nextColumn = cols[columnIndex + columnDelta];
      const visual = currentOrder.indexOf(current.rowIndex);
      const nextVisual = (visual >= 0 ? visual : 0) + rowDelta;
      if (!nextColumn || nextVisual < 0 || nextVisual >= currentOrder.length) return;
      focusCell({
        rowIndex: currentOrder[nextVisual] ?? current.rowIndex,
        columnId: nextColumn.id,
      });
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
    const visual = orderRef.current.indexOf(active.rowIndex);
    if (visual < start || visual >= end) commit();
  }, [active, commit, editing, end, start]);

  useEffect(() => {
    const current = latest.current.active;
    if (!current) return;
    const visual = orderRef.current.indexOf(current.rowIndex);
    if (visual >= 0) scrollIntoView(visual);
  }, [scrollIntoView, sort]);

  const cancel = useCallback(() => {
    skipCommitRef.current = true;
    setEditing(false);
    gridRef.current?.focus();
  }, []);

  const onCellClick = useCallback(
    (cell: CellRef) => {
      latest.current.lab.setSelectedColumnId(cell.columnId);
      if (latest.current.lab.config.allowDataEdit === false) return;
      setActive(cell);
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
    if (readOnly) return;
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
      if (orderRef.current.length === 0) return;
      const pageRows = Math.max(
        1,
        Math.floor(
          ((scrollRef.current?.clientHeight ?? 0) - HEADER_HEIGHT) / ROW_HEIGHT,
        ) - 1,
      );
      const visual = Math.max(0, orderRef.current.indexOf(active.rowIndex));
      const targetVisual = Math.min(
        orderRef.current.length - 1,
        Math.max(0, visual + (event.key === "PageDown" ? pageRows : -pageRows)),
      );
      focusCell({
        rowIndex: orderRef.current[targetVisual] ?? active.rowIndex,
        columnId: active.columnId,
      });
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
  for (let visualIndex = start; visualIndex < end; visualIndex += 1) {
    const rowIndex = order[visualIndex];
    if (rowIndex === undefined) continue;
    const isActiveRow = active?.rowIndex === rowIndex;
    visibleRows.push(
      <SheetRow
        key={rowIndex}
        rowIndex={rowIndex}
        visualIndex={visualIndex}
        row={rows[rowIndex]}
        columns={columns}
        selectedColumnId={lab.selectedColumnId}
        labelColumnId={lab.labelColumn}
        featureColumnIds={lab.selectedFeatures}
        activeColumnId={readOnly ? undefined : isActiveRow ? active?.columnId : undefined}
        editing={!readOnly && isActiveRow && editing}
        draft={!readOnly && isActiveRow && editing ? draft : ""}
        readOnly={readOnly}
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
        <div
          className={styles.scrollBody}
          style={{ "--index-col-ch": indexColCh } as CSSProperties}
        >
          <table
            ref={gridRef}
            className={styles.grid}
            tabIndex={readOnly ? -1 : 0}
            role="grid"
            aria-label={lab.config.dataset.name}
            aria-readonly={readOnly}
            aria-colcount={gridColumnCount}
            aria-rowcount={rows.length + 1}
            onKeyDown={onGridKeyDown}
          >
          <colgroup>
            <col className={styles.colIndex} />
            {columns.map((column) => (
              <col key={column.id} />
            ))}
          </colgroup>
          <thead>
            <tr aria-rowindex={1}>
              <th className={`${styles.th} ${styles.thIndex}`} />
              {columns.map((column) => {
                const inspecting = lab.selectedColumnId === column.id;
                const isLabel = lab.labelColumn === column.id;
                const isFeature = lab.selectedFeatures.includes(column.id);
                const direction =
                  sort?.columnId === column.id ? sort.direction : undefined;
                const sortUi = sortPresentation(column, direction);
                return (
                  <th
                    key={column.id}
                    data-col={column.id}
                    aria-sort={
                      direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : "none"
                    }
                    className={`${styles.th} ${
                      column.type === "numerical" ? styles.thNumeric : ""
                    } ${inspecting ? styles.thSelected : ""} ${
                      isLabel ? styles.thLabel : ""
                    } ${isFeature ? styles.thFeature : ""} ${
                      direction ? styles.thSorted : ""
                    }`}
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
                      </span>
                    </button>
                    <span
                      className={[
                        styles.sortButton,
                        inspecting && theme === "light" ? "dark" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-theme={
                        inspecting
                          ? theme === "dark"
                            ? "Light"
                            : "Dark"
                          : undefined
                      }
                    >
                      <Tooltip
                        title={sortUi.label}
                        iconName={sortUi.tooltipIcon}
                        placement="bottom"
                      >
                        <Button
                          type="button"
                          size="extraSmall"
                          variant="text"
                          color="secondary"
                          iconOnly
                          startIconName={sortUi.buttonIcon}
                          className={styles.sortControl}
                          aria-label={sortUi.label}
                          onClick={(event) => {
                            const next = cycleSort(sort, column.id);
                            if (!next) event.currentTarget.blur();
                            setSort(next);
                          }}
                        />
                      </Tooltip>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {order.length === 0 && lab.columnFilter ? (
              <tr>
                <td colSpan={gridColumnCount} className={styles.emptyFilterCell}>
                  <span>No rows match this filter.</span>
                  <Button
                    variant="text"
                    color="secondary"
                    size="extraSmall"
                    onClick={() => lab.clearColumnFilter()}
                  >
                    Clear filter
                  </Button>
                </td>
              </tr>
            ) : (
              <>
                {topPad > 0 ? (
                  <tr aria-hidden className={styles.spacerRow}>
                    <td colSpan={gridColumnCount} style={{ height: topPad }} />
                  </tr>
                ) : null}
                {visibleRows}
                {bottomPad > 0 ? (
                  <tr aria-hidden className={styles.spacerRow}>
                    <td colSpan={gridColumnCount} style={{ height: bottomPad }} />
                  </tr>
                ) : null}
              </>
            )}
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
  /** Position in the current view. Matches `rowIndex` until the sheet is sorted. */
  visualIndex: number;
  row: AiLabDataRow;
  columns: AiLabColumn[];
  selectedColumnId: string | undefined;
  /** Predict column — tinted brand so the sheet matches the statement Tags. */
  labelColumnId: string | undefined;
  /** Using columns — tinted success. */
  featureColumnIds: string[];
  /** Set only when this row holds the active cell. */
  activeColumnId: string | undefined;
  editing: boolean;
  draft: string;
  readOnly: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onCellClick: (cell: CellRef) => void;
  onCellDoubleClick: (cell: CellRef) => void;
  onDraftChange: (value: string) => void;
  onEditorBlur: () => void;
  onEditorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const SheetRow = memo(function SheetRow({
  rowIndex,
  visualIndex,
  row,
  columns,
  selectedColumnId,
  labelColumnId,
  featureColumnIds,
  activeColumnId,
  editing,
  draft,
  readOnly,
  inputRef,
  onCellClick,
  onCellDoubleClick,
  onDraftChange,
  onEditorBlur,
  onEditorKeyDown,
}: SheetRowProps) {
  const rowSelected = activeColumnId !== undefined;
  return (
    <tr aria-rowindex={visualIndex + 2}>
      <td className={`${styles.td} ${styles.tdIndex}`}>{rowIndex + 1}</td>
      {columns.map((column) => {
        const isActive = activeColumnId === column.id;
        const isColumn = selectedColumnId === column.id;
        const isLabel = labelColumnId === column.id;
        const isFeature = featureColumnIds.includes(column.id);
        const isEditing = isActive && editing;
        return (
          <td
            key={column.id}
            className={`${styles.td} ${
              column.type === "numerical" ? styles.tdNumeric : ""
            } ${isColumn ? styles.tdSelectedColumn : ""} ${
              rowSelected ? styles.tdSelectedRow : ""
            } ${isActive ? styles.tdActive : ""} ${
              isLabel ? styles.tdLabel : isFeature ? styles.tdFeature : ""
            }`}
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
            ) : readOnly ? (
              <span
                className={styles.cellReadOnly}
                onClick={() => onCellClick({ rowIndex, columnId: column.id })}
              >
                {formatCell(row[column.id])}
              </span>
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
