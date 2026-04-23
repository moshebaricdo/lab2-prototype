import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { faIconForFileName } from "../../../ui/fileChipMeta";
import styles from "./TutorActionCard.module.scss";

interface TutorActionCardProps {
  prompt: string;
  files: string[];
  status: "pending" | "added" | "dismissed";
  onAdd: () => void;
  onDismiss: () => void;
}

export function TutorActionCard({
  prompt,
  files,
  status,
  onAdd,
  onDismiss,
}: TutorActionCardProps) {
  if (status !== "pending") return null;

  return (
    <div className={styles.card}>
      <p className={styles.prompt}>{prompt}</p>
      <div className={styles.fileList}>
        {files.map((file) => (
          <div key={file} className={styles.fileRow}>
            <FaIcon
              name={faIconForFileName(file)}
              size="xs"
              className={styles.fileIcon}
            />
            <span className={styles.fileName}>{file}</span>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <AppButton
          variant="primary"
          tone="purple"
          size="s"
          iconName="plus"
          fullWidth
          onClick={onAdd}
        >
          Add to project
        </AppButton>
        <AppButton
          variant="secondary"
          tone="black"
          size="s"
          fullWidth
          onClick={onDismiss}
        >
          Keep as context only
        </AppButton>
      </div>
    </div>
  );
}
