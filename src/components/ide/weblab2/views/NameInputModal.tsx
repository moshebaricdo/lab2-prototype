import { useEffect, useState } from "react";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./CreateFileModal.module.scss";

interface NameInputModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => true | string | void;
}

function SeparatorHorizontal() {
  return <div className={styles.separator} aria-hidden="true" />;
}

export function NameInputModal({
  isOpen,
  title,
  description,
  fieldLabel,
  placeholder,
  confirmLabel,
  initialValue = "",
  onClose,
  onSubmit,
}: NameInputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue);
    setError("");
  }, [initialValue, isOpen]);

  const handleSubmit = () => {
    if (!value.trim()) {
      setError(`Please enter a ${fieldLabel.toLowerCase()}.`);
      return;
    }

    const result = onSubmit(value.trim());
    if (typeof result === "string") {
      setError(result);
      return;
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit();
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close dialog"
        >
          <FaIcon name="xmark" size="s" />
        </button>

        <h3 className={styles.title}>{title}</h3>
        <SeparatorHorizontal />

        <p className={styles.description}>{description}</p>

        <div className={styles.inputRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{fieldLabel}</label>
            <input
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={styles.textInput}
              autoFocus
            />
            {error ? <p className={styles.errorText}>{error}</p> : null}
          </div>
        </div>

        <SeparatorHorizontal />

        <div className={styles.actionsRow}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.primaryButton}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
