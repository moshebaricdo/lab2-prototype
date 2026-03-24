import svgPaths from "./svg-6lsaryb4px";

function TimelineConnector() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #292F36)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Icon">
      <RadioButtonsBlocks />
    </div>
  );
}

function Container() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Aug 25, 12:30PM</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Icon />
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container1 />
    </div>
  );
}

function VersionHistoryItem() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container2 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start px-[12px] py-[8px] relative w-full">
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#424d59] text-[12px] w-full">
            <p className="leading-[19.68px]">Fixed issue with text overflow in containers and buttons not linking properly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <VersionHistoryItem />
        <Container3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[184px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector />
      <Container4 />
      <TimelineConnector />
    </div>
  );
}

function TimelineConnector1() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #0093A4)" strokeWidth="2" />
          <path d={svgPaths.p3cc90c00} fill="var(--fill-0, #0093A4)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Icon">
      <RadioButtonsBlocks1 />
    </div>
  );
}

function Container5() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Aug 25, 12:30PM</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <Icon1 />
      <Container5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0" data-name="Container">
      <Container6 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">arrow-rotate-left</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',sans-serif] grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center">Restore</p>
    </div>
  );
}

function VersionHistoryItem1() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container7 />
          <Button />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start px-[12px] py-[8px] relative w-full">
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#424d59] text-[12px] w-full">
            <p className="leading-[19.68px]">Fixed issue with text overflow in containers and buttons not linking properly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <VersionHistoryItem1 />
        <Container8 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[367.5px] top-[184px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector1 />
      <Container9 />
      <TimelineConnector1 />
    </div>
  );
}

function TimelineConnector2() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #292F36)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function IconContainer() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Icon Container">
      <RadioButtonsBlocks2 />
    </div>
  );
}

function TextContainer() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text Container">
      <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Aug 25, 12:30PM</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <IconContainer />
      <TextContainer />
    </div>
  );
}

function VersionHistoryItem2() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit px-[12px] py-[8px] relative w-full">
          <Container10 />
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#b7c1cb] text-[13px] text-center text-nowrap">
            <p className="leading-[normal] whitespace-pre">cloud-check</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised2() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[308px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector2 />
      <VersionHistoryItem2 />
      <TimelineConnector2 />
    </div>
  );
}

function TimelineConnector3() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #0093A4)" strokeWidth="2" />
          <path d={svgPaths.p3cc90c00} fill="var(--fill-0, #0093A4)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function RadioButton() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Radio Button">
      <RadioButtonsBlocks3 />
    </div>
  );
}

function DateContainer() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Date Container">
      <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Aug 25, 12:30PM</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <RadioButton />
      <DateContainer />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">arrow-rotate-left</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',sans-serif] grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center">Restore</p>
    </div>
  );
}

function VersionHistoryItem3() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container11 />
          <Button1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[367.5px] top-[308px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector3 />
      <VersionHistoryItem3 />
      <TimelineConnector3 />
    </div>
  );
}

function TimelineConnector4() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #292F36)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function IconContainer1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Icon Container">
      <RadioButtonsBlocks4 />
    </div>
  );
}

function TextContainer1() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Initial Version</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <IconContainer1 />
      <TextContainer1 />
    </div>
  );
}

function VersionHistoryItem4() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container12 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[376px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector4 />
      <VersionHistoryItem4 />
    </div>
  );
}

function TimelineConnector5() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RadioButtonsBlocks5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #0093A4)" strokeWidth="2" />
          <path d={svgPaths.p3cc90c00} fill="var(--fill-0, #0093A4)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function VersionIcon() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Version Icon">
      <RadioButtonsBlocks5 />
    </div>
  );
}

function VersionTextContainer() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Version Text Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Initial Version</p>
      </div>
    </div>
  );
}

function VersionInfo() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Version Info">
      <VersionIcon />
      <VersionTextContainer />
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">arrow-rotate-left</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',sans-serif] grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center">Restore</p>
    </div>
  );
}

