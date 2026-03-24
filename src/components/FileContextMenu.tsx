import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencil,
  faDownload,
  faTrash,
  faBoxArchive,
  faComment,
} from "@fortawesome/free-solid-svg-icons";

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
  icon: any;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <div
      className="bg-white relative shrink-0 w-full hover:bg-[#f0f2f5] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-row items-center size-full">
        <div
          className={`box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative w-full ${
            destructive ? "text-[#e02d16]" : "text-[#292f36]"
          }`}
        >
          <div className="flex flex-col justify-center relative shrink-0 text-[13px] text-center w-[16px]">
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
    </div>
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
    <div
      className="bg-white relative rounded-[4px] w-full min-w-[150px]"
      data-name="File Context Menu"
    >
      <div className="box-border content-stretch flex flex-col items-start overflow-clip px-0 py-[4px] relative rounded-[inherit] w-full">
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
      <div
        aria-hidden="true"
        className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-2px_rgba(0,0,0,0.05)]"
      />
    </div>
  );
}
