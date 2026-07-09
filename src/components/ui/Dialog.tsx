import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../hooks/useTheme";
import { AppIconButton } from "./AppIconButton";
import styles from "./Dialog.module.scss";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "s" | "m" | "l";
  children: ReactNode;
  footer?: ReactNode;
  decorativeIcon?: ReactNode;
  decorativeIconClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeButtonClassName?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  size = "s",
  children,
  footer,
  decorativeIcon,
  decorativeIconClassName = "",
  panelClassName = "",
  headerClassName = "",
  titleClassName = "",
  bodyClassName = "",
  footerClassName = "",
  closeButtonClassName = "",
}: DialogProps) {
  const { theme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  if (!open) return null;

  const sizeClass =
    size === "s" ? styles.sizeS : size === "l" ? styles.sizeL : styles.sizeM;

  return createPortal(
    <div
      className={[styles.overlay, theme === "dark" ? "dark" : ""]
        .filter(Boolean)
        .join(" ")}
      data-theme={theme}
      onMouseDown={onClose}
    >
      <div
        ref={panelRef}
        className={[styles.panel, sizeClass, panelClassName].filter(Boolean).join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {decorativeIcon ? (
          <div
            className={[styles.decorativeIcon, decorativeIconClassName]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            {decorativeIcon}
          </div>
        ) : null}
        <div className={[styles.header, headerClassName].filter(Boolean).join(" ")}>
          <h2 id={titleId} className={[styles.title, titleClassName].filter(Boolean).join(" ")}>
            {title}
          </h2>
          <AppIconButton
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="xmark"
            onClick={onClose}
            aria-label="Close"
            className={closeButtonClassName}
          />
        </div>
        <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
        {footer && (
          <div className={[styles.footer, footerClassName].filter(Boolean).join(" ")}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export type { DialogProps };
