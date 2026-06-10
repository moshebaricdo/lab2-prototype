import { AppActionDropdown } from "../../../../ui/AppDropdown";
import { AppButton } from "../../../../ui/AppButton";
import { Tooltip } from "../../../../ui/Tooltip";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import {
  formatBackpackSavedDate,
} from "../../../../../lib/backpack/backpackItemFromFile";
import { fileExtensionLabelFromName, getFileChipIconProps } from "../../../../ui/fileChipMeta";
import type { BackpackItem } from "../../../../../types/backpack";
import styles from "./BackpackFileChip.module.scss";

interface BackpackFileChipProps {
  item: BackpackItem;
  addedToProject?: boolean;
  importSupported?: boolean;
  importDisabledTooltip?: string;
  onAddToProject?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function BackpackFileChip({
  item,
  addedToProject = false,
  importSupported = true,
  importDisabledTooltip = "Not supported in this lab",
  onAddToProject,
  onDownload,
  onDelete,
}: BackpackFileChipProps) {
  const { iconName, iconFamily } = getFileChipIconProps(item.name);
  const extensionLabel = fileExtensionLabelFromName(item.name);
  const savedDateLabel = formatBackpackSavedDate(item.savedAt);
  const thumbnailSrc = item.thumbnailSrc;
  const menuItems = [
    ...(onDownload
      ? [{
          id: "download",
          label: "Download",
          iconName: "download" as FaIconName,
          onSelect: onDownload,
        }]
      : []),
    ...(onDelete
      ? [{
          id: "delete",
          label: "Delete from Backpack",
          iconName: "trash" as FaIconName,
          destructive: true,
          onSelect: onDelete,
        }]
      : []),
  ];

  return (
    <div className={styles.chip}>
      <div
        className={`${styles.iconRail} ${thumbnailSrc ? styles.iconRailImage : ""}`}
        aria-hidden="true"
      >
        {thumbnailSrc ? (
          <img alt="" className={styles.thumbnail} src={thumbnailSrc} />
        ) : (
          <FaIcon
            family={iconFamily}
            name={iconName}
            size="inherit"
            className={styles.iconGlyph}
          />
        )}
      </div>

      <div className={styles.textBlock}>
        <p className={styles.fileName} title={item.name}>
          {item.name}
        </p>
        <div className={styles.metaRow}>
          <p className={styles.metaLabel}>{extensionLabel}</p>
          {savedDateLabel ? (
            <>
              <span className={styles.metaDot} aria-hidden="true" />
              <p className={styles.metaLabel}>{savedDateLabel}</p>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        {addedToProject ? (
          <span className={styles.addedBadge} aria-label="Added to project">
            <FaIcon name="check" size="xs" className={styles.addedBadgeIcon} />
            <span className={styles.addedBadgeLabel}>Added</span>
          </span>
        ) : onAddToProject ? (
          importSupported ? (
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="plus"
              aria-label={`Add ${item.name} to project`}
              onClick={onAddToProject}
            />
          ) : (
            <Tooltip content={importDisabledTooltip} position="top">
              <span className={styles.addButtonWrap}>
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="xs"
                  iconName="plus"
                  disabled
                  aria-label={`Add ${item.name} to project (${importDisabledTooltip})`}
                />
              </span>
            </Tooltip>
          )
        ) : null}

        {menuItems.length > 0 ? (
          <AppActionDropdown
            align="end"
            side="bottom"
            size="xs"
            sideOffset={4}
            trigger={
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName="ellipsis-vertical"
                aria-label={`Actions for ${item.name}`}
              />
            }
            items={menuItems}
          />
        ) : null}
      </div>
    </div>
  );
}
