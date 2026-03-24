import imgColorLayer from "figma:asset/026672d26cbfb917649e8e92bab594772b607e99.png";

function VisibilityWrapper() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" data-name="Visibility Wrapper" />;
}

function LabelWrapper() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase">
        <p className="leading-[19.68px] whitespace-pre">SAVE Current version</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">xmark</p>
      </div>
    </div>
  );
}

function ActionGroupRight() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full" data-name="Action Group Right">
      <Button3 />
    </div>
  );
}

function VisibilityWrapper1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[50px]" data-name="Visibility Wrapper">
      <ActionGroupRight />
    </div>
  );
}

function PanelHeaderBuildingBlock() {
  return (
    <div className="bg-[#f0f2f5] min-h-[40px] relative shrink-0 w-full" data-name="Panel Header Building Block">
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
    <div className="bg-[#f0f2f5] h-[40px] relative shrink-0 w-full" data-name="Panel Header V2">
      <div className="content-stretch flex flex-col gap-[10px] h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderBuildingBlock />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-[300px]" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Describe your changes</p>
      </div>
    </div>
  );
}

function AddonsCursorTypingGif() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-[23px]" data-name="Addons/Cursor/Typing (GIF)">
      <div className="absolute bg-[#0093a4] bottom-[-20%] left-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_2px] mask-size-[2px_20px] right-[-4.35%] top-0" data-name="Color layer" style={{ maskImage: `url('${imgColorLayer}')` }} />
    </div>
  );
}

function Frame28() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative rounded-[4px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex items-start px-[8px] py-[3px] relative size-full">
          <AddonsCursorTypingGif />
        </div>
      </div>
    </div>
  );
}

function InputField() {
  return (
    <div className="bg-white h-[76px] relative rounded-[6px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border-2 border-[#0093a4] border-solid inset-[-2px] pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex h-[76px] items-center p-[2px] relative w-full">
          <Frame28 />
        </div>
      </div>
    </div>
  );
}

function HelperTextContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-[300px]" data-name="Helper Text Container">
      <div className="basis-0 flex flex-col font-['Figtree:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Go to the version history tab in your resource panel to see all of your saved versions and auto-saves.</p>
      </div>
    </div>
  );
}

function TextArea() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Text Area">
      <LabelContainer />
      <InputField />
      <HelperTextContainer />
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#9657c7] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Save version</p>
        </div>
      </div>
    </div>
  );
}

function PublishStickyWrapper() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Publish Sticky Wrapper">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[16px] pt-[12px] px-[16px] relative w-full">
          <TextArea />
          <Button4 />
        </div>
      </div>
    </div>
  );
}

export default function PublishVersionWrapper() {
  return (
    <div className="relative rounded-[4px] size-full" data-name="Publish Version Wrapper">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <PanelHeaderV2 />
        <PublishStickyWrapper />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.3)]" />
    </div>
  );
}