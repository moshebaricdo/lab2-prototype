function TooltipTails() {
  return (
    <div className="h-[6px] relative shrink-0 w-[4px]" data-name="Tooltip Tails">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 6">
        <g id="Tooltip Tails">
          <path d="M4 6L0 3L4 0L4 6Z" fill="var(--fill-0, #292F36)" id="Arrow" />
        </g>
      </svg>
    </div>
  );
}

function TooltipSmall() {
  return (
    <div className="bg-[#292f36] box-border content-stretch flex flex-col items-center max-w-[256px] min-w-[64px] px-[12px] py-[4px] relative rounded-[4px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.12),0px_0px_12px_0px_rgba(0,0,0,0.12)] shrink-0" data-name="Tooltip/Small">
      <div className="flex flex-col font-['Figtree:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white w-full">
        <p className="leading-[21.56px]">Instructions</p>
      </div>
    </div>
  );
}

export default function Tooltip() {
  return (
    <div className="content-stretch flex items-center justify-center relative size-full" data-name="Tooltip">
      <TooltipTails />
      <TooltipSmall />
    </div>
  );
}