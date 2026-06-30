import { useEffect, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { AppNativeSelect } from "../../../ui/AppDropdown";
import { AppTextField } from "../../../ui/AppTextField";
import { useTutorApiSettings } from "../../../../hooks/useTutorApiSettings";
import styles from "./SettingsPanel.module.scss";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Inline sits in the sidebar column; floating is a fixed card when the sidebar is collapsed. */
  variant?: "inline" | "floating";
}

interface SettingsField {
  key: string;
  label: string;
  value: string;
  options: string[];
}

const SETTINGS_FIELDS: SettingsField[] = [
  {
    key: "language",
    label: "Language",
    value: "English",
    options: ["English"],
  },
  {
    key: "editorFontSize",
    label: "Editor Font Size",
    value: "Small",
    options: ["Small", "Medium", "Large"],
  },
];

const SETTINGS_PANEL_EXIT_ANIMATION_MS = 180;

export function SettingsPanel({
  isOpen,
  onClose,
  variant = "inline",
}: SettingsPanelProps) {
  const { apiKey, setApiKey, hasApiKey } = useTutorApiSettings();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [fieldValues, setFieldValues] = useState(() =>
    Object.fromEntries(SETTINGS_FIELDS.map((field) => [field.key, field.value])),
  );

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(
      () => setShouldRender(false),
      SETTINGS_PANEL_EXIT_ANIMATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  if (variant === "floating" && !shouldRender) {
    return null;
  }

  return (
    <div
      className={[
        styles.root,
        variant === "floating" ? styles.rootFloating : styles.rootInline,
        isOpen ? styles.rootOpen : styles.rootClosed,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isOpen}
      data-state={isOpen ? "open" : "closed"}
    >
      <div className={styles.header}>
        <div className={styles.headerSide} aria-hidden="true" />
        <p className={styles.title}>settings</p>
        <AppButton
          variant="tertiary"
          size="xs"
          tone="gray"
          iconName="xmark"
          onClick={onClose}
          aria-label="Close settings"
          className={styles.closeButton}
        />
      </div>

      <div className={styles.content}>
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key} className={styles.field}>
            <p className={styles.label}>{field.label}</p>
            <AppNativeSelect
              value={fieldValues[field.key] ?? field.value}
              onValueChange={(value) =>
                setFieldValues((current) => ({
                  ...current,
                  [field.key]: value,
                }))
              }
              options={field.options.map((option) => ({
                value: option,
                label: option,
              }))}
              placeholder=""
              size="s"
              tone="gray"
              fullWidth
            />
          </div>
        ))}

        <div className={styles.field}>
          <AppTextField
            label="Tutor API key (prototype)"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Stored for this browser session"
            autoComplete="off"
            helperText={
              hasApiKey
                ? "Key is available for prototype tutor calls."
                : "Optional for now. Mock tutor edits work without a key."
            }
            size="s"
            tone="gray"
          />
        </div>

      </div>
    </div>
  );
}
