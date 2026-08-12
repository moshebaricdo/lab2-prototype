import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Dropdown, Slider, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../ui/icons/FaIcon";
import type { DevPanelField, DevPanelUploadedFile } from "./types";
import styles from "./DevPanel.module.scss";

interface FieldProps {
  field: DevPanelField;
  value: unknown;
  isOverridden: boolean;
  controlId: string;
  onChange: (value: unknown) => void;
  onReset: () => void;
  contractValue?: unknown;
  isContractOverridden?: boolean;
  onContractChange?: (value: unknown) => void;
  onContractReset?: () => void;
}

function TextField({ field, value, controlId, onChange }: FieldProps) {
  return (
    <TextInput
      id={controlId}
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
      size="small"
      color="secondary"
    />
  );
}

function TextareaField({ field, value, controlId, onChange }: FieldProps) {
  const rows = field.type === "textarea" ? (field.rows ?? 3) : 3;
  const useMarkdownPreview = field.type === "textarea"
    ? (field.markdownPreview ?? true)
    : true;
  const [previewing, setPreviewing] = useState(false);
  const externalText = (value as string) ?? "";
  const [draftText, setDraftText] = useState(externalText);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (!isEditingRef.current) {
      setDraftText(externalText);
    }
  }, [externalText]);

  const handleTextChange = (nextText: string) => {
    setDraftText(nextText);
    onChange(nextText);
  };

  if (!useMarkdownPreview) {
    return (
      <TextInput
        id={controlId}
        multiline
        value={draftText}
        onBlur={() => {
          isEditingRef.current = false;
          setDraftText(externalText);
        }}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => {
          isEditingRef.current = true;
        }}
        placeholder={field.label}
        rows={rows}
        size="small"
        color="secondary"
      />
    );
  }

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
          {draftText ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftText}</ReactMarkdown>
          ) : (
            <span className={styles.previewEmpty}>Nothing to preview</span>
          )}
        </div>
      ) : (
        <TextInput
          id={controlId}
          multiline
          className={styles.textareaBare}
          value={draftText}
          onBlur={() => {
            isEditingRef.current = false;
            setDraftText(externalText);
          }}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => {
            isEditingRef.current = true;
          }}
          placeholder={field.label}
          rows={rows}
          size="small"
          color="secondary"
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
    <TextInput
      id={controlId}
      type="number"
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      style={{ width: 72 }}
      size="small"
      color="secondary"
    />
  );
}

function SliderField({ field, value, controlId, onChange }: FieldProps) {
  if (field.type !== "slider") return null;
  const numVal = (value as number) ?? field.min;
  return (
    <Slider
      id={controlId}
      value={numVal}
      min={field.min}
      max={field.max}
      step={field.step ?? 0.01}
      displayValue={String(numVal)}
      showDisplayValue
      showHelper={false}
      fullWidth
      size="small"
      aria-label={field.label}
      onChange={(_event, next) => {
        onChange(Array.isArray(next) ? next[0] : next);
      }}
    />
  );
}

