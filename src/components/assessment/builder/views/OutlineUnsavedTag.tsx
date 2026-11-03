import { Tag, Tooltip } from "@moshebari/cads-react";
import styles from "./OutlineUnsavedTag.module.scss";

interface OutlineUnsavedTagProps {
  /** Tooltip and accessible name. */
  title: string;
}

/**
 * Icon-only warning Tag on a collapsed outline row: a question with
 * unsaved changes, or a page holding one. Sits before the overflow menu.
 */
export function OutlineUnsavedTag({ title }: OutlineUnsavedTagProps) {
  return (
    <Tooltip title={title} placement="top">
      <span className={styles.wrap} role="img" aria-label={title}>
        <Tag
          size="medium"
          color="warning"
          startIconName="triangle-exclamation"
          label=""
          className={styles.tag}
        />
      </span>
    </Tooltip>
  );
}
