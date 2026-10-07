import { useLayoutEffect, useRef, useState } from "react";
import { Tag, Tooltip } from "@moshebari/cads-react";
import { columnById } from "../../../../lib/aiLab";
import type { AiLabColumn } from "../../../../types/aiLab";
import styles from "./PredictionStatement.module.scss";

/** Label = accent pink, features = info blue. Every surface that paints the
 *  statement — Tags, sheet columns, cards, the training modal — uses this
 *  same pairing. */
export const LABEL_TAG_COLOR = "pink" as const;
export const FEATURE_TAG_COLOR = "info" as const;

type TagSize = "small" | "medium" | "large";

interface PredictionStatementProps {
  columns: AiLabColumn[];
  labelColumn: string | undefined;
  features: string[];
  /** `small` fits the 280px Train rail; `large` opens the gap for the modal. */
  size?: "small" | "large";
  /**
   * Keep the sentence on one line: feature Tags that don't fit fold into a
   * trailing "+N" Tag (with the hidden names in its tooltip), like the
   * Testing strip. Off by default so the Train rail still wraps.
   */
  fit?: boolean;
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
  fit = false,
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

  const tagSize = size === "large" ? "medium" : "small";
  const tagClass = size === "large" ? styles.tag : styles.tagSmall;

  // A div, not a <p>: CADS Tag renders a <div>, which a <p> can't contain.
  return (
    <div
      role="group"
      className={[
        styles.root,
        size === "large" ? styles.rootLarge : "",
        fit ? styles.rootFit : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={plain}
    >
      <span className={styles.word}>Predict</span>
      {labelName ? (
        <Tag
          size={tagSize}
          color={LABEL_TAG_COLOR}
          label={labelName}
          className={tagClass}
        />
      ) : (
        <Tag
          size={tagSize}
          color={LABEL_TAG_COLOR}
          label="a column"
          className={`${tagClass} ${styles.placeholder}`}
        />
      )}
      <span className={styles.word}>based on</span>
      {featureNames.length > 0 ? (
        fit ? (
          <StatementFeatureTags
            featureNames={featureNames}
            tagSize={tagSize}
            tagClassName={tagClass}
          />
        ) : (
          featureNames.map((name) => (
            <Tag
              key={name}
              size={tagSize}
              color={FEATURE_TAG_COLOR}
              label={name}
              className={tagClass}
            />
          ))
        )
      ) : (
        <Tag
          size={tagSize}
          color={FEATURE_TAG_COLOR}
          label="one or more columns"
          className={`${tagClass} ${styles.placeholder}`}
        />
      )}
    </div>
  );
}

interface StatementFeatureTagsProps {
  featureNames: string[];
  tagSize?: TagSize;
  tagClassName?: string;
}

/**
 * Feature Tags on one line: as many as fit the row, then a "+N" Tag whose
 * tooltip names the rest. Widths come from an invisible copy of every Tag,
 * re-measured whenever the row resizes. Takes the parent's column gap.
 */
export function StatementFeatureTags({
  featureNames,
  tagSize = "large",
  tagClassName = styles.tag,
}: StatementFeatureTagsProps) {
  const rowRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(featureNames.length);
  const namesKey = featureNames.join("\u0000");

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const run = () => {
      const available = row.clientWidth;
      if (available <= 0) return;

      const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
      const chips = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-measure=feature]"),
      );
      const overflowWidth =
        measure.querySelector<HTMLElement>("[data-measure=overflow]")
          ?.offsetWidth ?? 0;

      for (let visible = featureNames.length; visible >= 0; visible -= 1) {
        const hidden = featureNames.length - visible;
        let used = 0;
        for (let index = 0; index < visible; index += 1) {
          if (index > 0) used += gap;
          used += chips[index]?.offsetWidth ?? 0;
        }
        if (hidden > 0) used += (visible > 0 ? gap : 0) + overflowWidth;
        if (used <= available) {
          setVisibleCount(visible);
          return;
        }
      }
      setVisibleCount(0);
    };

    run();
    const observer = new ResizeObserver(run);
    observer.observe(row);
    return () => observer.disconnect();
    // `namesKey` stands in for `featureNames`, which is a new array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  const visibleFeatures = featureNames.slice(0, visibleCount);
  const overflowFeatures = featureNames.slice(visibleCount);

  return (
    <span ref={rowRef} className={styles.features}>
      {visibleFeatures.map((name) => (
        <Tag
          key={name}
          size={tagSize}
          color={FEATURE_TAG_COLOR}
          label={name}
          className={tagClassName}
        />
      ))}
      {overflowFeatures.length > 0 ? (
        <Tooltip title={overflowFeatures.join(", ")} placement="bottom">
          <span className={styles.overflowWrap}>
            <Tag
              size={tagSize}
              color={FEATURE_TAG_COLOR}
              label={`+${overflowFeatures.length}`}
              className={tagClassName}
            />
          </span>
        </Tooltip>
      ) : null}
      <div ref={measureRef} className={styles.measure} aria-hidden>
        {featureNames.map((name) => (
          <span key={name} data-measure="feature">
            <Tag
              size={tagSize}
              color={FEATURE_TAG_COLOR}
              label={name}
              className={tagClassName}
            />
          </span>
        ))}
        <span data-measure="overflow">
          <Tag
            size={tagSize}
            color={FEATURE_TAG_COLOR}
            label={`+${Math.max(featureNames.length, 9)}`}
            className={tagClassName}
          />
        </span>
      </div>
    </span>
  );
}
