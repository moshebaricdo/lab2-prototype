import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./AssessmentStemSection.module.scss";

export interface AssessmentStemSectionProps {
  /** Short label above the stem (e.g. “Multiple choice”, “Free response”). */
  eyebrow: string;
  /** Plain-text heading when the prompt is a single sentence. */
  question?: string;
  /** Markdown body — supplemental to \`question\`, or the full prompt when \`question\` is omitted. */
  description?: string;
  /** Level-specific interaction (inputs, canvas, etc.) rendered below the stem. */
  children?: ReactNode;
}

/**
 * Shared stem chrome for Lab2 assessment levels: eyebrow, optional plain heading,
 * optional markdown block, then children (the task UI).
 */
export function AssessmentStemSection({
  eyebrow,
  question,
  description,
  children,
}: AssessmentStemSectionProps) {
  return (
    <div className={styles.root}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      {question ? <h1 className={styles.question}>{question}</h1> : null}
      {description ? (
        <div
          className={
            question ? styles.description : styles.descriptionOnly
          }
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {description}
          </ReactMarkdown>
        </div>
      ) : null}
      {children}
    </div>
  );
}
