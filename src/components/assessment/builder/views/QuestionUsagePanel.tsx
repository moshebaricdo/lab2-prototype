import { useState } from "react";
import { Button, Tag, Toggle, Tooltip } from "@moshebaricdo/cads-react";
import { quizStatusMeta } from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import styles from "./QuestionUsagePanel.module.scss";

function versionName(label: string): string {
  return label.replace(/\s*\(this one\)\s*$/i, "").trim();
}

interface QuestionUsagePanelProps {
  question: QuestionItem;
  currentQuizTitle: string;
  showBankToggle?: boolean;
  onUpdateQuestion?: (question: QuestionItem) => void;
}

export function QuestionUsagePanel({
  question,
  currentQuizTitle,
  showBankToggle = true,
  onUpdateQuestion,
}: QuestionUsagePanelProps) {
  const listed = question.listedInBank !== false;
  const source = question.usedInQuizzes ?? [];
  const usedIn =
    source.length === 0
      ? [
          {
            quizTitle: currentQuizTitle,
            courseUnit: "None",
            status: "not_in_unit" as const,
            isCurrent: true,
          },
        ]
      : source.map((row) => ({
          ...row,
          isCurrent: row.quizTitle === currentQuizTitle,
        }));
  const versions = question.versions ?? [];

  return (
    <div className={styles.root}>
      {showBankToggle && onUpdateQuestion ? (
        <div className={styles.toggleBlock}>
          <Toggle
            size="small"
            label="Show in question bank"
            labelPlacement="left"
            checked={listed}
            onChange={(_event, next) =>
              onUpdateQuestion({ ...question, listedInBank: next })
            }
          />
          <p className={styles.helper}>
            {listed
              ? "Other quizzes can find and reuse this question. Turning this off does not remove it from quizzes already using it."
              : "Only on this quiz. Turn on to let other quizzes find and reuse it."}
          </p>
        </div>
      ) : null}

      <div className={styles.identity}>
        <IdentityStat
          label="Question ID"
          value={question.numericId != null ? String(question.numericId) : "—"}
          empty={question.numericId == null}
          copyValue={
            question.numericId != null ? String(question.numericId) : undefined
          }
        />
        <IdentityStat
          label="Key"
          value={question.questionKey ?? "—"}
          empty={!question.questionKey}
          copyValue={question.questionKey}
        />
        <IdentityStat
          label="Version"
          value={
            question.versionIndex && question.versionCount
              ? `${question.versionIndex} of ${question.versionCount}`
              : "1 of 1"
          }
        />
        <IdentityStat
          label="Last edited"
          value={question.lastEditedLabel ?? "—"}
          empty={!question.lastEditedLabel}
        />
      </div>

      <div className={styles.tables}>
        <section className={styles.tableBlock}>
        <h4 className={styles.tableTitle}>
          Used in ({usedIn.length} quiz{usedIn.length === 1 ? "" : "zes"})
        </h4>
        <div className={styles.tableFrame} role="table">
          <div
            className={`${styles.row} ${styles.headRow} ${styles.usedInGrid}`}
            role="row"
          >
            <div className={styles.headCell} role="columnheader">
              Quiz
            </div>
            <div className={styles.headCell} role="columnheader">
              Course / Unit
            </div>
            <div className={styles.headCell} role="columnheader">
              Status
            </div>
            <div className={styles.headCell} role="columnheader" />
          </div>
          {usedIn.map((row, index) => {
            const status = quizStatusMeta(row.status);
            return (
              <div
                key={`${row.quizTitle}-${index}`}
                className={`${styles.row} ${styles.bodyRow} ${styles.usedInGrid}`}
                role="row"
              >
                <div className={styles.cell} role="cell">
                  <span className={styles.cellCluster}>
                    <span className={styles.cellText}>{row.quizTitle}</span>
                    {row.isCurrent ? (
                      <Tag
                        size="small"
                        color="neutral"
                        label="This quiz"
                        className={styles.inlineTag}
                      />
                    ) : null}
                  </span>
                </div>
                <div
                  className={[
                    styles.cell,
                    row.courseUnit === "None" ? styles.muted : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="cell"
                >
                  <span className={styles.cellText}>{row.courseUnit}</span>
                </div>
                <div className={styles.cell} role="cell">
                  <Tag
                    size="small"
                    color={status.tagColor}
                    startIconName={status.iconName}
                    label={status.tableLabel}
                  />
                </div>
                <div className={styles.cell} role="cell">
                  {row.isCurrent ? null : (
                    <OpenLinkButton label={`Open ${row.quizTitle}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </section>

        <section className={styles.tableBlock}>
        <h4 className={styles.tableTitle}>Versions</h4>
        <div className={styles.tableFrame} role="table">
          <div
            className={`${styles.row} ${styles.headRow} ${styles.versionsGrid}`}
            role="row"
          >
            <div className={styles.versionsLead}>
              <div className={styles.headCell} role="columnheader">
                Version
              </div>
              <div className={styles.headCell} role="columnheader">
                ID
              </div>
              <div className={styles.headCell} role="columnheader">
                Used in
              </div>
            </div>
            <div className={styles.headCell} role="columnheader">
              Last edited
            </div>
            <div className={styles.headCell} role="columnheader" />
          </div>
          {versions.length === 0 ? (
            <div className={styles.emptyRow} role="row">
              <div className={styles.emptyCell} role="cell">
                No other versions. A new version is created when you edit this
                question while it is on a published unit.
              </div>
            </div>
          ) : (
            versions.map((row) => (
              <div
                key={row.id}
                className={`${styles.row} ${styles.bodyRow} ${styles.versionsRow} ${styles.versionsGrid}`}
                role="row"
              >
                <div className={styles.versionsLead}>
                  <div className={styles.cell} role="cell">
                    <span className={styles.cellCluster}>
                      <span className={styles.cellText}>
                        {versionName(row.label)}
                      </span>
                      {row.isCurrent ? (
                        <Tag
                          size="small"
                          color="brand"
                          label="This version"
                          className={styles.inlineTag}
                        />
                      ) : null}
                    </span>
                  </div>
                  <div className={`${styles.cell} ${styles.muted}`} role="cell">
                    <span className={styles.cellText}>{row.id}</span>
                  </div>
                  <div className={styles.cell} role="cell">
                    <span className={styles.cellText}>{row.usedIn}</span>
                  </div>
                </div>
                <div className={`${styles.cell} ${styles.muted}`} role="cell">
                  <span className={styles.cellText}>{row.lastEdited}</span>
                </div>
                <div className={styles.cell} role="cell">
                  {row.isCurrent ? null : (
                    <OpenLinkButton label={`Open ${versionName(row.label)}`} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </section>
      </div>
    </div>
  );
}

function OpenLinkButton({ label }: { label: string }) {
  return (
    <Tooltip title="Open in levelbuilder" placement="top">
      <Button
        variant="text"
        color="tertiary"
        size="extraSmall"
        iconOnly
        startIconName="arrow-up-right-from-square"
        aria-label={label}
      />
    </Tooltip>
  );
}

function IdentityStat({
  label,
  value,
  copyValue,
  empty = false,
}: {
  label: string;
  value: string;
  copyValue?: string;
  empty?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyValue) return;
    void navigator.clipboard?.writeText(copyValue).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statValueRow}>
        <span
          className={
            empty ? `${styles.statValue} ${styles.statValueEmpty}` : styles.statValue
          }
        >
          {value}
        </span>
        {copyValue ? (
          <Tooltip title={copied ? "Copied" : "Copy"} placement="top">
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName={copied ? "check" : "copy"}
              aria-label={`Copy ${label}`}
              onClick={handleCopy}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
