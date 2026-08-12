import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { getFileChipIconProps } from "../../../../ui/fileChipMeta";
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
        {files.map((file) => {
          const fileIcon = getFileChipIconProps(file);
          return (
          <div key={file} className={styles.fileRow}>
            <FaIcon
              family={fileIcon.iconFamily}
              name={fileIcon.iconName}
              size="xs"
              className={styles.fileIcon}
            />
            <span className={styles.fileName}>{file}</span>
          </div>
          );
        })}
      </div>
      <div className={styles.actions}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIconName="plus"
          fullWidth
          onClick={onAdd}
        >
          Add to project
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          fullWidth
          onClick={onDismiss}
        >
          Keep as reference only
        </Button>
      </div>
    </div>
  );
}
