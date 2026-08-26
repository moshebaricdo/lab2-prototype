import { Button, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./OutlineIntroCard.module.scss";

interface OutlineIntroCardProps {
  overviewContent: string;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onUpdateContent: (content: string) => void;
  onRemove: () => void;
}

function introMetaLabel(timeLimitMinutes?: number, maxAttempts?: number): string {
  const parts: string[] = [];
  if (timeLimitMinutes != null) parts.push(`${timeLimitMinutes} minutes`);
  parts.push(
    maxAttempts == null
      ? "Unlimited attempts"
      : `${maxAttempts} attempt${maxAttempts === 1 ? "" : "s"}`,
  );
  return parts.join(" · ");
}

/**
 * Pinned first block when the assessment has an intro screen. Never
 * draggable; expands in place to edit the overview copy. Time and attempts
 * stay in Settings and render read-only here.
 */
export function OutlineIntroCard({
  overviewContent,
  timeLimitMinutes,
  maxAttempts,
  expanded,
  onExpand,
  onCollapse,
  onUpdateContent,
  onRemove,
}: OutlineIntroCardProps) {
  const peek = overviewContent.trim().split("\n")[0] ?? "";

  return (
    <div
      className={[styles.card, expanded ? styles.cardExpanded : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={expanded ? undefined : styles.rowClickable}
        onClick={expanded ? undefined : onExpand}
      >
        <div className={styles.row}>
          <span className={styles.gutter} aria-hidden />
          <Tooltip title="Intro screen" placement="top">
            <span className={styles.kindIcon} aria-label="Intro screen">
              <FaIcon name="presentation-screen" size="s" aria-hidden />
            </span>
          </Tooltip>
          <span className={styles.name}>Intro screen</span>
          <span className={styles.stem}>
            {peek || "Tell learners what to expect before they begin."}
          </span>
          <div className={styles.actions}>
            <Tooltip title="Edit intro" placement="top">
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="pen-to-square"
                aria-label="Edit intro screen"
                onClick={(event) => {
                  event.stopPropagation();
                  onExpand();
                }}
              />
            </Tooltip>
            <Tooltip title="Remove intro screen" placement="top">
              <Button
                variant="text"
                color="tertiary"
                size="extraSmall"
                iconOnly
                startIconName="trash-can"
                aria-label="Remove intro screen"
                className={styles.removeButton}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      {expanded && (
        <>
          <div className={styles.editor}>
            <TextInput
              multiline
              rows={5}
              label="Overview"
              helperText="Shown to learners before the first question."
              size="small"
              color="secondary"
              value={overviewContent}
              onChange={(event) => onUpdateContent(event.target.value)}
            />
            <p className={styles.metaLine}>
              <FaIcon name="circle-info" size="xs" aria-hidden />
              {introMetaLabel(timeLimitMinutes, maxAttempts)} — edit in Settings.
            </p>
          </div>
          <div className={styles.footer}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={onCollapse}
            >
              Done
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
