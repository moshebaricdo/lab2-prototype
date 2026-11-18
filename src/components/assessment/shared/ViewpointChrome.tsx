import { useId, useState, type ReactNode } from "react";
import type { DomainTag } from "../../../types/assessmentBuilder";
import { Alert, Button, Tag } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { QuestionOutcomeTag as QuestionOutcomeTagKind } from "../../../lib/assessmentBuilder";
import styles from "./ViewpointChrome.module.scss";

export type ViewpointBannerVariant = "info" | "warning";

interface ViewpointBannerProps {
  variant?: ViewpointBannerVariant;
  children: ReactNode;
}

/**
 * Figma teacher Alert (`356:24536`): full-bleed CADS strip under the header,
 * not a card-width bar in the 64px workspace pad.
 */
export function ViewpointBanner({
  variant = "info",
  children,
}: ViewpointBannerProps) {
  return (
    <Alert
      className={styles.banner}
      sentiment={variant}
      size="extraSmall"
    >
      {children}
    </Alert>
  );
}

/** Small outcome tag in the question card’s top-right after submit or on results. */
export function QuestionOutcomeTag({ kind }: { kind: QuestionOutcomeTagKind }) {
  if (kind === "ungraded") {
    return <Tag size="small" color="neutral" label="Ungraded" />;
  }
  return (
    <Tag
      size="small"
      color="error"
      startIconName="xmark"
      label={kind === "skipped" ? "Skipped" : "Incorrect"}
    />
  );
}

interface AnswerNotesBlockProps {
  /** Student-facing answer explanation (RevealConfig.explanation). Free response puts the teacher exemplar here. */
  explanation?: string;
  /**
   * Standards the question is tagged with. Shown in results when the quiz
   * breaks scores down by standard. Appended to the explanation card, or in
   * a card of their own when the explanation is hidden.
   */
  standards?: DomainTag[];
}

/** Root-first category chain: CSTA `MS-ALG-PS-02` → [ALG, PS]. */
function categoryPath(category: DomainTag["category"]) {
  const chain: NonNullable<DomainTag["category"]>[] = [];
  for (let current = category; current; current = current.parent) {
    chain.unshift(current);
  }
  return chain;
}

/**
 * One standard: code first, name under it (same as the results table).
 * Expands to the framework › concept › subconcept path, the full wording when
 * the name is a shortened label (AI-901), and the listed skills. CSTA names
 * are already the full statement, so the wording isn't repeated.
 */
function StandardDisclosure({ tag }: { tag: DomainTag }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const path = [
    tag.framework?.label,
    ...categoryPath(tag.category).map((c) =>
      [c.code, c.label].filter(Boolean).join(" · "),
    ),
  ].filter(Boolean);
  const wording =
    tag.description && tag.description.trim() !== tag.label.trim()
      ? tag.description
      : undefined;
  const hasDetails = Boolean(path.length || wording || tag.skills?.length);
  const name = tag.code ? (
    <span className={styles.standardName}>
      <span className={styles.standardCode}>{tag.code}</span>
      <span className={styles.standardLabel}>{tag.label}</span>
    </span>
  ) : (
    <span className={styles.standardName}>
      <span className={styles.standardCode}>{tag.label}</span>
    </span>
  );
  if (!hasDetails) return <li className={styles.standard}>{name}</li>;
  return (
    <li className={styles.standard}>
      <button
        type="button"
        className={styles.standardToggle}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        <FaIcon
          name="chevron-right"
          className={[styles.standardChevron, open ? styles.standardChevronOpen : ""].join(" ")}
          fontSize="var(--text-body-sm, 12px)"
        />
        {name}
      </button>
      {open ? (
        <div id={detailsId} className={styles.standardDetails}>
          {path.length ? (
            <p className={styles.standardPath}>{path.join("  ›  ")}</p>
          ) : null}
          {wording ? (
            <p className={styles.standardDescription}>{wording}</p>
          ) : null}
          {tag.skills?.length ? (
            <ul className={styles.standardSkills}>
              {tag.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function StandardsList({ standards }: { standards: DomainTag[] }) {
  return (
    <ul className={styles.standardList}>
      {standards.map((tag) => (
        <StandardDisclosure key={tag.id} tag={tag} />
      ))}
    </ul>
  );
}

/** Figma `answerExplanation` cards — success. Teacher-only guidance is quiz-level, not per question. */
export function AnswerNotesBlock({
  explanation,
  standards,
}: AnswerNotesBlockProps) {
  const trimmedExplanation = explanation?.trim();
  const hasStandards = Boolean(standards?.length);
  if (!trimmedExplanation && !hasStandards) return null;
  const standardsLabel = standards?.length === 1 ? "Standard" : "Standards";
  return (
    <div className={styles.notes}>
      {trimmedExplanation ? (
        <article className={[styles.card, styles.cardExplanation].join(" ")}>
          <header className={styles.cardHeader}>
            <p className={styles.cardLabel}>Answer explanation</p>
          </header>
          <div className={styles.cardBody}>
            <p className={styles.cardText}>{trimmedExplanation}</p>
          </div>
          {hasStandards ? (
            <section className={styles.cardStandards} aria-label={standardsLabel}>
              <p className={styles.cardSubLabel}>{standardsLabel}</p>
              <StandardsList standards={standards!} />
            </section>
          ) : null}
        </article>
      ) : hasStandards ? (
        <article className={[styles.card, styles.cardStandardsOnly].join(" ")}>
          <header className={styles.cardHeader}>
            <p className={styles.cardLabel}>{standardsLabel}</p>
          </header>
          <div className={styles.cardBody}>
            <StandardsList standards={standards!} />
          </div>
        </article>
      ) : null}
    </div>
  );
}

interface StudentResponsesRowProps {
  count: number;
  /** Class size for the Figma `n/n` ratio. Unused when count is 0. */
  total?: number;
}

/** Figma `responseCount` (`370:31429`): 28px users + n/n or empty pair. Always paired with View student responses. */
export function StudentResponsesRow({
  count,
  total = 24,
}: StudentResponsesRowProps) {
  const hasResponses = count > 0;
  const answered = Math.min(count, total);
  return (
    <div className={styles.teacherActions}>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIconName="pen-field"
      >
        View student responses
      </Button>
      <div
        className={[
          styles.responseCount,
          hasResponses ? styles.responseCountFilled : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <FaIcon
          name="users"
          className={styles.responseIcon}
          fontSize="var(--text-heading-lg)"
        />
        <div className={styles.responseCopy}>
          <p className={styles.responseTitle}>
            {hasResponses ? `${answered}/${total}` : "No responses"}
          </p>
          <p className={styles.responseHelper}>
            {hasResponses ? "Students answered" : "No students have answered"}
          </p>
        </div>
      </div>
    </div>
  );
}
