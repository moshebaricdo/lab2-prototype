import { FaIcon, type FaIconName } from "@/icons";
import { AppButton } from "./AppButton";
import { Tooltip } from "./Tooltip";
import styles from "./FileChip.module.scss";

export interface FileChipProps {
  /** Shown in the chip title row (ellipsis when long). */
  fileName: string;
  /** Native tooltip; defaults to `fileName` (e.g. full path while `fileName` is basename). */
  nameTitle?: string;
  /**
   * Second line — extension label (e.g. "HTML") in remove mode,
   * or timestamp (e.g. "12:56PM") in add mode.
   */
  extensionLabel: string;
  iconName: FaIconName;
  /**
   * `"remove"` shows an X button (pre-send composer chip).
   * `"add"` shows an inline "+ Add" button inside the chip (sent chat chip).
   * `"static"` shows no action button (display-only chip).
   * Defaults to `"remove"`.
   */
  mode?: "remove" | "add" | "static";
  onRemove?: () => void;
  onAdd?: () => void;
  /** Visual indicator that the file was already added to the project. */
  addedToProject?: boolean;
  disabled?: boolean;
  /** When set, renders the square image thumbnail variant instead of the file row. */
  imageSrc?: string | null;
  onImageError?: () => void;
}

export function FileChip({
  fileName,
  nameTitle,
  extensionLabel,
  iconName,
  mode = "remove",
  onRemove,
  onAdd,
  addedToProject,
  disabled,
  imageSrc,
  onImageError,
}: FileChipProps) {
  const titleAttr = nameTitle ?? fileName;
  const isAdd = mode === "add";

  const removeButton = mode === "remove" ? (
    <button
      type="button"
      className={styles.actionButton}
      disabled={disabled}
      aria-label={`Remove ${fileName}`}
      onClick={onRemove}
    >
      <FaIcon name="xmark" size="xs" className={styles.actionIcon} />
    </button>
  ) : null;

  const addButton = (() => {
    if (!isAdd) return null;
    if (addedToProject) {
      return (
        <span className={styles.addedBadge} aria-label="Added to project">
          <FaIcon name="check" size="xs" className={styles.addedBadgeIcon} />
        </span>
      );
    }
    return (
      <Tooltip content="Add to project" position="top">
        <AppButton
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="plus"
          children="Add"
          disabled={disabled}
          aria-label={`Add ${fileName} to project`}
          onClick={onAdd}
          className={styles.inlineAddButton}
        />
      </Tooltip>
    );
  })();

  if (imageSrc && isAdd) {
    return (
      <div className={`${styles.imageChipContainer} ${addedToProject ? styles.fileChipAdded : ""}`}>
        <div className={styles.imageChipThumb}>
          <img
            alt=""
            className={styles.imageChipImg}
            src={imageSrc}
            onError={() => onImageError?.()}
          />
        </div>
        {addButton}
      </div>
    );
  }

  if (imageSrc) {
    return (
      <div className={`${styles.imageChip} ${addedToProject ? styles.imageChipAdded : ""}`}>
        <img
          alt=""
          className={styles.imageChipImg}
          src={imageSrc}
          onError={() => onImageError?.()}
        />
        {removeButton}
      </div>
    );
  }

  return (
    <div className={`${styles.fileChip} ${addedToProject ? styles.fileChipAdded : ""}`}>
      <div className={styles.iconRail} aria-hidden="true">
        <FaIcon name={iconName} size="inherit" className={styles.iconGlyph} />
      </div>
      <div className={styles.textBlock}>
        <p className={styles.fileName} title={titleAttr}>
          {fileName}
        </p>
        <p className={styles.extension}>{extensionLabel}</p>
      </div>
      {removeButton}
      {addButton}
    </div>
  );
}
