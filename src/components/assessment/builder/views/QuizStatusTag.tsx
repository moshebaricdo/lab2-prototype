import { useEffect, useRef } from "react";
import { Popover, Tag } from "@moshebari/cads-react";
import {
  deriveQuizStatus,
  liveUnitCount,
  quizPurposeLabel,
  quizStatusMeta,
  unitPublishedTag,
} from "../../../../lib/assessmentBuilder";
import type { AssessmentArtifact } from "../../../../types/assessmentBuilder";
import styles from "./QuizStatusTag.module.scss";

const CLOSE_DELAY_MS = 180;

function formatLastEdited(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface QuizStatusTagProps {
  artifact: AssessmentArtifact;
}

export function QuizStatusTag({ artifact }: QuizStatusTagProps) {
  const kind = deriveQuizStatus(artifact.unitPlacements);
  const liveCount = liveUnitCount(artifact.unitPlacements);
  const meta = quizStatusMeta(kind, liveCount);
  const placements = artifact.unitPlacements ?? [];
  const nonLiveHidden =
    kind === "live" &&
    placements.some(
      (row) => row.publishedState !== "preview" && row.publishedState !== "stable",
    );

  const triggerRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  };

  const clickTrigger = () => {
    triggerRef.current?.click();
  };

  const openPopover = () => {
    cancelClose();
    // CADS only records Popper `anchorEl` on the trigger click. Hover-open
    // without that parks the surface at the viewport origin.
    if (!openRef.current) clickTrigger();
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      if (openRef.current) clickTrigger();
    }, CLOSE_DELAY_MS);
  };

  useEffect(() => () => cancelClose(), []);

  return (
    <Popover
      content="custom"
      caretPlacement="topRight"
      hasActionRow={false}
      hasStepper={false}
      isDismissible={false}
      onOpenChange={(next) => {
        openRef.current = next;
      }}
      className={styles.popoverCard}
      customContent={
        <div
          className={styles.popover}
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
        >
          <div className={styles.metaStrip}>
            <IdentityStat
              label="Level ID"
              value={artifact.levelId != null ? String(artifact.levelId) : "—"}
              empty={artifact.levelId == null}
            />
            <IdentityStat
              label="Level name"
              value={artifact.title.trim() ? artifact.title : "—"}
              empty={!artifact.title.trim()}
            />
            <IdentityStat
              label="Purpose"
              value={
                artifact.purpose ? quizPurposeLabel(artifact.purpose) : "No purpose"
              }
              empty={!artifact.purpose}
            />
            <IdentityStat
              label="Last edited"
              value={formatLastEdited(artifact.updatedAt)}
            />
          </div>
          <div className={styles.tableBlock}>
            <h4 className={styles.tableTitle}>
              Placed in ({placements.length} unit
              {placements.length === 1 ? "" : "s"})
            </h4>
            {placements.length === 0 ? (
              <p className={styles.empty}>
                Not placed in any unit. Add this level to a lesson in the unit
                editor to publish it.
              </p>
            ) : (
              <div className={styles.tableFrame} role="table">
                <div
                  className={`${styles.row} ${styles.headRow}`}
                  role="row"
                >
                  <div className={styles.headCell} role="columnheader">
                    Unit
                  </div>
                  <div className={styles.headCell} role="columnheader">
                    Course
                  </div>
                  <div className={styles.headCell} role="columnheader">
                    Lesson
                  </div>
                  <div className={styles.headCell} role="columnheader">
                    Unit state
                  </div>
                </div>
                {placements.map((row, index) => {
                  const stateTag = unitPublishedTag(row.publishedState);
                  return (
                    <div
                      key={`${row.unitName}-${row.courseName}-${index}`}
                      className={`${styles.row} ${styles.bodyRow}`}
                      role="row"
                    >
                      <TableText value={row.unitName} />
                      <TableText value={row.courseName} />
                      <TableText value={row.lessonName} />
                      <div className={styles.cell} role="cell">
                        <Tag
                          size="small"
                          color={stateTag.color}
                          label={stateTag.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {nonLiveHidden ? (
            <p className={styles.footnote}>
              Pilot, beta, and in-development statuses are not counted as live
              units
            </p>
          ) : null}
        </div>
      }
    >
      <span
        ref={triggerRef}
        className={styles.trigger}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
      >
        <Tag
          size="medium"
          color={meta.tagColor}
          startIconName={meta.iconName}
          label={meta.headerLabel}
        />
      </span>
    </Popover>
  );
}

function IdentityStat({
  label,
  value,
  empty = false,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={
          empty ? `${styles.statValue} ${styles.statValueEmpty}` : styles.statValue
        }
      >
        {value}
      </span>
    </div>
  );
}

function TableText({ value }: { value?: string }) {
  const empty = !value?.trim();
  return (
    <div
      className={empty ? `${styles.cell} ${styles.cellEmpty}` : styles.cell}
      role="cell"
    >
      {empty ? "—" : value}
    </div>
  );
}
