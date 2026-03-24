function Frame() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Figtree:Regular',sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[0px] text-[12px] text-nowrap whitespace-pre">
        You’re viewing a previous version of this project from<span className="font-['Figtree:SemiBold',sans-serif]">{` Aug 25, 12:30PM.`}</span>
      </p>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content Container">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9cb28] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">exclamation-circle</p>
      </div>
      <Frame />
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
    <div className="bg-yellow-50 relative size-full" data-name="Alert">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[8px] relative size-full">
          <ContentContainer />
          <CloseIconButton />
        </div>
      </div>
    </div>
  );
}