import { useEffect, useRef, useState, type DragEvent } from "react";
import { Alert, Button, Modal, Radio } from "@moshebari/cads-react";
import type { IncomingCsv, MergeUploadedSheetsResult } from "../../../../lib/aiLab";
import type { AiLabDataset } from "../../../../types/aiLab";
import styles from "./DatasetPickerModal.module.scss";

export interface DatasetPickerUpload {
  dataset: AiLabDataset;
  fileName: string;
}

export interface DatasetTemplateFile {
  fileName: string;
  content: string;
  label: string;
}

export interface DatasetPickerController {
  presets: AiLabDataset[];
  uploads: DatasetPickerUpload[];
  template: DatasetTemplateFile;
  onUpload: (files: IncomingCsv[]) => MergeUploadedSheetsResult;
  onRemoveUpload: (datasetId: string) => void;
  onApply: (datasetId: string) => void;
}

interface DatasetPickerModalProps extends DatasetPickerController {
  open: boolean;
  selectedId?: string;
  hasModel: boolean;
  onClose: () => void;
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

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

async function readCsvFiles(list: ArrayLike<File>): Promise<IncomingCsv[]> {
  const files = Array.from(list);
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      content: await file.text(),
    })),
  );
}

function sheetMeta(dataset: AiLabDataset): string {
  const rows = `${dataset.rows.length} row${dataset.rows.length === 1 ? "" : "s"}`;
  const columns = `${dataset.columns.length} column${dataset.columns.length === 1 ? "" : "s"}`;
  return `${rows} · ${columns}`;
}

function DatasetChoice({
  dataset,
  name,
  selected,
  meta,
  detail,
  onSelect,
  onRemove,
  removeLabel,
}: {
  dataset: AiLabDataset;
  name: string;
  selected: boolean;
  meta: string;
  detail?: string;
  onSelect: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <div className={`${styles.choice} ${selected ? styles.choiceSelected : ""}`}>
      <label className={styles.choiceMain}>
        <Radio
          name={name}
          value={dataset.id}
          size="small"
          checked={selected}
          onChange={onSelect}
        />
        <span className={styles.choiceCopy}>
          <span className={styles.choiceTitle}>{dataset.name}</span>
          <span className={styles.choiceMeta}>{meta}</span>
          {detail ? <span className={styles.choiceDetail}>{detail}</span> : null}
        </span>
      </label>
      {onRemove ? (
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="trash"
          aria-label={removeLabel ?? `Remove ${dataset.name}`}
          onClick={onRemove}
        />
      ) : null}
    </div>
  );
}

export function DatasetPickerModal({
  open,
  selectedId,
  hasModel,
  presets,
  uploads,
  template,
  onUpload,
  onRemoveUpload,
  onApply,
  onClose,
}: DatasetPickerModalProps) {
  const [pendingId, setPendingId] = useState(selectedId);
  const [error, setError] = useState<string | undefined>();
  const [isReading, setIsReading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const readingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setPendingId(selectedId);
    setError(undefined);
    setIsDragOver(false);
    dragDepth.current = 0;
  }, [open, selectedId]);

  const apply = () => {
    if (!pendingId) return;
    onApply(pendingId);
    onClose();
  };

  const ingestFiles = (fileList: ArrayLike<File> | null) => {
    if (!fileList || fileList.length === 0 || readingRef.current) return;
    const files = Array.from(fileList);
    if (files.some((file) => !isCsvFile(file))) {
      setError("Upload a CSV file. Download the template if you need the column layout.");
      return;
    }
    readingRef.current = true;
    setIsReading(true);
    setError(undefined);
    void readCsvFiles(files)
      .then((incoming) => {
        let result: MergeUploadedSheetsResult;
        try {
          result = onUpload(incoming);
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "This tab cannot store that file.",
          );
          return;
        }
        if (result.focusId) setPendingId(result.focusId);
        if (result.error) setError(result.error);
      })
      .catch(() => {
        setError("That file could not be read. Try the CSV again.");
      })
      .finally(() => {
        readingRef.current = false;
        setIsReading(false);
      });
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

  return (
    <Modal
      open={open}
      title="Choose a dataset"
      maxWidth={720}
      isDismissable
      hasSecondaryAction
      primaryActionLabel={pendingId ? "Use this dataset" : "Select a dataset"}
      secondaryActionLabel="Cancel"
      onPrimaryAction={apply}
      onSecondaryAction={onClose}
      onClose={onClose}
    >
      <div className={styles.body}>
        <p className={styles.lead}>
          Pick a sample dataset, or upload a CSV of your own. The first row
          should be the column names, and the last column is what the model
          predicts.
        </p>
        {hasModel ? (
          <p className={styles.note}>Switching datasets clears the model you trained.</p>
        ) : null}
        <div className={styles.columns}>
          <fieldset className={styles.pane} aria-label="Sample datasets">
            <legend className={styles.legend}>Sample datasets</legend>
            <div className={styles.list}>
              {presets.map((dataset) => (
                <DatasetChoice
                  key={dataset.id}
                  dataset={dataset}
                  name="ai-lab-dataset-source"
                  selected={pendingId === dataset.id}
                  meta={sheetMeta(dataset)}
                  detail={
                    dataset.description.startsWith("Imported CSV")
                      ? undefined
                      : dataset.description
                  }
                  onSelect={() => setPendingId(dataset.id)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className={`${styles.pane} ${styles.uploadPane}`} aria-label="Upload a CSV">
            <legend className={styles.legend}>Upload a CSV</legend>
            <div
              className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""}`}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                className={styles.fileInput}
                type="file"
                accept=".csv,text/csv"
                multiple
                tabIndex={-1}
                aria-label="Upload CSV files"
                onChange={(event) => {
                  ingestFiles(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
              <p className={styles.dropHint}>Drag a CSV here</p>
              <div className={styles.dropActions}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="extraSmall"
                  startIconName="upload"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="extraSmall"
                  startIconName="download"
                  onClick={() => downloadTextFile(template.fileName, template.content)}
                >
                  {template.label}
                </Button>
              </div>
            </div>
            {isReading ? <p className={styles.reading}>Reading file…</p> : null}
            {error ? (
              <Alert sentiment="error" size="small">
                {error}
              </Alert>
            ) : null}
            {uploads.length > 0 ? (
              <div className={styles.uploads}>
                <p className={styles.sublegend}>Your files</p>
                <div className={styles.list}>
                  {uploads.map(({ dataset, fileName }) => (
                    <DatasetChoice
                      key={dataset.id}
                      dataset={dataset}
                      name="ai-lab-dataset-source"
                      selected={pendingId === dataset.id}
                      meta={`${fileName} · ${sheetMeta(dataset)}`}
                      onSelect={() => setPendingId(dataset.id)}
                      onRemove={() => {
                        onRemoveUpload(dataset.id);
                        if (pendingId === dataset.id) setPendingId(undefined);
                      }}
                      removeLabel={`Remove ${fileName}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </fieldset>
        </div>
      </div>
    </Modal>
  );
}
