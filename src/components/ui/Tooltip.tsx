import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";
import styles from "./Tooltip.module.scss";

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
  sideOffset = 6,
}: TooltipProps) {
  const arrowByPosition = {
    right: styles.rightArrow,
    left: styles.leftArrow,
    top: styles.topArrow,
    bottom: styles.bottomArrow,
  }[position];

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
            className={styles.content}
          >
            <div
              className={`${styles.tooltip} ${
                position === "top"
                  ? styles.top
                  : position === "bottom"
                    ? styles.bottom
                    : ""
              }`}
              data-name="Tooltip"
            >
              {(position === "right" || position === "bottom") && (
                <span className={`${styles.arrow} ${arrowByPosition}`} />
              )}
              <div className={styles.body}>
                <p className={styles.text}>{content}</p>
              </div>
              {(position === "left" || position === "top") && (
                <span className={`${styles.arrow} ${arrowByPosition}`} />
              )}
            </div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
