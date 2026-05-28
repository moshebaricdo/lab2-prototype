import { useId, useState, type FormEvent } from "react";
import type { EditOptionChoice, EditOptionsCardData } from "../../../../../types/chat";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import styles from "./EditOptionsCard.module.scss";

interface EditOptionsCardProps {
  editOptions: EditOptionsCardData;
  disabled?: boolean;
  onSelect: (option: EditOptionChoice) => void;
  onCustomSubmit?: (customDirection: string) => void;
}

export function EditOptionsCard({
  editOptions,
  disabled = false,
  onSelect,
  onCustomSubmit,
}: EditOptionsCardProps) {
  const inputId = useId();
  const [customDirection, setCustomDirection] = useState("");

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const direction = customDirection.trim();
    if (!direction || disabled || !onCustomSubmit) return;
    onCustomSubmit(direction);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>Choose a direction</div>

      <div className={styles.body}>
        <div className={styles.choiceList}>
          {editOptions.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={styles.choiceRow}
              disabled={disabled}
              onClick={() => onSelect(option)}
            >
              <span className={styles.optionBadge} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.choiceLabel}>{option.label}</span>
            </button>
          ))}

          <form className={styles.customRow} onSubmit={handleCustomSubmit}>
            <span className={styles.optionBadge} aria-hidden="true">
              <FaIcon
                name="pen-line"
                size="xs"
                className={styles.optionBadgeIcon}
              />
            </span>
            <input
              id={inputId}
              type="text"
              className={styles.customInput}
              value={customDirection}
              placeholder="Something else..."
              disabled={disabled || !onCustomSubmit}
              onChange={(event) => setCustomDirection(event.currentTarget.value)}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
