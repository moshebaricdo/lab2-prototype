import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { columnById, formatCell } from "../../../../lib/aiLab";
import type { AiLabColumn } from "../../../../types/aiLab";
import { PredictionStatement } from "./PredictionStatement";
import {
  TrainingModalShell,
  type TrainingRowWalkProps,
} from "./TrainingModalShell";
import {
  GUESS_DELAY_MS,
  GUESS_FLY_MS,
  useTrainingWalk,
  useWalkPlayback,
  type TallyEntry,
  type TrainingStageProps,
  type WalkState,
} from "./trainingWalk";
import { labelFill, OTHER_LABEL_INDEX } from "./viz/labelPalette";
import { PanZoomTools, usePanZoom } from "./viz/PanZoom";
import {
  SortingTree,
  traceMs,
  useSortingModel,
  type SortingMarbleStyle,
} from "./viz/SortingTree";
import styles from "./TreeTableRow.module.scss";

/**
 * `"rider"` draws the taken connectors with a grey marble on the line's tip
 * (it takes the leaf's color on the last line); `"trace"` is the line alone;
 * `"marble"` is the old rolling "?" dot.
 */
const MARBLE_STYLE: SortingMarbleStyle = "rider";
/**
 * The guess leaves the leaf after its bounce and lands in the label cell;
 * the cell fills in (and takes the bold) as it lands.
 */
const GUESS_LAND_MS = GUESS_DELAY_MS + Math.round(GUESS_FLY_MS * 0.9);
/** How far the flight bows up between the leaf and the cell. */
const FLY_ARC = 28;
/** Tree features shown in the strip; wider trees keep the first few. */
const MAX_FEATURES = 5;
/** Folded labels the "+N more" tooltip names before it says "and N more". */
const FOLDED_TOOLTIP_MAX = 24;
/**
 * Tree canvas height, dock included (Figma `mainContent` plus the dock), so
 * the modal never resizes.
 */
const CANVAS_HEIGHT = 437;
/** The test row's dock over the canvas bottom. Mirrored by `.dock` in the SCSS. */
const DOCK_HEIGHT = 57;
/**
 * Canvas inset on top and bottom, inside which the tree is centered (on top
 * of the stage's own 20px padding). Mirrored by `.canvas` in the SCSS.
 */
const CANVAS_PAD_Y = 12;
/** How far past its layout size a small tree may grow to fill the canvas. */
const MAX_TREE_SCALE = 1.35;
/**
 * The tree rescales on the sheet's own timing (`.sheetLayer` /
 * `.sheetLayerOn` in the SCSS), so it gives way as the row rises and fills
 * back in as it drops.
 */
const SHEET_IN = "285ms cubic-bezier(0.2, 0.8, 0.2, 1)";
const SHEET_OUT = "185ms cubic-bezier(0.4, 0, 1, 1)";

/**
 * Modal chrome this stage is designed for. The lab's modal and the
 * training sandbox both read it, so the two can't drift.
 */
export const TABLE_ROW_SHELL = {
  maxWidth: 800,
  flush: true,
  /** The stage draws the sentence itself (with the phase status on its right). */
  hideStatement: true,
  persistentBack: true,
} as const;

/** The phase word lives in the modal title. */
export function tableRowTitle(state: WalkState): string {
  return state.act === "training"
    ? "Training your model"
    : "Testing your model";
}

/**
 * The lab's decision-tree training modal (default `trainingAnimation`):
 * plays the sort-and-quiz beats on timers through `TreeTableRow`.
 */
export function TrainingTableRow(props: TrainingRowWalkProps) {
  const { open, onClose, onTest, columns, labelColumn, features, canTest } =
    props;
  const walk = useTrainingWalk(props);
  const { state, instant, skip } = useWalkPlayback(open, walk);
  return (
    <TrainingModalShell
      {...TABLE_ROW_SHELL}
      open={open}
      title={tableRowTitle(state)}
      onClose={onClose}
      onTest={onTest}
      columns={columns}
      labelColumn={labelColumn}
      features={features}
      canTest={canTest}
      done={state.act === "done"}
      onSkip={skip}
    >
      <TreeTableRow data={props} walk={walk} state={state} instant={instant} />
    </TrainingModalShell>
  );
}

