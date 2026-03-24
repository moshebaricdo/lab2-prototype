function VisibilityWrapper() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] shrink-0" data-name="Visibility Wrapper" />;
}

function LabelWrapper() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap tracking-[0.48px] uppercase">
        <p className="leading-[19.68px] whitespace-pre">Publish Current version</p>
      </div>
    </div>
  );
}

function VisibilityWrapper1() {
  return <div className="content-stretch flex flex-col gap-[10px] items-start shrink-0 w-[50px]" data-name="Visibility Wrapper" />;
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
    <div className="bg-white h-[40px] relative shrink-0 w-full" data-name="Panel Header V2">
      <div className="content-stretch flex flex-col gap-[10px] h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
        <PanelHeaderBuildingBlock />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Describe your changes</p>
      </div>
    </div>
  );
}

function InputField() {
  return (
    <div className="bg-white h-[76px] relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex h-[76px] items-start px-[10px] py-[5px] w-full" />
      </div>
    </div>
  );
}

function TextArea() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Text Area">
      <LabelContainer />
      <InputField />
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#9657c7] box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-[32px] px-[12px] py-[5px] relative rounded-[4px] shrink-0 w-[328px]" data-name="Button">
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Save version</p>
    </div>
  );
}

function PublishStickyWrapper() {
  return (
    <div className="bg-[#f0f2f5] relative shrink-0 w-full" data-name="Publish Sticky Wrapper">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[8px] relative w-full">
          <TextArea />
          <Button4 />
        </div>
      </div>
    </div>
  );
}

export default function PublishVersionWrapper() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Publish Version Wrapper">
      <PanelHeaderV2 />
      <PublishStickyWrapper />
    </div>
  );
}