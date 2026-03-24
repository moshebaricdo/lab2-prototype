import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faXmark } from "@fortawesome/free-solid-svg-icons";

interface SuccessAlertProps {
  message: string;
  onClose: () => void;
}

export function SuccessAlert({ message, onClose }: SuccessAlertProps) {
  return (
    <div className="bg-[#e2f6e2] relative rounded-[4px] w-full" data-name="Alert">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center px-[12px] py-[8px] relative size-full">
          {/* Content Container */}
          <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
            {/* Success Icon */}
            <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#3ea33e] text-[13px] text-center w-[16px]">
              <FontAwesomeIcon icon={faCheckCircle} className="leading-[1.25]" />
            </div>

            {/* Message Text */}
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <p
                className="leading-[19.68px] not-italic relative shrink-0 text-[#292f36] text-[12px] text-nowrap whitespace-pre"
                style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}
              >
                {message}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 hover:bg-[#c6ecc6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
            aria-label="Close alert"
            data-name="Close Icon Button"
          >
            <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[18px]">
              <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
