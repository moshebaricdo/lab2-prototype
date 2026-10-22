import { useEffect, useRef, useState, type DragEvent } from "react";
import { Alert, Button } from "@moshebari/cads-react";
import type { IncomingCsv, MergeUploadedSheetsResult } from "../../../../lib/aiLab";
import type { AiLabDataset } from "../../../../types/aiLab";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { PanelHeader } from "../../../ui/PanelHeader";
import type { DatasetPickerController } from "./DatasetPickerModal";
import { SetupModal } from "./SetupModal";
import styles from "./DatasetStartEmptyState.module.scss";

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

async function readCsvFiles(list: ArrayLike<File>): Promise<IncomingCsv[]> {
  return Promise.all(
    Array.from(list).map(async (file) => ({
      name: file.name,
      content: await file.text(),
    })),
  );
}

/** CSVs without an authored description get "Imported CSV · N rows …". */
function authoredDescription(dataset: AiLabDataset): string | undefined {
  return dataset.description.startsWith("Imported CSV") ? undefined : dataset.description;
}

function DatasetCover({ dataset }: { dataset: AiLabDataset }) {
  if (dataset.cover) {
    return <img className={styles.cover} src={dataset.cover} alt="" />;
  }
  return (
    <span className={styles.placeholder} aria-hidden>
      <FaIcon name="table" size="inherit" />
    </span>
  );
}

function DatasetTile({
  dataset,
  selected,
  onSelect,
}: {
  dataset: AiLabDataset;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
      onClick={onSelect}
    >
      <span className={styles.media}>
        <DatasetCover dataset={dataset} />
        {selected ? <span className={styles.selectedWash} aria-hidden /> : null}
        {selected ? (
          <span className={styles.selectedMark} aria-hidden>
            <FaIcon name="check" size="inherit" />
          </span>
        ) : null}
      </span>
      <span className={styles.caption}>
        <span className={styles.captionName}>{dataset.name}</span>
        <span className={styles.captionMeta}>{`${(dataset.rowCount ?? dataset.rows.length).toLocaleString()} rows`}</span>
      </span>
    </button>
  );
}

function sourceHref(source: string): string | undefined {
  const explicit = source.match(/https?:\/\/\S+/);
  if (explicit) return explicit[0].replace(/[),.;]+$/, "");
  const parenthesized = source.match(
    /\(([a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)]*)?)\)/i,
  );
  if (parenthesized?.[1]) {
    return `https://${parenthesized[1].replace(/[),.;]+$/, "")}`;
  }
  return undefined;
}

