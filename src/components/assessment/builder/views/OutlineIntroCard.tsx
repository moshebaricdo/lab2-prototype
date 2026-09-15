import { useEffect, useRef } from "react";
import { Button, TextInput } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AssessmentIntro } from "../../../../types/assessmentBuilder";
import styles from "./OutlineIntroCard.module.scss";

interface OutlineIntroCardProps {
  title?: string;
  overviewContent: string;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onUpdateIntro: (patch: Partial<AssessmentIntro>) => void;
  onRemove: () => void;
}

/**
 * Pinned first block when the quiz shows an intro screen. No tabs — optional
 * title and markdown content. Remove turns off Show intro in Configuration.
 */
export function OutlineIntroCard({
  title,
  overviewContent,
  expanded,
  onExpand,
  onCollapse,
  onUpdateIntro,
  onRemove,
}: OutlineIntroCardProps) {
  const snapshotRef = useRef({ title: title ?? "", overviewContent });
  const wasExpanded = useRef(expanded);

  useEffect(() => {
    if (expanded && !wasExpanded.current) {
      snapshotRef.current = { title: title ?? "", overviewContent };
    }
    wasExpanded.current = expanded;
  }, [expanded, overviewContent, title]);

  const peek = overviewContent.trim().split("\n")[0] ?? "";

  return (
    <div
      className={[styles.card, expanded ? styles.cardExpanded : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.headerBar}>
        <div className={styles.row}>
          <div className={styles.topRow}>
            <span className={styles.kindIcon} aria-label="Intro screen">
              <FaIcon name="hand-wave" size="small" />
            </span>
            <span className={styles.preview}>
              <span className={styles.name}>Intro Screen</span>
              <span className={styles.stem}>
                {peek || "Tell learners what to expect before they begin."}
              </span>
            </span>
          </div>
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            iconOnly
            startIconName={expanded ? "chevron-up" : "pencil"}
            aria-label={expanded ? "Collapse intro" : "Edit intro"}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              if (expanded) onCollapse();
              else onExpand();
            }}
          />
        </div>
      </div>
      {expanded && (
        <>
          <div className={styles.editor}>
            <TextInput
              label="Intro screen title (optional)"
              helperText="Leave unset and users will see the name of the quiz level."
              size="small"
              color="secondary"
              value={title ?? ""}
              onChange={(event) =>
                onUpdateIntro({
                  title: event.target.value === "" ? undefined : event.target.value,
                })
              }
            />
            <TextInput
              multiline
              rows={5}
              label="Content"
              size="small"
              color="secondary"
              value={overviewContent}
              onChange={(event) =>
                onUpdateIntro({ overviewContent: event.target.value })
              }
            />
          </div>
          <div className={styles.footer}>
            <Button
              variant="outlined"
              color="error"
              size="extraSmall"
              onClick={onRemove}
            >
              Remove from quiz
            </Button>
            <div className={styles.footerActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                onClick={() => {
                  onUpdateIntro({
                    title: snapshotRef.current.title.trim() || undefined,
                    overviewContent: snapshotRef.current.overviewContent,
                  });
                  onCollapse();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="extraSmall"
                startIconName="floppy-disk"
                onClick={onCollapse}
              >
                Save
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
