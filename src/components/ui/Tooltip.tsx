import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  sideOffset?: number;
  /** When false, render only Root/Content; wrap the tree in TooltipPrimitive.Provider yourself. */
  withProvider?: boolean;
  /** When true, the tooltip body won't act as a hover target (prevents hover traps in dense layouts). */
  disableHoverableContent?: boolean;
}

function TooltipBody({
  content,
  startIcon,
  endIcon,
}: Pick<TooltipProps, "content" | "startIcon" | "endIcon">) {
  const hasIcons = Boolean(startIcon || endIcon);

  if (!hasIcons) {
    if (typeof content === "string") {
      return <p className={styles.text}>{content}</p>;
    }
    return <div className={styles.text}>{content}</div>;
  }

  return (
    <div className={styles.contentRow}>
      {startIcon ? (
        <span className={styles.iconSlot}>{startIcon}</span>
      ) : null}
      <span className={styles.textInline}>{content}</span>
      {endIcon ? <span className={styles.iconSlot}>{endIcon}</span> : null}
    </div>
  );
}

export function Tooltip({
  children,
  content,
  startIcon,
  endIcon,
  position = "top",
  delayDuration = 0,
  sideOffset = 6,
  withProvider = true,
  disableHoverableContent = true,
}: TooltipProps) {
  const root = (
    <TooltipPrimitive.Root disableHoverableContent={disableHoverableContent}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={position}
          sideOffset={sideOffset}
          className={styles.content}
        >
          <div className={styles.body} data-name="Tooltip">
            <TooltipBody
              content={content}
              startIcon={startIcon}
              endIcon={endIcon}
            />
          </div>
          <TooltipPrimitive.Arrow
            className={styles.arrow}
            width={8}
            height={4}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );

  if (!withProvider) {
    return root;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {root}
    </TooltipPrimitive.Provider>
  );
}
