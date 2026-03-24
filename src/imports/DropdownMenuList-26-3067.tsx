function DropdownMenuItems() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Dropdown Menu Items">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative text-[#292f36] w-full">
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center relative shrink-0 text-[13px] text-center w-[16px]">
            <p className="leading-[1.25]">file-plus</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center relative shrink-0 text-[12px] text-nowrap">
            <p className="leading-[19.68px] whitespace-pre">Rename</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownMenuItems1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Dropdown Menu Items">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative text-[#292f36] w-full">
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center relative shrink-0 text-[13px] text-center w-[16px]">
            <p className="leading-[1.25]">folder-plus</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center relative shrink-0 text-[12px] text-nowrap">
            <p className="leading-[19.68px] whitespace-pre">Add to AI Tutor Chat</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownMenuItems2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Dropdown Menu Items">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative text-[#292f36] w-full">
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center relative shrink-0 text-[13px] text-center w-[16px]">
            <p className="leading-[1.25]">upload</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center relative shrink-0 text-[12px] text-nowrap">
            <p className="leading-[19.68px] whitespace-pre">Download</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownMenuItems3() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Dropdown Menu Items">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center leading-[0] not-italic pl-[8px] pr-[10px] py-[2px] relative text-[#292f36] w-full">
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center relative shrink-0 text-[13px] text-center w-[16px]">
            <p className="leading-[1.25]">backpack</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center relative shrink-0 text-[12px] text-nowrap">
            <p className="leading-[19.68px] whitespace-pre">Import from Backpack</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DropdownMenuList() {
  return (
    <div className="bg-white relative rounded-[4px] size-full" data-name="Dropdown Menu List">
      <div className="box-border content-stretch flex flex-col items-start overflow-clip px-0 py-[4px] relative rounded-[inherit] size-full">
        <DropdownMenuItems />
        <DropdownMenuItems1 />
        <DropdownMenuItems2 />
        <DropdownMenuItems3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-2px_rgba(0,0,0,0.05)]" />
    </div>
  );
}