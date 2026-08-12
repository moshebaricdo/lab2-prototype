import { useEffect, useState } from "react";
import { Modal, TextInput } from "@moshebaricdo/cads-react";
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      primaryActionLabel={confirmLabel}
      secondaryActionLabel="Cancel"
      onPrimaryAction={handleSubmit}
      onSecondaryAction={onClose}
    >
      <p>{description}</p>
      <div className={styles.inputRow}>
        <div className={styles.fieldGroup}>
          <TextInput
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
            error={Boolean(error)}
            helperText={error || undefined}
            size="medium"
            color="secondary"
          />
        </div>
      </div>
    </Modal>
  );
}
