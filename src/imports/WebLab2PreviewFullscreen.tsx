import svgPaths from "./svg-0cq126m8bz";
import imgLivePreview from "figma:asset/9edbfac72164dee469f864768974e0e17af43727.png";
import imgLivePreview1 from "figma:asset/6fd74d985ee18ce39d12ae7e9276f992f0340ee7.png";

function Layer12() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
      <g id="Layer_1-2">
        <path d={svgPaths.p30ede580} fill="var(--fill-0, white)" id="Vector" />
        <path d={svgPaths.p36ccd9f0} fill="var(--fill-0, white)" id="Vector_2" />
        <path d={svgPaths.p2d0807f0} fill="var(--fill-0, white)" id="Vector_3" />
        <path d={svgPaths.p35b99500} fill="var(--fill-0, white)" id="Vector_4" />
        <path d={svgPaths.p3c60a080} fill="var(--fill-0, white)" id="Vector_5" />
        <path d={svgPaths.p16b30100} fill="var(--fill-0, white)" id="Vector_6" />
      </g>
    </svg>
  );
}

function LogoIconBlack6X() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="logo-icon-black6x">
      <Layer12 />
    </div>
  );
}

function Logo() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Logo">
      <LogoIconBlack6X />
    </div>
  );
}

function Logo1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-0 pr-[12px] py-0 relative shrink-0" data-name="logo">
      <Logo />
    </div>
  );
}

function Left() {
  return (
    <div className="content-stretch flex gap-[24px] h-[40px] items-center overflow-clip relative shrink-0" data-name="left">
      <Logo1 />
    </div>
  );
}

function GlobalNav() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="global nav">
      <Left />
    </div>
  );
}

function FontAwesomeIcon() {
  return (
    <div className="box-border content-stretch flex h-[12px] items-center justify-center opacity-50 pb-px pt-0 px-0 relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">cloud-check</p>
      </div>
    </div>
  );
}

function Frame1314() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center mb-[-2px] relative shrink-0">
      <FontAwesomeIcon />
      <p className="font-['Figtree:Regular',_sans-serif] leading-[17px] not-italic relative shrink-0 text-[10px] text-nowrap text-white whitespace-pre">Saved a few seconds ago</p>
    </div>
  );
}

function Text() {
  return (
    <div className="box-border content-stretch flex flex-col h-full items-end justify-center pb-[2px] pt-0 px-0 relative shrink-0" data-name="text">
      <p className="font-['Figtree:Semi_Bold',_sans-serif] h-[18px] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-center text-white w-[120px]">Lesson #: Lesson Title</p>
      <Frame1314 />
    </div>
  );
}

function DiamondBubbleSmall() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, white)" id="Not Started" r="5.75" stroke="var(--stroke-0, #D4DAE1)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleSmall2() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall2() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, #3EA33E)" id="Not Started" r="5.75" stroke="var(--stroke-0, #3EA33E)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall2() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall2 />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall2 />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleSmall5() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall5() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, white)" id="Not Started" r="5.75" stroke="var(--stroke-0, #3EA33E)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall5() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall5 />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall5 />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleLarge() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Large" />;
}

function CircleBubbleLarge() {
  return (
    <div className="absolute inset-[2.62%_-39.77%_-39.66%_2.73%]" data-name="Circle Bubble Large">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34 34">
        <g id="Circle Bubble Large">
          <ellipse cx="16.9835" cy="17" fill="var(--fill-0, #3EA33E)" id="Not Started" rx="16.9835" ry="17" transform="matrix(1 0 0.000970931 1 0 0)" />
        </g>
      </svg>
    </div>
  );
}

function BubbleLarge() {
  return (
    <div className="relative size-[24.81px]" data-name="Bubble Large">
      <DiamondBubbleLarge />
      <CircleBubbleLarge />
      <div className="absolute flex inset-[2.62%_-39.77%_-39.66%_2.73%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[34px]">
          <div className="flex flex-col font-['Figtree:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative size-full text-[9.824px] text-center text-white">
            <p className="leading-[15.13px]">9</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubbles() {
  return (
    <div className="box-border content-stretch flex gap-[3px] items-center px-[6px] py-[2px] relative shrink-0" data-name="bubbles">
      <BubbleSmall />
      <BubbleSmall />
      <BubbleSmall2 />
      <BubbleSmall />
      <BubbleSmall />
      <BubbleSmall5 />
      <BubbleSmall />
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <BubbleLarge />
        </div>
      </div>
      <BubbleSmall />
      <BubbleSmall />
    </div>
  );
}

function Progress() {
  return (
    <div className="bg-[#f0f2f5] h-[32px] relative rounded-[4px] shrink-0" data-name="progress">
      <div className="content-stretch flex h-[32px] items-center overflow-clip relative rounded-[inherit]">
        <Bubbles />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function LessonMetadata() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0" data-name="lesson metadata">
      <div className="flex flex-row items-center self-stretch">
        <Text />
      </div>
      <Progress />
    </div>
  );
}

function Button() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-[32px] px-[12px] py-[5px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[4px]" />
      <p className="basis-0 font-['Figtree:Semi_Bold',_sans-serif] grow leading-[21.56px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-center text-white">Username</p>
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white w-[18px]">
        <p className="leading-[1.25]">caret-down</p>
      </div>
    </div>
  );
}

function V6Icon() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-center relative shrink-0" data-name="v6-icon">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">circle-question</p>
      </div>
    </div>
  );
}

