import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";

interface VersionTagProps {
  versionLabel: string;
}

export function VersionTag({ versionLabel }: VersionTagProps) {
  return (
    <div className="bg-[#bfe4e8] relative rounded-[100px]">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[2px] items-center justify-center not-italic pl-[8px] pr-[12px] py-[2px] relative">
          <div
            className="flex flex-col h-[13px] justify-center leading-[0] relative shrink-0 text-[#0093a4] text-center text-[10px] w-[16px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <FontAwesomeIcon
              icon={faArrowRotateLeft}
              className="leading-[1.25]"
            />
          </div>
          <p
            className="leading-[17.6px] relative shrink-0 text-[#292f36] text-[10px] text-nowrap tracking-[0.4px] uppercase whitespace-pre"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            VIEWING {versionLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
