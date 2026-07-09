import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import {
  AppButton,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from "./AppButton";
import type { FaIconName } from "../../icons/faProRegularCodepoints";

interface AppIconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible name — required for icon-only controls. */
  "aria-label": string;
  iconName?: FaIconName;
  /** Prefer \`iconName\` for FA icons; use \`icon\` for custom nodes. */
  icon?: ReactNode;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

/**
 * Icon-only AppButton with a required aria-label.
 * Defaults match chrome hits: secondary / gray / s.
 */
export const AppIconButton = forwardRef<HTMLButtonElement, AppIconButtonProps>(
  (
    {
      icon,
      iconName,
      variant = "secondary",
      tone = "gray",
      size = "s",
      type = "button",
      ...props
    },
    ref,
  ) => {
    if (!icon && !iconName) {
      throw new Error("AppIconButton requires iconName or icon");
    }

    return (
      <AppButton
        ref={ref}
        type={type}
        variant={variant}
        tone={tone}
        size={size}
        icon={icon}
        iconName={iconName}
        {...props}
      />
    );
  },
);

AppIconButton.displayName = "AppIconButton";

export type { AppIconButtonProps };
