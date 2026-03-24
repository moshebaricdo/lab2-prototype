function LabelWrapper() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label Wrapper">
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">My Files</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">plus</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">arrow-left-to-line</p>
      </div>
    </div>
  );
}

function ActionGroupRight() {
  return (
    <div className="content-stretch flex gap-[2px] items-center justify-end min-w-[50px] relative shrink-0 w-full" data-name="Action Group Right">
      <Button />
      <Button1 />
    </div>
  );
}

function VisibilityWrapper() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start min-w-[50px] relative shrink-0 w-[50px]" data-name="Visibility Wrapper">
      <ActionGroupRight />
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="min-h-[32px] relative shrink-0 w-full" data-name="Panel Header">
      <div className="flex flex-row items-center min-h-inherit overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex items-center justify-between min-h-inherit pl-[16px] pr-[10px] py-[8px] relative w-full">
          <LabelWrapper />
          <VisibilityWrapper />
        </div>
      </div>
    </div>
  );
}

function FileItemIcons() {
  return (
    <div className="box-border content-stretch flex h-[14px] items-center justify-center pb-px pt-0 px-px relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">folder-open</p>
      </div>
    </div>
  );
}

function IconLabel() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">Folder Open</p>
      </div>
    </div>
  );
}

function FileListItem() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[24px] items-center px-[8px] py-0 relative w-full">
          <IconLabel />
        </div>
      </div>
    </div>
  );
}

function FileItem() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem />
    </div>
  );
}

function FileItemIcons1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-px relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">file-code</p>
      </div>
    </div>
  );
}

function IconLabel1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons1 />
      <div className="flex flex-col font-['Figtree:Semi_Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">index.html</p>
      </div>
    </div>
  );
}

function FileListItem1() {
  return (
    <div className="h-[24px] relative rounded-[4px] shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[14px] h-[24px] items-center pl-[14px] pr-[8px] py-0 relative w-full">
          <div className="flex h-full items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "23.984375", "--transform-inner-height": "23.984375" } as React.CSSProperties}>
            <div className="flex-none h-full rotate-[90deg]">
              <div className="h-full relative w-[24px]" data-name="Line">
                <div className="absolute inset-[-0.5px_-2.08%]" style={{ "--stroke-0": "rgba(183, 193, 203, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 2">
                    <path d="M1 1H25" id="Line" stroke="var(--stroke-0, #B7C1CB)" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <IconLabel1 />
        </div>
      </div>
    </div>
  );
}

function FileItem1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem1 />
    </div>
  );
}

function FileItemIcons2() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-0 relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Brands:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">css</p>
      </div>
    </div>
  );
}

function IconLabel2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons2 />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">styles.css</p>
      </div>
    </div>
  );
}

function CloseIconButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0" data-name="Close Icon Button">
      <div className="flex flex-col font-['Font_Awesome_6_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[10px] text-center w-[13px]">
        <p className="leading-[1.25]">ellipsis-vertical</p>
      </div>
    </div>
  );
}

function FileListItem2() {
  return (
    <div className="bg-[#dfe3e9] h-[24px] relative rounded-[4px] shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[14px] h-[24px] items-center pl-[14px] pr-[8px] py-0 relative w-full">
          <div className="flex h-full items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "23.984375", "--transform-inner-height": "23.984375" } as React.CSSProperties}>
            <div className="flex-none h-full rotate-[90deg]">
              <div className="h-full relative w-[24px]" data-name="Line">
                <div className="absolute inset-[-0.5px_-2.08%]" style={{ "--stroke-0": "rgba(183, 193, 203, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 2">
                    <path d="M1 1H25" id="Line" stroke="var(--stroke-0, #B7C1CB)" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <IconLabel2 />
          <CloseIconButton />
        </div>
      </div>
    </div>
  );
}

function FileItem2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem2 />
    </div>
  );
}

function FileItemIcons4() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-0 relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">image</p>
      </div>
    </div>
  );
}

function IconLabel4() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons4 />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">image.png</p>
      </div>
    </div>
  );
}

function FileListItem4() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[14px] h-[24px] items-center pl-[14px] pr-[8px] py-0 relative w-full">
          <div className="flex h-full items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "23.984375", "--transform-inner-height": "23.984375" } as React.CSSProperties}>
            <div className="flex-none h-full rotate-[90deg]">
              <div className="h-full relative w-[24px]" data-name="Line">
                <div className="absolute inset-[-0.5px_-2.08%]" style={{ "--stroke-0": "rgba(212, 218, 225, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 2">
                    <path d="M1 1H25" id="Line" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <IconLabel4 />
        </div>
      </div>
    </div>
  );
}

function FileItem4() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem4 />
    </div>
  );
}

function FileItemIcons5() {
  return (
    <div className="box-border content-stretch flex h-[14px] items-center justify-center pb-px pt-0 px-px relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">folder-open</p>
      </div>
    </div>
  );
}

function IconLabel5() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons5 />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">Sub-folder Open</p>
      </div>
    </div>
  );
}

function FileListItem5() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[24px] items-center pl-[28px] pr-[8px] py-0 relative w-full">
          <IconLabel5 />
        </div>
      </div>
    </div>
  );
}

function FileItem5() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem5 />
    </div>
  );
}

function FileItemIcons6() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-0 relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">file-lines</p>
      </div>
    </div>
  );
}

function IconLabel6() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons6 />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">prompt.txt</p>
      </div>
    </div>
  );
}

function FileListItem6() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[14px] h-[24px] items-center pl-[34px] pr-[8px] py-0 relative w-full">
          <div className="flex h-full items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "23.984375", "--transform-inner-height": "23.984375" } as React.CSSProperties}>
            <div className="flex-none h-full rotate-[90deg]">
              <div className="h-full relative w-[24px]" data-name="Line">
                <div className="absolute inset-[-0.5px_-2.08%]" style={{ "--stroke-0": "rgba(212, 218, 225, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 2">
                    <path d="M1 1H25" id="Line" stroke="var(--stroke-0, #D4DAE1)" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <IconLabel6 />
        </div>
      </div>
    </div>
  );
}

function FileItem6() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem6 />
    </div>
  );
}

function FileItemIcons7() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] h-[14px] items-center justify-center pb-px pt-0 px-[3px] relative shrink-0 w-[12px]" data-name="File Item Icons">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#576575] text-[12px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">folder</p>
      </div>
    </div>
  );
}

function IconLabel7() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Icon + Label">
      <FileItemIcons7 />
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] text-[12px] text-center text-nowrap">
        <p className="leading-[19.68px] whitespace-pre">Sub-folder Closed</p>
      </div>
    </div>
  );
}

function FileListItem7() {
  return (
    <div className="h-[24px] relative rounded-[4px] shrink-0 w-full" data-name="File List Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[24px] items-center pl-[28px] pr-[8px] py-0 relative w-full">
          <IconLabel7 />
        </div>
      </div>
    </div>
  );
}

function FileItem7() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="File Item">
      <FileListItem7 />
    </div>
  );
}

function FileList() {
  return (
    <div className="relative shrink-0 w-full" data-name="File List">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[2px] items-start px-[8px] py-0 relative w-full">
          <FileItem />
          <FileItem1 />
          <FileItem2 />
          <FileItem />
          <FileItem4 />
          <FileItem5 />
          <FileItem6 />
          <FileItem7 />
        </div>
      </div>
    </div>
  );
}

export default function FileManagerV2() {
  return (
    <div className="bg-[#f0f2f5] relative size-full" data-name="File Manager V2">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <PanelHeader />
        <FileList />
      </div>
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}