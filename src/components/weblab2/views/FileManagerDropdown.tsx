import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFolder,
  faDownload,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./FileManagerDropdown.module.scss";

interface FileManagerDropdownProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onDownload?: () => void;
  onImportFromBackpack?: () => void;
}

interface MenuItemProps {
  icon: unknown;
  label: string;
  onClick?: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.item}
    >
      <span className={styles.icon}>
        <FontAwesomeIcon icon={icon as never} className="leading-[1.25]" />
      </span>
      <p className={styles.label}>{label}</p>
    </button>
  );
}

export function FileManagerDropdown({
  onNewFile,
  onNewFolder,
  onDownload,
  onImportFromBackpack,
}: FileManagerDropdownProps) {
  return (
    <div className={styles.root} data-name="Dropdown Menu List">
      <div className={styles.list}>
        <MenuItem
          icon={faFile}
          label="New File"
          onClick={onNewFile}
        />
        <MenuItem
          icon={faFolder}
          label="New Folder"
          onClick={onNewFolder}
        />
        <MenuItem
          icon={faDownload}
          label="Download"
          onClick={onDownload}
        />
        <MenuItem
          icon={faFileImport}
          label="Import from Backpack"
          onClick={onImportFromBackpack}
        />
      </div>
    </div>
  );
}
