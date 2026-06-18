import type { ReactNode } from "react";
import { FaIcon, type FaIconSize } from "./icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import styles from "./AppTag.module.scss";

type AppTagVariant = "neutral" | "purple";

interface AppTagProps {
  children: ReactNode;
  variant?: AppTagVariant;
  iconName?: FaIconName;
  iconSize?: FaIconSize;
  className?: string;
}

export function AppTag({
  children,
  variant = "neutral",
  iconName,
  iconSize = "xs",
  className = "",
}: AppTagProps) {
  return (
    <span
      className={[styles.tag, styles[variant], className].filter(Boolean).join(" ")}
    >
      {iconName ? <FaIcon name={iconName} size={iconSize} aria-hidden /> : null}
      {children}
    </span>
  );
}
