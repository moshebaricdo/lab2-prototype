import { FaIcon } from "../../ui/icons/FaIcon";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import styles from "./FileContextMenu.module.scss";

interface FileContextMenuProps {
  onRename?: () => void;
  onAddToChat?: () => void;
  onDownload?: () => void;
  onSaveToBackpack?: () => void;
  onDelete?: () => void;
}

function MenuItem({
  iconName,
  label,
  onClick,
  destructive = false,
}: {
  iconName: FaIconName;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.item} ${destructive ? styles.destructive : ""}`}
      onClick={onClick}
    >
      <span className={styles.itemIcon}>
        <FaIcon name={iconName} size="s" />
      </span>
      <p className={styles.itemLabel}>{label}</p>
    </button>
  );
}

export function FileContextMenu({
  onRename,
  onAddToChat,
  onDownload,
  onSaveToBackpack,
  onDelete,
}: FileContextMenuProps) {
  return (
    <div className={styles.root} data-name="File Context Menu">
      <div className={styles.list}>
        {onRename && (
          <MenuItem iconName="pencil" label="Rename" onClick={onRename} />
        )}
        {onAddToChat && (
          <MenuItem
            iconName="comment"
            label="Add to AI Tutor Chat"
            onClick={onAddToChat}
          />
        )}
        <MenuItem iconName="download" label="Download" onClick={onDownload} />
        <MenuItem
          iconName="backpack"
          label="Save to Backpack"
          onClick={onSaveToBackpack}
        />
        {onDelete && (
          <MenuItem
            iconName="trash"
            label="Delete"
            onClick={onDelete}
            destructive
          />
        )}
      </div>
    </div>
  );
}
