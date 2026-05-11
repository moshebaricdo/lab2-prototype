import { useEffect, useState } from "react";
import { AppButton } from "../../../ui/AppButton";
import { AppTextField } from "../../../ui/AppTextField";
import { Modal } from "../../../ui/Modal";
import styles from "../../shared/CreateFileModal.module.scss";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <AppButton variant="secondary" tone="gray" size="m" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton variant="primary" tone="purple" size="m" onClick={handleSubmit}>
            {confirmLabel}
          </AppButton>
        </>
      }
    >
      <div className={styles.inputRow}>
        <div className={styles.fieldGroup}>
          <AppTextField
            label={fieldLabel}
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            errorText={error || undefined}
            size="m"
            tone="gray"
          />
        </div>
      </div>
    </Modal>
  );
}
