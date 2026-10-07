import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow } from "../../../../types/aiLab";
import { Legend } from "./TrainingRowWalk";
import type { TrainingStageProps } from "./trainingWalk";
import { labelFill } from "./viz/labelPalette";
import { SortingTree } from "./viz/SortingTree";
import type { TreeLayout } from "./viz/treeLayout";
import styles from "./TreeRide.module.scss";

/**
 * Sort and quiz with no sidebar: the row's own values are the only text,
 * and they sit on the tree.
 *
 * - `lift`: each answer flies off the row card and lands on the branch it
 *   took, so the path reads in this row's values.
 * - `highlight`: the cell the question is reading and the branch it matches
 *   light up in the same color. Nothing else moves.
 *
 * Training opens on a few real rows, which stay while the dots pour into
 * the top pile and leave when the first question appears.
 */
export function TreeRide({ data, walk, state, instant, mode }: TrainingStageProps & { mode: "lift" | "highlight" }) {
  const { columns, labels, rowNoun, rows, titleColumn } = data;
  const { model, score, indexOf, quiz, tally, labelName } = walk;
  const count = `${rows.length} ${rowNoun}${rows.length === 1 ? "" : "s"}`;
  const current = state.quiz >= 0 ? quiz[state.quiz] : undefined;
  const row = current ? rows[current.result.rowIndex] : undefined;

  const treeFeatures = useMemo(() => {
    const features: string[] = [];
    model.splits.forEach((split) => {
      if (split.node.type === "decision" && !features.includes(split.node.feature)) {
        features.push(split.node.feature);
      }
    });
    return features.slice(0, 4);
  }, [model.splits]);

  const questions = useMemo(
    () =>
      current && row
        ? pathQuestions(model.layout, current.pathKeys, row, columns)
        : [],
    [current, row, model.layout, columns],
  );

  const phase =
    state.act === "training" ? "Training" : state.act === "testing" ? "Testing" : "Score";
  const showSheet = state.act === "training" && state.splitsShown === 0;
  const showCard = state.act === "testing" && current !== undefined && row !== undefined;
  const revealed = current !== undefined && state.revealed > state.quiz;

  const atKey = current && state.step >= 0 ? current.pathKeys[state.step] : undefined;
  const atNode = atKey ? model.layout.byKey.get(atKey) : undefined;
  const asking =
    mode === "highlight" && atNode?.node.type === "decision" ? state.step : -1;
  const hotEdgeKey =
    mode === "highlight" && atNode?.node.type === "decision"
      ? current?.pathKeys[state.step + 1]
      : undefined;

  const cellRefs = useRef<(HTMLElement | null)[]>([]);
  const anchorRefs = useRef<(HTMLElement | null)[]>([]);
  const [landed, setLanded] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const flyingIndex = flight ? state.step - 1 : -1;

  useLayoutEffect(() => {
    if (mode !== "lift") return;
    if (!showCard || instant || state.step < 1) {
      setFlight(null);
      setLanded(state.step);
      return;
    }
    const question = questions[state.step - 1];
    const from = question ? cellRefs.current[question.index]?.getBoundingClientRect() : undefined;
    const to = question ? anchorRefs.current[question.index]?.getBoundingClientRect() : undefined;
    if (!question || !from || !to || from.width === 0 || to.width === 0) {
      setFlight(null);
      setLanded(state.step);
      return;
    }
    setFlight({
      id: `${current?.result.rowIndex}:${state.step}`,
      from,
      to,
      text: question.value,
      duration: state.travelMs,
    });
    const timer = window.setTimeout(() => {
      setFlight(null);
      setLanded(state.step);
    }, state.travelMs);
    return () => window.clearTimeout(timer);
  }, [mode, showCard, instant, state.step, state.travelMs, questions, current?.result.rowIndex]);

  const activeLabels = new Set<string>();
  if (state.act === "testing" && current) {
    if (state.guessed) activeLabels.add(current.result.predicted);
    if (revealed) activeLabels.add(current.result.actual);
  }

  const name =
    row && current
      ? rowTitle(row, current.result.rowIndex, titleColumn, rowNoun)
      : "";

  return (
    <div className={styles.board}>
      <div className={styles.band}>
        <p className={styles.phase}>{phase}</p>
        <div className={styles.bandMain}>
          {showSheet ? (
            <Sheet
              rows={rows}
              columns={columns}
              features={treeFeatures}
              titleColumn={titleColumn}
              rowNoun={rowNoun}
            />
          ) : null}
          {showCard && current && row ? (
            <div className={styles.card} aria-label={name}>
              <span className={styles.cardName}>{name}</span>
              {questions.map((question) => (
                <span
                  key={question.index}
                  className={[
                    styles.cell,
                    question.index === asking ? styles.cellHot : "",
                    question.index === flyingIndex ? styles.cellFlying : "",
                    mode === "lift" && question.index < landed ? styles.cellSpent : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.cellName}>{question.featureName}</span>
                  <span
                    className={styles.cellValue}
                    ref={(el) => {
                      cellRefs.current[question.index] = el;
                    }}
                  >
                    {question.value}
                  </span>
                </span>
              ))}
              <LabelToken
                revealed={revealed}
                correct={current.result.correct}
                actual={current.result.actual}
                fill={labelFill(indexOf(current.result.actual))}
              />
            </div>
          ) : null}
          {state.checked ? (
            <p className={styles.score}>
              {score.right.toLocaleString()} of {score.total.toLocaleString()} right
            </p>
          ) : null}
        </div>
      </div>
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
                revealedLabel: revealed ? current.result.actual : undefined,
                answering: state.guessed,
                travelMs: state.travelMs,
              }
            : undefined
        }
        instant={instant}
        maxHeight={460}
        hotEdgeKey={hotEdgeKey}
        overlay={
          mode === "lift" ? (
            <>
              {questions.map((question) => (
                <span
                  key={question.index}
                  ref={(el) => {
                    anchorRefs.current[question.index] = el;
                  }}
                  className={`${styles.landed} ${!question.merge && question.index < landed ? styles.landedOn : ""}`}
                  style={{ left: question.x, top: question.y }}
                  title={`${question.featureName}: ${question.value}`}
                >
                  {question.value}
                </span>
              ))}
            </>
          ) : undefined
        }
        ariaLabel={`Decision tree sorting ${count} into groups by ${labelName}`}
      />
      <Legend
        labelName={labelName}
        tally={tally}
        rowsPerDot={model.rowsPerDot}
        active={activeLabels}
        showWrong={state.checked && score.right < score.total}
      />
      {flight ? <Flyer flight={flight} /> : null}
    </div>
  );
}

