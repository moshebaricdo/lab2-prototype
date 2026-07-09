import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
  forwardRef,
} from "react";
import styles from "./AppLink.module.scss";

type LinkSize = "l" | "m" | "s" | "xs" | "xxs";
type LinkTone = "brand" | "inherit";

interface AppLinkSharedProps {
  children: ReactNode;
  size?: LinkSize;
  tone?: LinkTone;
  /** Always show underline (CADS default is none until hover). */
  underline?: boolean;
  disabled?: boolean;
  className?: string;
}

type AppLinkAnchorProps = AppLinkSharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    as?: "a";
  };

type AppLinkButtonProps = AppLinkSharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    as: "button";
  };

export type AppLinkProps = AppLinkAnchorProps | AppLinkButtonProps;

const SIZE_CLASS: Record<LinkSize, string> = {
  l: styles.sizeL,
  m: styles.sizeM,
  s: styles.sizeS,
  xs: styles.sizeXs,
  xxs: styles.sizeXxs,
};

function linkClassName({
  size,
  tone,
  underline,
  disabled,
  className,
}: {
  size: LinkSize;
  tone: LinkTone;
  underline: boolean;
  disabled: boolean;
  className: string;
}) {
  return [
    styles.root,
    SIZE_CLASS[size],
    tone === "inherit" ? styles.toneInherit : styles.toneBrand,
    underline ? styles.underline : "",
    disabled ? styles.disabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * CADS Link — brand text action, not the button text variant.
 * Default: brand primary, no underline; hover → brand secondary + underline.
 */
export const AppLink = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  AppLinkProps
>(function AppLink(props, ref) {
  const {
    children,
    size = "m",
    tone = "brand",
    underline = false,
    disabled = false,
    className = "",
  } = props;
  const classes = linkClassName({ size, tone, underline, disabled, className });

  if (props.as === "button") {
    const {
      as: _as,
      size: _size,
      tone: _tone,
      underline: _underline,
      disabled: buttonDisabled,
      className: _className,
      children: _children,
      type = "button",
      ...buttonProps
    } = props;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        disabled={buttonDisabled || disabled}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  const {
    as: _as,
    size: _size,
    tone: _tone,
    underline: _underline,
    disabled: linkDisabled,
    className: _className,
    children: _children,
    href,
    onClick,
    ...anchorProps
  } = props;

  if (linkDisabled || disabled) {
    return (
      <span className={classes} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <a
      ref={ref as Ref<HTMLAnchorElement>}
      className={classes}
      href={href}
      onClick={onClick}
      {...anchorProps}
    >
      {children}
    </a>
  );
});

AppLink.displayName = "AppLink";

export type { LinkSize, LinkTone };
