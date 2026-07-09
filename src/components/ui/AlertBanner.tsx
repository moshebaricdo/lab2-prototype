import {
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppIconButton } from "./AppIconButton";
import { AppLink } from "./AppLink";
import { FaIcon } from "./icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import styles from "./AlertBanner.module.scss";

export type AlertBannerSize = "xs" | "s" | "m" | "l";
export type AlertBannerSentiment =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "aqua";
export type AlertBannerPresentation = "banner" | "toast";

export interface AlertBannerProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode;
  children: ReactNode;
  dismissible?: boolean;
  duration?: number;
  icon?: ReactNode;
  iconName?: FaIconName;
  onDismiss?: () => void;
  presentation?: AlertBannerPresentation;
  sentiment?: AlertBannerSentiment;
  showIcon?: boolean;
  size?: AlertBannerSize;
}

export interface AlertBannerLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

const SIZE_CLASS: Record<AlertBannerSize, string> = {
  xs: styles.sizeXs,
  s: styles.sizeS,
  m: styles.sizeM,
  l: styles.sizeL,
};

const SENTIMENT_CLASS: Record<AlertBannerSentiment, string> = {
  brand: styles.sentimentBrand,
  success: styles.sentimentSuccess,
  danger: styles.sentimentDanger,
  warning: styles.sentimentWarning,
  info: styles.sentimentInfo,
  neutral: styles.sentimentNeutral,
  aqua: styles.sentimentAqua,
};

const PRESENTATION_CLASS: Record<AlertBannerPresentation, string> = {
  banner: styles.presentationBanner,
  toast: styles.presentationToast,
};

const DEFAULT_ICON: Record<AlertBannerSentiment, FaIconName> = {
  brand: "face-smile",
  success: "circle-check",
  danger: "circle-xmark",
  warning: "circle-exclamation",
  info: "circle-info",
  neutral: "face-smile",
  aqua: "face-smile",
};

const ICON_SIZE: Record<AlertBannerSize, "xs" | "s" | "m" | "l"> = {
  xs: "xs",
  s: "s",
  m: "m",
  l: "l",
};

const TOAST_ANIMATION_DURATION_MS = 100;

export function AlertBanner({
  actions,
  children,
  className = "",
  dismissible = true,
  duration,
  icon,
  iconName,
  onDismiss,
  presentation = "banner",
  role,
  sentiment = "brand",
  showIcon = false,
  size = "m",
  ...props
}: AlertBannerProps) {
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (!onDismiss) return;

    if (presentation !== "toast" || typeof window === "undefined") {
      onDismiss();
      return;
    }

    if (isExiting || exitTimeoutRef.current != null) return;

    setIsExiting(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      exitTimeoutRef.current = null;
      onDismiss();
    }, TOAST_ANIMATION_DURATION_MS);
  }, [isExiting, onDismiss, presentation]);

  useEffect(() => {
    if (!duration || duration <= 0 || !onDismiss || typeof window === "undefined") {
      return undefined;
    }

    const timeoutId = window.setTimeout(dismiss, duration);
    return () => window.clearTimeout(timeoutId);
  }, [dismiss, duration, onDismiss]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current != null) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  const resolvedIcon =
    icon ??
    (iconName || showIcon ? (
      <FaIcon name={iconName ?? DEFAULT_ICON[sentiment]} size={ICON_SIZE[size]} />
    ) : null);

  return (
    <div
      className={[
        styles.root,
        SIZE_CLASS[size],
        SENTIMENT_CLASS[sentiment],
        PRESENTATION_CLASS[presentation],
        resolvedIcon ? styles.hasIcon : "",
        isExiting ? styles.isExiting : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={role ?? (sentiment === "danger" ? "alert" : "status")}
      {...props}
    >
      <div className={styles.content}>
        {resolvedIcon ? (
          <span className={styles.icon} aria-hidden="true">
            {resolvedIcon}
          </span>
        ) : null}
        <div className={styles.body}>
          <span className={styles.message}>{children}</span>
          {actions ? <span className={styles.actions}>{actions}</span> : null}
        </div>
      </div>

      {dismissible && onDismiss ? (
        <AppIconButton
          aria-label="Dismiss alert"
          className={styles.closeButton}
          iconName="xmark"
          onClick={dismiss}
          size="xs"
          tone="gray"
          variant="tertiary"
        />
      ) : null}
    </div>
  );
}

export function AlertBannerLink({
  children,
  className = "",
  ...props
}: AlertBannerLinkProps) {
  return (
    <AppLink
      tone="inherit"
      underline
      size="s"
      className={[styles.link, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </AppLink>
  );
}

