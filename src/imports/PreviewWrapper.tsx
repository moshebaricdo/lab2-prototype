import imgLivePreview from "figma:asset/85ac0c44b82c7e36d56e2dce556ab014faaf651e.png";

function Button() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">chevron-left</p>
      </div>
    </div>
  );
}

function Button1() {
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
      <Button />
      <Button1 />
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

function Button2() {
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
          <Button2 />
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

function SegmentedButtonBlock2() {
  return (
    <div className="bg-[#0093a4] box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">desktop</p>
      </div>
    </div>
  );
}

function SegmentedButtonBlock3() {
  return (
    <div className="bg-white box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0" data-name="Segmented Button Block">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">mobile</p>
      </div>
    </div>
  );
}

function SegmentedButtonGroup1() {
  return (
    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0" data-name="Segmented Button Group">
      <SegmentedButtonBlock2 />
      <SegmentedButtonBlock3 />
    </div>
  );
}

function Button3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[16px]">
        <p className="leading-[1.25]">expand</p>
      </div>
    </div>
  );
}

function ActionGroupRight() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Action Group Right">
      <SegmentedButtonGroup1 />
      <Button3 />
    </div>
  );
}

function WebLabControlBar() {
  return (
    <div className="bg-[#f0f2f5] h-[40px] min-h-[32px] relative shrink-0 w-full" data-name="Web Lab Control Bar">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center min-h-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center min-h-inherit px-[8px] py-0 relative w-full">
          <UrlBarWrapper />
          <ActionGroupRight />
        </div>
      </div>
    </div>
  );
}

function LivePreview() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="Live Preview">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[104.91%] left-0 max-w-none top-[0.06%] w-full" src={imgLivePreview} />
      </div>
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[16px] relative size-full">
          <div className="aspect-[1322/1516] basis-0 grow max-h-[688.048px] max-w-[600px] min-h-px min-w-px shrink-0" data-name="Screenshot 2025-08-06 at 5.01.15 PM 1" />
        </div>
      </div>
    </div>
  );
}

export default function PreviewWrapper() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Preview Wrapper">
      <WebLabControlBar />
      <LivePreview />
    </div>
  );
}