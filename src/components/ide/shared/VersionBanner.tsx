import { FaIcon } from "../../ui/icons/FaIcon";
import styles from "./VersionBanner.module.scss";

interface VersionBannerProps {
  versionLabel: string;
  onClose: () => void;
}

export function VersionBanner({ versionLabel, onClose }: VersionBannerProps) {
  return (
    <div className={styles.root} data-name="Alert">
      <div className={styles.content} data-name="Content Container">
        <span className={styles.icon}>
          <FaIcon name="circle-exclamation" size="s" />
        </span>
        <p className={styles.message}>
          You're viewing a previous version of this project from
          <span className={styles.version}>{` ${versionLabel}.`}</span>
        </p>
      </div>
      <button
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Return to current version"
        data-name="Close Icon Button"
      >
        <span className={styles.closeIcon}>
          <FaIcon name="xmark" size="xs" />
        </span>
      </button>
    </div>
  );
}