function UploadDetails({ dataset, fileName }: { dataset: AiLabDataset; fileName: string }) {
  const sample = dataset.rows[0];
  return (
    <div className={styles.detailsStack}>
      <div className={styles.details}>
        <div className={styles.detailBlock}>
          <h3 className={styles.uploadTitle}>{fileName}</h3>
        </div>
        <div className={styles.statRow}>
          <div className={`${styles.stat} ${styles.statTight}`}>
            <p className={styles.sectionLabel}>Rows</p>
            <p className={styles.statValue}>{dataset.rows.length}</p>
          </div>
          <div className={`${styles.stat} ${styles.statTight}`}>
            <p className={styles.sectionLabel}>Columns</p>
            <p className={styles.statValue}>{dataset.columns.length}</p>
          </div>
        </div>
      </div>
      {sample ? (
        <div className={styles.sampleCard}>
          <div className={styles.sampleHeader}>Sample row</div>
          {dataset.columns.map((column) => (
            <div key={column.id} className={styles.sampleRow}>
              <span className={styles.sampleLabel}>{column.name}</span>
              <span className={styles.sampleValue}>{sample[column.id]}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DatasetDetails({ dataset, fileName }: { dataset: AiLabDataset; fileName?: string }) {
  if (fileName) return <UploadDetails dataset={dataset} fileName={fileName} />;

  const card = dataset.card;
  const description = card?.description ?? dataset.story?.whatIsARow ?? authoredDescription(dataset);
  const potentialUses = card?.potentialUses ?? dataset.story?.question;
  const potentialMisuses = card?.potentialMisuses ?? dataset.story?.whyItMatters;
  const source = card?.source ?? dataset.story?.source;
  const href = source ? sourceHref(source) : undefined;
  const sections = [
    potentialUses ? { label: "Potential Uses", value: potentialUses } : undefined,
    potentialMisuses
      ? { label: "Potential Misuses", value: potentialMisuses }
      : undefined,
  ].filter((section): section is { label: string; value: string } => Boolean(section));

  return (
    <div className={styles.details}>
      <div className={styles.detailBlock}>
        <h3 className={styles.detailsTitle}>{dataset.name}</h3>
        {description ? <p className={styles.detailsLead}>{description}</p> : null}
      </div>
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <p className={styles.sectionLabel}>Rows</p>
          <p className={styles.statValue}>{(dataset.rowCount ?? dataset.rows.length).toLocaleString()}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.sectionLabel}>Columns</p>
          <p className={styles.statValue}>{dataset.columnCount ?? dataset.columns.length}</p>
        </div>
        {card?.lastUpdated ? (
          <div className={styles.stat}>
            <p className={styles.sectionLabel}>Last Updated</p>
            <p className={styles.statValue}>{card.lastUpdated}</p>
          </div>
        ) : null}
      </div>
      {sections.map((section) => (
        <div key={section.label} className={styles.detailBlock}>
          <p className={styles.sectionLabel}>{section.label}</p>
          <p className={styles.sectionCopy}>{section.value}</p>
        </div>
      ))}
      {source ? (
        <div className={styles.detailBlock}>
          <p className={styles.sectionLabel}>Source</p>
          {href ? (
            <a className={styles.sourceLink} href={href} target="_blank" rel="noreferrer">
              {source}
            </a>
          ) : (
            <p className={styles.sectionCopy}>{source}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DatasetStartEmptyState({
  presets,
  uploads,
  algorithmLock,
  onUpload,
  onRemoveUpload,
  onApply,
}: DatasetPickerController) {
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [algorithmModalOpen, setAlgorithmModalOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isReading, setIsReading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const readingRef = useRef(false);

  const pendingUpload = uploads.find((upload) => upload.dataset.id === pendingId);
  const pending =
    pendingUpload?.dataset ?? presets.find((dataset) => dataset.id === pendingId);

  useEffect(() => {
    if (!pendingId) return;
    const stillThere =
      presets.some((dataset) => dataset.id === pendingId) ||
      uploads.some((upload) => upload.dataset.id === pendingId);
    if (!stillThere) {
      setPendingId(undefined);
      setAlgorithmModalOpen(false);
    }
  }, [pendingId, presets, uploads]);

  const select = (id: string) => {
    setPendingId(id);
    setError(undefined);
  };

  const ingestFiles = (fileList: ArrayLike<File> | null) => {
    if (!fileList || fileList.length === 0 || readingRef.current) return;
    const files = Array.from(fileList);
    if (files.some((file) => !isCsvFile(file))) {
      setError("Upload a CSV file.");
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

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    ingestFiles(event.dataTransfer.files);
  };

  return (
    <div className={styles.root}>
      <section
        className={styles.chooser}
        aria-label="Choose a dataset"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setIsDragOver(false);
        }}
        onDrop={onDrop}
      >
        <PanelHeader label="CHOOSE A DATASET" />
        <div className={styles.gridArea}>
          <div className={`${styles.gridScroll} ${isDragOver ? styles.gridDimmed : ""}`}>
            {error ? (
              <Alert sentiment="error" size="small">
                {error}
              </Alert>
            ) : null}
            <div className={styles.grid} role="radiogroup" aria-label="Datasets">
              {presets.map((dataset) => (
                <DatasetTile
                  key={dataset.id}
                  dataset={dataset}
                  selected={pendingId === dataset.id}
                  onSelect={() => select(dataset.id)}
                />
              ))}
            </div>
          </div>
          {isDragOver ? (
            <div className={styles.dropOverlay} aria-hidden>
              <span className={styles.dropOverlayIcon}>
                <FaIcon name="file-arrow-up" size="inherit" />
              </span>
              <span className={styles.dropOverlayCopy}>
                <span className={styles.dropOverlayTitle}>Drop to upload</span>
                <span className={styles.dropOverlayHint}>CSV files only</span>
              </span>
            </div>
          ) : null}
        </div>
        <div className={styles.footer}>
          <div className={styles.footerStart}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIconName="upload"
              onClick={() => inputRef.current?.click()}
              disabled={isReading}
            >
              {isReading ? "Reading file…" : "Upload CSV"}
            </Button>
            {uploads.length > 0 ? <span className={styles.footerDivider} aria-hidden /> : null}
            {uploads.map(({ dataset, fileName }) => (
              <div
                key={dataset.id}
                className={`${styles.uploadChip} ${
                  pendingId === dataset.id ? styles.uploadChipSelected : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.uploadChipSelect}
                  aria-pressed={pendingId === dataset.id}
                  onClick={() => select(dataset.id)}
                >
                  <span className={styles.uploadChipIcon}>
                    <FaIcon name="file-csv" size="inherit" />
                  </span>
                  <span className={styles.uploadChipName}>{fileName}</span>
                </button>
                <button
                  type="button"
                  className={styles.uploadChipClose}
                  aria-label={`Remove ${fileName}`}
                  onClick={() => onRemoveUpload(dataset.id)}
                >
                  <FaIcon name="xmark" size="inherit" />
                </button>
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className={styles.fileInput}
            tabIndex={-1}
            aria-label="Upload CSV files"
            onChange={(event) => {
              ingestFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </section>

      <aside className={styles.detailsRail} aria-label="About this data">
        <PanelHeader label="ABOUT THIS DATA" />
        <div className={styles.detailsScroll}>
          {pending ? (
            <DatasetDetails dataset={pending} fileName={pendingUpload?.fileName} />
          ) : (
            <div className={styles.detailsEmpty}>
              <span className={styles.detailsEmptyIcon} aria-hidden>
                <FaIcon name="table" size="inherit" />
              </span>
              <span className={styles.detailsEmptyCopy}>
                <span className={styles.detailsEmptyTitle}>No dataset selected</span>
                <span className={styles.detailsEmptyHint}>
                  Select a dataset to see its details here.
                </span>
              </span>
            </div>
          )}
        </div>
        <div className={`${styles.footer} ${styles.railFooter}`}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={!pending}
            endIconName="arrow-right"
            onClick={() => {
              if (!pending) return;
              if (algorithmLock) {
                onApply(pending.id, algorithmLock);
                return;
              }
              setAlgorithmModalOpen(true);
            }}
          >
            Use this dataset
          </Button>
        </div>
      </aside>

      {!algorithmLock ? (
        <SetupModal
          open={algorithmModalOpen && Boolean(pending)}
          dataset={pending}
          primaryActionLabel="Continue"
          onClose={() => setAlgorithmModalOpen(false)}
          onSelectAlgorithm={(algorithm) => {
            if (!pending) return;
            setAlgorithmModalOpen(false);
            onApply(pending.id, algorithm);
          }}
        />
      ) : null}
    </div>
  );
}
