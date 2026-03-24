import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

interface VersionBannerProps {
  versionLabel: string;
  onClose: () => void;
}

export function VersionBanner({ versionLabel, onClose }: VersionBannerProps) {
  return (
    <div className="bg-yellow-50 relative w-full h-[40px]" data-name="Alert">
      <div
        aria-hidden="true"
        className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
      />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[8px] relative size-full">
          {/* Content Container */}
          <div
            className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0"
            data-name="Content Container"
          >
            {/* Warning Icon */}
            <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#f9cb28] text-[13px] text-center w-[16px]">
              <FontAwesomeIcon icon={faCircleExclamation} className="leading-[1.25]" />
            </div>

            {/* Message Text */}
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <p
                className="leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre"
                style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}
              >
                You're viewing a previous version of this project from
                <span
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}
                >{` ${versionLabel}.`}</span>
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 hover:bg-[#fef3c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
            aria-label="Return to current version"
            data-name="Close Icon Button"
          >
            <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center w-[18px]">
              <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
