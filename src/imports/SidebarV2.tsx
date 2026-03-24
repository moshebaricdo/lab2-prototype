function SidebarControl() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[40px] items-center justify-center relative shrink-0 w-[56px]" data-name="Sidebar Control">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function FontAwesomeIcon() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0093a4] text-[20px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">info-circle</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon />
    </div>
  );
}

function SidebarTabItemV2() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <Icon1 />
      <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center left-0 top-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "54.984375", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[54.998px]" data-name="Active Border">
            <div className="absolute bottom-0 left-0 right-0 top-[-3px]" style={{ "--stroke-0": "rgba(0, 147, 164, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 55 3">
                <line id="Active Border" stroke="var(--stroke-0, #0093A4)" strokeWidth="3" x2="54.9975" y1="1.5" y2="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FontAwesomeIcon1() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[20px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">clipboard-check</p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon1 />
    </div>
  );
}

function SidebarTabItemV3() {
  return (
    <div className="bg-[#f0f2f5] content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
      <Icon2 />
    </div>
  );
}

function FontAwesomeIcon2() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_Kit_9228c44802:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[20px] text-center text-nowrap">
        <p className="leading-[1.25] whitespace-pre">ai-head-solid-test</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon2 />
    </div>
  );
}

function SidebarTabItemV4() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
      <Icon3 />
    </div>
  );
}

function FontAwesomeIcon3() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[20px] text-center text-nowrap">
        <p className="leading-[1.25] whitespace-pre">clock-rotate-left</p>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon3 />
    </div>
  );
}

function SidebarTabItemV5() {
  return (
    <div className="bg-[#f0f2f5] content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
      <Icon4 />
    </div>
  );
}

function FontAwesomeIcon4() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[20px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">chalkboard-user</p>
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon4 />
    </div>
  );
}

function SidebarTabItemV6() {
  return (
    <div className="bg-[#f0f2f5] content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
      <Icon5 />
    </div>
  );
}

function SidebarTabGroupV2() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center overflow-clip relative shrink-0" data-name="Sidebar Tab Group V2">
      <SidebarControl />
      <SidebarTabItemV2 />
      <SidebarTabItemV3 />
      <SidebarTabItemV4 />
      <SidebarTabItemV5 />
      <SidebarTabItemV6 />
    </div>
  );
}

function SidebarWrapper() {
  return (
    <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 w-full" data-name="Sidebar Wrapper">
      <SidebarTabGroupV2 />
    </div>
  );
}

function Button() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">book</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">gear</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">shield-exclamation</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">copyright</p>
      </div>
    </div>
  );
}

function IconButtonGroup() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-center justify-center relative shrink-0" data-name="Icon Button Group">
      <Button />
      <Button1 />
      <Button2 />
      <Button3 />
    </div>
  );
}

export default function SidebarV2() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-center justify-between pb-[8px] pt-0 px-0 relative size-full" data-name="Sidebar V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <SidebarWrapper />
      <IconButtonGroup />
    </div>
  );
}