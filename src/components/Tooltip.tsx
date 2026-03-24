import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  sideOffset?: number;
}

export function Tooltip({ 
  children, 
  content, 
  position = "top",
  delayDuration = 0,
  sideOffset = 6
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={position}
            sideOffset={sideOffset}
            className="z-50"
          >
            {position === "right" && (
              <div className="flex items-center" data-name="Tooltip">
                {/* Tooltip Tail - Left pointing */}
                <div className="h-[6px] relative shrink-0 w-[4px]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 4 6"
                  >
                    <path
                      d="M4 6L0 3L4 0L4 6Z"
                      fill="#292F36"
                    />
                  </svg>
                </div>

                {/* Tooltip Body */}
                <div
                  className="bg-[#292f36] box-border flex items-center max-w-[256px] min-w-[64px] px-[12px] py-[4px] relative rounded-[4px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.12),0px_0px_12px_0px_rgba(0,0,0,0.12)] shrink-0"
                >
                  <p
                    className="leading-[21.56px] text-[14px] text-center text-white whitespace-nowrap"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-normal)",
                    }}
                  >
                    {content}
                  </p>
                </div>
              </div>
            )}

            {position === "left" && (
              <div className="flex items-center" data-name="Tooltip">
                {/* Tooltip Body */}
                <div
                  className="bg-[#292f36] box-border flex items-center max-w-[256px] min-w-[64px] px-[12px] py-[4px] relative rounded-[4px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.12),0px_0px_12px_0px_rgba(0,0,0,0.12)] shrink-0"
                >
                  <p
                    className="leading-[21.56px] text-[14px] text-center text-white whitespace-nowrap"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-normal)",
                    }}
                  >
                    {content}
                  </p>
                </div>

                {/* Tooltip Tail - Right pointing */}
                <div className="h-[6px] relative shrink-0 w-[4px]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 4 6"
                  >
                    <path
                      d="M0 0L4 3L0 6L0 0Z"
                      fill="#292F36"
                    />
                  </svg>
                </div>
              </div>
            )}

            {position === "top" && (
              <div className="flex flex-col items-center" data-name="Tooltip">
                {/* Tooltip Body */}
                <div
                  className="bg-[#292f36] box-border flex items-center max-w-[256px] min-w-[64px] px-[12px] py-[4px] relative rounded-[4px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.12),0px_0px_12px_0px_rgba(0,0,0,0.12)] shrink-0"
                >
                  <p
                    className="leading-[21.56px] text-[14px] text-center text-white whitespace-nowrap"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-normal)",
                    }}
                  >
                    {content}
                  </p>
                </div>

                {/* Tooltip Tail - Down pointing */}
                <div className="h-[4px] relative shrink-0 w-[6px]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 6 4"
                  >
                    <path
                      d="M0 0L3 4L6 0L0 0Z"
                      fill="#292F36"
                    />
                  </svg>
                </div>
              </div>
            )}

            {position === "bottom" && (
              <div className="flex flex-col items-center" data-name="Tooltip">
                {/* Tooltip Tail - Up pointing */}
                <div className="h-[4px] relative shrink-0 w-[6px]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 6 4"
                  >
                    <path
                      d="M0 4L3 0L6 4L0 4Z"
                      fill="#292F36"
                    />
                  </svg>
                </div>

                {/* Tooltip Body */}
                <div
                  className="bg-[#292f36] box-border flex items-center max-w-[256px] min-w-[64px] px-[12px] py-[4px] relative rounded-[4px] shadow-[0px_8px_12px_0px_rgba(0,0,0,0.12),0px_0px_12px_0px_rgba(0,0,0,0.12)] shrink-0"
                >
                  <p
                    className="leading-[21.56px] text-[14px] text-center text-white whitespace-nowrap"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-normal)",
                    }}
                  >
                    {content}
                  </p>
                </div>
              </div>
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
