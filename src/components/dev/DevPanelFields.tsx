import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DevPanelField } from "./types";
import styles from "./DevPanel.module.scss";

interface FieldProps {
  field: DevPanelField;
  value: unknown;
  isOverridden: boolean;
  onChange: (value: unknown) => void;
  onReset: () => void;
}

function TextField({ field, value, onChange }: FieldProps) {
  return (
    <input
      type="text"
      className={styles.input}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
    />
  );
}

function TextareaField({ field, value, onChange }: FieldProps) {
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

function NumberField({ field, value, onChange }: FieldProps) {
  const min = field.type === "number" ? field.min : undefined;
  const max = field.type === "number" ? field.max : undefined;
  const step = field.type === "number" ? field.step : undefined;
  return (
    <input
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

function SliderField({ field, value, onChange }: FieldProps) {
  if (field.type !== "slider") return null;
  const numVal = (value as number) ?? field.min;
  return (
    <div className={styles.sliderWrap}>
      <input
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

function BooleanField({ value, onChange }: FieldProps) {
  return (
    <label className={styles.toggleLabel}>
      <input
        type="checkbox"
        className={styles.toggle}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{value ? "On" : "Off"}</span>
    </label>
  );
}

function SelectField({ field, value, onChange }: FieldProps) {
  if (field.type !== "select") return null;
  return (
    <select
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

export function DevPanelFieldRow({ field, value, isOverridden, onChange, onReset }: FieldProps) {
  const Component = FIELD_COMPONENTS[field.type];
  if (!Component) return null;

  return (
    <div className={`${styles.fieldRow} ${isOverridden ? styles.fieldOverridden : ""}`}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel}>{field.label}</label>
        {isOverridden && (
          <button type="button" className={styles.resetButton} onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      <Component
        field={field}
        value={value}
        isOverridden={isOverridden}
        onChange={onChange}
        onReset={onReset}
      />
    </div>
  );
}
