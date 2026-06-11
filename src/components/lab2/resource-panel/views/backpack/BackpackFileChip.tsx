import { AppActionDropdown } from "../../../../ui/AppDropdown";
import { AppButton } from "../../../../ui/AppButton";
import { Tooltip } from "../../../../ui/Tooltip";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import {
  formatBackpackSavedDate,
} from "../../../../../lib/backpack/backpackItemFromFile";
import { isAgentBackpackItem } from "../../../../../lib/backpack/agentBackpack";
import { fileExtensionLabelFromName, getFileChipIconProps } from "../../../../ui/fileChipMeta";
import type { BackpackItem } from "../../../../../types/backpack";
import styles from "./BackpackFileChip.module.scss";

interface BackpackFileChipProps {
  item: BackpackItem;
  addedToProject?: boolean;
  /** When true, render the + affordance (enabled or disabled per lab allow-list). */
  showImportButton?: boolean;
  importSupported?: boolean;
  importDisabledTooltip?: string;
  importActionTooltip?: string;
  /** Glyph to render instead of the file-extension icon (e.g. a saved agent). */
  iconNameOverride?: FaIconName;
  /** Subtitle to render instead of the file-extension label. */
  metaLabelOverride?: string;
  onAddToProject?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function BackpackFileChip({
  item,
  addedToProject = false,
  showImportButton = false,
  importSupported = true,
  importDisabledTooltip = "Not supported in this lab",
  importActionTooltip = "Add to project",
  iconNameOverride,
  metaLabelOverride,
  onAddToProject,
  onDownload,
  onRename,
  onDelete,
}: BackpackFileChipProps) {
  const isAgent = isAgentBackpackItem(item);
  const { iconName, iconFamily } = getFileChipIconProps(item.name);
  const extensionLabel = metaLabelOverride ?? fileExtensionLabelFromName(item.name);
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
    ...(onRename
      ? [{
          id: "rename",
          label: "Rename",
          iconName: "pencil" as FaIconName,
          onSelect: onRename,
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
        ) : iconNameOverride ? (
          <FaIcon name={iconNameOverride} size="inherit" className={styles.iconGlyph} />
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
        {isAgent ? null : addedToProject ? (
          <span className={styles.addedBadge} aria-label="Added to project">
            <FaIcon name="check" size="xs" className={styles.addedBadgeIcon} />
            <span className={styles.addedBadgeLabel}>Added</span>
          </span>
        ) : showImportButton ? (
          importSupported && onAddToProject ? (
            <Tooltip content={importActionTooltip} position="top">
              <AppButton
                variant="secondary"
                tone="gray"
                size="xs"
                iconName="plus"
                aria-label={`${importActionTooltip}: ${item.name}`}
                onClick={onAddToProject}
              />
            </Tooltip>
          ) : (
            <Tooltip content={importDisabledTooltip} position="top">
              <span className={styles.addButtonWrap}>
                <AppButton
                  variant="secondary"
                  tone="gray"
                  size="xs"
                  iconName="plus"
                  disabled
                  aria-label={`${importActionTooltip}: ${item.name} (${importDisabledTooltip})`}
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
