function FontAwesomeIcon() {
  return (
    <div className="box-border content-stretch flex h-[12px] items-center justify-center opacity-50 pb-px pt-0 px-0 relative shrink-0" data-name="Font Awesome Icon">
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">cloud-check</p>
      </div>
    </div>
  );
}

function Frame1314() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center mb-[-2px] relative shrink-0">
      <FontAwesomeIcon />
      <p className="font-['Figtree:Regular',_sans-serif] leading-[17px] not-italic relative shrink-0 text-[10px] text-nowrap text-white whitespace-pre">Saved a few seconds ago</p>
    </div>
  );
}

function Text() {
  return (
    <div className="box-border content-stretch flex flex-col h-full items-end justify-center pb-[2px] pt-0 px-0 relative shrink-0" data-name="text">
      <p className="font-['Figtree:Semi_Bold',_sans-serif] h-[18px] leading-[19.68px] not-italic relative shrink-0 text-[12px] text-center text-white w-[120px]">Lesson #: Lesson Title</p>
      <Frame1314 />
    </div>
  );
}

function DiamondBubbleSmall() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, white)" id="Not Started" r="5.75" stroke="var(--stroke-0, #D4DAE1)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleSmall2() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall2() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, #3EA33E)" id="Not Started" r="5.75" stroke="var(--stroke-0, #3EA33E)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall2() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall2 />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall2 />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleSmall5() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Small" />;
}

function CircleBubbleSmall5() {
  return (
    <div className="relative size-full" data-name="Circle Bubble Small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Circle Bubble Small">
          <circle cx="6.5" cy="6.5" fill="var(--fill-0, white)" id="Not Started" r="5.75" stroke="var(--stroke-0, #3EA33E)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function BubbleSmall5() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Bubble Small">
      <DiamondBubbleSmall5 />
      <div className="absolute flex inset-[6.667%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[13px]">
          <CircleBubbleSmall5 />
        </div>
      </div>
    </div>
  );
}

function DiamondBubbleLarge() {
  return <div className="absolute bottom-full contents left-0 right-full top-0" data-name="Diamond Bubble Large" />;
}

function CircleBubbleLarge() {
  return (
    <div className="absolute inset-[1.84%_1.92%_2%_1.92%]" data-name="Circle Bubble Large">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Circle Bubble Large">
          <ellipse cx="11.9181" cy="11.9297" fill="var(--fill-0, #3EA33E)" id="Not Started" rx="11.9181" ry="11.9297" transform="matrix(1 0 0.000970931 1 0 0)" />
        </g>
      </svg>
    </div>
  );
}

function BubbleLarge() {
  return (
    <div className="relative size-[24.81px]" data-name="Bubble Large">
      <DiamondBubbleLarge />
      <CircleBubbleLarge />
      <div className="absolute flex inset-[1.84%_1.92%_2%_1.92%] items-center justify-center">
        <div className="flex-none scale-y-[-100%] size-[23.859px]">
          <div className="flex flex-col font-['Figtree:Bold',_sans-serif] justify-center leading-[0] not-italic relative size-full text-[14.035px] text-center text-white">
            <p className="leading-[19.649px]">9</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubbles() {
  return (
    <div className="box-border content-stretch flex gap-[3px] items-center px-[6px] py-[2px] relative shrink-0" data-name="bubbles">
      <BubbleSmall />
      <BubbleSmall />
      <BubbleSmall2 />
      <BubbleSmall />
      <BubbleSmall />
      <BubbleSmall5 />
      <BubbleSmall />
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <BubbleLarge />
        </div>
      </div>
      <BubbleSmall />
      <BubbleSmall />
    </div>
  );
}

function Progress() {
  return (
    <div className="bg-[#f0f2f5] h-[32px] relative rounded-[4px] shrink-0" data-name="progress">
      <div className="content-stretch flex h-[32px] items-center overflow-clip relative rounded-[inherit]">
        <Bubbles />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d4dae1] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

export default function LessonMetadata() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative size-full" data-name="lesson metadata">
      <div className="flex flex-row items-center self-stretch">
        <Text />
      </div>
      <Progress />
    </div>
  );
}