interface RideQuestion {
  index: number;
  featureName: string;
  value: string;
  /** The branch already says this, so the flying value joins it instead of parking a second copy. */
  merge: boolean;
  x: number;
  y: number;
}

/** One entry per question on this row's path, in the order it's asked. */
function pathQuestions(
  layout: TreeLayout,
  pathKeys: string[],
  row: AiLabDataRow,
  columns: AiLabColumn[],
): RideQuestion[] {
  const questions: RideQuestion[] = [];
  for (let index = 0; index < pathKeys.length - 1; index += 1) {
    const parent = layout.byKey.get(pathKeys[index]!);
    const child = layout.byKey.get(pathKeys[index + 1]!);
    if (!parent || !child || parent.node.type !== "decision") continue;
    const feature = parent.node.feature;
    const value = row[feature] === undefined ? "—" : formatCell(row[feature]!);
    const branch = (child.branchLabel ?? "").trim();
    const merge = value.toLowerCase() === branch.toLowerCase();
    const bottom = parent.y + parent.height;
    const midY = bottom + (child.y - bottom) * 0.45;
    const aligned = Math.abs(parent.cx - child.cx) < 8;
    questions.push({
      index: questions.length,
      featureName: columnById(columns, feature)?.name ?? feature,
      value,
      merge,
      // Same word as the branch: land on that label. A new word (a number
      // against "≤ 2.5") parks on the connector, clear of the label.
      x: merge ? child.cx : aligned ? parent.cx + 48 : (parent.cx + child.cx) / 2,
      y: merge ? child.y - 19 : midY - 18,
    });
  }
  return questions;
}

function Sheet({
  rows,
  columns,
  features,
  titleColumn,
  rowNoun,
}: {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  titleColumn?: string;
  rowNoun: string;
}) {
  const indexes = previewIndexes(rows.length, 3);
  const rest = rows.length - indexes.length;
  return (
    <div className={styles.sheetWrap}>
      <table className={styles.sheet}>
        <thead>
          <tr>
            <th />
            {features.map((feature) => (
              <th key={feature}>{columnById(columns, feature)?.name ?? feature}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {indexes.map((index) => {
            const row = rows[index]!;
            return (
              <tr key={index}>
                <th>{rowTitle(row, index, titleColumn, rowNoun)}</th>
                {features.map((feature) => (
                  <td key={feature}>{row[feature] === undefined ? "—" : formatCell(row[feature]!)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rest > 0 ? <span className={styles.more}>+{rest.toLocaleString()} more</span> : null}
    </div>
  );
}

function LabelToken({
  revealed,
  correct,
  actual,
  fill,
}: {
  revealed: boolean;
  correct: boolean;
  actual: string;
  fill: string;
}) {
  if (!revealed) {
    return (
      <span className={styles.labelCell}>
        <span className={styles.token}>?</span>
      </span>
    );
  }
  return (
    <span className={`${styles.labelCell} ${correct ? styles.labelRight : styles.labelWrong}`}>
      <span className={styles.swatch} style={{ background: fill }} />
      <span className={styles.actual}>{actual}</span>
      <FaIcon name={correct ? "check" : "xmark"} fontSize="12px" />
    </span>
  );
}

interface Flight {
  id: string;
  from: DOMRect;
  to: DOMRect;
  text: string;
  duration: number;
}

function Flyer({ flight }: { flight: Flight }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { from, to, duration } = flight;
    const fromX = from.left;
    const fromY = from.top;
    const toX = to.left + to.width / 2 - from.width / 2;
    const toY = to.top + to.height / 2 - from.height / 2;
    const anim = el.animate(
      [
        { transform: `translate(${fromX}px, ${fromY}px) scale(1)` },
        { transform: `translate(${toX}px, ${toY}px) scale(0.92)` },
      ],
      { duration, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" },
    );
    return () => anim.cancel();
  }, [flight]);
  return createPortal(
    <span
      ref={ref}
      className={styles.flyer}
      style={{
        width: flight.from.width,
        height: flight.from.height,
        transform: `translate(${flight.from.left}px, ${flight.from.top}px)`,
      }}
    >
      {flight.text}
    </span>,
    document.body,
  );
}

function previewIndexes(count: number, size: number): number[] {
  if (count <= size) return Array.from({ length: count }, (_, index) => index);
  return Array.from({ length: size }, (_, index) => Math.round((index * (count - 1)) / (size - 1)));
}

function rowTitle(row: AiLabDataRow, index: number, titleColumn: string | undefined, rowNoun: string): string {
  if (titleColumn && row[titleColumn] !== undefined) return formatCell(row[titleColumn]!);
  const noun = rowNoun.charAt(0).toUpperCase() + rowNoun.slice(1);
  return `${noun} ${index + 1}`;
}
