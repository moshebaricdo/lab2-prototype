function Frame1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Figtree:Regular',sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Version successfully restored!</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#3ea33e] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">check-circle</p>
      </div>
      <Frame1 />
    </div>
  );
}

function CloseIconButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0" data-name="Close Icon Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
        <p className="leading-[1.25]">close</p>
      </div>
    </div>
  );
}

export default function Alert() {
  return (
    <div className="bg-[#e2f6e2] relative rounded-[4px] size-full" data-name="Alert">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center px-[12px] py-[8px] relative size-full">
          <Frame />
          <CloseIconButton />
        </div>
      </div>
    </div>
  );
}