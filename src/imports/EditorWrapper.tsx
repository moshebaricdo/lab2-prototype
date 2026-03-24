function FileItemIcons() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-px relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">file-code</p>
      </div>
    </div>
  );
}

function IconLabel1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Icon + Label">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-white">
        <p className="leading-[19.68px] whitespace-pre">index.html</p>
      </div>
    </div>
  );
}

function CloseIconButton1() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0" data-name="Close Icon Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-white w-[13px]">
        <p className="leading-[1.25]">close</p>
      </div>
    </div>
  );
}

function FileTabRowItem() {
  return (
    <div className="bg-[#0093a4] box-border content-stretch flex gap-[8px] items-center overflow-clip px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="File Tab Row Item">
      <FileItemIcons />
      <IconLabel1 />
      <CloseIconButton1 />
    </div>
  );
}

function FileItemIcons1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-0 relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Brands:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">css</p>
      </div>
    </div>
  );
}

function IconLabel2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Icon + Label">
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">styles.css</p>
      </div>
    </div>
  );
}

function CloseIconButton2() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0" data-name="Close Icon Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[10px] text-center w-[13px]">
        <p className="leading-[1.25]">close</p>
      </div>
    </div>
  );
}

function FileTabRowItem1() {
  return (
    <div className="bg-[#f0f2f5] box-border content-stretch flex gap-[8px] items-center overflow-clip px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="File Tab Row Item">
      <FileItemIcons1 />
      <IconLabel2 />
      <CloseIconButton2 />
    </div>
  );
}

function TabWrapper() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Tab Wrapper">
      <FileTabRowItem />
      <FileTabRowItem1 />
    </div>
  );
}

function TopRow() {
  return (
    <div className="relative shrink-0 w-full" data-name="Top Row">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start px-[8px] py-0 relative w-full">
          <TabWrapper />
        </div>
      </div>
    </div>
  );
}

function LineNumber() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">1</p>
    </div>
  );
}

function LineNumber1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">2</p>
    </div>
  );
}

function LineNumber2() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">3</p>
    </div>
  );
}

function LineNumber3() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">4</p>
    </div>
  );
}

function LineNumber4() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">5</p>
    </div>
  );
}

function LineNumber5() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">6</p>
    </div>
  );
}

function LineNumber6() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">7</p>
    </div>
  );
}

function LineNumber7() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">8</p>
    </div>
  );
}

function LineNumber8() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">9</p>
    </div>
  );
}

function LineNumber9() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">10</p>
    </div>
  );
}

function LineNumber10() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">11</p>
    </div>
  );
}

function LineNumber11() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">12</p>
    </div>
  );
}

function LineNumber12() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap text-right whitespace-pre">13</p>
    </div>
  );
}

function LineNumber13() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">14</p>
    </div>
  );
}

function LineNumber14() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">15</p>
    </div>
  );
}

function LineNumber15() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">16</p>
    </div>
  );
}

function LineNumber16() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-end justify-center overflow-clip pl-[16px] pr-[8px] py-0 relative shrink-0" data-name="Line Number">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap text-right whitespace-pre">17</p>
    </div>
  );
}

function LineNumbers() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-end overflow-clip relative shrink-0" data-name="Line Numbers">
      <LineNumber />
      <LineNumber1 />
      <LineNumber2 />
      <LineNumber3 />
      <LineNumber4 />
      <LineNumber5 />
      <LineNumber6 />
      <LineNumber7 />
      <LineNumber8 />
      <LineNumber9 />
      <LineNumber10 />
      <LineNumber11 />
      <LineNumber12 />
      <LineNumber13 />
      <LineNumber14 />
      <LineNumber15 />
      <LineNumber16 />
    </div>
  );
}

function LineWrapper() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[126px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#69788a] text-[14px] text-nowrap whitespace-pre">{`<!DOCTYPE html>`}</p>
    </div>
  );
}

