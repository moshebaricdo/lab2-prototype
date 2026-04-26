import styles from "./AiChangesBanner.module.scss";
import { AiTutorIcon } from "@/components/ui/icons/AiTutorIcon";

interface AiChangesBannerProps {
  visible: boolean;
}

export function AiChangesBanner({ visible }: AiChangesBannerProps) {
  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : styles.rootHidden}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          <AiTutorIcon className="w-4 h-4 mb-[2px]" color="var(--ds-text-brand-aqua-secondary)" />
        </span>
        <p className={styles.message}>
          AI Tutor generated changes to your project. Accept to apply changes or reject to discard.
        </p>
      </div>
    </div>
  );
}
