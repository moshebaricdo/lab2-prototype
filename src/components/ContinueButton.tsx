import { ButtonHTMLAttributes } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface ContinueButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  // No additional props needed for now
}

export function ContinueButton({
  className = "",
  disabled,
  ...props
}: ContinueButtonProps) {
  return (
    <button
      className={`
        h-[32px] min-w-[32px] w-full rounded-[4px]
        transition-colors
        ${
          disabled
            ? "bg-[#d4dae1] cursor-not-allowed"
            : "bg-[#9657c7] hover:bg-[#6c468a] active:bg-[#9657c7]"
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[12px] py-[5px] text-[14px] text-center text-white w-full">
          <p className="font-semibold leading-[21.56px] shrink-0 text-nowrap whitespace-pre">
            Continue to Level 10
          </p>
          <div className="flex flex-col justify-center leading-[0] shrink-0 w-[18px]">
            <FontAwesomeIcon
              icon={faArrowRight}
              className="text-[14px] leading-[1.25]"
            />
          </div>
        </div>
      </div>
    </button>
  );
}