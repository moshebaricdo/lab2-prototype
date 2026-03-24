function SeparatorsHorozontal() {
  return (
    <div className="h-px relative shrink-0 w-full" data-name="Separators/Horozontal">
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[14px]">
        <p className="leading-[21.56px]">File name</p>
      </div>
    </div>
  );
}

function InputField() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative w-full">
          <div className="basis-0 flex flex-col font-['Figtree:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[16px]">
            <p className="leading-[23.68px]">Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelperTextContainer() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Helper Text Container">
      <div className="basis-0 flex flex-col font-['Figtree:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[14px]">
        <p className="leading-[21.56px]">Helper Message</p>
      </div>
    </div>
  );
}

function TextField() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-[263px]" data-name="Text Field">
      <LabelContainer />
      <InputField />
      <HelperTextContainer />
    </div>
  );
}

function LabelContainer1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[14px]">
        <p className="leading-[21.56px]">File type</p>
      </div>
    </div>
  );
}

function Frame81() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
      <p className="font-['Figtree:Regular',_sans-serif] leading-[23.68px] not-italic relative shrink-0 text-[#292f36] text-[16px] text-nowrap whitespace-pre">Code</p>
    </div>
  );
}

function DropdownMenuButton() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Dropdown Menu Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[16px] py-[8px] relative w-full">
          <Frame81 />
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[16px] text-center w-[20px]">
            <p className="leading-[1.25]">chevron-down</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputDropdown() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]" data-name="Input Dropdown">
      <DropdownMenuButton />
    </div>
  );
}

function DropdownField() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] isolate items-start relative shrink-0 w-full" data-name="Dropdown Field">
      <LabelContainer1 />
      <InputDropdown />
    </div>
  );
}

function Frame2758() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
      <DropdownField />
    </div>
  );
}

function Frame2762() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <TextField />
      <Frame2758 />
    </div>
  );
}

function Frame2759() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[16px] w-full">
        <p className="leading-[23.68px]">Give your new file a name and type.</p>
      </div>
      <Frame2762 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center min-w-[40px] px-[16px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#292f36] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="basis-0 font-['Figtree:Semi_Bold',_sans-serif] grow leading-[23.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[16px] text-center">Cancel</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#9657c7] box-border content-stretch flex gap-[8px] items-center justify-center min-w-[40px] px-[16px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button">
      <p className="basis-0 font-['Figtree:Semi_Bold',_sans-serif] grow leading-[23.68px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-white">Create file</p>
    </div>
  );
}

function Actions() {
  return (
    <div className="content-stretch flex gap-[8px] items-start justify-end relative shrink-0 w-full" data-name="Actions">
      <Button />
      <Button1 />
    </div>
  );
}

function CloseDialog() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[428px] rounded-[4px] size-[24px] top-[8px]" data-name="Close Dialog">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[16px] text-center w-[25px]">
        <p className="leading-[1.25]">close</p>
      </div>
    </div>
  );
}

export default function PopupContainer() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Popup Container">
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[6px_6px_4px_0px_rgba(0,0,0,0.4)]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[32px] py-[24px] relative size-full">
          <p className="font-['Barlow_Semi_Condensed:Semi_Bold',_sans-serif] leading-[35.84px] min-w-full not-italic relative shrink-0 text-[#292f36] text-[28px] w-[min-content]">Create a new file</p>
          <SeparatorsHorozontal />
          <Frame2759 />
          <SeparatorsHorozontal />
          <Actions />
          <CloseDialog />
        </div>
      </div>
    </div>
  );
}