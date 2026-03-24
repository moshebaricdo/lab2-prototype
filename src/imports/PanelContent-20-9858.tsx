function Cell() {
  return (
    <div className="basis-0 bg-[#dfe3e9] grow min-h-px min-w-px relative shrink-0" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center pb-[6px] pt-[7px] px-[12px] relative w-full">
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[17.6px] not-italic relative shrink-0 text-[#292f36] text-[10px] text-center text-nowrap tracking-[0.4px] uppercase whitespace-pre">Test</p>
        </div>
      </div>
    </div>
  );
}

function Cell1() {
  return (
    <div className="bg-[#dfe3e9] box-border content-stretch flex gap-[10px] items-center justify-center pb-[6px] pt-[7px] px-[8px] relative shrink-0 w-[60px]" data-name="Cell">
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[17.6px] not-italic relative shrink-0 text-[#292f36] text-[10px] text-center text-nowrap tracking-[0.4px] uppercase whitespace-pre">Result</p>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Header">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Cell />
        <Cell1 />
      </div>
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Cell2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative self-stretch shrink-0" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative size-full">
          <p className="basis-0 font-['Figtree:Regular',_sans-serif] grow leading-[21.56px] min-h-px min-w-px not-italic relative shrink-0 text-[#424d59] text-[14px]">Painter moves and paints at least 5 times</p>
        </div>
      </div>
    </div>
  );
}

function FontAwesomeIcon() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#3ea33e] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">check-circle</p>
      </div>
    </div>
  );
}

function Cell3() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-center pb-[8px] pt-[10px] px-[10px] relative shrink-0 w-[60px]" data-name="Cell">
      <FontAwesomeIcon />
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap whitespace-pre">Pass</p>
    </div>
  );
}

function Row() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Row">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Cell2 />
        <Cell3 />
      </div>
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Cell4() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative self-stretch shrink-0" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative size-full">
          <p className="basis-0 font-['Figtree:Regular',_sans-serif] grow leading-[21.56px] min-h-px min-w-px not-italic relative shrink-0 text-[#424d59] text-[14px]">Painter paints (1,0) to (5,0)</p>
        </div>
      </div>
    </div>
  );
}

function FontAwesomeIcon1() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#e02d16] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">xmark-circle</p>
      </div>
    </div>
  );
}

function Cell5() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-center pb-[8px] pt-[10px] px-[10px] relative shrink-0 w-[60px]" data-name="Cell">
      <FontAwesomeIcon1 />
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap whitespace-pre">Fail</p>
    </div>
  );
}

function Row1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Row">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Cell4 />
        <Cell5 />
      </div>
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Cell6() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative self-stretch shrink-0" data-name="Cell">
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative size-full">
          <div className="basis-0 font-['Figtree:Regular',_sans-serif] grow leading-[21.56px] min-h-px min-w-px not-italic relative shrink-0 text-[#424d59] text-[14px]">
            <p className="mb-0">Painter ends at (6, 3)</p>
            <p>&nbsp;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FontAwesomeIcon2() {
  return (
    <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f9cb28] text-[14px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">circle-minus</p>
      </div>
    </div>
  );
}

function Cell7() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-center pb-[8px] pt-[10px] px-[10px] relative shrink-0 w-[60px]" data-name="Cell">
      <FontAwesomeIcon2 />
      <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap whitespace-pre">Skip</p>
    </div>
  );
}

function Row2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Row">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Cell6 />
        <Cell7 />
      </div>
      <div aria-hidden="true" className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function ValidationTable() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Validation Table">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Header />
        <Row />
        <Row1 />
        <Row2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-inherit size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] relative shrink-0 w-[18px]">
            <p className="leading-[1.25]">clipboard-check</p>
          </div>
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre">Validate</p>
        </div>
      </div>
    </div>
  );
}

function InstructionCard() {
  return (
    <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full" data-name="Instruction Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          <ValidationTable />
          <Button />
        </div>
      </div>
    </div>
  );
}

export default function PanelContent() {
  return (
    <div className="relative size-full" data-name="Panel Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[8px] relative size-full">
          <InstructionCard />
        </div>
      </div>
    </div>
  );
}