function NewProject() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[37px] items-center justify-center relative shrink-0 w-[38px]" data-name="new-project">
      <V6Icon />
    </div>
  );
}

function V6Icon1() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-center relative shrink-0" data-name="v6-icon">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">bars</p>
      </div>
    </div>
  );
}

function NewProject1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[37px] items-center justify-center relative shrink-0 w-[38px]" data-name="new-project">
      <V6Icon1 />
    </div>
  );
}

function Icons() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0" data-name="icons">
      <NewProject />
      <NewProject1 />
    </div>
  );
}

function Right() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center justify-end relative shrink-0" data-name="right">
      <Button />
      <Icons />
    </div>
  );
}

function LabNav() {
  return (
    <div className="bg-[#0093a4] h-[49.732px] relative shrink-0 w-full" data-name="Lab Nav">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex h-[49.732px] items-center justify-between px-[8px] py-0 relative w-full">
          <GlobalNav />
          <LessonMetadata />
          <Right />
        </div>
      </div>
    </div>
  );
}

function SidebarControl() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[40px] items-center justify-center relative shrink-0 w-[56px]" data-name="Sidebar Control">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function FontAwesomeIcon1() {
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
      <FontAwesomeIcon1 />
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

function FontAwesomeIcon2() {
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
      <FontAwesomeIcon2 />
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

function FontAwesomeIcon3() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_Kit_9228c44802:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[20px] text-center text-nowrap">
        <p className="leading-[1.25] whitespace-pre">ai-head-solid-test</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative rounded-[4px] shrink-0 size-[32px]" data-name="icon">
      <FontAwesomeIcon3 />
    </div>
  );
}

function SidebarTabItemV4() {
  return (
    <div className="bg-[#f0f2f5] content-stretch flex flex-col items-center justify-center relative shrink-0 size-[56px]" data-name="Sidebar Tab Item V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px_0px] border-solid inset-0 pointer-events-none" />
      <Icon3 />
    </div>
  );
}

function FontAwesomeIcon4() {
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
      <FontAwesomeIcon4 />
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

function FontAwesomeIcon5() {
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
      <FontAwesomeIcon5 />
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

function Button1() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">book</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">gear</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[7px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">shield-exclamation</p>
      </div>
    </div>
  );
}

function Button4() {
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
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
    </div>
  );
}

function SidebarV2() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col h-[974.268px] items-center justify-between max-w-[56px] min-h-[500px] pb-[8px] pt-0 px-0 relative shrink-0" data-name="Sidebar V2">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <SidebarWrapper />
      <IconButtonGroup />
    </div>
  );
}

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

function Button9() {
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
      <Button9 />
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

function Button10() {
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
      <Button10 />
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

function Button11() {
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
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Continue Button Sticky Wrapper">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[8px] relative w-full">
          <Button11 />
        </div>
      </div>
    </div>
  );
}

function PanelWrapper() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-start min-h-px min-w-px relative shrink-0" data-name="Panel Wrapper">
      <PanelHeaderV2 />
      <PanelContent />
      <ContinueButtonStickyWrapper />
    </div>
  );
}

function SidebarContent() {
  return (
    <div className="content-stretch flex h-[974.268px] items-start overflow-clip relative shrink-0 w-[400px]" data-name="Sidebar Content">
      <SidebarV2 />
      <PanelWrapper />
    </div>
  );
}

function SegmentedButtonBlock() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Code</p>
    </div>
  );
}

function SegmentedButtonBlock1() {
  return (
    <div className="bg-[#0093a4] box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">eye</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Preview</p>
    </div>
  );
}

function SegmentedButtonBlock2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">table-columns</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Split View</p>
    </div>
  );
}

