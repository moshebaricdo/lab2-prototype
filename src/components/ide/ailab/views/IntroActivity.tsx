import { useMemo, useState } from "react";
import { Button, Tag } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { columnById, formatCell, uniqueValues } from "../../../../lib/aiLab";
import type {
  AiLabDataRow,
  AiLabDataset,
  AiLabIntroActivity,
} from "../../../../types/aiLab";
import { DatasetStoryModal, storyFor } from "./DatasetStoryModal";
import { LABEL_TAG_COLOR } from "./PredictionStatement";
import { labelFill, labelIndexer } from "./viz/labelPalette";
import styles from "./IntroActivity.module.scss";

/** Classify needs one button per label value; past this it falls back to `info`. */
export const MAX_CLASSIFY_LABELS = 8;
const DEFAULT_ROW_COUNT = 5;

/**
 * Rows for the classify deck: explicit indexes when the level names them,
 * otherwise a round-robin over the label values (in sheet order) so five
 * cards never show five of the same answer. Deterministic — reloads show
 * the same deck.
 */
export function introRowIndexes(
  rows: AiLabDataRow[],
  labelColumn: string,
  activity: AiLabIntroActivity,
): number[] {
  if (activity.rowIndexes?.length) {
    return activity.rowIndexes.filter((index) => index >= 0 && index < rows.length);
  }
  const count = Math.min(activity.rowCount ?? DEFAULT_ROW_COUNT, rows.length);
  const labels = uniqueValues(rows, labelColumn);
  const byLabel = new Map<string, number[]>(labels.map((label) => [label, []]));
  rows.forEach((row, index) => byLabel.get(String(row[labelColumn]))?.push(index));
  const picked: number[] = [];
  let round = 0;
  while (picked.length < count && round < rows.length) {
    for (const label of labels) {
      const candidate = byLabel.get(label)?.[round];
      if (candidate !== undefined) picked.push(candidate);
      if (picked.length >= count) break;
    }
    round += 1;
  }
  return picked;
}

/** Whether a dataset can run the classify deck at all. */
export function canClassify(dataset: AiLabDataset): boolean {
  const label = columnById(dataset.columns, dataset.defaultLabelColumn);
  if (!label || label.type !== "categorical") return false;
  const count = uniqueValues(dataset.rows, dataset.defaultLabelColumn).length;
  return count >= 2 && count <= MAX_CLASSIFY_LABELS;
}

interface IntroActivityProps {
  lab: AiLabController;
}

/**
 * The step before the sheet. `info` is the story modal alone; `classify`
 * deals a few rows as cards with the answer hidden, asks the student to
 * guess it from the other columns, shows the real answer, and then hands
 * off to the sheet. Everything here is read from the dataset — the level
 * only says how many cards and which columns to show.
 */
