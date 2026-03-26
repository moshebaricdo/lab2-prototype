import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "../../ui/AppButton";
import styles from "./SettingsPanel.module.scss";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsField {
  label: string;
  value: string;
}

const SETTINGS_FIELDS: SettingsField[] = [
  { label: "Language", value: "English" },
  { label: "Editor Font Size", value: "Small" },
  { label: "Theme", value: "Light" },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerSide} aria-hidden="true" />
        <p className={styles.title}>settings</p>
        <AppButton
          variant="tertiary"
          size="xs"
          tone="gray"
          icon={<FontAwesomeIcon icon={faXmark} />}
          onClick={onClose}
          aria-label="Close settings"
          className={styles.closeButton}
        />
      </div>

      <div className={styles.content}>
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.label} className={styles.field}>
            <p className={styles.label}>{field.label}</p>
            <div className={styles.select}>
              <p className={styles.value}>{field.value}</p>
              <span className={styles.icon}>
                <FontAwesomeIcon icon={faChevronDown} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
