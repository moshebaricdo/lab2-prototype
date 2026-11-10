import { Tag } from "@moshebari/cads-react";
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
 * Table body groups: one per category (subtotal row, then its standards),
 * then any standards without a category, then the untagged row.
 */
function tableGroups(breakdown: Breakdown, rows: Row[]): TableGroup[] {
  if (breakdown.categories.length === 0) return [{ key: "all", rows }];
  const groups: TableGroup[] = breakdown.categories.map((category) => ({
    key: category.category.id,
    category,
    rows: rows.filter((row) => row.tag.category?.id === category.category.id),
  }));
  const rest = rows.filter(
    (row) =>
      !breakdown.categories.some((c) => c.category.id === row.tag.category?.id),
  );
  if (rest.length > 0) groups.push({ key: "rest", rows: rest });
  return groups;
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
            {tableGroups(breakdown, rows).map((group) => (
              <tbody key={group.key}>
                {group.category ? (
                  <tr className={styles.categoryRow}>
                    <th scope="rowgroup">
                      <span className={styles.tableName}>
                        {group.category.category.code ? (
                          <span className={styles.categoryCode}>
                            {group.category.category.code}
                          </span>
                        ) : null}
                        <span className={styles.tableNameLabel}>
                          {group.category.category.label}
                        </span>
                      </span>
                    </th>
                    <td className={styles.correctCol}>
                      {group.category.correct} of {group.category.graded}
                    </td>
                    <td className={`${styles.scoreCol} ${styles.tableScore}`}>
                      {group.category.percent}%
                    </td>
                  </tr>
                ) : null}
                {group.rows.map((row) => (
                  <tr
                    key={row.tag.id}
                    className={group.category ? styles.nestedRow : undefined}
                  >
                    <th scope="row">
                      <span className={styles.tableName}>
                        <span className={styles.tableNameLabel}>{row.tag.label}</span>
                        {row.tag.code ? (
                          <>
                            <span className={styles.tableDot} aria-hidden="true" />
                            <span className={styles.tableCode}>{row.tag.code}</span>
                          </>
                        ) : null}
                      </span>
                    </th>
                    <td className={styles.correctCol}>
                      {row.correct} of {row.graded}
                    </td>
                    <td className={`${styles.scoreCol} ${styles.tableScore}`}>
                      {row.percent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
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