function LineWrapper1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[135px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">html</span> <span className="text-[#c88504]">lang</span>=<span>{`"`}</span>
        <span className="text-[#286d29]">en</span>
        <span>{`"`}</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function LineWrapper2() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[51px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">head</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[16px] pr-0 py-0 relative shrink-0 w-[201px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">meta</span> <span className="text-[#c88504]">charset</span>=<span>{`"`}</span>
        <span className="text-[#286d29]">UTF-8</span>
        <span>{`"`}</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper1() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[16px] pr-0 py-0 relative shrink-0 w-[604px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">meta</span> <span className="text-[#c88504]">name</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">viewport</span>
        <span>{`" `}</span>
        <span className="text-[#c88504]">content</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">width=device-width, initial-scale=1.0</span>
        <span>{`">`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper2() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[16px] pr-0 py-0 relative shrink-0 w-[394px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">title</span>
        <span>{`>TaskFlow - Simple Task Manager</`}</span>
        <span className="text-[#c12814]">title</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper3() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[16px] pr-0 py-0 relative shrink-0 w-[361px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">link</span> <span className="text-[#c88504]">rel</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">stylesheet</span>
        <span>{`" `}</span>
        <span className="text-[#c88504]">href</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">styles.css</span>
        <span>{`">`}</span>
      </p>
    </div>
  );
}

function LineWrapper3() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[59px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`</`}</span>
        <span className="text-[#c12814]">head</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function LineWrapper4() {
  return (
    <div className="content-stretch flex gap-[10px] h-[22px] items-center relative shrink-0" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre"> </p>
    </div>
  );
}

function LineWrapper5() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[51px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">body</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper4() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[16px] pr-0 py-0 relative shrink-0 w-[210px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">div</span> <span className="text-[#c88504]">class</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">container</span>
        <span>{`">`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper5() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[32px] pr-0 py-0 relative shrink-0 w-[259px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">header</span> <span className="text-[#c88504]">class</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">app-header</span>
        <span>{`">`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper6() {
  return (
    <div className="relative rounded-[4px] shrink-0 w-full" data-name="Indented Line Wrapper">
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center pl-[48px] pr-0 py-0 relative w-full">
          <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
            <span>{`<`}</span>
            <span className="text-[#c12814]">h1</span>
            <span>{`>TaskFlow</`}</span>
            <span className="text-[#c12814]">h1</span>
            <span>{`> `}</span>
            <span className="text-[#0093a4]">|</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function IndentedLineWrapper7() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[48px] pr-0 py-0 relative shrink-0 w-[510px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`<`}</span>
        <span className="text-[#c12814]">p</span> <span className="text-[#c88504]">class</span>
        <span>{`="`}</span>
        <span className="text-[#286d29]">subtitle</span>
        <span>{`">Stay organized, stay productive</`}</span>
        <span className="text-[#c12814]">p</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function IndentedLineWrapper8() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-center pl-[32px] pr-0 py-0 relative shrink-0 w-[108px]" data-name="Indented Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`</`}</span>
        <span className="text-[#c12814]">header</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function LineWrapper6() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[59px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`</`}</span>
        <span className="text-[#c12814]">body</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function LineWrapper7() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-[59px]" data-name="Line Wrapper">
      <p className="font-['Google_Sans_Code:Regular',_sans-serif] font-normal leading-[21.56px] relative shrink-0 text-[#292f36] text-[14px] text-nowrap whitespace-pre">
        <span>{`</`}</span>
        <span className="text-[#c12814]">html</span>
        <span>{`>`}</span>
      </p>
    </div>
  );
}

function CodeWrapper() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px overflow-clip relative shrink-0" data-name="Code Wrapper">
      <LineWrapper />
      <LineWrapper1 />
      <LineWrapper2 />
      <IndentedLineWrapper />
      <IndentedLineWrapper1 />
      <IndentedLineWrapper2 />
      <IndentedLineWrapper3 />
      <LineWrapper3 />
      <LineWrapper4 />
      <LineWrapper5 />
      <IndentedLineWrapper4 />
      <IndentedLineWrapper5 />
      <IndentedLineWrapper6 />
      <IndentedLineWrapper7 />
      <IndentedLineWrapper8 />
      <LineWrapper6 />
      <LineWrapper7 />
    </div>
  );
}

function Code() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Code">
      <LineNumbers />
      <CodeWrapper />
    </div>
  );
}

export default function EditorWrapper() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[8px] items-start px-0 py-[8px] relative size-full" data-name="Editor Wrapper">
      <TopRow />
      <Code />
    </div>
  );
}