function SegmentedButtonGroup() {
  return (
    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0" data-name="Segmented Button Group">
      <SegmentedButtonBlock />
      <SegmentedButtonBlock1 />
      <SegmentedButtonBlock2 />
    </div>
  );
}

function ActionGroupLeft1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center min-w-[50px] relative shrink-0 w-full" data-name="Action Group Left">
      <SegmentedButtonGroup />
    </div>
  );
}

function VisibilityWrapper2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] relative shrink-0" data-name="Visibility Wrapper">
      <ActionGroupLeft1 />
    </div>
  );
}

function LabelWrapper1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase">
        <p className="leading-[19.68px] whitespace-pre">Workspace</p>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center w-[16px]">
        <p className="leading-[1.25]">download</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',_sans-serif] grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px] text-center">Export</p>
    </div>
  );
}

function ActionGroupRight1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full" data-name="Action Group Right">
      <Button13 />
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
    <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="Panel Header Building Block">
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
    <div className="relative shrink-0 w-full" data-name="Panel Header V2">
      <div className="content-stretch flex flex-col gap-[10px] items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderBuildingBlock1 />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function WebLabWorkspaceHeader() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[1040px]" data-name="Web Lab Workspace Header">
      <PanelHeaderV3 />
    </div>
  );
}

function Button14() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">chevron-left</p>
      </div>
    </div>
  );
}

function Button15() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">chevron-right</p>
      </div>
    </div>
  );
}

function Frame1359() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
      <Button14 />
      <Button15 />
    </div>
  );
}

function Path() {
  return (
    <div className="basis-0 content-stretch flex font-['Figtree:Regular',_sans-serif] gap-[2px] grow items-center min-h-px min-w-px not-italic relative shrink-0 text-center text-nowrap whitespace-pre" data-name="Path">
      <p className="leading-[19.68px] relative shrink-0 text-[#69788a] text-[12px]">app</p>
      <p className="leading-[21.56px] relative shrink-0 text-[#b7c1cb] text-[14px]">/</p>
      <p className="leading-[19.68px] relative shrink-0 text-[#292f36] text-[12px]">index.html</p>
    </div>
  );
}

function Button16() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">refresh</p>
      </div>
    </div>
  );
}

function UrlBar() {
  return (
    <div className="basis-0 bg-white grow h-[24px] min-h-px min-w-px relative rounded-[4px] shrink-0" data-name="URL Bar">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] h-[24px] items-center pl-[8px] pr-[6px] py-0 relative w-full">
          <Frame1359 />
          <Path />
          <Button16 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function UrlBarWrapper() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="URL Bar Wrapper">
      <UrlBar />
    </div>
  );
}

function SegmentedButtonBlock5() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">desktop</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Desktop</p>
    </div>
  );
}

function SegmentedButtonBlock6() {
  return (
    <div className="bg-[#0093a4] box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">mobile</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Mobile</p>
    </div>
  );
}

function SegmentedButtonGroup2() {
  return (
    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0" data-name="Segmented Button Group">
      <SegmentedButtonBlock5 />
      <SegmentedButtonBlock6 />
    </div>
  );
}

function Button17() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[16px]">
        <p className="leading-[1.25]">expand</p>
      </div>
    </div>
  );
}

function ActionGroupRight2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Action Group Right">
      <SegmentedButtonGroup2 />
      <Button17 />
    </div>
  );
}

function PreviewTopBar() {
  return (
    <div className="bg-[#f0f2f5] h-[40px] min-h-[32px] relative shrink-0 w-full" data-name="Preview Top Bar">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center min-h-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center min-h-inherit px-[8px] py-0 relative w-full">
          <UrlBarWrapper />
          <ActionGroupRight2 />
        </div>
      </div>
    </div>
  );
}

function LivePreview() {
  return (
    <div className="basis-0 grow min-h-px min-w-px pointer-events-none relative shrink-0 w-[460px]" data-name="Live Preview">
      <div className="absolute inset-0 overflow-hidden">
        <img alt="" className="absolute h-[101.06%] left-0 max-w-none top-[-0.01%] w-full" src={imgLivePreview} />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px] border-solid inset-0" />
    </div>
  );
}

function PreviewWrapper() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-center min-h-px min-w-px relative shrink-0 w-[1040px]" data-name="Preview Wrapper">
      <PreviewTopBar />
      <LivePreview />
    </div>
  );
}

function PreviewMode() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Preview Mode">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <WebLabWorkspaceHeader />
        <PreviewWrapper />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function WorkspaceViews() {
  return (
    <div className="content-stretch flex h-[974.268px] items-start overflow-clip relative shrink-0 w-[1040px]" data-name="Workspace Views">
      <PreviewMode />
    </div>
  );
}

