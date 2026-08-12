import { Alert } from "@moshebaricdo/cads-react";
import styles from "./VersionBanner.module.scss";

interface VersionBannerProps {
  versionLabel: string;
  onClose: () => void;
}

export function VersionBanner({ versionLabel, onClose }: VersionBannerProps) {
  return (
    <Alert
      className={styles.root}
      sentiment="warning"
      size="small"
      isDismissible
      onClose={onClose}
    >
      You're viewing a previous version of this project from
      <span className={styles.version}>{` ${versionLabel}.`}</span>
    </Alert>
  );
}
