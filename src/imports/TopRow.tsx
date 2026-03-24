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

export default function TopRow() {
  return (
    <div className="relative size-full" data-name="Top Row">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start px-[8px] py-0 relative size-full">
          <TabWrapper />
        </div>
      </div>
    </div>
  );
}