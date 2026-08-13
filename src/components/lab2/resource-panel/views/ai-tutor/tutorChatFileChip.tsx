import { AiChatFileChip, type AiChatFileChipType } from "@moshebaricdo/cads-react";
import { getFileChipIconProps } from "../../../../ui/fileChipMeta";
import { UploadProgressRing } from "../../../../ui/UploadProgressRing";
import type { ChatAttachment } from "../../../../../types/chat";
import styles from "./AiTutorPanel.module.scss";

export function tutorChatChipType(options: {
  source?: ChatAttachment["source"];
  imageSrc?: string | null;
  mimeType?: string;
  isCodeReference?: boolean;
}): AiChatFileChipType {
  if (options.isCodeReference || options.source === "code-reference") {
    return "codeSnippet";
  }
  if (options.imageSrc || options.mimeType?.startsWith("image/")) {
    return "image";
  }
  return "file";
}

interface TutorChatFileChipProps {
  fileName: string;
  title?: string;
  useCase: "chatStream" | "inputField";
  type?: AiChatFileChipType;
  metadata?: string;
  imageSrc?: string | null;
  onRemove?: () => void;
  uploadProgress?: number;
}

export function TutorChatFileChip({
  fileName,
  title,
  useCase,
  type = "file",
  metadata,
  imageSrc,
  onRemove,
  uploadProgress,
}: TutorChatFileChipProps) {
  const fileIcon = getFileChipIconProps(fileName);
  const resolvedType =
    type === "codeSnippet" && !metadata ? "file" : type;
  const chip = (
    <AiChatFileChip
      type={resolvedType}
      useCase={useCase}
      fileName={fileName}
      title={title ?? fileName}
      metadata={resolvedType === "codeSnippet" ? metadata : undefined}
      imageSrc={imageSrc ?? undefined}
      imageAlt={fileName}
      iconName={fileIcon.iconName}
      onRemove={onRemove}
    />
  );

  if (uploadProgress === undefined) return chip;

  return (
    <span className={styles.composerChipUploading}>
      {chip}
      <span className={styles.composerChipUploadOverlay} aria-hidden />
      <span className={styles.composerChipUploadProgress}>
        <UploadProgressRing progress={uploadProgress} size={18} />
      </span>
    </span>
  );
}
