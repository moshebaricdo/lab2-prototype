function Button() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] not-italic px-[8px] py-[2px] relative rounded-[4px] shrink-0 text-[#292f36] text-center" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]">
        <p className="leading-[1.25]">info-circle</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',sans-serif] grow leading-[19.68px] min-h-px min-w-px relative shrink-0 text-[12px]">Show Instructions</p>
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]">
        <p className="leading-[1.25]">chevron-down</p>
      </div>
    </div>
  );
}

function DrawerToggle() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-center justify-center mb-[-1px] p-[4px] relative rounded-bl-[8px] rounded-br-[8px] shrink-0" data-name="Drawer Toggle">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px] border-solid inset-0 pointer-events-none rounded-bl-[8px] rounded-br-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.05)]" />
      <Button />
    </div>
  );
}

export default function DrawerCollapsed() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-center justify-center pb-px pt-0 px-0 relative size-full" data-name="Drawer Collapsed">
      <DrawerToggle />
    </div>
  );
}