function ResizeHandle() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col gap-[10px] h-[18px] items-center justify-center left-[394px] p-[2px] rounded-[4px] top-[478.63px] w-[14px]" data-name="Resize Handle">
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]" />
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[11px] text-center w-[9px]">
        <p className="leading-[1.25]">grip-dots-vertical</p>
      </div>
    </div>
  );
}

function MainStage() {
  return (
    <div className="basis-0 bg-[#f0f2f5] content-stretch flex grow items-start min-h-px min-w-px relative shrink-0" data-name="Main Stage">
      <SidebarContent />
      <WorkspaceViews />
      <ResizeHandle />
    </div>
  );
}

function Frame1364() {
  return (
    <div className="absolute bg-white h-[952px] left-[1395px] top-[40px] w-[13px]">
      <div className="box-border content-stretch flex gap-[10px] h-[952px] items-start justify-center overflow-clip px-[2px] py-[4px] relative rounded-[inherit] w-[13px]">
        <div className="bg-[#c6ced6] h-[199.358px] rounded-[999px] shrink-0 w-[6px]" />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Button18() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">chevron-left</p>
      </div>
    </div>
  );
}

function Button19() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">chevron-right</p>
      </div>
    </div>
  );
}

function Frame1360() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
      <Button18 />
      <Button19 />
    </div>
  );
}

function Path1() {
  return (
    <div className="basis-0 content-stretch flex font-['Figtree:Regular',_sans-serif] gap-[2px] grow items-center min-h-px min-w-px not-italic relative shrink-0 text-center text-nowrap whitespace-pre" data-name="Path">
      <p className="leading-[19.68px] relative shrink-0 text-[#69788a] text-[12px]">app</p>
      <p className="leading-[21.56px] relative shrink-0 text-[#b7c1cb] text-[14px]">/</p>
      <p className="leading-[19.68px] relative shrink-0 text-[#292f36] text-[12px]">index.html</p>
    </div>
  );
}

function Button20() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">refresh</p>
      </div>
    </div>
  );
}

function UrlBar1() {
  return (
    <div className="basis-0 bg-white grow h-[24px] min-h-px min-w-px relative rounded-[4px] shrink-0" data-name="URL Bar">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] h-[24px] items-center pl-[8px] pr-[6px] py-0 relative w-full">
          <Frame1360 />
          <Path1 />
          <Button20 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function UrlBarWrapper1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="URL Bar Wrapper">
      <UrlBar1 />
    </div>
  );
}

function SegmentedButtonBlock9() {
  return (
    <div className="bg-[#0093a4] box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">desktop</p>
      </div>
    </div>
  );
}

function SegmentedButtonBlock10() {
  return (
    <div className="bg-white box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">mobile</p>
      </div>
    </div>
  );
}

function SegmentedButtonGroup4() {
  return (
    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0" data-name="Segmented Button Group">
      <SegmentedButtonBlock9 />
      <SegmentedButtonBlock10 />
    </div>
  );
}

function Button21() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[16px]">
        <p className="leading-[1.25]">compress</p>
      </div>
    </div>
  );
}

function ActionGroupRight3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Action Group Right">
      <SegmentedButtonGroup4 />
      <Button21 />
    </div>
  );
}

function WebLabControlBar() {
  return (
    <div className="absolute bg-[#f0f2f5] box-border content-stretch flex gap-[8px] h-[40px] items-center left-0 min-h-[32px] px-[8px] py-0 top-0 w-[1408px]" data-name="Web Lab Control Bar">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <UrlBarWrapper1 />
      <ActionGroupRight3 />
    </div>
  );
}

function LivePreview1() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px overflow-clip relative rounded-[4px] shrink-0" data-name="Live Preview">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[4px]">
        <img alt="" className="absolute h-[117.4%] left-[-0.17%] max-w-none top-[4%] w-[99.26%]" src={imgLivePreview1} />
      </div>
      <Frame1364 />
      <WebLabControlBar />
    </div>
  );
}

function FullscreenPreview() {
  return (
    <div className="absolute bg-[rgba(41,47,54,0.8)] box-border content-stretch flex gap-[10px] h-[1024px] items-center justify-center left-0 overflow-clip p-[16px] top-0 w-[1440px]" data-name="Fullscreen Preview">
      <LivePreview1 />
    </div>
  );
}

export default function WebLab2PreviewFullscreen() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full" data-name="WebLab 2: (Preview - Fullscreen)">
      <LabNav />
      <MainStage />
      <FullscreenPreview />
    </div>
  );
}