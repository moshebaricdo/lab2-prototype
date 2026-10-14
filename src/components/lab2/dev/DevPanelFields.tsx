import { useEffect, useRef, useState, type DragEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AiChatFileChip, Button, Dropdown, Slider, TextInput, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "../../ui/icons/FaIcon";
import { getFileChipIconProps } from "../../ui/fileChipMeta";
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
  const sensitive = field.type === "text" && field.sensitive;
  return (
    <TextInput
      id={controlId}
      type={sensitive ? "password" : "text"}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
      autoComplete={sensitive ? "off" : undefined}
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
  const options = field.options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  if (field.multiple) {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <Dropdown
        role="input"
        menuType="checklist"
        aria-label={field.label}
        value={selected}
        onChange={(raw) => {
          const next = Array.isArray(raw) ? raw.map(String) : [];
          onChange(next);
        }}
        options={options}
        placeholder="User chooses"
        size="small"
        color="secondary"
        width="full"
      />
    );
  }
  return (
    <Dropdown
      role="input"
      aria-label={field.label}
      value={String(value ?? "")}
      onChange={(raw) => {
        const next = Array.isArray(raw) ? raw[0] ?? "" : raw;
        onChange(field.valueType === "number" ? Number(next) : next);
      }}
      options={options}
      placeholder=""
      size="small"
      color="secondary"
      width="full"
    />
  );
}

function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function readUploadedFiles(
  fileList: ArrayLike<File>,
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

function uploadedFilesFrom(value: unknown): DevPanelUploadedFile[] {
  const files = (value as { files?: unknown } | undefined)?.files;
  return Array.isArray(files) ? (files as DevPanelUploadedFile[]) : [];
}

function removeUploadedFile(
  files: DevPanelUploadedFile[],
  path: string,
  onChange: (value: unknown) => void,
) {
  onChange({
    files: files.filter((item) => item.path !== path),
    uploadedAt: new Date().toISOString(),
    source: "remove",
  });
}

function FileUploadField({ field, value, controlId, onChange }: FieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);
  const [isReading, setIsReading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  if (field.type !== "file") return null;
  const uploadedFiles = uploadedFilesFrom(value);
  const directoryProps = field.directory
    ? ({ webkitdirectory: "", directory: "" } as Record<string, string>)
    : {};

  const ingestFiles = (files: ArrayLike<File> | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (list.some((file) => !fileMatchesAccept(file, field.accept))) {
      setUploadError(field.accept?.includes("csv")
        ? "Upload CSV files."
        : "That file type is not accepted.");
      return;
    }
    setIsReading(true);
    setUploadError(null);
    void readUploadedFiles(list, {
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
          console.error("[DevPanel] File upload failed", error);
          setUploadError(
            error instanceof Error
              ? error.message
              : "Unable to load those files.",
          );
        }
      })
      .catch((error) => {
        console.error("[DevPanel] Starter file read failed", error);
        setUploadError(error instanceof Error
          ? error.message
          : "Unable to read those files. Try uploading text files only.");
      })
      .finally(() => setIsReading(false));
  };

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragOver(true);
  };
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragOver(false);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragOver(false);
    ingestFiles(event.dataTransfer.files);
  };

  const fileInput = (
    <input
      ref={inputRef}
      id={controlId}
      type="file"
      accept={field.accept}
      multiple={field.multiple ?? field.directory ?? false}
      className={styles.fileUploadInput}
      tabIndex={-1}
      onChange={(event) => {
        ingestFiles(event.currentTarget.files);
        event.currentTarget.value = "";
      }}
      {...directoryProps}
    />
  );

  if (field.dropzone) {
    return (
      <div className={styles.fileDropzoneWrap}>
        <div
          className={`${styles.fileDropzone} ${isDragOver ? styles.fileDropzoneActive : ""}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {fileInput}
          <p className={styles.fileDropzoneHint}>Drag files here to upload</p>
          <div className={styles.fileDropzoneActions}>
            <Button
              variant="contained"
              color="secondary"
              size="extraSmall"
              startIconName="upload"
              onClick={() => inputRef.current?.click()}
            >
              {field.buttonLabel ?? "Browse"}
            </Button>
            {field.template ? (
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                startIconName="download"
                onClick={() => downloadTextFile(field.template!.fileName, field.template!.content)}
              >
                {field.template.label}
              </Button>
            ) : null}
          </div>
        </div>
        {isReading ? (
          <p className={styles.fileUploadSummary}>Loading files...</p>
        ) : null}
        {uploadError ? (
          <p className={styles.fileUploadError} role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>
    );
  }

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
      {fileInput}
      {isReading ? (
        <p className={styles.fileUploadSummary}>Loading starter files...</p>
      ) : null}
      {uploadError ? (
        <p className={styles.fileUploadError} role="alert">
          {uploadError}
        </p>
      ) : null}
      {uploadedFiles.length > 0 && !field.removable ? (
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
  const isDropzone = field.type === "file" && Boolean(field.dropzone);
  const isInlineControl =
    field.type === "boolean" ||
    field.type === "action" ||
    (field.type === "file" && !field.dropzone) ||
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
    <div className={`${styles.fieldRow} ${isInlineControl ? styles.fieldRowInline : ""} ${isDropzone ? styles.fieldRowDropzone : ""}`}>
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
                <FaIcon name="circle-info" family={isDropzone ? "solid" : undefined} size="xs" />
              </button>
            </Tooltip>
          ) : null}
          {field.storage === "session" ? (
            <span className={styles.storageBadge}>Session</span>
          ) : null}
        </div>
        <div className={styles.fieldActions}>
          {isOverridden && field.type !== "action" && !(field.type === "file" && field.removable) && (
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
      {field.type === "file" && field.removable ? (
        <FileUploadChips
          files={uploadedFilesFrom(value)}
          onRemove={(path) => removeUploadedFile(uploadedFilesFrom(value), path, onChange)}
        />
      ) : null}
    </div>
  );
}

function FileUploadChips({
  files,
  onRemove,
}: {
  files: DevPanelUploadedFile[];
  onRemove: (path: string) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className={styles.fileChipRow}>
      {files.map((file) => (
        <AiChatFileChip
          key={file.path}
          type="file"
          useCase="inputField"
          fileName={file.name}
          title={file.name}
          iconName={getFileChipIconProps(file.name).iconName}
          onRemove={() => onRemove(file.path)}
        />
      ))}
    </div>
  );
}
