import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-regular-svg-icons";
import { useState } from "react";

interface ActionRowProps {
  onCopy?: () => void;
  onDownload?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}

export function ActionRow({
  onCopy,
  onDownload,
  onThumbsUp,
  onThumbsDown,
}: ActionRowProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleThumbsUp = () => {
    setFeedback(feedback === "up" ? null : "up");
    onThumbsUp?.();
  };

  const handleThumbsDown = () => {
    setFeedback(feedback === "down" ? null : "down");
    onThumbsDown?.();
  };

  return (
    <div className="relative size-full" data-name="Action Row">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start relative size-full m-[0px] pt-[0px] pr-[20px] pb-[0px] pl-[0px]">
          {/* Left Action Group */}
          <div className="content-stretch flex gap-[2px] items-start overflow-clip relative shrink-0">
            <button
              onClick={onCopy}
              className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] transition-colors"
            >
              <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
                <FontAwesomeIcon icon={faCopy} className="leading-[1.25]" />
              </div>
            </button>
            <button
              onClick={onDownload}
              className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] transition-colors"
            >
              <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]">
                <FontAwesomeIcon icon={faDownload} className="leading-[1.25]" />
              </div>
            </button>
          </div>

          {/* Right Action Group */}
          <div className="basis-0 content-stretch flex gap-[4px] grow items-start justify-end min-h-px min-w-px overflow-clip relative shrink-0">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <div
                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[12px] text-center text-nowrap"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-normal)",
                }}
              >
                <p className="leading-[19.68px] whitespace-pre">Was this helpful?</p>
              </div>
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <button
                  onClick={handleThumbsUp}
                  className={`box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0 transition-colors ${
                    feedback === "up"
                      ? "bg-[#e0f8f9] text-[#0093a4]"
                      : "hover:bg-[#dfe3e9] text-[#69788a]"
                  }`}
                >
                  <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]">
                    <FontAwesomeIcon icon={faThumbsUp} className="leading-[1.25]" />
                  </div>
                </button>
                <button
                  onClick={handleThumbsDown}
                  className={`box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0 transition-colors ${
                    feedback === "down"
                      ? "bg-[#e0f8f9] text-[#0093a4]"
                      : "hover:bg-[#dfe3e9] text-[#69788a]"
                  }`}
                >
                  <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]">
                    <FontAwesomeIcon icon={faThumbsDown} className="leading-[1.25]" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
