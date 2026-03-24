export default function Tag() {
  return (
    <div className="bg-[#bfe4e8] relative rounded-[100px] size-full" data-name="Tag">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center not-italic pl-[8px] pr-[12px] py-[2px] relative size-full text-[10px]">
          <div className="flex flex-col font-['Font_Awesome_7_Pro:Solid',_sans-serif] h-[13px] justify-center leading-[0] relative shrink-0 text-[#0093a4] text-center w-[16px]">
            <p className="leading-[1.25]">arrow-rotate-left</p>
          </div>
          <p className="font-['Figtree:Semi_Bold',_sans-serif] leading-[17.6px] relative shrink-0 text-[#292f36] text-nowrap tracking-[0.4px] uppercase whitespace-pre">VIEWING AUG 15, 2:03PM</p>
        </div>
      </div>
    </div>
  );
}