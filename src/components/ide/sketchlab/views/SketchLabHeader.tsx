import { AppButton } from "../../../ui/AppButton";
import styles from "./SketchLabHeader.module.scss";

interface SketchLabHeaderProps {
  onDownload: () => void;
  onStartOver: () => void;
}

export function SketchLabHeader({ onDownload, onStartOver }: SketchLabHeaderProps) {
  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          iconName="download"
          onClick={onDownload}
        >
          Download
        </AppButton>
      </div>
      <div className={styles.center}>
        <span className={styles.label}>Workspace</span>
      </div>
      <div className={styles.right}>
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          iconName="arrow-rotate-left"
          onClick={onStartOver}
        >
          Start over
        </AppButton>
      </div>
    </div>
  );
}
