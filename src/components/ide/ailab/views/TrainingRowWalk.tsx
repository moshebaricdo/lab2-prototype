import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById, formatCell, traceDecisionTree } from "../../../../lib/aiLab";
import type { AiLabHoldoutResult } from "../../../../types/aiLab";
import { TrainingModalShell, type TrainingRowWalkProps } from "./TrainingModalShell";
import { labelFill, labelIndexer } from "./viz/labelPalette";
import { SortingTree, useSortingModel, type SortingTreeState } from "./viz/SortingTree";
import { treeScore } from "./viz/TreeGrowth";
import { prefersReducedMotion } from "./viz/useStepPlayback";
import styles from "./TrainingRowWalk.module.scss";

/** Rows that roll through the tree one at a time during Testing. */
const QUIZ_SIZE = 3;
/** Each quiz row plays faster than the last; the idea lands on the first. */
const QUIZ_PACE = [1, 0.7, 0.5];

type Act = "training" | "testing" | "checking" | "done";

interface WalkState extends SortingTreeState {
  act: Act;
  /** Quiz row on the card (−1 before Testing). */
  quiz: number;
  /** Marble position along the quiz row's path; −1 hides it. */
  step: number;
  /** The leaf the marble landed in has announced its guess. */
  guessed: boolean;
  /** Quiz rows whose real label has been shown. */
  revealed: number;
  travelMs: number;
}

const INITIAL: WalkState = {
  act: "training",
  read: false,
  splitsShown: 0,
  childrenShown: 0,
  splitsDone: 0,
  named: false,
  quiet: false,
  checked: false,
  quiz: -1,
  step: -1,
  guessed: false,
  revealed: 0,
  travelMs: 600,
};

interface Beat {
  wait: number;
  patch: Partial<WalkState>;
}

interface QuizRow {
  result: AiLabHoldoutResult;
  pathKeys: string[];
}

/**
 * The tree as a sorting machine, one moving thing at a time.
 *
 * **Training:** every row is a dot in its real label's color. The dots
 * pour into the top pile, then each question splits a pile into smaller
 * piles until each is mostly one color, and each final pile names itself
 * after its biggest color. **Testing:** the label is hidden; a grey "?"
 * marble rolls down the connectors while its card highlights the answer
 * each question reads, lands in a pile, takes that pile's guess, and shows
 * its real color. **Checking:** every dot that doesn't match its pile's
 * guess goes hollow — that's the score. The stage is sized from the
 * finished tree, so the modal never changes height while it plays.
 */
