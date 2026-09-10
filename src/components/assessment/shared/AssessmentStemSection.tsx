import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./AssessmentStemSection.module.scss";

export interface AssessmentStemSectionProps {
  /** Short label above the stem (e.g. “Multiple choice”, “Free response”). */
  eyebrow: string;
  /** Appended to the eyebrow line (e.g. level-group step counter styling). */
  eyebrowClassName?: string;
  /**
   * `questionContainer` matches the Figma student card: 24px pad, 24px
   * content gap, 8px title stack. Default keeps standalone assessment padding.
   */
  layout?: "default" | "questionContainer";
  /** Plain-text heading when the prompt is a single sentence. */
  question?: string;
  /** Markdown body — supplemental to \`question\`, or the full prompt when \`question\` is omitted. */
  description?: string;
  /** Level-specific interaction (inputs, canvas, etc.) rendered below the stem. */
  children?: ReactNode;
  /** Figma explanation cards sit in the same 24px question-content stack. */
  afterBody?: ReactNode;
}

/**
 * Shared stem chrome for Lab2 assessment levels: eyebrow, optional plain heading,
 * optional markdown block, then children (the task UI).
 */
export function AssessmentStemSection({
  eyebrow,
  eyebrowClassName,
  layout = "default",
  question,
  description,
  children,
  afterBody,
}: AssessmentStemSectionProps) {
  const eyebrowEl = eyebrow.trim() ? (
    <p
      className={[styles.eyebrow, eyebrowClassName ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow}
    </p>
  ) : null;

  const questionEl = question ? (
    <h1 className={styles.question}>{question}</h1>
  ) : null;

  const descriptionEl = description ? (
    <div className={question ? styles.description : styles.descriptionOnly}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
    </div>
  ) : null;

  if (layout === "questionContainer") {
    return (
      <div className={[styles.root, styles.questionContainer].join(" ")}>
        <div className={styles.headerStack}>
          <div className={styles.titleStack}>
            {eyebrowEl}
            {questionEl}
          </div>
          {descriptionEl}
        </div>
        {children}
        {afterBody}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {eyebrowEl}
      {questionEl}
      {descriptionEl}
      {children}
      {afterBody}
    </div>
  );
}
