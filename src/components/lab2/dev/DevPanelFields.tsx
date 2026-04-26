import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppButton } from "../../ui/AppButton";
import type { DevPanelField } from "./types";
import styles from "./DevPanel.module.scss";

interface FieldProps {
  field: DevPanelField;
  value: unknown;
  isOverridden: boolean;
  controlId: string;
  onChange: (value: unknown) => void;
  onReset: () => void;
}

function TextField({ field, value, controlId, onChange }: FieldProps) {
  return (
    <input
      id={controlId}
      type="text"
      className={styles.input}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
    />
  );
}

function TextareaField({ field, value, controlId, onChange }: FieldProps) {
  const rows = field.type === "textarea" ? (field.rows ?? 3) : 3;
  const [previewing, setPreviewing] = useState(false);
  const text = (value as string) ?? "";

  return (
    <div className={styles.textareaWrap}>
      <div className={styles.textareaTabBar}>
        <button
          type="button"
          className={`${styles.textareaTab} ${!previewing ? styles.textareaTabActive : ""}`}
          onClick={() => setPreviewing(false)}
        >
          Write
        </button>
        <button
          type="button"
          className={`${styles.textareaTab} ${previewing ? styles.textareaTabActive : ""}`}
          onClick={() => setPreviewing(true)}
        >
          Preview
        </button>
      </div>
      {previewing ? (
        <div className={styles.markdownPreview}>
          {text ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <span className={styles.previewEmpty}>Nothing to preview</span>
          )}
        </div>
      ) : (
        <textarea
          id={controlId}
          className={styles.textarea}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          rows={rows}
        />
      )}
    </div>
  );
}

function NumberField({ field, value, controlId, onChange }: FieldProps) {
  const min = field.type === "number" ? field.min : undefined;
  const max = field.type === "number" ? field.max : undefined;
  const step = field.type === "number" ? field.step : undefined;
  return (
    <input
      id={controlId}
      type="number"
      className={styles.input}
      value={(value as number) ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
    />
  );
}

function SliderField({ field, value, controlId, onChange }: FieldProps) {
  if (field.type !== "slider") return null;
  const numVal = (value as number) ?? field.min;
  return (
    <div className={styles.sliderWrap}>
      <input
        id={controlId}
        type="range"
        className={styles.slider}
        value={numVal}
        onChange={(e) => onChange(Number(e.target.value))}
        min={field.min}
        max={field.max}
        step={field.step ?? 0.01}
      />
      <span className={styles.sliderValue}>{numVal}</span>
    </div>
  );
}

function BooleanField({ value, controlId, onChange }: FieldProps) {
  return (
    <label className={styles.toggleLabel}>
      <input
        id={controlId}
        type="checkbox"
        className={styles.toggle}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{value ? "On" : "Off"}</span>
    </label>
  );
}

function SelectField({ field, value, controlId, onChange }: FieldProps) {
  if (field.type !== "select") return null;
  return (
    <select
      id={controlId}
      className={styles.select}
      value={String(value ?? "")}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(field.valueType === "number" ? Number(raw) : raw);
      }}
    >
      {field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

const FIELD_COMPONENTS: Record<string, React.ComponentType<FieldProps>> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  slider: SliderField,
  boolean: BooleanField,
  select: SelectField,
};

type FieldRowProps = Omit<FieldProps, "controlId">;

export function DevPanelFieldRow({
  field,
  value,
  isOverridden,
  onChange,
  onReset,
}: FieldRowProps) {
  const Component = FIELD_COMPONENTS[field.type];
  if (!Component) return null;
  const controlId = `dev-panel-${field.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldTitle}>
          <label className={styles.fieldLabel} htmlFor={controlId}>
            {field.label}
          </label>
          {field.storage === "session" ? (
            <span className={styles.storageBadge}>Session</span>
          ) : null}
        </div>
        {isOverridden && (
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="rotate-left"
            className={styles.resetButton}
            onClick={onReset}
            aria-label={`Reset ${field.label}`}
          />
        )}
      </div>
      {field.description ? (
        <p className={styles.fieldDescription}>{field.description}</p>
      ) : null}
      <Component
        field={field}
        value={value}
        isOverridden={isOverridden}
        controlId={controlId}
        onChange={onChange}
        onReset={onReset}
      />
    </div>
  );
}