export function TrainingRowWalk({
  open,
  onClose,
  onTest,
  tree,
  columns,
  labelColumn,
  features,
  labels,
  rowNoun,
  canTest,
  rows,
  results,
  titleColumn,
}: TrainingRowWalkProps) {
  const model = useSortingModel(tree, rows, labelColumn, labels);
  const score = useMemo(() => treeScore(tree), [tree]);
  const indexOf = useMemo(() => labelIndexer(labels), [labels]);
  const quiz = useMemo<QuizRow[]>(
    () =>
      orderQuiz(pickSample(results, QUIZ_SIZE)).map((result) => ({
        result,
        pathKeys: rows[result.rowIndex]
          ? traceDecisionTree(tree, rows[result.rowIndex]!).pathKeys
          : ["root"],
      })),
    [results, rows, tree],
  );

  const tally = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const label = String(row[labelColumn]);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return labels.map((label) => ({ label, fill: labelFill(indexOf(label)), count: counts.get(label) ?? 0 }));
  }, [rows, labelColumn, labels, indexOf]);

  const splitCount = model.splits.length;
  const { beats, final } = useMemo(() => buildBeats(splitCount, quiz), [splitCount, quiz]);
  const [state, setState] = useState<WalkState>(INITIAL);
  const [instant, setInstant] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  // Every open replays from the empty pile; reduced motion lands on the end.
  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion()) {
      setInstant(true);
      setState(final);
      return;
    }
    setInstant(false);
    setState(INITIAL);
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const beat = beats[index];
      if (!beat) return;
      index += 1;
      timer = setTimeout(() => {
        setState((current) => ({ ...current, ...beat.patch }));
        next();
      }, beat.wait);
    };
    next();
    const stop = () => clearTimeout(timer);
    stopRef.current = stop;
    return stop;
  }, [open, beats, final]);

  const skip = () => {
    stopRef.current();
    setInstant(true);
    setState(final);
  };

  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  const count = `${rows.length} ${rowNoun}${rows.length === 1 ? "" : "s"}`;
  const current = state.quiz >= 0 ? quiz[state.quiz] : undefined;
  const currentSplit =
    state.act === "training" && state.splitsShown > 0 && !state.named
      ? model.splits[state.splitsShown - 1]
      : undefined;
  const status: ReactNode =
    state.act === "training" ? (
      state.named ? (
        <>
          Each group guesses its most common <strong>{labelName}</strong>
        </>
      ) : currentSplit && currentSplit.node.type === "decision" ? (
        <>
          Sorting by{" "}
          <strong>
            {columnById(columns, currentSplit.node.feature)?.name ?? currentSplit.node.feature}
          </strong>
        </>
      ) : (
        `Looking at ${count}`
      )
    ) : state.act === "testing" ? (
      <>
        <strong>{labelName}</strong> is hidden. Can the model guess it?
      </>
    ) : state.act === "checking" ? (
      `Checking all ${count}`
    ) : (
      `Checked all ${count}`
    );

  const face = state.act === "training" ? "key" : state.act === "testing" ? "quiz" : "score";
  const groups = model.splits
    .slice(0, state.splitsDone)
    .reduce((piles, split) => piles + split.childKeys.length - 1, state.read ? 1 : 0);
  const activeLabels = new Set<string>();
  if (state.act === "testing" && current) {
    if (state.guessed) activeLabels.add(current.result.predicted);
    if (state.revealed > state.quiz) activeLabels.add(current.result.actual);
  }

  return (
    <TrainingModalShell
      open={open}
      onClose={onClose}
      onTest={onTest}
      columns={columns}
      labelColumn={labelColumn}
      features={features}
      canTest={canTest}
      done={state.act === "done"}
      onSkip={skip}
      maxWidth={880}
      flush
    >
      <div className={`${styles.stage} ${instant ? styles.instant : ""}`}>
        <aside className={styles.panel}>
          <div className={styles.narration}>
            <ol className={styles.steps} aria-label="Steps">
              <Step
                index={1}
                label="Training"
                active={state.act === "training"}
                complete={state.act !== "training"}
              />
              <Step
                index={2}
                label="Testing"
                active={state.act !== "training" && state.act !== "done"}
                complete={state.act === "done"}
              />
            </ol>
            <p className={styles.status} aria-live="polite">
              {status}
            </p>
          </div>
          <div className={styles.faces}>
            <DataKey
              on={face === "key"}
              count={rows.length}
              rowNoun={rowNoun}
              questions={state.splitsShown}
              groups={groups}
            />
            <QuizCard
              on={face === "quiz"}
              quiz={quiz}
              index={Math.max(0, state.quiz)}
              state={state}
              model={model}
              rows={rows}
              columns={columns}
              features={features}
              labelName={labelName}
              titleColumn={titleColumn}
              rowNoun={rowNoun}
              indexOf={indexOf}
            />
            <ScoreCard on={face === "score"} right={score.right} total={score.total} />
          </div>
        </aside>
        <div className={styles.board}>
          <div className={styles.treeArea}>
            <SortingTree
            model={model}
            columns={columns}
            labels={labels}
            state={state}
            marble={
              current && state.step >= 0
                ? {
                    id: current.result.rowIndex,
                    pathKeys: current.pathKeys,
                    step: state.step,
                    revealedLabel:
                      state.revealed > state.quiz ? current.result.actual : undefined,
                    answering: state.guessed,
                    travelMs: state.travelMs,
                  }
                : undefined
            }
            instant={instant}
            maxHeight={300}
            ariaLabel={`Decision tree sorting ${count} into groups by ${labelName}`}
            />
          </div>
          <Legend
            labelName={labelName}
            tally={tally}
            rowsPerDot={model.rowsPerDot}
            active={activeLabels}
            showWrong={state.checked && score.right < score.total}
          />
        </div>
      </div>
    </TrainingModalShell>
  );
}

