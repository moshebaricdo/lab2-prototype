import { useEffect, useMemo, useState } from "react";
import { FaIcon, type FaIconName } from "@/icons";
import styles from "./UploadedFileChip.module.scss";

function fileExtensionLabel(file: File): string {
  const name = file.name;
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) {
    return "FILE";
  }
  return name.slice(dot + 1).toUpperCase();
}

function faIconForFile(file: File): FaIconName {
  const name = file.name;
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";

  if (ext === "pdf") return "file-pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
    return "file-image";
  }
  if (
    ["html", "htm", "css", "js", "ts", "tsx", "jsx", "json", "java", "py"].includes(
      ext,
    )
  ) {
    return "file-code";
  }
  if (["csv"].includes(ext)) return "file-csv";
  if (["xlsx", "xls"].includes(ext)) return "file-excel";
  if (["doc", "docx"].includes(ext)) return "file-word";
  if (["ppt", "pptx"].includes(ext)) return "file-powerpoint";
  if (["zip", "rar", "7z"].includes(ext)) return "file-zipper";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "file-audio";
  if (["mp4", "webm", "mov"].includes(ext)) return "file-video";
  return "file";
}

function canPreviewImageInBrowser(file: File): boolean {
  const t = file.type.toLowerCase();
  return (
    t === "image/png" ||
    t === "image/jpeg" ||
    t === "image/gif" ||
    t === "image/webp" ||
    t === "image/svg+xml"
  );
}

interface UploadedFileChipProps {
  file: File;
  disabled?: boolean;
  onRemove: () => void;
}

export function UploadedFileChip({
  file,
  disabled,
  onRemove,
}: UploadedFileChipProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const showImageThumb =
    canPreviewImageInBrowser(file) && !previewFailed;

  const imageUrl = useMemo(() => {
    if (!showImageThumb) return null;
    return URL.createObjectURL(file);
  }, [file, showImageThumb]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const extension = fileExtensionLabel(file);
  const iconName = faIconForFile(file);

  if (showImageThumb && imageUrl) {
    return (
      <div className={styles.imageChip}>
        <img
          alt=""
          className={styles.imageChipImg}
          src={imageUrl}
          onError={() => setPreviewFailed(true)}
        />
        <button
          type="button"
          className={styles.remove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
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
        <p className={styles.fileName} title={file.name}>
          {file.name}
        </p>
        <p className={styles.extension}>{extension}</p>
      </div>
      <button
        type="button"
        className={styles.remove}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
      >
        <FaIcon name="xmark" size="xs" className={styles.removeIcon} />
      </button>
    </div>
  );
}
