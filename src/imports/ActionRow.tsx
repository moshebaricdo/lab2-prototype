function Button() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">copy</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">download</p>
      </div>
    </div>
  );
}

function LeftActionGroup() {
  return (
    <div className="content-stretch flex gap-[2px] items-start overflow-clip relative shrink-0" data-name="Left Action Group">
      <Button />
      <Button1 />
    </div>
  );
}

function IconToggleButton() {
  return (
    <div className="box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Icon Toggle Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">thumbs-up</p>
      </div>
    </div>
  );
}

function IconToggleButton1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Icon Toggle Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">thumbs-down</p>
      </div>
    </div>
  );
}

function ToggleGroup() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Toggle Group">
      <IconToggleButton />
      <IconToggleButton1 />
    </div>
  );
}

function IconToggleGroup() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Icon Toggle Group">
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">Was this helpful?</p>
      </div>
      <ToggleGroup />
    </div>
  );
}

function RightActionGroup() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-start justify-end min-h-px min-w-px overflow-clip relative shrink-0" data-name="Right Action Group">
      <IconToggleGroup />
    </div>
  );
}

export default function ActionRow() {
  return (
    <div className="relative size-full" data-name="Action Row">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start pl-[40px] pr-0 py-0 relative size-full">
          <LeftActionGroup />
          <RightActionGroup />
        </div>
      </div>
    </div>
  );
}