function buildBeats(splitCount: number, quiz: QuizRow[]): { beats: Beat[]; final: WalkState } {
  const f = Math.min(1, Math.max(0.45, 3 / Math.max(1, splitCount)));
  const beats: Beat[] = [{ wait: 350, patch: { read: true } }];
  for (let i = 0; i < splitCount; i += 1) {
    beats.push(
      { wait: i === 0 ? 1300 : 1000 * f, patch: { splitsShown: i + 1 } },
      { wait: 550 * f, patch: { childrenShown: i + 1 } },
      { wait: 450 * f, patch: { splitsDone: i + 1 } },
    );
  }
  beats.push(
    { wait: splitCount ? 1100 * f : 900, patch: { named: true } },
    { wait: 1700, patch: { act: "testing", quiet: true } },
  );
  quiz.forEach((row, index) => {
    const pace = QUIZ_PACE[index] ?? QUIZ_PACE[QUIZ_PACE.length - 1]!;
    const travelMs = Math.round(620 * pace);
    beats.push({
      wait: index === 0 ? 700 : 900 * pace,
      patch: { quiz: index, step: 0, guessed: false, travelMs },
    });
    for (let step = 1; step < row.pathKeys.length; step += 1) {
      beats.push({ wait: step === 1 ? 800 * pace : travelMs + 300 * pace, patch: { step } });
    }
    beats.push(
      {
        wait: row.pathKeys.length > 1 ? travelMs + 200 * pace : 600 * pace,
        patch: { guessed: true },
      },
      { wait: 700 * pace, patch: { revealed: index + 1 } },
    );
  });
  beats.push(
    { wait: 1100, patch: { act: "checking", step: -1, quiet: false, checked: true } },
    { wait: 1500, patch: { act: "done" } },
  );
  const final: WalkState = {
    ...INITIAL,
    act: "done",
    read: true,
    splitsShown: splitCount,
    childrenShown: splitCount,
    splitsDone: splitCount,
    named: true,
    checked: true,
    quiz: quiz.length - 1,
    guessed: true,
    revealed: quiz.length,
  };
  return { beats, final };
}

function Step({
  index,
  label,
  active,
  complete,
}: {
  index: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <li
      className={[styles.step, active ? styles.stepActive : "", complete ? styles.stepDone : ""]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "step" : undefined}
    >
      <span className={styles.stepMark}>
        {complete ? <FaIcon name="check" fontSize="10px" /> : index}
      </span>
      {label}
    </li>
  );
}

/**
 * One state of the left card. All three share the same anatomy — overline,
 * one big line, a short list of rows — so switching states reads as the
 * card's contents updating, not a different card arriving.
 */
function Face({
  on,
  overline,
  meta,
  children,
}: {
  on: boolean;
  overline: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={`${styles.face} ${on ? styles.faceOn : ""}`}
      aria-hidden={!on}
      aria-label={overline}
    >
      <header className={styles.faceHead}>
        <p className={styles.overline}>{overline}</p>
        {meta}
      </header>
      {children}
    </section>
  );
}

