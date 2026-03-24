function VisibilityWrapper() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" data-name="Visibility Wrapper" />;
}

function LabelWrapper() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase">
        <p className="leading-[19.68px] whitespace-pre">Instructions</p>
      </div>
    </div>
  );
}

function VisibilityWrapper1() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start shrink-0 w-[50px]" data-name="Visibility Wrapper" />;
}

function PanelHeaderBuildingBlock() {
  return (
    <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="Panel Header Building Block">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex items-center justify-between min-h-inherit px-[8px] py-[4px] relative w-full">
          <VisibilityWrapper />
          <LabelWrapper />
          <VisibilityWrapper1 />
        </div>
      </div>
    </div>
  );
}

function PanelHeaderV2() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full" data-name="Panel Header V2">
      <div className="content-stretch flex flex-col gap-[10px] h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderBuildingBlock />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function ContentWrapper() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full" data-name="Content Wrapper">
      <p className="font-['Barlow_Semi_Condensed:Semi_Bold',_sans-serif] leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full">This is a header</p>
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full">This is some body text.</p>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Button</p>
        </div>
      </div>
    </div>
  );
}

function ActionWrapper() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Action Wrapper">
      <Button4 />
    </div>
  );
}

function InstructionCard() {
  return (
    <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full" data-name="Instruction Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
          <ContentWrapper />
          <ActionWrapper />
        </div>
      </div>
    </div>
  );
}

function ContentWrapper1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full" data-name="Content Wrapper">
      <p className="font-['Barlow_Semi_Condensed:Semi_Bold',_sans-serif] leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full">This is a header</p>
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full">This is some body text.</p>
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Enter your response</p>
      </div>
    </div>
  );
}

function InputField() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative w-full">
          <div className="basis-0 flex flex-col font-['Figtree:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[14px]">
            <p className="leading-[21.56px]">Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Text Field">
      <LabelContainer />
      <InputField />
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Button</p>
        </div>
      </div>
    </div>
  );
}

function ActionWrapper1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Action Wrapper">
      <TextField />
      <Button5 />
    </div>
  );
}

function InstructionCard1() {
  return (
    <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full" data-name="Instruction Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
          <ContentWrapper1 />
          <ActionWrapper1 />
        </div>
      </div>
    </div>
  );
}

function PanelContent() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative shrink-0 w-full" data-name="Panel Content">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[8px] relative size-full">
          <InstructionCard />
          <InstructionCard1 />
        </div>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContinueButtonStickyWrapper() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Continue Button Sticky Wrapper">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[8px] relative w-full">
          <Button6 />
        </div>
      </div>
    </div>
  );
}

function VisibilityWrapper2() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" data-name="Visibility Wrapper" />;
}

function LabelWrapper1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase">
        <p className="leading-[19.68px] whitespace-pre">settings</p>
      </div>
    </div>
  );
}

function CloseIconButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0" data-name="Close Icon Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">close</p>
      </div>
    </div>
  );
}

function ActionGroupRight1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full" data-name="Action Group Right">
      <CloseIconButton />
    </div>
  );
}

function VisibilityWrapper3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[50px]" data-name="Visibility Wrapper">
      <ActionGroupRight1 />
    </div>
  );
}

function PanelHeaderBuildingBlock1() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Panel Header Building Block">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex items-center justify-between min-h-inherit px-[8px] py-[4px] relative w-full">
          <VisibilityWrapper2 />
          <LabelWrapper1 />
          <VisibilityWrapper3 />
        </div>
      </div>
    </div>
  );
}

function PanelHeaderV3() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Panel Header V2">
      <div className="content-stretch flex flex-col gap-[10px] items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderBuildingBlock1 />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function LabelContainer1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Language</p>
      </div>
    </div>
  );
}

function Frame86() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">English</p>
    </div>
  );
}

function DropdownMenuButton() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Dropdown Menu Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
          <Frame86 />
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]">
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
    <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full" data-name="Dropdown Field">
      <LabelContainer1 />
      <InputDropdown />
    </div>
  );
}

function LabelContainer2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Editor Font Size</p>
      </div>
    </div>
  );
}

function Frame87() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">Small</p>
    </div>
  );
}

function DropdownMenuButton1() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Dropdown Menu Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
          <Frame87 />
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]">
            <p className="leading-[1.25]">chevron-down</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputDropdown1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]" data-name="Input Dropdown">
      <DropdownMenuButton1 />
    </div>
  );
}

function DropdownField1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full" data-name="Dropdown Field">
      <LabelContainer2 />
      <InputDropdown1 />
    </div>
  );
}

function LabelContainer3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full z-[3]" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Theme</p>
      </div>
    </div>
  );
}

function Frame88() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center pl-0 pr-[8px] py-0 relative shrink-0">
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">Light</p>
    </div>
  );
}

function DropdownMenuButton2() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Dropdown Menu Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[12px] py-[5px] relative w-full">
          <Frame88 />
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[18px]">
            <p className="leading-[1.25]">chevron-down</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputDropdown2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative rounded-[4px] shrink-0 w-full z-[2]" data-name="Input Dropdown">
      <DropdownMenuButton2 />
    </div>
  );
}

function DropdownField2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] isolate items-start justify-center relative shrink-0 w-full" data-name="Dropdown Field">
      <LabelContainer3 />
      <InputDropdown2 />
    </div>
  );
}

function Frame1363() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[16px] pt-[8px] px-[8px] relative w-full">
          <DropdownField />
          <DropdownField1 />
          <DropdownField2 />
        </div>
      </div>
    </div>
  );
}

function WebLab2Settings() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Web Lab 2 Settings">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderV3 />
        <Frame1363 />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

export default function PanelWrapper() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Panel Wrapper">
      <PanelHeaderV2 />
      <PanelContent />
      <ContinueButtonStickyWrapper />
      <WebLab2Settings />
    </div>
  );
}