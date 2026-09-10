import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Dropdown, FieldWrapper, TextInput } from "@moshebaricdo/cads-react";
import { FaIcon } from "@moshebaricdo/cads-react/icons";
import {
  groupStandardsByFramework,
  type TaxonomyOption,
} from "../../../../lib/assessmentBuilder";
import styles from "./StandardsTypeahead.module.scss";

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function matchesQuery(haystack: string, query: string): boolean {
  if (query.length === 0) return true;
  return haystack.toLowerCase().includes(query);
}

function overflowSummary(labels: string[], visible = 3): string {
  if (labels.length === 0) return "";
  if (labels.length <= visible) return labels.join(", ");
  return `${labels.slice(0, visible).join(", ")}, +${labels.length - visible}`;
}

function ChecklistItem({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-checked={selected}
      className={styles.item}
      onClick={onClick}
    >
      <span className={styles.itemInner}>
        <span
          aria-hidden
          className={[styles.checkbox, selected ? styles.checkboxSelected : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {selected ? <FaIcon name="check" fontSize="0.625rem" /> : null}
        </span>
        <span className={styles.itemLabel}>{children}</span>
      </span>
    </button>
  );
}

interface StandardsTypeaheadPanelProps {
  options: TaxonomyOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onBack: () => void;
  onDone: () => void;
}

/** Searchable, framework-grouped standards checklist (Figma 326:42501). */
export function StandardsTypeaheadPanel({
  options,
  selectedIds,
  onChange,
  onBack,
  onDone,
}: StandardsTypeaheadPanelProps) {
  const [query, setQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = searchWrapRef.current?.querySelector("input");
    input?.focus();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      options.filter((option) =>
        matchesQuery(
          `${option.code ?? ""} ${option.label} ${option.value}`,
          normalizedQuery,
        ),
      ),
    [options, normalizedQuery],
  );

  const grouped = useMemo(
    () => groupStandardsByFramework(filtered),
    [filtered],
  );

  const empty = filtered.length === 0;
  const hasSelection = selectedIds.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="chevron-left"
          aria-label="Back"
          onClick={onBack}
        />
        <span className={styles.headerTitle}>Standards</span>
        <span className={styles.headerSpacer} aria-hidden />
      </div>
      <div className={styles.searchRow} ref={searchWrapRef}>
        <TextInput
          size="extraSmall"
          color="secondary"
          placeholder="Search by ID or description"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search by ID or description"
        />
      </div>
      <div
        className={[styles.optionList, empty ? styles.optionListEmpty : ""]
          .filter(Boolean)
          .join(" ")}
        role="listbox"
        aria-label="Standards"
        aria-multiselectable
      >
        {empty ? (
          <p className={styles.emptyHint}>No results</p>
        ) : (
          grouped.map((section) => (
            <div key={section.group}>
              <p className={styles.menuOptGroup}>{section.group}</p>
              {section.items.map((option) => {
                const code = option.code ?? option.label;
                const description =
                  option.code && option.label !== option.code
                    ? option.label
                    : "";
                return (
                  <ChecklistItem
                    key={option.value}
                    selected={selectedIds.includes(option.value)}
                    onClick={() => onChange(toggleId(selectedIds, option.value))}
                  >
                    <span className={styles.code}>{code}</span>
                    {description ? (
                      <>
                        {" "}
                        <span className={styles.description}>{description}</span>
                      </>
                    ) : null}
                  </ChecklistItem>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className={styles.actionRow}>
        <Button
          variant="text"
          color="secondary"
          size="extraSmall"
          disabled={!hasSelection}
          onClick={() => onChange([])}
        >
          Clear all
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="extraSmall"
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    </div>
  );
}

interface StandardsTypeaheadFieldProps {
  options: TaxonomyOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Question-tab Standard(s) field — same typeahead as the bank filter,
 * CADS size small (32px) with chevron-right.
 */
export function StandardsTypeaheadField({
  options,
  selectedIds,
  onChange,
  disabled = false,
}: StandardsTypeaheadFieldProps) {
  const [open, setOpen] = useState(false);
  const applied = selectedIds.length > 0;
  const summary = overflowSummary(
    options
      .filter((option) => selectedIds.includes(option.value))
      .map((option) => option.code ?? option.label),
  );

  const close = () => setOpen(false);

  return (
    <div className={styles.field}>
      <FieldWrapper size="small" label="Standard(s):">
        <div className={styles.dropdownHost}>
          <Dropdown
            role="action"
            size="small"
            menuType="custom"
            menuWidth="trigger"
            menuPlacement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
            disabled={disabled}
            aria-label="Standard(s)"
            customContent={
              <StandardsTypeaheadPanel
                options={options}
                selectedIds={selectedIds}
                onChange={onChange}
                onBack={close}
                onDone={close}
              />
            }
            trigger={
              <button
                type="button"
                className={styles.trigger}
                disabled={disabled}
              >
                <span
                  className={applied ? styles.triggerValue : styles.placeholder}
                >
                  {applied ? summary : "Select standards"}
                </span>
                <span className={styles.chevron} aria-hidden>
                  <FaIcon name="chevron-right" size="small" />
                </span>
              </button>
            }
          />
        </div>
      </FieldWrapper>
    </div>
  );
}