function Row({
  term,
  children,
  className,
}: {
  term: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Training: how much data went in, and how the questions carve it up. */
function DataKey({
  on,
  count,
  rowNoun,
  questions,
  groups,
}: {
  on: boolean;
  count: number;
  rowNoun: string;
  questions: number;
  groups: number;
}) {
  return (
    <Face on={on} overline="Training data">
      <p className={styles.hero}>
        <span className={styles.heroNumber}>{count}</span>
        <span className={styles.heroNoun}>{count === 1 ? rowNoun : `${rowNoun}s`}</span>
      </p>
      <dl className={styles.rows}>
        <Row term="Questions">
          <span key={questions} className={styles.tick}>
            {questions}
          </span>
        </Row>
        <Row term="Groups">
          <span key={groups} className={styles.tick}>
            {groups}
          </span>
        </Row>
      </dl>
    </Face>
  );
}

/**
 * Which color is which label, always under the tree. Lights the guess and
 * the real answer while a quiz row plays; adds the hollow "wrong" mark
 * once the piles are checked.
 */
function Legend({
  labelName,
  tally,
  rowsPerDot,
  active,
  showWrong,
}: {
  labelName: string;
  tally: { label: string; fill: string; count: number }[];
  rowsPerDot: number;
  active: Set<string>;
  showWrong: boolean;
}) {
  const perDot = Math.round(rowsPerDot);
  return (
    <div className={styles.legend} aria-label={`${labelName} colors`}>
      <ul className={styles.legendItems}>
        {tally.map((entry) => (
          <li
            key={entry.label}
            className={`${styles.legendItem} ${active.has(entry.label) ? styles.legendItemActive : ""}`}
          >
            <span className={styles.legendDot} style={{ color: entry.fill }} aria-hidden />
            <span className={styles.legendName}>{entry.label}</span>
            <span className={styles.legendCount}>{entry.count}</span>
          </li>
        ))}
      </ul>
      <p className={styles.legendNote}>
        {showWrong ? (
          <span className={styles.legendNoteItem}>
            <span className={`${styles.legendDot} ${styles.legendDotWrong}`} aria-hidden />
            wrong guess
          </span>
        ) : null}
        <span className={styles.legendNoteItem}>
          <span className={`${styles.legendDot} ${styles.legendDotNeutral}`} aria-hidden />
          {perDot <= 1 ? "= 1 row" : `≈ ${perDot} rows`}
        </span>
      </p>
    </div>
  );
}

/** Testing: the row rolling down right now, with its label covered. */
function QuizCard({
  on,
  quiz,
  index,
  state,
  model,
  rows,
  columns,
  features,
  labelName,
  titleColumn,
  rowNoun,
  indexOf,
}: {
  on: boolean;
  quiz: QuizRow[];
  index: number;
  state: WalkState;
  model: ReturnType<typeof useSortingModel>;
  rows: TrainingRowWalkProps["rows"];
  columns: TrainingRowWalkProps["columns"];
  features: string[];
  labelName: string;
  titleColumn?: string;
  rowNoun: string;
  indexOf: (label: string) => number;
}) {
  const entry = quiz[index];
  if (!entry) return <Face on={on} overline="Test">{null}</Face>;
  const { result, pathKeys } = entry;
  const row = rows[result.rowIndex] ?? {};
  const name =
    titleColumn && row[titleColumn] !== undefined
      ? formatCell(row[titleColumn]!)
      : `${capitalize(rowNoun)} ${result.rowIndex + 1}`;
  const at = state.step >= 0 ? model.layout.byKey.get(pathKeys[state.step]!) : undefined;
  const asking = at?.node.type === "decision" ? at.node.feature : undefined;
  const revealed = state.revealed > index;
  const guessed = state.guessed || revealed;

  return (
    <Face
      on={on}
      overline={`Test ${index + 1} of ${quiz.length}`}
      meta={
        <ol className={styles.pips} aria-label="Test guesses">
          {quiz.map((item, itemIndex) => {
            const done = state.revealed > itemIndex;
            return (
              <li
                key={item.result.rowIndex}
                className={[
                  styles.pip,
                  itemIndex === index && !done ? styles.pipCurrent : "",
                  done ? (item.result.correct ? styles.pipRight : styles.pipWrong) : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {done ? (
                  <FaIcon name={item.result.correct ? "check" : "xmark"} fontSize="8px" />
                ) : null}
              </li>
            );
          })}
        </ol>
      }
    >
      {/* Keyed by quiz row so the next row fades in instead of its values
          changing in place. */}
      <div key={index} className={styles.swap}>
        <p className={styles.hero}>
          <span
            className={`${styles.token} ${revealed ? styles.tokenRevealed : ""}`}
            style={revealed ? { background: labelFill(indexOf(result.actual)) } : undefined}
            aria-hidden
          >
            {revealed ? null : "?"}
          </span>
          <span className={styles.heroName}>{name}</span>
        </p>
        <dl className={styles.rows}>
          {features.map((feature) => (
            <Row
              key={feature}
              term={columnById(columns, feature)?.name ?? feature}
              className={asking === feature ? styles.rowAsked : undefined}
            >
              {row[feature] === undefined ? "—" : formatCell(row[feature]!)}
            </Row>
          ))}
          <Row term={labelName} className={styles.rowLabel}>
            {guessed ? (
              <span className={styles.guess}>
                <span
                  className={styles.guessDot}
                  style={{ background: labelFill(indexOf(result.predicted)) }}
                  aria-hidden
                />
                {result.predicted}
              </span>
            ) : (
              <span className={styles.hidden}>?</span>
            )}
          </Row>
        </dl>
        <p
          className={[
            styles.verdict,
            revealed ? styles.verdictOn : "",
            result.correct ? styles.verdictRight : styles.verdictWrong,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
        >
          {revealed ? (
            result.correct ? (
              <>
                <FaIcon name="check" fontSize="12px" />
                Right!
              </>
            ) : (
              <>
                <FaIcon name="xmark" fontSize="12px" />
                Really
                <span
                  className={styles.guessDot}
                  style={{ background: labelFill(indexOf(result.actual)) }}
                  aria-hidden
                />
                {result.actual}
              </>
            )
          ) : (
            " "
          )}
        </p>
      </div>
    </Face>
  );
}

/** Checking / done: the hollow dots on the tree, counted. */
function ScoreCard({ on, right, total }: { on: boolean; right: number; total: number }) {
  const percent = total ? Math.round((right / total) * 100) : 0;
  return (
    <Face on={on} overline="Accuracy">
      <p className={styles.hero}>
        <span className={`${styles.heroNumber} ${styles.heroSuccess}`}>{percent}%</span>
        <span className={styles.heroNoun}>right</span>
      </p>
      <dl className={styles.rows}>
        <Row term="Right">
          <span className={`${styles.tally} ${styles.tallyRight}`}>
            <FaIcon name="check" fontSize="10px" />
            {right}
          </span>
        </Row>
        <Row term="Wrong">
          <span className={`${styles.tally} ${styles.tallyWrong}`}>
            <FaIcon name="xmark" fontSize="10px" />
            {total - right}
          </span>
        </Row>
      </dl>
    </Face>
  );
}

/** Right guesses first, the miss last: the idea lands before the twist. */
function orderQuiz(sample: AiLabHoldoutResult[]): AiLabHoldoutResult[] {
  return sample.slice().sort((a, b) => Number(!a.correct) - Number(!b.correct));
}

/**
 * Evenly spaced rows across the sheet, in sheet order, with at least one
 * miss when the model has any — a perfect-looking sample would hide the
 * point of Testing.
 */
function pickSample(results: AiLabHoldoutResult[], size: number): AiLabHoldoutResult[] {
  const n = results.length;
  if (n <= size) return results.slice();
  const picks = Array.from({ length: size }, (_, i) =>
    Math.min(n - 1, Math.floor(((i + 0.5) * n) / size)),
  );
  const picked = picks.map((index) => results[index]!);
  if (!picked.some((result) => !result.correct)) {
    const firstWrong = results.findIndex((result) => !result.correct);
    if (firstWrong >= 0) {
      const slot = picks.findIndex((index) => index >= firstWrong);
      picked[slot >= 0 ? slot : size - 1] = results[firstWrong]!;
      picked.sort((a, b) => a.rowIndex - b.rowIndex);
    }
  }
  return picked;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
