import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export function SavedTag() {
  return (
    <div className="bg-[#c7ecc6] h-[24px] relative rounded-[100px] shrink-0" data-name="Tag">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center not-italic pl-[8px] pr-[12px] py-[2px] relative size-full text-[10px]">
          <div
            className="flex flex-col h-[13px] justify-center leading-[0] relative shrink-0 text-[#3ea33e] text-center w-[16px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <FontAwesomeIcon icon={faCheck} className="leading-[1.25]" />
          </div>
          <p
            className="leading-[17.6px] relative shrink-0 text-[#292f36] text-nowrap tracking-[0.4px] uppercase whitespace-pre"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            SAVED
          </p>
        </div>
      </div>
    </div>
  );
}
