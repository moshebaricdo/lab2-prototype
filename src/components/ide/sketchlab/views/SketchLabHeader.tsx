import { AppActionDropdown } from "../../../ui/AppDropdown";
import { AppButton } from "../../../ui/AppButton";
import styles from "./SketchLabHeader.module.scss";

interface SketchLabHeaderProps {
  onDownloadLocal: () => void;
  onSaveToBackpack: () => void;
  onStartOver: () => void;
}

export function SketchLabHeader({
  onDownloadLocal,
  onSaveToBackpack,
  onStartOver,
}: SketchLabHeaderProps) {
  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <AppActionDropdown
          align="start"
          size="xs"
          listLabel="Save sketch"
          trigger={
            <AppButton
              type="button"
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="floppy-disk"
              aria-label="Save sketch"
            />
          }
          items={[
            {
              id: "save-device",
              label: "Save to device",
              iconName: "download",
              onSelect: onDownloadLocal,
            },
            {
              id: "save-backpack",
              label: "Save to backpack",
              iconName: "backpack",
              onSelect: onSaveToBackpack,
            },
          ]}
        />
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