export function IntroActivity({ lab }: IntroActivityProps) {
  const activity = lab.config.introActivity;
  const dataset = lab.config.dataset;
  const mode: AiLabIntroActivity["mode"] =
    activity?.mode === "classify" && canClassify(dataset) ? "classify" : "info";
  const showStoryFirst = mode === "info" || activity?.showStoryFirst !== false;
  const [storyOpen, setStoryOpen] = useState(showStoryFirst);

  if (!activity) return null;

  if (mode === "info") {
    return (
      <div className={styles.root}>
        <DatasetStoryModal
          dataset={dataset}
          open={storyOpen}
          required
          primaryActionLabel="Open the data"
          onClose={() => {
            setStoryOpen(false);
            lab.completeIntro();
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <DatasetStoryModal
        dataset={dataset}
        open={storyOpen}
        required
        primaryActionLabel="Let's try it"
        onClose={() => setStoryOpen(false)}
      />
      {storyOpen ? null : (
        <ClassifyDeck lab={lab} activity={activity} onDone={lab.completeIntro} />
      )}
    </div>
  );
}

interface ClassifyDeckProps {
  lab: AiLabController;
  activity: AiLabIntroActivity;
  onDone: () => void;
}

function ClassifyDeck({ lab, activity, onDone }: ClassifyDeckProps) {
  const dataset = lab.config.dataset;
  const rows = lab.rows;
  const labelColumn = dataset.defaultLabelColumn;
  const labelName = columnById(dataset.columns, labelColumn)?.name ?? labelColumn;
  const story = storyFor(dataset);
  const labels = useMemo(() => uniqueValues(rows, labelColumn), [rows, labelColumn]);
  const indexOf = useMemo(() => labelIndexer(labels), [labels]);
  const deck = useMemo(
    () => introRowIndexes(rows, labelColumn, activity),
    [rows, labelColumn, activity],
  );
  const clueColumns = useMemo(() => {
    const visible = activity.visibleColumns;
    return dataset.columns.filter(
      (column) =>
        column.id !== labelColumn && (!visible || visible.includes(column.id)),
    );
  }, [activity.visibleColumns, dataset.columns, labelColumn]);
  const oneAtATime = activity.reveal === "one-at-a-time";

  const [position, setPosition] = useState(0);
  const [guess, setGuess] = useState<string | undefined>();
  const [cluesShown, setCluesShown] = useState(oneAtATime ? 1 : clueColumns.length);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);

  const rowIndex = deck[position];
  const row = rows[rowIndex];
  const actual = row ? String(row[labelColumn]) : "";
  const isLast = position >= deck.length - 1;
  const allCluesShown = cluesShown >= clueColumns.length;

  const choose = (label: string) => {
    if (guess !== undefined) return;
    setGuess(label);
    setCluesShown(clueColumns.length);
    if (label === actual) setRight((count) => count + 1);
  };

  const next = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setPosition((index) => index + 1);
    setGuess(undefined);
    setCluesShown(oneAtATime ? 1 : clueColumns.length);
  };

  if (finished || !row) {
    return (
      <div className={styles.stage}>
        <section className={styles.summary} aria-live="polite">
          <p className={styles.eyebrow}>
            All {deck.length} {story.rowNoun}s done
          </p>
          <h2 className={styles.summaryTitle}>
            You got {right} of {deck.length} right.
          </h2>
          <p className={styles.copy}>
            You just did what a model does: looked at each {story.rowNoun}'s
            columns and guessed its {labelName}. The sheet has all{" "}
            {rows.length} {story.rowNoun}s — every card you saw is one row.
          </p>
          <Button
            size="medium"
            variant="contained"
            color="primary"
            endIconName="arrow-right"
            onClick={onDone}
          >
            Open the data
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.deck}>
        <p className={styles.progress} aria-live="polite">
          {capitalize(story.rowNoun)} {position + 1} of {deck.length}
        </p>
        <h2 className={styles.prompt}>
          What <Tag size="small" color={LABEL_TAG_COLOR} label={labelName} /> is
          this {story.rowNoun}?
        </h2>

        <article
          key={rowIndex}
          className={`${styles.card} ${guess !== undefined ? styles.cardRevealed : ""}`}
          aria-label={`${capitalize(story.rowNoun)} ${position + 1}`}
        >
          <dl className={styles.cardBody}>
            {clueColumns.map((column, index) => {
              const shown = index < cluesShown;
              return (
                <div
                  key={column.id}
                  className={`${styles.cardRow} ${shown ? styles.cardRowShown : ""}`}
                  aria-hidden={!shown}
                >
                  <dt className={styles.cardKey}>{column.name}</dt>
                  <dd className={styles.cardValue}>
                    {shown ? formatCell(row[column.id]) : "•••"}
                  </dd>
                </div>
              );
            })}
            <div className={`${styles.cardRow} ${styles.cardRowLabel}`}>
              <dt className={styles.cardKey}>{labelName}</dt>
              <dd className={styles.cardValue}>
                {guess === undefined ? (
                  <span className={styles.hidden} aria-label="Hidden">
                    ?
                  </span>
                ) : (
                  <span className={styles.answer}>
                    <span
                      className={styles.answerDot}
                      style={{ background: labelFill(indexOf(actual)) }}
                      aria-hidden
                    />
                    {actual}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </article>

        {oneAtATime && !allCluesShown && guess === undefined ? (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIconName="eye"
            onClick={() => setCluesShown((count) => count + 1)}
          >
            Show another clue
          </Button>
        ) : null}

        <div className={styles.choices} role="group" aria-label={`Your guess for ${labelName}`}>
          {labels.map((label) => {
            const picked = guess === label;
            const isActual = guess !== undefined && label === actual;
            const wrongPick = picked && !isActual;
            return (
              <button
                key={label}
                type="button"
                className={[
                  styles.choice,
                  isActual ? styles.choiceRight : "",
                  wrongPick ? styles.choiceWrong : "",
                  guess !== undefined && !picked && !isActual ? styles.choiceDim : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={guess !== undefined}
                aria-pressed={picked}
                onClick={() => choose(label)}
              >
                <span
                  className={styles.choiceDot}
                  style={{ background: labelFill(indexOf(label)) }}
                  aria-hidden
                />
                {label}
                {isActual ? (
                  <FaIcon name="check" fontSize="12px" />
                ) : wrongPick ? (
                  <FaIcon name="xmark" fontSize="12px" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={styles.feedback} aria-live="polite">
          {guess === undefined ? (
            <p className={styles.copy}>
              Use the clues on the card. There is no wrong way to guess.
            </p>
          ) : (
            <>
              <p className={styles.copy}>
                {guess === actual
                  ? `Right — this ${story.rowNoun} is a ${actual}.`
                  : `Not quite. This ${story.rowNoun} is a ${actual}.`}
              </p>
              <Button
                size="small"
                variant="contained"
                color="primary"
                endIconName="arrow-right"
                onClick={next}
              >
                {isLast ? "Finish" : "Next"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
