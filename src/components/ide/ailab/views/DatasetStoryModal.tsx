import { Modal } from "@moshebari/cads-react";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabDataset, AiLabDatasetStory } from "../../../../types/aiLab";
import styles from "./DatasetStoryModal.module.scss";

/** CSVs without an authored description get "Imported CSV · N rows …". */
function authoredDescription(dataset: AiLabDataset): string | undefined {
  return dataset.description.startsWith("Imported CSV")
    ? undefined
    : dataset.description;
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

/**
 * A story for any sheet. Real stories come from the dataset; anything else
 * gets a plain reading of its shape so the UI never has an empty slot.
 */
export function storyFor(dataset: AiLabDataset): AiLabDatasetStory {
  if (dataset.story) return dataset.story;
  const card = dataset.card;
  const label = columnById(dataset.columns, dataset.defaultLabelColumn);
  return {
    rowNoun: "row",
    whatIsARow:
      card?.description ??
      `Each row is one entry and the columns are what we know about it.`,
    source: card?.source ?? dataset.description,
    question:
      card?.potentialUses ??
      (label
        ? `From the other columns, what is this row's ${label.name}?`
        : "What can the other columns tell us about each row?"),
    whyItMatters: card?.potentialMisuses,
  };
}

interface DatasetStoryProps {
  dataset: AiLabDataset;
  /** Row to show as the worked example when the sheet has no authored card. */
  exampleRowIndex?: number;
  /** Hide the label value on the sample row (the classify intro asks for it). */
  hideLabel?: boolean;
}

/**
 * Dataset details shared with the dataset chooser info panel:
 * description, row/column/updated stats, potential uses, potential misuses,
 * and source (or a sample row card for uploaded CSVs without authored metadata).
 */
export function DatasetStory({
  dataset,
  exampleRowIndex = 0,
  hideLabel = false,
}: DatasetStoryProps) {
  const card = dataset.card;
  const description =
    card?.description ??
    dataset.story?.whatIsARow ??
    authoredDescription(dataset);
  const potentialUses = card?.potentialUses ?? dataset.story?.question;
  const potentialMisuses = card?.potentialMisuses ?? dataset.story?.whyItMatters;
  const source = card?.source ?? dataset.story?.source;
  const href = source ? sourceHref(source) : undefined;
  const sections = [
    potentialUses
      ? { label: "Potential Uses", value: potentialUses }
      : undefined,
    potentialMisuses
      ? { label: "Potential Misuses", value: potentialMisuses }
      : undefined,
  ].filter((section): section is { label: string; value: string } =>
    Boolean(section),
  );
  const hasAuthoredDetails = Boolean(
    description || sections.length > 0 || source || card?.lastUpdated,
  );
  const sampleRow = hasAuthoredDetails
    ? undefined
    : (dataset.rows[exampleRowIndex] ?? dataset.rows[0]);
  const rowCount = dataset.rowCount ?? dataset.rows.length;
  const columnCount = dataset.columnCount ?? dataset.columns.length;

  return (
    <div className={styles.root}>
      <div className={styles.details}>
        {description ? (
          <div className={styles.detailBlock}>
            <p className={styles.detailsLead}>{description}</p>
          </div>
        ) : null}
        <div className={styles.statRow}>
          <div className={styles.stat}>
            <p className={styles.sectionLabel}>Rows</p>
            <p className={styles.statValue}>{rowCount.toLocaleString()}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.sectionLabel}>Columns</p>
            <p className={styles.statValue}>{columnCount}</p>
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
              <a
                className={styles.sourceLink}
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {source}
              </a>
            ) : (
              <p className={styles.sectionCopy}>{source}</p>
            )}
          </div>
        ) : null}
      </div>

      {!hasAuthoredDetails && sampleRow ? (
        <div className={styles.sampleSection}>
          <div className={styles.sampleCard} aria-label="Sample row">
            <div className={styles.sampleHeader}>Sample row</div>
            {dataset.columns.map((column) => {
              const isLabel = column.id === dataset.defaultLabelColumn;
              return (
                <div key={column.id} className={styles.sampleRow}>
                  <span className={styles.sampleLabel}>{column.name}</span>
                  {isLabel && hideLabel ? (
                    <span className={styles.sampleHidden}>?</span>
                  ) : (
                    <span className={styles.sampleValue}>
                      {formatCell(sampleRow[column.id])}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface DatasetStoryModalProps {
  dataset: AiLabDataset;
  open: boolean;
  /** Story-first intro: not dismissable, one Continue button. */
  required?: boolean;
  primaryActionLabel?: string;
  onClose: () => void;
}

/** "About this data" — dataset details in a modal, from the header button or as the intro. */
export function DatasetStoryModal({
  dataset,
  open,
  required = false,
  primaryActionLabel,
  onClose,
}: DatasetStoryModalProps) {
  return (
    <Modal
      open={open}
      title={dataset.name}
      maxWidth={520}
      isDismissable={!required}
      hasSecondaryAction={false}
      primaryActionLabel={primaryActionLabel ?? (required ? "Continue" : "Done")}
      onPrimaryAction={onClose}
      onClose={required ? undefined : onClose}
    >
      <DatasetStory dataset={dataset} />
    </Modal>
  );
}
