function Disabled() {
  return (
    <div className="absolute box-border content-stretch flex gap-[4px] items-center justify-center left-[17.5px] p-[4px] rounded-[4px] top-[150px]" data-name="Disabled">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#d4dae1] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">smile</p>
      </div>
    </div>
  );
}

function Frame69() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-center p-[4px] relative rounded-[4px] shrink-0">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">smile</p>
      </div>
    </div>
  );
}

function Focused() {
  return (
    <div className="absolute box-border content-stretch flex gap-[4px] items-center justify-center left-[15.5px] p-[2px] rounded-[6px] top-[112px]" data-name="Focused">
      <div aria-hidden="true" className="absolute border-2 border-[#0093a4] border-solid inset-[-2px] pointer-events-none rounded-[8px]" />
      <Frame69 />
    </div>
  );
}

function Pressed() {
  return (
    <div className="absolute bg-[#d4dae1] box-border content-stretch flex gap-[4px] items-center justify-center left-[17.5px] p-[4px] rounded-[4px] top-[78px]" data-name="Pressed">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">smile</p>
      </div>
    </div>
  );
}

function Hover() {
  return (
    <div className="absolute bg-[#d4dae1] box-border content-stretch flex gap-[4px] items-center justify-center left-[17.5px] p-[4px] rounded-[4px] top-[44px]" data-name="Hover">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">smile</p>
      </div>
    </div>
  );
}

function Default() {
  return (
    <div className="absolute box-border content-stretch flex gap-[4px] items-center justify-center left-[17.5px] p-[4px] rounded-[4px] top-[10px]" data-name="Default">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">smile</p>
      </div>
    </div>
  );
}

export default function TertiaryIconButton() {
  return (
    <div className="bg-white relative size-full" data-name="Tertiary Icon Button">
      <Disabled />
      <Focused />
      <Pressed />
      <Hover />
      <Default />
    </div>
  );
}