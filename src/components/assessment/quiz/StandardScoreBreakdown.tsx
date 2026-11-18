import { useState } from "react";
import { Button, Tag } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { rootCategory } from "../../../lib/assessmentBuilder/scoring";
import type { StandardScoreBreakdown as Breakdown } from "../../../types/assessmentBuilder";
import styles from "./StandardScoreBreakdown.module.scss";

/**
 * How the per-standard score renders inside the results card.
 * - `bars`: one row per standard with a meter. Scans well for 2–6 standards.
 * - `table`: dense Standard / Correct / Score columns. Holds many standards.
 * - `tiles`: mini stat tiles that echo the stats row above. Best at 2–4.
 */
export type StandardBreakdownVariant = "bars" | "table" | "tiles";

export const STANDARD_BREAKDOWN_VARIANTS: StandardBreakdownVariant[] = [
  "bars",
  "table",
  "tiles",
];

export function isStandardBreakdownVariant(
  value: string | null | undefined,
): value is StandardBreakdownVariant {
  return (STANDARD_BREAKDOWN_VARIANTS as string[]).includes(value ?? "");
}

interface StandardScoreBreakdownProps {
  breakdown: Breakdown;
  variant?: StandardBreakdownVariant;
}

function footnotes(breakdown: Breakdown): string[] {
  const notes: string[] = [];
  if (breakdown.hasMultiTagged) {
    notes.push("A question with more than one standard counts toward each.");
  }
  return notes;
}

type Row = Breakdown["rows"][number];

/** Standard rows in outline order, then an "Untagged questions" row last. */
function displayRows(breakdown: Breakdown): Row[] {
  if (breakdown.untaggedGraded === 0) return breakdown.rows;
  const { untaggedCorrect: correct, untaggedGraded: graded } = breakdown;
  return [
    ...breakdown.rows,
    {
      tag: { id: "__untagged", label: "Untagged questions" },
      correct,
      graded,
      percent: Math.round((correct / graded) * 100),
    },
  ];
}

interface TableGroup {
  key: string;
  category?: Breakdown["categories"][number];
  rows: Row[];
}

/**
 * Table body groups: one per top-level category (subtotal row, then its standards),
 * then any standards without a category, then the untagged row.
 */
function tableGroups(breakdown: Breakdown, rows: Row[]): TableGroup[] {
  if (breakdown.categories.length === 0) return [{ key: "all", rows }];
  const groups: TableGroup[] = breakdown.categories.map((category) => ({
    key: category.category.id,
    category,
    rows: rows.filter(
      (row) => rootCategory(row.tag.category)?.id === category.category.id,
    ),
  }));
  const rest = rows.filter(
    (row) =>
      !breakdown.categories.some(
        (c) => c.category.id === rootCategory(row.tag.category)?.id,
      ),
  );
  if (rest.length > 0) groups.push({ key: "rest", rows: rest });
  return groups;
}

/**
 * At or under this many standard rows every category starts open (a full
 * AI-901 exam is 7). Past it, categories start collapsed to their subtotals
 * so a big exam reads as a short summary first.
 */
export const AUTO_EXPAND_STANDARD_LIMIT = 8;

/** Code first (short, scannable), name under it (wraps at any length). */
function TableStandardName({ tag }: { tag: Row["tag"] }) {
  if (!tag.code) {
    return <span className={styles.tableCodeLine}>{tag.label}</span>;
  }
  return (
    <span className={styles.tableStack}>
      <span className={styles.tableCodeLine}>{tag.code}</span>
      <span className={styles.tableNameLine}>{tag.label}</span>
    </span>
  );
}

function Meter({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      className={styles.meter}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      <span className={styles.meterFill} style={{ width: `${percent}%` }} />
    </div>
  );
}

function StandardName({ tag }: { tag: Breakdown["rows"][number]["tag"] }) {
  return (
    <span className={styles.name}>
      <span className={styles.nameLabel}>{tag.label}</span>
      {tag.code ? <Tag size="small" color="pink" label={tag.code} /> : null}
    </span>
  );
}

