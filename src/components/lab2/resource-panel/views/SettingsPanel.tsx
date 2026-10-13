import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dropdown, FieldWrapper, Modal, Toggle } from "@moshebari/cads-react";
import { useTheme, type ThemeMode } from "../../../../hooks/useTheme";
import {
  usePythonConsoleLayout,
  type PythonConsoleLayout,
} from "../../../../hooks/usePythonConsoleLayout";
import {
  groupLabSettings,
  labSettingsProfileFromPath,
  type LabSettingsField,
} from "./labSettings";
import styles from "./SettingsPanel.module.scss";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const pythonConsoleLayout = usePythonConsoleLayout();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const profile = labSettingsProfileFromPath(pathname);
  const groups = useMemo(() => groupLabSettings(profile), [profile]);

  const layoutLabel = (layout: PythonConsoleLayout) =>
    layout === "vertical" ? "Vertical" : "Horizontal";

  const valueFor = (field: LabSettingsField) => {
    if (field.binding === "theme") return theme;
    if (field.binding === "pythonConsoleLayout" && pythonConsoleLayout) {
      return layoutLabel(pythonConsoleLayout.layout);
    }
    return localValues[field.key] ?? field.defaultValue;
  };

  const changeField = (field: LabSettingsField, nextValue: string) => {
    if (field.binding === "theme") {
      if (nextValue === "light" || nextValue === "dark") {
        setTheme(nextValue as ThemeMode);
      }
      return;
    }
    if (field.binding === "pythonConsoleLayout" && pythonConsoleLayout) {
      pythonConsoleLayout.setLayout(nextValue === "Vertical" ? "vertical" : "horizontal");
      return;
    }
    setLocalValues((current) => ({ ...current, [field.key]: nextValue }));
  };

  const renderField = (field: LabSettingsField) => {
    if (field.control === "toggle") {
      return (
        <FieldWrapper
          key={field.key}
          className={styles.toggleField}
          size="small"
          helperText={field.helperText}
          showHelper={Boolean(field.helperText)}
        >
          <Toggle
            size="small"
            label={field.label}
            labelPlacement="left"
            checked={valueFor(field) === "On"}
            onChange={(_event, next) => changeField(field, next ? "On" : "Off")}
          />
        </FieldWrapper>
      );
    }

    return (
      <Dropdown
        key={field.key}
        role="input"
        label={field.label}
        helperText={field.helperText}
        showHelper={Boolean(field.helperText)}
        size="small"
        color="secondary"
        width="full"
        menuWidth="trigger"
        value={valueFor(field)}
        options={field.options ?? []}
        onChange={(nextValue) => changeField(field, String(nextValue))}
      />
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Settings"
      maxWidth={400}
      hasSecondaryAction={false}
      primaryActionLabel="Done"
      onPrimaryAction={onClose}
      isDismissable
    >
      <div className={styles.groups}>
        {groups.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`lab-settings-${group.id}`}>
            <h3 id={`lab-settings-${group.id}`} className={styles.heading}>
              {group.label}
            </h3>
            <div className={styles.fields}>{group.fields.map(renderField)}</div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
