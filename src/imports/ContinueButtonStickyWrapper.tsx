function Button() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-[32px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap whitespace-pre">Cancel</p>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-[32px] relative rounded-[4px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[#292f36] text-[14px] text-center w-full">
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">sync</p>
          </div>
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Restore</p>
        </div>
      </div>
    </div>
  );
}

function Frame1369() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <Button />
      <Button1 />
    </div>
  );
}

export default function ContinueButtonStickyWrapper() {
  return (
    <div className="bg-[#f0f2f5] relative size-full" data-name="Continue Button Sticky Wrapper">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[8px] relative size-full">
          <Frame1369 />
        </div>
      </div>
    </div>
  );
}