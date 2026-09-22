import { Tag } from "@moshebari/cads-react";
import { columnById } from "../../../../lib/aiLab";
import type { AiLabColumn } from "../../../../types/aiLab";
import styles from "./PredictionStatement.module.scss";

/** Label = brand (purple), features = success (green). Every surface that
 *  paints the statement — Tags, sheet columns, cards, the training modal —
 *  uses this same pairing. */
export const LABEL_TAG_COLOR = "brand" as const;
export const FEATURE_TAG_COLOR = "success" as const;

interface PredictionStatementProps {
  columns: AiLabColumn[];
  labelColumn: string | undefined;
  features: string[];
  /** `small` fits the 300px Train rail wrap; `large` opens the gap for the modal. */
  size?: "small" | "large";
  className?: string;
}

/**
 * The sentence the model is built from — "Predict **Type** based on
 * **Has feathers**, **Breathes with lungs**" — as wrapping Tags. Missing
 * parts read as muted placeholders so the sentence fills in as the
 * student picks columns.
 */
export function PredictionStatement({
  columns,
  labelColumn,
  features,
  size = "small",
  className,
}: PredictionStatementProps) {
  const labelName = labelColumn
    ? columnById(columns, labelColumn)?.name ?? labelColumn
    : undefined;
  const featureNames = features.map(
    (feature) => columnById(columns, feature)?.name ?? feature,
  );
  const plain = [
    "Predict",
    labelName ?? "…",
    "based on",
    featureNames.length > 0 ? featureNames.join(", ") : "…",
  ].join(" ");

  return (
    <p
      className={[
        styles.root,
        size === "large" ? styles.rootLarge : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={plain}
    >
      <span className={styles.word}>Predict</span>
      {labelName ? (
        <Tag
          size="large"
          color={LABEL_TAG_COLOR}
          label={labelName}
          className={styles.tag}
        />
      ) : (
        <Tag
          size="large"
          color={LABEL_TAG_COLOR}
          label="a column"
          className={`${styles.tag} ${styles.placeholder}`}
        />
      )}
      <span className={styles.word}>based on</span>
      {featureNames.length > 0 ? (
        featureNames.map((name) => (
          <Tag
            key={name}
            size="large"
            color={FEATURE_TAG_COLOR}
            label={name}
            className={styles.tag}
          />
        ))
      ) : (
        <Tag
          size="large"
          color={FEATURE_TAG_COLOR}
          label="one or more columns"
          className={`${styles.tag} ${styles.placeholder}`}
        />
      )}
    </p>
  );
}
