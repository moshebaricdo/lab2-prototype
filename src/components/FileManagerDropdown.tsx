import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFolder,
  faDownload,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";

interface FileManagerDropdownProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onDownload?: () => void;
  onImportFromBackpack?: () => void;
}

interface MenuItemProps {
  icon: any;
  label: string;
  onClick?: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white relative shrink-0 w-full hover:bg-[#f0f2f5] transition-colors"
    >
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative text-[#292f36] w-full">
          <div
            className="flex flex-col justify-center relative shrink-0 text-[13px] text-center w-[16px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <FontAwesomeIcon icon={icon} className="leading-[1.25]" />
          </div>
          <div
            className="flex flex-col justify-center relative shrink-0 text-[12px] text-nowrap"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-normal)",
            }}
          >
            <p className="leading-[19.68px] whitespace-pre">{label}</p>
          </div>
        </div>
      </div>
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
    <div
      className="bg-white relative rounded-[4px] w-fit"
      data-name="Dropdown Menu List"
    >
      <div className="box-border content-stretch flex flex-col items-start overflow-clip px-0 py-[4px] relative rounded-[inherit]">
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
      <div
        aria-hidden="true"
        className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-2px_rgba(0,0,0,0.05)]"
      />
    </div>
  );
}
