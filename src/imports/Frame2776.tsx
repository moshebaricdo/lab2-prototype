function Default() {
  return (
    <div className="bg-[#9657c7] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Default">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hover() {
  return (
    <div className="bg-[#6c468a] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Hover">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pressed() {
  return (
    <div className="bg-[#9657c7] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Pressed">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="basis-0 bg-[#9657c7] grow min-h-px min-w-[32px] relative rounded-[4px] shrink-0">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Focus() {
  return (
    <div className="h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Focus">
      <div aria-hidden="true" className="absolute border-2 border-[#0093a4] border-solid inset-[-2px] pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex h-[36px] items-center justify-center p-[2px] relative w-full">
          <Frame44 />
        </div>
      </div>
    </div>
  );
}

function Disabled() {
  return (
    <div className="bg-[#d4dae1] h-[32px] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Disabled">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Continue</p>
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">arrow-right</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Frame2776() {
  return (
    <div className="bg-white relative size-full">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[15px] items-start p-[13px] relative size-full">
          <Default />
          <Hover />
          <Pressed />
          <Focus />
          <Disabled />
        </div>
      </div>
    </div>
  );
}