/**
 * Sort and quiz from the AI Lab 2 Figma (Training/Testing Modal). The
 * Predict … based on … sentence and the label key sit over the tree for the
 * whole run; while testing, the test row rises into a dock under the tree as
 * a cut of the Data Set sheet, next to the leaf it lands in (label cell blank
 * until the row lands, then the guess with a check or an x). The phase word
 * is the modal title; the tree uses the compact look.
 */
export function TreeTableRow({
  data,
  walk,
  state,
  instant,
}: TrainingStageProps) {
  const {
    tree,
    columns,
    labels,
    labelColumn,
    features,
    rowNoun,
    rows,
    titleColumn,
  } = data;
  const { score, quiz, tally, labelName } = walk;
  const model = useSortingModel(tree, rows, labelColumn, labels, "compact");
  const current = state.quiz >= 0 ? quiz[state.quiz] : undefined;
  const row = current ? rows[current.result.rowIndex] : undefined;

  const treeFeatures = useMemo(() => {
    const seen: string[] = [];
    model.splits.forEach((split) => {
      if (
        split.node.type === "decision" &&
        !seen.includes(split.node.feature)
      ) {
        seen.push(split.node.feature);
      }
    });
    return seen.slice(0, MAX_FEATURES);
  }, [model.splits]);

  const revealed = current !== undefined && state.revealed > state.quiz;
  /** The cell grades itself the moment the guess lands, not at the reveal beat. */
  const wrong = current !== undefined && !current.result.correct;
  /** The question the row just answered: bold in its cell while its edge label is lit. */
  const askedNode =
    current && state.step >= 1
      ? model.layout.byKey.get(current.pathKeys[state.step - 1]!)?.node
      : undefined;
  const askedFeature =
    askedNode?.type === "decision" ? askedNode.feature : undefined;
  /**
   * Once the guess fills in (after the leaf's bounce), it is the row's one
   * bold value; the last question's bold drops at the same moment.
   */
  const activeFeature = state.guessed ? undefined : askedFeature;
  /**
   * Stays bold until the next edge label lights (or the guess fills in),
   * so the bold hands off rather than blinking.
   */
  const handingOff =
    current && state.step >= 2
      ? model.layout.byKey.get(current.pathKeys[state.step - 2]!)?.node
      : undefined;
  const previousFeature = state.guessed
    ? askedFeature
    : handingOff?.type === "decision"
      ? handingOff.feature
      : undefined;
  const boldDelayMs = state.guessed
    ? GUESS_LAND_MS
    : MARBLE_STYLE !== "marble"
      ? traceMs(state.travelMs)
      : 0;
  const boldDelay =
    boldDelayMs > 0 && !instant
      ? { transitionDelay: `${boldDelayMs}ms` }
      : undefined;
  /* The sheet stays mounted from the first test row on so it can slide back
     down out of the dock at the score step. */
  const hasRow =
    state.act !== "training" && current !== undefined && row !== undefined;
  const sheetOn = hasRow && !state.checked;
  const headerName = (id: string) => columnById(columns, id)?.name ?? id;
  const noun = (count: number) => `${rowNoun}${count === 1 ? "" : "s"}`;
  const perDot = Math.round(model.rowsPerDot);
  /* Explorable once the run is over; nodes stay plain (no click, no modal). */
  const panZoom = usePanZoom(state.act === "done", "Finished decision tree");
  const greyTaken = tally.some((entry) => entry.fill === NEUTRAL_FILL);

  const boardRef = useRef<HTMLDivElement>(null);
  const labelCellRef = useRef<HTMLTableCellElement>(null);
  const flight = useGuessFlight({
    boardRef,
    labelCellRef,
    leafKey: current?.pathKeys[current.pathKeys.length - 1],
    flyKey:
      sheetOn && current && state.guessed && !instant
        ? `${state.quiz}`
        : undefined,
    label: current?.result.predicted ?? "",
    fill: current
      ? labelFill(model.grouping.indexOf(current.result.predicted))
      : NEUTRAL_FILL,
  });

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${instant ? styles.instant : ""}`}
    >
      {flight}
      <div className={styles.statement}>
        <PredictionStatement
          columns={columns}
          labelColumn={labelColumn}
          features={features}
          size="large"
          fit
        />
        {state.checked ? (
          <span className={styles.accuracy}>
            {score.total > 0
              ? Math.round((score.right / score.total) * 100)
              : 0}
            % Accuracy
          </span>
        ) : (
          <span key={state.act} className={styles.phase} role="status">
            {state.act === "training" ? "Training" : "Testing"}
            <FaIcon name="spinner" fontSize="14px" className={styles.spinner} />
          </span>
        )}
      </div>
      <div
        className={`${styles.legend} ${state.legend ? styles.legendOn : ""}`}
        aria-label={`${labelName} colors`}
      >
        <LegendKeys tally={tally} />
        <ul className={`${styles.legendItems} ${styles.legendScale}`}>
          {state.checked && score.right < score.total ? (
            <li className={styles.legendItem}>
              <span
                className={`${styles.legendDot} ${styles.legendDotWrong}`}
                aria-hidden
              />
              wrong guess
            </li>
          ) : null}
          <li className={styles.legendItem}>
            {/* Grey already names a label (or the folded rest), so the scale key goes dotless. */}
            {greyTaken ? null : (
              <span
                className={`${styles.legendDot} ${styles.legendDotNeutral}`}
                aria-hidden
              />
            )}
            {perDot <= 1
              ? `1 dot = 1 ${rowNoun}`
              : `1 dot ≈ ${perDot.toLocaleString()} ${noun(perDot)}`}
          </li>
        </ul>
      </div>
      <div
        {...panZoom.frameProps}
        className={`${styles.field} ${panZoom.frameProps.className}`}
        style={{ height: CANVAS_HEIGHT }}
      >
        <PanZoomTools panZoom={panZoom} />
        <div
          className={`${styles.canvas} ${sheetOn ? styles.canvasDocked : ""}`}
        >
          <div {...panZoom.contentProps}>
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
                      revealedLabel: revealed
                        ? current.result.actual
                        : undefined,
                      answering: state.guessed,
                      travelMs: state.travelMs,
                    }
                  : undefined
              }
              instant={instant}
              maxHeight={
                CANVAS_HEIGHT - CANVAS_PAD_Y * 2 - (sheetOn ? DOCK_HEIGHT : 0)
              }
              maxScale={MAX_TREE_SCALE}
              resizeTransition={sheetOn ? SHEET_IN : SHEET_OUT}
              askOnArrival
              labelSwatch={false}
              marbleStyle={MARBLE_STYLE}
              ariaLabel={`Decision tree sorting ${rows.length.toLocaleString()} ${noun(rows.length)} into groups by ${headerName(labelColumn)}`}
            />
          </div>
        </div>
        <div className={styles.dock}>
          <div
            className={`${styles.sheetLayer} ${sheetOn ? styles.sheetLayerOn : ""}`}
            aria-hidden={!sheetOn || undefined}
          >
            {hasRow && current && row ? (
              <table
                className={styles.sheet}
                aria-label={`Row ${current.result.rowIndex + 1} from the table`}
              >
                <thead>
                  <tr>
                    <th className={styles.thIndex} />
                    {titleColumn ? (
                      <th className={styles.th}>{headerName(titleColumn)}</th>
                    ) : null}
                    {treeFeatures.map((feature) => (
                      <th
                        key={feature}
                        className={`${styles.th} ${styles.thFeature} ${isNumeric(columns, feature) ? styles.numeric : ""}`}
                      >
                        {headerName(feature)}
                      </th>
                    ))}
                    <th className={`${styles.th} ${styles.thLabel}`}>
                      {labelName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tdIndex}>
                      {current.result.rowIndex + 1}
                    </td>
                    {titleColumn ? (
                      <td className={styles.td}>
                        {row[titleColumn] === undefined
                          ? "—"
                          : formatCell(row[titleColumn]!)}
                      </td>
                    ) : null}
                    {treeFeatures.map((feature) => (
                      <td
                        key={feature}
                        className={[
                          styles.td,
                          styles.tdFeature,
                          isNumeric(columns, feature) ? styles.numeric : "",
                          feature === activeFeature ? styles.tdAsked : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={
                          feature === activeFeature ||
                          feature === previousFeature
                            ? boldDelay
                            : undefined
                        }
                      >
                        {row[feature] === undefined
                          ? "—"
                          : formatCell(row[feature]!)}
                      </td>
                    ))}
                    <td
                      ref={labelCellRef}
                      className={`${styles.td} ${styles.tdLabel}`}
                    >
                      {state.guessed ? (
                        <span
                          className={`${styles.guess} ${styles.guessEnter}`}
                          style={
                            instant
                              ? undefined
                              : { animationDelay: `${GUESS_LAND_MS}ms` }
                          }
                        >
                          <FaIcon
                            name={wrong ? "circle-xmark" : "circle-check"}
                            fontSize="12px"
                          />
                          {current.result.predicted}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const NEUTRAL_FILL = labelFill(OTHER_LABEL_INDEX);

interface Flight {
  key: string;
  label: string;
  fill: string;
  /** The leaf's title, board coordinates. */
  from: { x: number; y: number; height: number };
  /** Where the guess's text starts in the label cell (vertical center). */
  to: { x: number; y: number };
}

/**
 * The guess flies from the leaf's title into the row's label cell, so the
 * row reads as the thing the tree just answered for. Rendered at the cell
 * and animated back from the leaf; the cell's own guess fades in under it
 * as it lands (`GUESS_LAND_MS`).
 */
function useGuessFlight({
  boardRef,
  labelCellRef,
  leafKey,
  flyKey,
  label,
  fill,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  labelCellRef: RefObject<HTMLTableCellElement | null>;
  leafKey: string | undefined;
  flyKey: string | undefined;
  label: string;
  fill: string;
}) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const flyerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const board = boardRef.current;
    const cell = labelCellRef.current;
    const title =
      leafKey && board
        ? board.querySelector(
            `[data-node-key="${CSS.escape(leafKey)}"] [data-node-title]`,
          )
        : null;
    if (!flyKey || !board || !cell || !title) {
      setFlight((was) => (was ? null : was));
      return;
    }
    const b = board.getBoundingClientRect();
    const s = title.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(cell).paddingLeft) || 0;
    setFlight({
      key: flyKey,
      label,
      fill,
      from: { x: s.left - b.left, y: s.top - b.top, height: s.height },
      to: { x: c.left - b.left + pad, y: c.top - b.top + c.height / 2 },
    });
    /* Measured once per guess; the label and fill belong to that guess. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey, leafKey]);

  useLayoutEffect(() => {
    const el = flyerRef.current;
    if (!el || !flight) return;
    const { from, to } = flight;
    const text = el.querySelector<HTMLElement>("[data-flyer-text]");
    const textLeft = text ? text.offsetLeft : 0;
    const scale = Math.min(
      1.6,
      Math.max(0.7, from.height / Math.max(1, text?.offsetHeight ?? 1)),
    );
    const dx = from.x - (el.offsetLeft + textLeft * scale);
    const dy = from.y + from.height / 2 - to.y;
    const at = (x: number, y: number, s: number) =>
      `translate(${x}px, calc(-50% + ${y}px)) scale(${s})`;
    const fly = el.animate(
      [
        { transform: at(dx, dy, scale), opacity: 0 },
        { offset: 0.1, transform: at(dx, dy - 4, scale), opacity: 1 },
        {
          offset: 0.5,
          transform: at(dx * 0.5, dy * 0.5 - FLY_ARC, (scale + 1) / 2 + 0.06),
          opacity: 1,
        },
        { offset: 0.9, transform: at(0, 0, 1), opacity: 1 },
        { transform: at(0, 0, 1), opacity: 0 },
      ],
      {
        duration: GUESS_FLY_MS,
        delay: GUESS_DELAY_MS,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      },
    );
    return () => fly.cancel();
  }, [flight]);

  if (!flight) return null;
  return (
    <span
      key={flight.key}
      ref={flyerRef}
      className={styles.flyer}
      style={{ left: flight.to.x, top: flight.to.y }}
      aria-hidden
    >
      <span className={styles.flyerDot} style={{ background: flight.fill }} />
      <span data-flyer-text>{flight.label}</span>
    </span>
  );
}

/** A blank cell is still a label; give it a name the key can show. */
function keyName(label: string): string {
  return label.trim() === "" ? "(blank)" : label;
}

/** Tooltip copy for the overflow entry; very long tails end in "and N more". */
function overflowSummary(names: string[]): string {
  const shown = names.slice(0, FOLDED_TOOLTIP_MAX);
  const hidden = names.length - shown.length;
  return hidden > 0
    ? `${shown.join(", ")}, and ${hidden} more`
    : shown.join(", ");
}

/**
 * The label key on one line: as many entries as fit, then "+N more" whose
 * tooltip names the rest (the statement's `StatementFeatureTags` treatment).
 * Labels already folded past the palette ride in the same overflow; its dot
 * is Other's grey only then, since those are the grey dots in the tree.
 * Widths come from an invisible copy of every entry, re-measured on resize.
 */
function LegendKeys({ tally }: { tally: TallyEntry[] }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const measureRef = useRef<HTMLLIElement>(null);
  const named = tally.filter((entry) => !entry.folded);
  const paletteFolded = tally.find((entry) => entry.folded)?.folded ?? [];
  const [visibleCount, setVisibleCount] = useState(named.length);
  const key = tally
    .map((entry) => `${entry.label}:${entry.count}`)
    .join("\u0000");

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const run = () => {
      const style = getComputedStyle(row);
      const available =
        row.clientWidth -
        (Number.parseFloat(style.paddingLeft) || 0) -
        (Number.parseFloat(style.paddingRight) || 0);
      if (available <= 0) return;
      const gap = Number.parseFloat(style.columnGap) || 0;
      const items = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-measure=key]"),
      );
      const moreWidth =
        measure.querySelector<HTMLElement>("[data-measure=more]")
          ?.offsetWidth ?? 0;
      for (let visible = named.length; visible >= 0; visible -= 1) {
        const hidden = named.length - visible + paletteFolded.length;
        let used = 0;
        for (let index = 0; index < visible; index += 1) {
          if (index > 0) used += gap;
          used += items[index]?.offsetWidth ?? 0;
        }
        if (hidden > 0) used += (visible > 0 ? gap : 0) + moreWidth;
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
    // `key` stands in for `tally`, which is rebuilt with the walk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const shown = named.slice(0, visibleCount);
  const overflow = [
    ...named
      .slice(visibleCount)
      .map(
        (entry) => `${keyName(entry.label)} (${entry.count.toLocaleString()})`,
      ),
    ...paletteFolded.map(keyName),
  ];
  const entry = (item: TallyEntry) => (
    <>
      <span
        className={styles.legendDot}
        style={{ background: item.fill }}
        aria-hidden
      />
      {keyName(item.label)} ({item.count.toLocaleString()})
    </>
  );

  return (
    <ul ref={rowRef} className={`${styles.legendItems} ${styles.legendKeys}`}>
      {shown.map((item) => (
        <li key={item.label} className={styles.legendItem}>
          {entry(item)}
        </li>
      ))}
      {overflow.length > 0 ? (
        <li className={styles.legendItem}>
          {paletteFolded.length > 0 ? (
            <span
              className={styles.legendDot}
              style={{ background: NEUTRAL_FILL }}
              aria-hidden
            />
          ) : null}
          <Tooltip title={overflowSummary(overflow)} placement="bottom">
            <span
              className={styles.legendMore}
              tabIndex={0}
              aria-label={`${overflow.length} more: ${overflowSummary(overflow)}`}
            >
              +{overflow.length} more
            </span>
          </Tooltip>
        </li>
      ) : null}
      <li ref={measureRef} className={styles.legendMeasure} aria-hidden>
        {named.map((item) => (
          <span
            key={item.label}
            className={styles.legendItem}
            data-measure="key"
          >
            {entry(item)}
          </span>
        ))}
        <span className={styles.legendItem} data-measure="more">
          <span className={styles.legendDot} aria-hidden />
          <span className={styles.legendMore}>
            +{Math.max(tally.length + paletteFolded.length, 99)} more
          </span>
        </span>
      </li>
    </ul>
  );
}

function isNumeric(columns: AiLabColumn[], id: string): boolean {
  return columnById(columns, id)?.type === "numerical";
}
