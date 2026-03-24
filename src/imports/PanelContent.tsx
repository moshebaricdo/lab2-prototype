function ContentWrapper() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full" data-name="Content Wrapper">
      <p className="font-['Barlow_Semi_Condensed:Semi_Bold',_sans-serif] leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full">This is a header</p>
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full">This is some body text.</p>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Button</p>
        </div>
      </div>
    </div>
  );
}

function ActionWrapper() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Action Wrapper">
      <Button />
    </div>
  );
}

function InstructionCard() {
  return (
    <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full" data-name="Instruction Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
          <ContentWrapper />
          <ActionWrapper />
        </div>
      </div>
    </div>
  );
}

function ContentWrapper1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full" data-name="Content Wrapper">
      <p className="font-['Barlow_Semi_Condensed:Semi_Bold',_sans-serif] leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full">This is a header</p>
      <p className="font-['Figtree:Regular',_sans-serif] leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full">This is some body text.</p>
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Label Container">
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]">
        <p className="leading-[19.68px]">Enter your response</p>
      </div>
    </div>
  );
}

function InputField() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Input Field">
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative w-full">
          <div className="basis-0 flex flex-col font-['Figtree:Regular',_sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[14px]">
            <p className="leading-[21.56px]">Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Text Field">
      <LabelContainer />
      <InputField />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Button</p>
        </div>
      </div>
    </div>
  );
}

function ActionWrapper1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Action Wrapper">
      <TextField />
      <Button1 />
    </div>
  );
}

function InstructionCard1() {
  return (
    <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full" data-name="Instruction Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
          <ContentWrapper1 />
          <ActionWrapper1 />
        </div>
      </div>
    </div>
  );
}

export default function PanelContent() {
  return (
    <div className="bg-white relative size-full" data-name="Panel Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[8px] relative size-full">
          <InstructionCard />
          <InstructionCard1 />
        </div>
      </div>
    </div>
  );
}