function VersionHistoryItem5() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative rounded-[4px] shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <VersionInfo />
          <Button2 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function VersionHistoryItemRevised5() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[367.5px] top-[376px] w-[348px]" data-name="Version History Item (Revised)">
      <TimelineConnector5 />
      <VersionHistoryItem5 />
    </div>
  );
}

function RadioButtonsBlocks6() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #292F36)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function RadioButton1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Radio button">
      <RadioButtonsBlocks6 />
    </div>
  );
}

function Container13() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Current Version</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <RadioButton1 />
      <Container13 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container14 />
    </div>
  );
}

function VersionHistoryItem6() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-col justify-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start justify-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container15 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function InputField() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative size-full">
          <div className="basis-0 flex flex-col font-['Figtree:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[14px]">
            <p className="leading-[21.56px]">Describe your changes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextArea() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[70px] items-start relative shrink-0 w-full" data-name="Text Area">
      <InputField />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[#292f36] text-[14px] text-center w-full">
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">save</p>
          </div>
          <p className="font-['Figtree:Semi_Bold',sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Save current version</p>
        </div>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start p-[8px] relative w-full">
          <TextArea />
          <Button3 />
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <VersionHistoryItem6 />
        <Container16 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function TimelineConnector6() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function VersionHistoryItemRevised6() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[348px]" data-name="Version History Item (Revised)">
      <Container17 />
      <TimelineConnector6 />
    </div>
  );
}

function RadioButtonsBlocks7() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Radio Buttons Blocks">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Radio Buttons Blocks">
          <g id="Vector"></g>
          <circle cx="9" cy="9" fill="var(--fill-0, white)" id="Ellipse 1" r="8" stroke="var(--stroke-0, #0093A4)" strokeWidth="2" />
          <path d={svgPaths.p3cc90c00} fill="var(--fill-0, #0093A4)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function RadioButton2() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pb-0 pt-[2px] px-0 relative shrink-0" data-name="Radio Button">
      <RadioButtonsBlocks7 />
    </div>
  );
}

function Container18() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap">
        <p className="leading-[21.56px] whitespace-pre">Current Version</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="basis-0 content-stretch flex gap-[10px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <RadioButton2 />
      <Container18 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container19 />
    </div>
  );
}

function VersionHistoryItem7() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Version History Item">
      <div className="flex flex-col justify-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start justify-center min-h-inherit pl-[12px] pr-[8px] py-[8px] relative w-full">
          <Container20 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function InputField1() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative size-full">
          <div className="basis-0 flex flex-col font-['Figtree:Regular',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[14px]">
            <p className="leading-[21.56px]">Describe your changes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextArea1() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[70px] items-start relative shrink-0 w-full" data-name="Text Area">
      <InputField1 />
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-white h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[#292f36] text-[14px] text-center w-full">
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">save</p>
          </div>
          <p className="font-['Figtree:Semi_Bold',sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Save current version</p>
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start p-[8px] relative w-full">
          <TextArea1 />
          <Button4 />
        </div>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <VersionHistoryItem7 />
        <Container21 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function TimelineConnector7() {
  return (
    <div className="h-[8px] relative shrink-0 w-[20px]" data-name="Timeline Connector">
      <div className="absolute bottom-0 left-0 right-[-5%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 8">
          <g id="Timeline Connector">
            <line id="Line 18" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" x1="20.5" x2="20.5" y1="0.5" y2="7.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function VersionHistoryItemRevised7() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[367.5px] top-0 w-[348px]" data-name="Version History Item (Revised)">
      <Container22 />
      <TimelineConnector7 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <VersionHistoryItemRevised />
      <VersionHistoryItemRevised1 />
      <VersionHistoryItemRevised2 />
      <VersionHistoryItemRevised3 />
      <VersionHistoryItemRevised4 />
      <VersionHistoryItemRevised5 />
      <VersionHistoryItemRevised6 />
      <VersionHistoryItemRevised7 />
    </div>
  );
}