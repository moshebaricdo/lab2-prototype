import { useState, type ReactNode } from "react";
import { FaIcon } from "../../../components/ui/icons/FaIcon";
import { ProgressStatusGlyph } from "./ProgressStatusGlyph";
import type { ProgressStatus } from "./progressData";
import styles from "./ProgressIconKey.module.scss";

interface LegendItem {
  id: string;
  label: string;
  glyph: ReactNode;
}

interface LegendGroup {
  id: string;
  title: string;
  columns: 1 | 2;
  items: LegendItem[];
}

function statusItem(id: string, status: ProgressStatus, label: string): LegendItem {
  return { id, label, glyph: <ProgressStatusGlyph status={status} /> };
}

const LEGEND_GROUPS: LegendGroup[] = [
  {
    id: "completion",
    title: "Assignment Completion States",
    columns: 2,
    items: [
      statusItem("in-progress", "in-progress", "In progress"),
      statusItem("validated", "validated", "Validated"),
      statusItem("submitted", "submitted", "Submitted"),
      statusItem("no-work", "no-work", "No online work"),
    ],
  },
  {
    id: "teacher-actions",
    title: "Teacher Actions",
    columns: 2,
    items: [
      statusItem("needs-feedback", "needs-feedback", "Needs feedback"),
      statusItem("keep-working", "keep-working", "Marked as 'keep working'"),
      statusItem("feedback-given", "feedback-given", "Feedback given"),
    ],
  },
  {
    id: "level-types",
    title: "Level Types",
    columns: 1,
    items: [
      {
        id: "assessment",
        label: "Assessment level",
        glyph: <FaIcon name="star" size="s" className={styles.assessmentGlyph} />,
      },
      {
        id: "choice",
        label: "Choice level",
        glyph: <FaIcon name="code-fork" size="s" className={styles.choiceGlyph} />,
      },
    ],
  },
];

export function ProgressIconKey() {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className={styles.root} aria-label="Icon key">
      <div className={styles.headerRow}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <FaIcon
            name={expanded ? "caret-down" : "caret-right"}
            size="xs"
            className={styles.toggleCaret}
          />
          Icon Key
        </button>
        <a href="#" className={styles.moreDetails}>
          More Details
        </a>
      </div>

      {expanded ? (
        <div className={styles.groups}>
          {LEGEND_GROUPS.map((group) => (
            <div key={group.id} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul
                className={styles.itemGrid}
                style={{
                  gridTemplateColumns:
                    group.columns === 1 ? "1fr" : "repeat(2, max-content)",
                }}
              >
                {group.items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <span className={styles.glyphSlot}>{item.glyph}</span>
                    <span className={styles.itemLabel}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
