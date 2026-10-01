import { Modal, Tag } from "@moshebari/cads-react";
import { columnById } from "../../../../lib/aiLab";
import type { AiLabDataset, AiLabDatasetStory } from "../../../../types/aiLab";
import { LABEL_TAG_COLOR } from "./PredictionStatement";
import styles from "./DatasetStoryModal.module.scss";

/**
 * A story for any sheet. Real stories come from the dataset; anything else
 * gets a plain reading of its shape so the UI never has an empty slot.
 */
export function storyFor(dataset: AiLabDataset): AiLabDatasetStory {
  if (dataset.story) return dataset.story;
  const label = columnById(dataset.columns, dataset.defaultLabelColumn);
  return {
    rowNoun: "row",
    whatIsARow: `Each row is one entry and the columns are what we know about it.`,
    source: dataset.description,
    question: label
      ? `From the other columns, what is this row's ${label.name}?`
      : "What can the other columns tell us about each row?",
  };
}

interface DatasetStoryProps {
  dataset: AiLabDataset;
  /** Row to show as the worked example. Default: the first row. */
  exampleRowIndex?: number;
  /** Hide the label value on the example (the classify intro asks for it). */
  hideLabel?: boolean;
}

/**
 * The story laid out: what one row is, where it came from, the question,
 * and one real row as a small card so "row" is a thing, not a word.
 */
export function DatasetStory({
  dataset,
  exampleRowIndex = 0,
  hideLabel = false,
}: DatasetStoryProps) {
  const story = storyFor(dataset);
  const label = columnById(dataset.columns, dataset.defaultLabelColumn);
  const row = dataset.rows[exampleRowIndex];
  const plural = `${dataset.rows.length} ${story.rowNoun}${dataset.rows.length === 1 ? "" : "s"}`;

  return (
    <div className={styles.story}>
      <p className={styles.meta}>
        {plural} · {dataset.columns.length} columns
      </p>

      <section className={styles.block}>
        <h3 className={styles.heading}>What is one row?</h3>
        <p className={styles.copy}>{story.whatIsARow}</p>
        {row ? (
          <div className={styles.example} aria-label={`Example ${story.rowNoun}`}>
            {dataset.columns.map((column) => {
              const isLabel = column.id === dataset.defaultLabelColumn;
              const value = row[column.id];
              return (
                <div
                  key={column.id}
                  className={`${styles.exampleRow} ${isLabel ? styles.exampleRowLabel : ""}`}
                >
                  <span className={styles.exampleKey}>{column.name}</span>
                  {isLabel && hideLabel ? (
                    <span className={styles.exampleHidden}>?</span>
                  ) : isLabel ? (
                    <Tag size="small" color={LABEL_TAG_COLOR} label={value} />
                  ) : (
                    <span className={styles.exampleValue}>{value}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>Where it came from</h3>
        <p className={styles.copy}>{story.source}</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.heading}>The question</h3>
        <p className={styles.copy}>{story.question}</p>
        {label ? (
          <div className={styles.hint}>
            The answer for every {story.rowNoun} is already in the{" "}
            <Tag size="small" color={LABEL_TAG_COLOR} label={label.name} /> column.
            A model learns the pattern so it can answer for a new {story.rowNoun}.
          </div>
        ) : null}
      </section>

      {story.whyItMatters ? (
        <section className={styles.block}>
          <h3 className={styles.heading}>Why it matters</h3>
          <p className={styles.copy}>{story.whyItMatters}</p>
        </section>
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

/** "About this data" — the story in a modal, from the chip or as the intro. */
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
      primaryActionLabel={primaryActionLabel ?? (required ? "Continue" : "Got it")}
      onPrimaryAction={onClose}
      onClose={required ? undefined : onClose}
    >
      <DatasetStory dataset={dataset} />
    </Modal>
  );
}
