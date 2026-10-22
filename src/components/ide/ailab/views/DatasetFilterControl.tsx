import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import {
  Button,
  CloseIconButton,
  Dropdown,
  Tooltip,
} from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import {
  columnUsable,
  compareNatural,
  frequencies,
} from "../../../../lib/aiLab";
import styles from "./DatasetFilterControl.module.scss";

function formatCategoryValue(value: string): string {
  if (value === "") return "(Empty)";
  const lower = value.toLowerCase();
  if (lower === "yes" || lower === "no") {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return value;
}

function summarizeSelectedValues(values: string[], maxInline = 2): string {
  if (values.length === 0) return "";
  const formatted = values.map(formatCategoryValue);
  if (formatted.length <= maxInline) {
    const joined = formatted.join(", ");
    if (joined.length <= 24) return joined;
  }
  const first = formatted[0] ?? "";
  return formatted.length > 1 ? `${first} +${formatted.length - 1}` : first;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

/** yes / no columns sort Yes first, then No; other columns use natural order. */
function compareCategoryOrder(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA === "yes" && lowerB === "no") return -1;
  if (lowerA === "no" && lowerB === "yes") return 1;
  return compareNatural(a, b);
}

interface AppliedFilterTagTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  columnName: string;
  valuesSummary: string;
  onClear: () => void;
}

/**
 * Interactive CADS Tag (size="medium", color="brand", isDismissible) matching
 * Figma 6188:35389: clicking the tag reopens the filter popover, while clicking
 * the trailing close icon clears the filter (with a "Clear filter" tooltip).
 */
const AppliedFilterTagTrigger = forwardRef<
  HTMLButtonElement,
  AppliedFilterTagTriggerProps
>(function AppliedFilterTagTrigger(
  { columnName, valuesSummary, onClear, onKeyDown, ...buttonProps },
  ref,
) {
  return (
    <div
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      role="button"
      tabIndex={0}
      className={styles.appliedTag}
      {...(buttonProps as unknown as React.HTMLAttributes<HTMLDivElement>)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>);
        if (event.defaultPrevented) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          (
            buttonProps.onClick as
              | ((e: React.MouseEvent<HTMLButtonElement>) => void)
              | undefined
          )?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }
      }}
    >
      <span className={styles.appliedTagContent}>
        <FaIcon
          name="bars-filter"
          family="solid"
          fontSize="0.75rem"
          className={styles.appliedTagIcon}
          aria-hidden
        />
        <span className={styles.appliedTagLabel}>
          <span className={styles.appliedTagColumn}>{`${columnName}:`}&nbsp;</span>
          <span className={styles.appliedTagValues}>{valuesSummary}</span>
        </span>
      </span>
      <Tooltip title="Clear filter" placement="bottom">
        <span
          className={styles.appliedTagCloseWrap}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab" && event.key !== "Escape") {
              event.stopPropagation();
            }
          }}
        >
          <CloseIconButton
            size="small"
            color="brand"
            aria-label="Clear filter"
            sx={{ width: "0.625rem" }}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
          />
        </span>
      </Tooltip>
    </div>
  );
});

