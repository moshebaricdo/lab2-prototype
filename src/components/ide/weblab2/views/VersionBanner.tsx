import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
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
          <FontAwesomeIcon icon={faCircleExclamation} className="leading-[1.25]" />
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
          <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
        </span>
      </button>
    </div>
  );
}
