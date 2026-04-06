import { FaIcon, type FaIconName } from "@/icons";
import styles from "./FileChip.module.scss";

export interface FileChipProps {
  /** Shown in the chip title row (ellipsis when long). */
  fileName: string;
  /** Native tooltip; defaults to `fileName` (e.g. full path while `fileName` is basename). */
  nameTitle?: string;
  /** Second line, e.g. HTML or PDF. */
  extensionLabel: string;
  iconName: FaIconName;
  onRemove: () => void;
  disabled?: boolean;
  /** When set, renders the square image thumbnail variant instead of the file row. */
  imageSrc?: string | null;
  onImageError?: () => void;
}

/**
 * Shared file attachment chip (matches free-response upload styling).
 */
export function FileChip({
  fileName,
  nameTitle,
  extensionLabel,
  iconName,
  onRemove,
  disabled,
  imageSrc,
  onImageError,
}: FileChipProps) {
  const titleAttr = nameTitle ?? fileName;

  if (imageSrc) {
    return (
      <div className={styles.imageChip}>
        <img
          alt=""
          className={styles.imageChipImg}
          src={imageSrc}
          onError={() => onImageError?.()}
        />
        <button
          type="button"
          className={styles.remove}
          disabled={disabled}
          aria-label={`Remove ${fileName}`}
          onClick={onRemove}
        >
          <FaIcon name="xmark" size="xs" className={styles.removeIcon} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.fileChip}>
      <div className={styles.iconRail} aria-hidden="true">
        <FaIcon name={iconName} size="inherit" className={styles.iconGlyph} />
      </div>
      <div className={styles.textBlock}>
        <p className={styles.fileName} title={titleAttr}>
          {fileName}
        </p>
        <p className={styles.extension}>{extensionLabel}</p>
      </div>
      <button
        type="button"
        className={styles.remove}
        disabled={disabled}
        aria-label={`Remove ${fileName}`}
        onClick={onRemove}
      >
        <FaIcon name="xmark" size="xs" className={styles.removeIcon} />
      </button>
    </div>
  );
}
