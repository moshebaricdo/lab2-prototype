import { Button, Dropdown } from "@moshebaricdo/cads-react";
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
        <Dropdown
          role="action"
          size="extraSmall"
          buttonVariant="outlined"
          buttonColor="secondary"
          iconOnly
          startIconName="floppy-disk"
          aria-label="Save sketch"
          menuPlacement="bottomLeft"
          options={[
            {
              value: "save-device",
              label: "Save to device",
              iconName: "download",
            },
            {
              value: "save-backpack",
              label: "Save to backpack",
              iconName: "backpack",
            },
          ]}
          onAction={(actionValue) => {
            if (actionValue === "save-device") onDownloadLocal();
            if (actionValue === "save-backpack") onSaveToBackpack();
          }}
        />
      </div>
      <div className={styles.center}>
        <span className={styles.label}>Workspace</span>
      </div>
      <div className={styles.right}>
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          startIconName="arrow-rotate-left"
          onClick={onStartOver}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}