export function DatasetFilterControl({ lab }: { lab: AiLabController }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const colItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const catItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastDrillColumnIdRef = useRef<string | undefined>(undefined);

  const columns = lab.config.dataset.columns;
  const rows = lab.rows;
  const activeFilter = lab.columnFilter;

  const categoricalColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          column.type === "categorical" &&
          columnUsable(rows, columns, column.id),
      ),
    [columns, rows],
  );

  const [drillColumnId, setDrillColumnId] = useState<string | undefined>(
    () => activeFilter?.columnId,
  );
  const [focusedColIndex, setFocusedColIndex] = useState(0);
  const [focusedCatIndex, setFocusedCatIndex] = useState(0);
  const [keyboardModality, setKeyboardModality] = useState(false);

  const focusTrigger = useCallback(() => {
    requestAnimationFrame(() => {
      const triggerEl = rootRef.current?.querySelector<HTMLElement>(
        "[data-cads-dropdown-trigger]",
      );
      triggerEl?.focus();
    });
  }, []);

  const closePopover = useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) {
        focusTrigger();
      }
    },
    [focusTrigger],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      const initialColumnId =
        activeFilter?.columnId ??
        (categoricalColumns.length === 1
          ? categoricalColumns[0]!.id
          : undefined);
      setDrillColumnId(initialColumnId);
      if (initialColumnId) {
        lastDrillColumnIdRef.current = initialColumnId;
      }
    }
  };

  const targetColumn = drillColumnId
    ? categoricalColumns.find((column) => column.id === drillColumnId)
    : undefined;

  const targetCategories = useMemo(() => {
    if (!targetColumn) return [];
    return [...frequencies(rows, targetColumn.id)].sort((a, b) =>
      compareCategoryOrder(a.value, b.value),
    );
  }, [rows, targetColumn]);

  const selectedValuesForTarget =
    targetColumn && activeFilter?.columnId === targetColumn.id
      ? activeFilter.values
      : [];

  // Move keyboard focus into the active step's list whenever the popover opens or switches step.
  useEffect(() => {
    if (!open) return;
    let rafId = 0;
    if (targetColumn) {
      const firstSelectedIdx = targetCategories.findIndex((entry) =>
        selectedValuesForTarget.includes(entry.value),
      );
      const nextIdx = firstSelectedIdx >= 0 ? firstSelectedIdx : 0;
      setFocusedCatIndex(nextIdx);
      rafId = requestAnimationFrame(() => {
        const el = catItemRefs.current[nextIdx];
        el?.focus();
        el?.scrollIntoView({ block: "nearest" });
      });
    } else {
      const preferredColId =
        lastDrillColumnIdRef.current ?? activeFilter?.columnId;
      const foundIdx = preferredColId
        ? categoricalColumns.findIndex((col) => col.id === preferredColId)
        : -1;
      const nextIdx = foundIdx >= 0 ? foundIdx : 0;
      setFocusedColIndex(nextIdx);
      rafId = requestAnimationFrame(() => {
        const el = colItemRefs.current[nextIdx];
        el?.focus();
        el?.scrollIntoView({ block: "nearest" });
      });
    }
    return () => cancelAnimationFrame(rafId);
    // Intentionally run when `open` or `targetColumn?.id` changes (not on every checkbox toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetColumn?.id]);

  if (categoricalColumns.length === 0) {
    return null;
  }

  const activeColumn = activeFilter
    ? columns.find((column) => column.id === activeFilter.columnId)
    : undefined;
  const activeSummaryValues = activeFilter
    ? summarizeSelectedValues(activeFilter.values)
    : "";

  const hasSelected = Boolean(activeFilter && activeFilter.values.length > 0);

  const handleDrillIntoColumn = (columnId: string) => {
    lastDrillColumnIdRef.current = columnId;
    setDrillColumnId(columnId);
  };

  const handleBackToColumns = () => {
    if (targetColumn) {
      lastDrillColumnIdRef.current = targetColumn.id;
    }
    setDrillColumnId(undefined);
  };

  const handleToggleCategory = (columnId: string, value: string) => {
    const currentValues =
      activeFilter?.columnId === columnId ? activeFilter.values : [];
    const nextValues = toggleValue(currentValues, value);
    if (nextValues.length === 0) {
      lab.clearColumnFilter();
    } else {
      lab.setColumnFilter({ columnId, values: nextValues });
    }
  };

  const moveColumnFocus = (nextIdx: number) => {
    const count = categoricalColumns.length;
    if (count === 0) return;
    const bounded = ((nextIdx % count) + count) % count;
    setKeyboardModality(true);
    setFocusedColIndex(bounded);
    const el = colItemRefs.current[bounded];
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  };

  const moveCategoryFocus = (nextIdx: number) => {
    const count = targetCategories.length;
    if (count === 0) return;
    const bounded = ((nextIdx % count) + count) % count;
    setKeyboardModality(true);
    setFocusedCatIndex(bounded);
    const el = catItemRefs.current[bounded];
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      setKeyboardModality(true);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePopover(true);
      return;
    }

    if (event.key === "Tab") {
      const panel = panelRef.current;
      if (!panel) return;
      const tabbables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled):not([tabindex="-1"])',
        ),
      );
      if (tabbables.length === 0) return;
      const first = tabbables[0]!;
      const last = tabbables[tabbables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      setKeyboardModality(true);
      if (event.shiftKey) {
        if (!panel.contains(active) || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!panel.contains(active) || active === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (targetColumn) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        moveCategoryFocus(focusedCatIndex + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        moveCategoryFocus(focusedCatIndex - 1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        event.stopPropagation();
        moveCategoryFocus(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        event.stopPropagation();
        moveCategoryFocus(targetCategories.length - 1);
        return;
      }
      if (
        (event.key === "ArrowLeft" || event.key === "Backspace") &&
        categoricalColumns.length > 1
      ) {
        event.preventDefault();
        event.stopPropagation();
        setKeyboardModality(true);
        handleBackToColumns();
      }
      return;
    }

    // Step 1: Column list keyboard navigation
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      moveColumnFocus(focusedColIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      moveColumnFocus(focusedColIndex - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      moveColumnFocus(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      moveColumnFocus(categoricalColumns.length - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      const col = categoricalColumns[focusedColIndex];
      if (col) {
        event.preventDefault();
        event.stopPropagation();
        setKeyboardModality(true);
        handleDrillIntoColumn(col.id);
      }
    }
  };

  const renderMenuContent = () => {
    if (targetColumn) {
      const doneLabel =
        selectedValuesForTarget.length > 0
          ? `Done (${selectedValuesForTarget.length})`
          : "Done";

      return (
        <div
          ref={panelRef}
          className={styles.panel}
          onKeyDown={handlePanelKeyDown}
          onPointerDown={() => {
            if (keyboardModality) setKeyboardModality(false);
          }}
        >
          <div className={`${styles.headerRow} ${styles.headerRowDrill}`}>
            {categoricalColumns.length > 1 ? (
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="chevron-left"
                aria-label="Back to columns"
                onClick={handleBackToColumns}
              />
            ) : (
              <span className={styles.headerSpacer} aria-hidden />
            )}
            <p className={styles.headerTitle}>{targetColumn.name}</p>
            <span className={styles.headerSpacer} aria-hidden />
          </div>

          <div
            className={styles.itemList}
            role="listbox"
            aria-label={`${targetColumn.name} categories`}
            aria-multiselectable
          >
            {targetCategories.map((entry, idx) => {
              const selected = selectedValuesForTarget.includes(entry.value);
              const isEmpty = entry.value === "";
              const label = formatCategoryValue(entry.value);
              const isFocusedItem = idx === focusedCatIndex;
              return (
                <button
                  key={entry.value}
                  ref={(el) => {
                    catItemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="option"
                  tabIndex={isFocusedItem ? 0 : -1}
                  aria-selected={selected}
                  aria-checked={selected}
                  data-keyboard-focus={
                    keyboardModality && isFocusedItem ? "true" : undefined
                  }
                  className={styles.categoryItem}
                  onFocus={() => setFocusedCatIndex(idx)}
                  onClick={() => {
                    setFocusedCatIndex(idx);
                    handleToggleCategory(targetColumn.id, entry.value);
                  }}
                >
                  <span
                    aria-hidden
                    className={[
                      styles.checkbox,
                      selected ? styles.checkboxSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {selected ? (
                      <FaIcon name="check" family="solid" fontSize="0.625rem" />
                    ) : null}
                  </span>
                  <span
                    className={[
                      styles.categoryLabel,
                      isEmpty ? styles.categoryLabelEmpty : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={label}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.actionRow}>
            <Button
              variant="text"
              color="secondary"
              size="extraSmall"
              disabled={!hasSelected}
              onClick={() => {
                lab.clearColumnFilter();
                catItemRefs.current[focusedCatIndex]?.focus();
              }}
            >
              Clear filter
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="extraSmall"
              onClick={() => closePopover(true)}
            >
              {doneLabel}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={panelRef}
        className={styles.panel}
        onKeyDown={handlePanelKeyDown}
        onPointerDown={() => {
          if (keyboardModality) setKeyboardModality(false);
        }}
      >
        <div className={styles.headerRow}>
          <p className={styles.headerTitle}>Filter by column</p>
        </div>

        <div
          className={styles.itemList}
          role="listbox"
          aria-label="Filter by column"
        >
          {categoricalColumns.map((column, idx) => {
            const isSelected = activeFilter?.columnId === column.id;
            const categoryCount = frequencies(rows, column.id).length;
            const metaText = isSelected
              ? `${activeFilter.values.length} selected`
              : `${categoryCount} ${
                  categoryCount === 1 ? "category" : "categories"
                }`;
            const isFocusedItem = idx === focusedColIndex;
            return (
              <button
                key={column.id}
                ref={(el) => {
                  colItemRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                tabIndex={isFocusedItem ? 0 : -1}
                aria-selected={isSelected}
                data-keyboard-focus={
                  keyboardModality && isFocusedItem ? "true" : undefined
                }
                className={styles.columnItem}
                onFocus={() => setFocusedColIndex(idx)}
                onClick={() => handleDrillIntoColumn(column.id)}
              >
                <span className={styles.columnName}>{column.name}</span>
                <span className={styles.columnRightGroup}>
                  <span className={styles.columnMeta}>{metaText}</span>
                  <span className={styles.columnChevron} aria-hidden>
                    <FaIcon
                      name="chevron-right"
                      family="solid"
                      fontSize="0.6875rem"
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.actionRow}>
          <Button
            variant="text"
            color="secondary"
            size="extraSmall"
            disabled={!hasSelected}
            onClick={() => {
              lab.clearColumnFilter();
              colItemRefs.current[focusedColIndex]?.focus();
            }}
          >
            Clear filter
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="extraSmall"
            onClick={() => closePopover(true)}
          >
            Done
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onKeyDown={(event) => {
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          setKeyboardModality(true);
          if (
            open &&
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            !panelRef.current?.contains(event.target as Node)
          ) {
            event.preventDefault();
            if (targetColumn) {
              catItemRefs.current[focusedCatIndex]?.focus();
            } else {
              colItemRefs.current[focusedColIndex]?.focus();
            }
          }
        }
      }}
    >
      <Dropdown
        role="action"
        size="extraSmall"
        menuPlacement="bottomRight"
        menuType="custom"
        open={open}
        onOpenChange={handleOpenChange}
        customContent={renderMenuContent()}
        aria-label={
          activeFilter && activeColumn
            ? `Filter: ${activeColumn.name}: ${activeSummaryValues}`
            : "Filter by column"
        }
        trigger={
          activeFilter && activeColumn ? (
            <AppliedFilterTagTrigger
              columnName={activeColumn.name}
              valuesSummary={activeSummaryValues}
              onClear={() => {
                setOpen(false);
                lab.clearColumnFilter();
                focusTrigger();
              }}
            />
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="bars-filter"
            >
              Filter
            </Button>
          )
        }
      />
    </div>
  );
}
