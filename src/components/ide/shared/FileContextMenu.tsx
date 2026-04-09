import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencil,
  faDownload,
  faTrash,
  faBoxArchive,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./FileContextMenu.module.scss";

interface FileContextMenuProps {
  onRename?: () => void;
  onAddToChat?: () => void;
  onDownload?: () => void;
  onSaveToBackpack?: () => void;
  onDelete?: () => void;
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: unknown;
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
        <FontAwesomeIcon icon={icon as never} className="leading-[1.25]" />
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
        <MenuItem icon={faPencil} label="Rename" onClick={onRename} />
        <MenuItem
          icon={faComment}
          label="Add to AI Tutor Chat"
          onClick={onAddToChat}
        />
        <MenuItem icon={faDownload} label="Download" onClick={onDownload} />
        <MenuItem
          icon={faBoxArchive}
          label="Save to Backpack"
          onClick={onSaveToBackpack}
        />
        <MenuItem
          icon={faTrash}
          label="Delete"
          onClick={onDelete}
          destructive
        />
      </div>
    </div>
  );
}
