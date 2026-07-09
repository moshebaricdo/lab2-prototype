import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../hooks/useTheme";
import { AppIconButton } from "./AppIconButton";
import styles from "./Modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  const { theme } = useTheme();
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={[styles.overlay, theme === "dark" ? "dark" : ""]
        .filter(Boolean)
        .join(" ")}
      data-theme={theme}
    >
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <AppIconButton
          variant="tertiary"
          tone="gray"
          size="xs"
          iconName="xmark"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        />

        <h3 id={titleId} className={styles.title}>{title}</h3>
        <div className={styles.separator} aria-hidden="true" />

        {description ? <p className={styles.description}>{description}</p> : null}

        {children}

        {footer && (
          <>
            <div className={styles.separator} aria-hidden="true" />
            <div className={styles.actionsRow}>{footer}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export type { ModalProps };