function BooleanField({ value, controlId, onChange }: FieldProps) {
  return (
    <input
      id={controlId}
      type="checkbox"
      className={styles.toggle}
      checked={Boolean(value)}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function SelectField({ field, value, onChange }: FieldProps) {
  if (field.type !== "select") return null;
  return (
    <Dropdown
      role="input"
      aria-label={field.label}
      value={String(value ?? "")}
      onChange={(raw) => {
        const next = Array.isArray(raw) ? raw[0] ?? "" : raw;
        onChange(field.valueType === "number" ? Number(next) : next);
      }}
      options={field.options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      placeholder=""
      size="small"
      color="secondary"
      width="full"
    />
  );
}

async function readUploadedFiles(
  fileList: FileList,
  options: { maxFiles?: number; maxTotalSizeBytes?: number } = {},
): Promise<DevPanelUploadedFile[]> {
  const files = Array.from(fileList);
  if (options.maxFiles && files.length > options.maxFiles) {
    throw new Error(`Upload up to ${options.maxFiles} files.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (options.maxTotalSizeBytes && totalBytes > options.maxTotalSizeBytes) {
    throw new Error("Uploaded files are too large.");
  }

  return Promise.all(files.map(async (file) => ({
    name: file.name,
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    type: file.type,
    size: file.size,
    content: await file.text(),
  })));
}

function FileUploadField({ field, value, controlId, onChange }: FieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  if (field.type !== "file") return null;
  const uploadedFiles = Array.isArray((value as { files?: unknown[] } | undefined)?.files)
    ? ((value as { files: DevPanelUploadedFile[] }).files)
    : [];
  const directoryProps = field.directory
    ? ({ webkitdirectory: "", directory: "" } as Record<string, string>)
    : {};

  return (
    <div className={styles.fileUploadWrap}>
      <Button
        variant="outlined"
        color="secondary"
        size="extraSmall"
        iconOnly
        startIconName="upload"
        className={styles.fileUploadButton}
        onClick={() => inputRef.current?.click()}
        aria-label={field.buttonLabel ?? field.label}
      />
      <input
        ref={inputRef}
        id={controlId}
        type="file"
        accept={field.accept}
        multiple={field.multiple ?? field.directory ?? false}
        className={styles.fileUploadInput}
        tabIndex={-1}
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (!files || files.length === 0) return;
          setIsReading(true);
          setUploadError(null);
          void readUploadedFiles(files, {
            maxFiles: field.maxFiles,
            maxTotalSizeBytes: field.maxTotalSizeBytes,
          })
            .then((uploaded) => {
              try {
                onChange({
                  files: uploaded,
                  uploadedAt: new Date().toISOString(),
                });
              } catch (error) {
                console.error("[DevPanel] Starter file upload failed", error);
                setUploadError("Unable to load those starter files. Try a smaller text-only project.");
              }
            })
            .catch((error) => {
              console.error("[DevPanel] Starter file read failed", error);
              setUploadError(error instanceof Error
                ? error.message
                : "Unable to read those files. Try uploading text files only.");
            })
            .finally(() => setIsReading(false));
          event.currentTarget.value = "";
        }}
        {...directoryProps}
      />
      {isReading ? (
        <p className={styles.fileUploadSummary}>Loading starter files...</p>
      ) : null}
      {uploadError ? (
        <p className={styles.fileUploadError} role="alert">
          {uploadError}
        </p>
      ) : null}
      {uploadedFiles.length > 0 ? (
        <p className={styles.fileUploadSummary}>
          Loaded {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"}:{" "}
          {uploadedFiles.slice(0, 5).map((file) => file.path).join(", ")}
          {uploadedFiles.length > 5 ? `, and ${uploadedFiles.length - 5} more` : ""}
        </p>
      ) : null}
    </div>
  );
}

function ActionField({ field }: FieldProps) {
  if (field.type !== "action") return null;
  return (
    <Button
      variant={field.variant ?? "outlined"}
      color={field.color ?? "secondary"}
      size={field.size ?? "extraSmall"}
      iconOnly
      startIconName={field.iconName}
      disabled={field.disabled}
      className={styles.actionButton}
      onClick={field.onAction}
      aria-label={field.buttonLabel ?? field.label}
    />
  );
}

const FIELD_COMPONENTS: Record<string, React.ComponentType<FieldProps>> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  slider: SliderField,
  boolean: BooleanField,
  select: SelectField,
  file: FileUploadField,
  action: ActionField,
};

type FieldRowProps = Omit<FieldProps, "controlId">;

export function DevPanelFieldRow({
  field,
  value,
  isOverridden,
  contractValue,
  isContractOverridden = false,
  onChange,
  onReset,
  onContractChange,
  onContractReset,
}: FieldRowProps) {
  const Component = FIELD_COMPONENTS[field.type];
  const controlId = `dev-panel-${field.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const contractId = field.type === "boolean" && field.contract
    ? `dev-panel-${field.contract.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`
    : undefined;
  const hasContractEditor = field.type === "boolean" && field.contract && Boolean(value);
  const contractText = typeof contractValue === "string" ? contractValue : "";
  const [isContractExpanded, setIsContractExpanded] = useState(() => Boolean(contractText.trim()));
  const showContractEditor = hasContractEditor && (isContractExpanded || Boolean(contractText.trim()));
  if (!Component) return null;
  const isInlineControl =
    field.type === "boolean" ||
    field.type === "action" ||
    field.type === "file" ||
    field.controlLayout === "inline";
  const renderedControl = (
    <Component
      field={field}
      value={value}
      isOverridden={isOverridden}
      controlId={controlId}
      onChange={onChange}
      onReset={onReset}
      contractValue={contractValue}
      isContractOverridden={isContractOverridden}
      onContractChange={onContractChange}
      onContractReset={onContractReset}
    />
  );
  return (
    <div className={`${styles.fieldRow} ${isInlineControl ? styles.fieldRowInline : ""}`}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldTitle}>
          <label className={styles.fieldLabel} htmlFor={controlId}>
            {field.label}
          </label>
          {field.description ? (
            <Tooltip title={field.description} placement="top">
              <button
                type="button"
                className={styles.infoButton}
                aria-label={`${field.label}: ${field.description}`}
              >
                <FaIcon name="circle-info" size="xs" />
              </button>
            </Tooltip>
          ) : null}
          {field.storage === "session" ? (
            <span className={styles.storageBadge}>Session</span>
          ) : null}
        </div>
        <div className={styles.fieldActions}>
          {isOverridden && field.type !== "action" && (
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="rotate-left"
              className={styles.resetButton}
              onClick={onReset}
              aria-label={`Reset ${field.label}`}
            />
          )}
          {hasContractEditor ? (
            <Tooltip
              title={`${showContractEditor ? "Hide" : "View/add to"} ${field.label} contract`}
              placement="top"
            >
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                startIconName="pencil"
                className={styles.contractToggleButton}
                aria-label={`${showContractEditor ? "Hide" : "View/add to"} ${field.label} contract`}
                aria-controls={contractId}
                aria-expanded={showContractEditor}
                onClick={() => setIsContractExpanded((current) => !current)}
              />
            </Tooltip>
          ) : null}
          {isInlineControl ? renderedControl : null}
        </div>
      </div>
      {showContractEditor ? (
        <div className={styles.contractInline}>
          <div className={styles.contractEditor}>
            {isContractOverridden ? (
              <div className={styles.contractEditorHeader}>
                <Button
                  variant="text"
                  color="tertiary"
                  size="extraSmall"
                  iconOnly
                  startIconName="rotate-left"
                  className={styles.resetButton}
                  onClick={onContractReset}
                  aria-label={`Reset ${field.label} contract`}
                />
              </div>
            ) : null}
            <TextInput
              id={contractId}
              multiline
              value={contractText}
              onChange={(event) => onContractChange?.(event.target.value)}
              placeholder={field.contract?.placeholder ?? "Add to contract (optional). Write additional instructions in markdown."}
              rows={field.contract?.rows ?? 4}
              size="small"
              color="secondary"
            />
          </div>
        </div>
      ) : null}
      {isInlineControl ? null : renderedControl}
    </div>
  );
}
