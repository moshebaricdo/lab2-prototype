import { type ReactNode } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { TrainingRowWalkProps } from "./TrainingModalShell";
import {
  type QuizRow,
  type TrainingStageProps,
  type TrainingWalk,
  type WalkState,
} from "./trainingWalk";
import { labelFill } from "./viz/labelPalette";
import { SortingTree } from "./viz/SortingTree";
import styles from "./TrainingRowWalk.module.scss";

/**
 * The first sort-and-quiz layout: a narrated left panel beside the tree.
 * The lab now plays `TreeTableRow`; this stage stays as the training
 * sandbox's **Baseline** variant.
 *
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
export function TrainingRowWalkStage({ data, walk, state, instant }: TrainingStageProps) {
  const { columns, features, labels, rowNoun, rows, titleColumn } = data;
  const { model, score, indexOf, quiz, tally, labelName } = walk;
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
  );
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
export function Legend({
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
  model: TrainingWalk["model"];
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

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
