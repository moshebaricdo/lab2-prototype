import imgHideInstructionsButton from "figma:asset/8071e1ca68e4151cd90426226810dbc064192698.png";

function HelpfulStepsContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center leading-[0] not-italic relative shrink-0 text-[#292f36] w-full" data-name="Helpful Steps Container">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center relative shrink-0 text-[13px] text-center w-[16px]">
        <p className="leading-[1.25]">caret-up</p>
      </div>
      <div className="basis-0 flex flex-col font-['Figtree:Semi_Bold',sans-serif] grow justify-center min-h-px min-w-px relative shrink-0 text-[14px]">
        <p className="leading-[21.56px]">Helpful Steps</p>
      </div>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="basis-0 bg-[#f0f2f5] grow min-h-px min-w-px relative rounded-[4px] shrink-0 w-full" data-name="Content Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] items-start pb-[12px] pt-[8px] px-[12px] relative size-full">
          <div className="flex flex-col font-['Barlow_Semi_Condensed:Semi_Bold',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[28px] w-[min-content]">
            <p className="leading-[35.84px]">Style Your Webpage to Match Your Brand Identity</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[14px] w-[min-content]">
            <p className="leading-[21.56px]">Your goal is to apply your brand’s colors and fonts to create a consistent, professional look across the entire page.</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[14px] w-[min-content]">
            <p className="leading-[21.56px]">Make sure to:</p>
          </div>
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[14px] w-[min-content]">
            <ul className="list-disc">
              <li className="mb-0 ms-[21px]">
                <span className="leading-[21.56px]">Add the html file as context and prompt the AI to update the file with a link to the stylesheet.</span>
              </li>
              <li className="ms-[21px]">
                <span className="leading-[21.56px]">Fine-tune specific elements of your webpage so every detail aligns with your brand’s look and feel.</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col font-['Figtree:Semi_Bold',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[0px] w-[min-content]">
            <p className="leading-[21.56px] text-[14px]">
              <span>{`Don't have your own brand identity kit? `}</span>
              <span className="font-['Figtree:Regular',sans-serif] not-italic">Attach one from the sample_brand_kits folder to your chat with AI.</span>
            </p>
          </div>
          <HelpfulStepsContainer />
          <div className="flex flex-col font-['Figtree:Regular',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#292f36] text-[14px] w-[min-content]">
            <ol className="list-decimal" start="1">
              <li className="mb-0 ms-[21px]">
                <span className="leading-[21.56px]">Generate the Initial Style and save as V1.</span>
              </li>
              <li className="mb-0 ms-[21px]">
                <span className="leading-[21.56px]">Make Specific Refinement Prompts. Use targeted prompts to give the AI clear styling instructions, such as:</span>
              </li>
              <ul className="list-disc mb-0">
                <li className="mb-0 ms-[42px]">
                  <span className="leading-[21.56px]">“Style the main heading with font [X].”</span>
                </li>
                <li className="mb-0 ms-[42px]">
                  <span className="leading-[21.56px]">“Change the button background to our secondary color and add a hover effect.”</span>
                </li>
                <li className="ms-[42px]">
                  <span className="leading-[21.56px]">“Make the footer text smaller and light gray.”</span>
                </li>
              </ul>
              <li className="ms-[21px]">
                <span className="leading-[21.56px]">Save as Version 2</span>
              </li>
            </ol>
          </div>
          <div className="absolute h-[22.927px] left-0 top-[512.07px] w-[328px]" data-name="Hide Instructions Button">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgHideInstructionsButton} />
          </div>
          <div className="absolute bg-[#c6ced6] h-[250.763px] left-[316px] rounded-[4px] top-[8px] w-[6px]" data-name="Hide Instructions Icon" />
        </div>
      </div>
    </div>
  );
}

function DrawerContent() {
  return (
    <div className="bg-white h-[551px] mb-[-1px] relative shrink-0 w-full" data-name="Drawer Content">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none shadow-[0px_2px_3px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[6px] h-[551px] items-center p-[8px] relative w-full">
          <ContentContainer />
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] not-italic px-[8px] py-[2px] relative rounded-[4px] shrink-0 text-[#292f36] text-center" data-name="Button">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]">
        <p className="leading-[1.25]">info-circle</p>
      </div>
      <p className="basis-0 font-['Figtree:Semi_Bold',sans-serif] grow leading-[19.68px] min-h-px min-w-px relative shrink-0 text-[12px]">Hide Instructions</p>
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',sans-serif] justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]">
        <p className="leading-[1.25]">chevron-up</p>
      </div>
    </div>
  );
}

function DrawerToggle() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-center justify-center mb-[-1px] pb-[4px] pt-0 px-[4px] relative rounded-bl-[8px] rounded-br-[8px] shrink-0" data-name="Drawer Toggle">
      <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px_1px_1px] border-solid inset-0 pointer-events-none rounded-bl-[8px] rounded-br-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.05)]" />
      <Button />
    </div>
  );
}

export default function DrawerContainer() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-center pb-px pt-0 px-0 relative size-full" data-name="Drawer Container">
      <DrawerContent />
      <DrawerToggle />
    </div>
  );
}