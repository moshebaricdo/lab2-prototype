function ActiveHover() {
  return (
    <div className="absolute bg-[#007785] box-border content-stretch flex gap-[8px] items-center justify-center left-[10.5px] min-w-[24px] px-[8px] py-[2px] rounded-bl-[4px] rounded-tl-[4px] top-[137.5px]" data-name="Active Hover">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Code</p>
    </div>
  );
}

function ActiveDefault() {
  return (
    <div className="absolute bg-[#0093a4] box-border content-stretch flex gap-[8px] items-center justify-center left-[10.5px] min-w-[24px] px-[8px] py-[2px] rounded-bl-[4px] rounded-tl-[4px] top-[105.5px]" data-name="Active Default">
      <div aria-hidden="true" className="absolute border border-[#0093a4] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center text-white w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Code</p>
    </div>
  );
}

function InactiveFocus() {
  return (
    <div className="absolute bg-[#e0f8f9] box-border content-stretch flex gap-[8px] items-center justify-center left-[10.5px] min-w-[24px] px-[8px] py-[2px] rounded-bl-[4px] rounded-tl-[4px] top-[73.5px]" data-name="Inactive Focus">
      <div aria-hidden="true" className="absolute border border-[#bfe4e8] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Code</p>
    </div>
  );
}

function InactiveHover() {
  return (
    <div className="absolute bg-[#dfe3e9] box-border content-stretch flex gap-[8px] items-center justify-center left-[10.5px] min-w-[24px] px-[8px] py-[2px] rounded-bl-[4px] rounded-tl-[4px] top-[41.5px]" data-name="Inactive Hover">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Code</p>
    </div>
  );
}

function InactiveDefault() {
  return (
    <div className="absolute bg-white box-border content-stretch flex gap-[8px] items-center justify-center left-[10.5px] min-w-[24px] px-[8px] py-[2px] rounded-bl-[4px] rounded-tl-[4px] top-[9.5px]" data-name="Inactive Default">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px]" />
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">code</p>
      </div>
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre">Code</p>
    </div>
  );
}

export default function Frame2778() {
  return (
    <div className="bg-gradient-to-r from-[#ffffff] relative size-full to-[#ffffff]">
      <ActiveHover />
      <ActiveDefault />
      <InactiveFocus />
      <InactiveHover />
      <InactiveDefault />
    </div>
  );
}