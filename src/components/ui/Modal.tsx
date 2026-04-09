import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppButton } from "./AppButton";
import styles from "./Modal.module.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "s" | "m" | "l";
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = "s",
  children,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={`${styles.panel} ${sizeClass}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            icon={<FontAwesomeIcon icon={faXmark} />}
            onClick={onClose}
            aria-label="Close"
          />
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