export function StandardScoreBreakdown({
  breakdown,
  variant = "table",
}: StandardScoreBreakdownProps) {
  if (breakdown.rows.length === 0) return null;
  const notes = footnotes(breakdown);
  const rows = displayRows(breakdown);

  return (
    <section className={styles.root} aria-labelledby="score-by-standard">
      <div className={styles.intro}>
        <h2 id="score-by-standard" className={styles.heading}>
          Score by standard
        </h2>
        {breakdown.framework ? (
          <p className={styles.note}>{breakdown.framework.label}</p>
        ) : null}
        {notes.map((note) => (
          <p key={note} className={styles.note}>
            {note}
          </p>
        ))}
      </div>

      {variant === "bars" ? (
        <ul className={styles.barList}>
          {rows.map((row) => (
            <li key={row.tag.id} className={styles.barRow}>
              <div className={styles.barTop}>
                <StandardName tag={row.tag} />
                <span className={styles.barScore}>
                  <span className={styles.barPercent}>{row.percent}%</span>
                  <span className={styles.barCount}>
                    {row.correct} of {row.graded}
                  </span>
                </span>
              </div>
              <Meter
                percent={row.percent}
                label={`${row.tag.label}: ${row.correct} of ${row.graded} correct`}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {variant === "table" ? (
        <BreakdownTable breakdown={breakdown} rows={rows} />
      ) : null}

      {variant === "tiles" ? (
        <ul className={styles.tiles}>
          {rows.map((row) => (
            <li key={row.tag.id} className={styles.tile}>
              <p className={styles.tileValue}>{row.percent}%</p>
              <p className={styles.tileLabel}>{row.tag.label}</p>
              <p className={styles.tileHelper}>
                {row.tag.code ? `${row.tag.code} · ` : ""}
                {row.correct} of {row.graded} correct
              </p>
            </li>
          ))}
        </ul>
      ) : null}

    </section>
  );
}

function BreakdownTable({ breakdown, rows }: { breakdown: Breakdown; rows: Row[] }) {
  const groups = tableGroups(breakdown, rows);
  const categoryIds = breakdown.categories.map((c) => c.category.id);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () =>
      new Set(
        breakdown.rows.length <= AUTO_EXPAND_STANDARD_LIMIT ? categoryIds : [],
      ),
  );
  const allOpen = categoryIds.every((id) => openIds.has(id));

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={styles.tableBlock}>
      {categoryIds.length > 1 ? (
        <div className={styles.tableToolbar}>
          <Button
            variant="text"
            color="secondary"
            size="extraSmall"
            startIconName={allOpen ? "chevrons-up" : "chevrons-down"}
            onClick={() => setOpenIds(new Set(allOpen ? [] : categoryIds))}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        </div>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Standard</th>
              <th scope="col" className={styles.correctCol}>
                Correct
              </th>
              <th scope="col" className={styles.scoreCol}>
                Score
              </th>
            </tr>
          </thead>
          {groups.map((group) => {
            const category = group.category;
            const open = !category || openIds.has(category.category.id);
            return (
              <tbody key={group.key}>
                {category ? (
                  <tr className={styles.categoryRow}>
                    <th scope="rowgroup">
                      <button
                        type="button"
                        className={styles.categoryToggle}
                        aria-expanded={open}
                        onClick={() => toggle(category.category.id)}
                      >
                        <span
                          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
                          aria-hidden="true"
                        >
                          <FaIcon name="chevron-right" size="small" />
                        </span>
                        <span className={styles.tableName}>
                          {category.category.code ? (
                            <span className={styles.categoryCode}>
                              {category.category.code}
                            </span>
                          ) : null}
                          <span className={styles.tableNameLabel}>
                            {category.category.label}
                          </span>
                          {!open ? (
                            <span className={styles.categoryCount}>
                              {group.rows.length}{" "}
                              {group.rows.length === 1 ? "standard" : "standards"}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </th>
                    <td className={styles.correctCol}>
                      {category.correct} of {category.graded}
                    </td>
                    <td className={`${styles.scoreCol} ${styles.tableScore}`}>
                      {category.percent}%
                    </td>
                  </tr>
                ) : null}
                {open
                  ? group.rows.map((row) => (
                      <tr
                        key={row.tag.id}
                        className={category ? styles.nestedRow : undefined}
                      >
                        <th scope="row">
                          <TableStandardName tag={row.tag} />
                        </th>
                        <td className={styles.correctCol}>
                          {row.correct} of {row.graded}
                        </td>
                        <td className={`${styles.scoreCol} ${styles.tableScore}`}>
                          {row.percent}%
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
