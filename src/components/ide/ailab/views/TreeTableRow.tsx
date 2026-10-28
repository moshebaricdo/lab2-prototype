import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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
  DOT_EASE_VALUES,
  GUESS_DELAY_MS,
  GUESS_FLY_MS,
  GROW_SLOW,
  intakeTiming,
  useTrainingWalk,
  useWalkPlayback,
  type IntakeTiming,
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
  withSplitOrder,
  type SortingMarbleStyle,
} from "./viz/SortingTree";
import { SplitScan } from "./viz/SplitScan";
import { ReelRow, TableIntro } from "./TableIntro";
import styles from "./TreeTableRow.module.scss";

/**
 * `"rider"` draws the taken connectors with a grey marble on the line's tip
 * (it takes the leaf's color on the last line); `"trace"` is the line alone;
 * `"marble"` is the old rolling "?" dot.
 */
const MARBLE_STYLE: SortingMarbleStyle = "rider";
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
  const { state, instant, skip, paused, togglePause, restart } =
    useWalkPlayback(open, walk);
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
      playback={{ paused, onTogglePause: togglePause, onRestart: restart }}
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
  speed = 1,
  scanMeter,
}: TrainingStageProps & {
  /** `scan` story: show the "how well it sorts" bar under each try. */
  scanMeter?: boolean;
}) {
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
  const { score, quiz, tally, labelName, story, scanPlan, growPlan, params } = walk;
  const timeScale = params.scaleCssWithSpeed && speed !== 1 ? 1 / speed : 1;
  const scaleMs = (ms: number) => Math.max(0, Math.round(ms * timeScale));
  const resolvedScanMeter = scanMeter ?? params.scanMeter;
  const marbleStyle = params.marbleStyle ?? MARBLE_STYLE;
  const guessDelayMs = scaleMs(params.guessDelayMs ?? GUESS_DELAY_MS);
  const guessFlyMs = scaleMs(params.guessFlyMs ?? GUESS_FLY_MS);
  const guessLandMs = guessDelayMs + Math.round(guessFlyMs * 0.9);
  const flyArcPx = params.flyArcPx ?? FLY_ARC;
  const sheetInMs = scaleMs(params.sheetInMs ?? 285);
  const sheetOutMs = scaleMs(params.sheetOutMs ?? 185);
  const sheetInTransition = `${sheetInMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  const sheetOutTransition = `${sheetOutMs}ms cubic-bezier(0.4, 0, 1, 1)`;

  const baseModel = useSortingModel(
    tree,
    rows,
    labelColumn,
    labels,
    params.look ?? "compact",
    columns,
    {
      maxDots: params.maxDots,
      dotScale: params.dotScale,
      levelGap: params.levelGap,
      bendRatio: params.bendRatio,
    },
  );
  const slowCount = growPlan
    ? Math.min(params.growSlowCount ?? GROW_SLOW, growPlan.arrivals.length)
    : 0;
  /* `grow` asks its questions in the order rows first mixed their piles; the
     slow rows' dots are handed off by the row morphing onto them. */
  const model = useMemo(
    () =>
      growPlan
        ? withSplitOrder(baseModel, growPlan.order, growPlan.arrival, slowCount)
        : baseModel,
    [baseModel, growPlan, slowCount],
  );
  const current = state.quiz >= 0 ? quiz[state.quiz] : undefined;
  const row = current ? rows[current.result.rowIndex] : undefined;
  const scanning = scanPlan && state.scan >= 0 ? scanPlan[state.scan] : undefined;
  const growing = growPlan !== undefined && state.act === "training";
  const intakeRank = growing && state.intake >= 0 ? state.intake : -1;
  /* The top dock keeps its last row mounted so it can slide back up at the pour. */
  const dockRank =
    intakeRank >= 0
      ? intakeRank
      : growing && (state.dotsShown ?? 0) > 0 && slowCount > 0
        ? slowCount - 1
        : -1;
  const dockDot =
    growPlan && dockRank >= 0
      ? model.dots[growPlan.arrivals[dockRank]!]
      : undefined;
  const dockRecord = dockDot ? rows[dockDot.rowIndex] : undefined;
  /* The intro's wheel lands on this row, exactly where the dock shows it. */
  const firstDot = growPlan ? model.dots[growPlan.arrivals[0]!] : undefined;
  const topOn = intakeRank >= 0 && dockRecord !== undefined;
  const baseTiming = intakeTiming(Math.max(0, dockRank), walk.intro, params);
  const unscaledTiming =
    dockRank === 0 && growPlan?.hold
      ? { ...baseTiming, settle: baseTiming.settle + growPlan.hold }
      : baseTiming;
  const timing: IntakeTiming = {
    settle: scaleMs(unscaledTiming.settle),
    scan: scaleMs(unscaledTiming.scan),
    fly: scaleMs(unscaledTiming.fly),
    gap: scaleMs(unscaledTiming.gap),
  };
  const intakeFill = dockDot
    ? labelFill(model.grouping.indexOf(dockDot.label))
    : NEUTRAL_FILL;
  const rowsIn =
    growPlan &&
    state.act === "training" &&
    state.dotsShown !== undefined &&
    state.dotsShown > 0
      ? Math.min(rows.length, Math.round(state.dotsShown * model.rowsPerDot))
      : undefined;

  const treeFeatures = useMemo(() => {
    const seen: string[] = [];
    baseModel.splits.forEach((split) => {
      if (
        split.node.type === "decision" &&
        !seen.includes(split.node.feature)
      ) {
        seen.push(split.node.feature);
      }
    });
    return seen.slice(0, MAX_FEATURES);
  }, [baseModel.splits]);
  const growFeatures = useMemo(
    () => features.slice(0, MAX_FEATURES),
    [features],
  );

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
    ? guessLandMs
    : marbleStyle !== "marble"
      ? traceMs(state.travelMs, params.connectorShare, scaleMs(params.traceExtraMs))
      : 0;
  const boldDelay =
    boldDelayMs > 0 && !instant
      ? { transitionDelay: `${boldDelayMs}ms` }
      : undefined;
  /* The sheet stays mounted from the first test row on so it can slide back
     down out of the dock at the score step. */
  const hasTest =
    state.act !== "training" && current !== undefined && row !== undefined;
  const sheetOn = hasTest && !state.checked;
  const docked = sheetOn || topOn;
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
    delayMs: guessDelayMs,
    durationMs: guessFlyMs,
    arcPx: flyArcPx,
  });
  /** One cut of the Data Set sheet: header plus a single row. */
  const sheet = (
    record: Record<string, string | number>,
    index: number,
    ariaLabel: string,
    sheetFeatures: string[],
    rowProps: {
      key?: string | number;
      className?: string;
      style?: CSSProperties;
      featureClass?: (feature: string) => string;
      featureStyle?: (feature: string) => CSSProperties | undefined;
      labelRef?: RefObject<HTMLTableCellElement | null>;
      label: ReactNode;
    },
  ) => {
    const leadTitle =
      titleColumn &&
      titleColumn !== labelColumn &&
      !sheetFeatures.includes(titleColumn)
        ? titleColumn
        : undefined;
    return (
      <table className={styles.sheet} aria-label={ariaLabel}>
        <thead>
          <tr>
            <th className={styles.thIndex} />
            {leadTitle ? (
              <th className={styles.th}>{headerName(leadTitle)}</th>
            ) : null}
            {sheetFeatures.map((feature) => (
              <th
                key={feature}
                className={`${styles.th} ${styles.thFeature} ${isNumeric(columns, feature) ? styles.numeric : ""}`}
              >
                {headerName(feature)}
              </th>
            ))}
            <th className={`${styles.th} ${styles.thLabel}`}>{labelName}</th>
          </tr>
        </thead>
        <tbody>
          <tr key={rowProps.key} className={rowProps.className} style={rowProps.style}>
            <td className={styles.tdIndex}>{index + 1}</td>
            {leadTitle ? (
              <td className={styles.td}>{cellText(record[leadTitle])}</td>
            ) : null}
            {sheetFeatures.map((feature) => (
              <td
                key={feature}
                className={[
                  styles.td,
                  styles.tdFeature,
                  isNumeric(columns, feature) ? styles.numeric : "",
                  rowProps.featureClass?.(feature) ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={rowProps.featureStyle?.(feature)}
              >
                {cellText(record[feature])}
              </td>
            ))}
            <td ref={rowProps.labelRef} className={`${styles.td} ${styles.tdLabel}`}>
              {rowProps.label}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${instant ? styles.instant : ""}`}
      style={
        {
          "--sheet-in-ms": `${sheetInMs}ms`,
          "--sheet-out-ms": `${sheetOutMs}ms`,
          "--node-enter-ms": `${scaleMs(params.nodeEnterMs)}ms`,
        } as CSSProperties
      }
    >
      {flight}
      {growPlan && intakeRank >= 0 && dockDot && !instant ? (
        <IntakeDrop
          key={intakeRank}
          boardRef={boardRef}
          dotId={dockDot.id}
          fill={intakeFill}
          timing={timing}
          landed={(state.dotsShown ?? 0) > intakeRank}
        />
      ) : null}
      {walk.intro && state.intro >= 0 ? (
        <TableIntro
          columns={columns}
          rows={rows}
          titleColumn={titleColumn}
          features={growFeatures}
          labelColumn={labelColumn}
          target={firstDot?.rowIndex ?? 0}
          fill={
            firstDot
              ? labelFill(model.grouping.indexOf(firstDot.label))
              : NEUTRAL_FILL
          }
          phase={state.intro}
          instant={instant}
          filterMs={scaleMs(params.introFilterMs)}
          scrollMs={scaleMs(params.introScrollMs)}
          spinRows={params.introSpinRows}
          overshootPx={params.introOvershootPx}
          shrinkFrom={params.introShrinkFrom}
        />
      ) : null}
      <div
        {...panZoom.frameProps}
        className={`${styles.field} ${panZoom.frameProps.className}`}
        style={{ height: CANVAS_HEIGHT }}
      >
        <PanZoomTools panZoom={panZoom} />
        <div
          className={[
            styles.canvas,
            sheetOn ? styles.canvasDocked : "",
            topOn ? styles.canvasDockedTop : "",
          ]
            .filter(Boolean)
            .join(" ")}
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
                CANVAS_HEIGHT - CANVAS_PAD_Y * 2 - (docked ? DOCK_HEIGHT : 0)
              }
              maxScale={params.maxTreeScale ?? MAX_TREE_SCALE}
              resizeTransition={docked ? sheetInTransition : sheetOutTransition}
              askOnArrival={story === "scan" ? "leaves" : true}
              incoming={intakeRank >= 0 ? intakeRank : undefined}
              pairedBranches={growPlan !== undefined && growPlan.growth !== "organic"}
              overlay={
                scanning ? (
                  <SplitScan
                    model={model}
                    plan={scanning}
                    candidate={state.candidate}
                    picked={state.picked}
                    meter={resolvedScanMeter}
                    columns={columns}
                    previewDots={params.scanPreviewDots}
                  />
                ) : undefined
              }
              labelSwatch={false}
              marbleStyle={marbleStyle}
              dotGlideMs={scaleMs(params.dotGlideMs)}
              dotEase={DOT_EASE_VALUES[params.dotEase] ?? DOT_EASE_VALUES.move}
              popStaggerMaxMs={scaleMs(params.popStaggerMaxMs)}
              moveStaggerMaxMs={scaleMs(params.moveStaggerMaxMs)}
              nodeEnterMs={scaleMs(params.nodeEnterMs)}
              connectorShare={params.connectorShare}
              traceExtraMs={scaleMs(params.traceExtraMs)}
              answerBounceMs={guessDelayMs}
              ariaLabel={`Decision tree sorting ${rows.length.toLocaleString()} ${noun(rows.length)} into groups by ${headerName(labelColumn)}`}
            />
          </div>
        </div>
        {growPlan ? (
          <div className={`${styles.dock} ${styles.dockTop}`}>
            <div
              className={`${styles.sheetLayer} ${styles.sheetLayerTop} ${topOn ? styles.sheetLayerOn : ""}`}
              aria-hidden={!topOn || undefined}
            >
              {dockRecord && dockDot
                ? sheet(
                    dockRecord,
                    dockDot.rowIndex,
                    `Row ${dockDot.rowIndex + 1} joining the tree`,
                    growFeatures,
                    {
                      key: dockRank,
                      label: (
                        <>
                          <span
                            className={styles.intakeDot}
                            style={{ background: intakeFill }}
                            data-intake-dot
                          />
                          {dockDot.label}
                        </>
                      ),
                    },
                  )
                : null}
              {topOn && dockRank > 0 && dockDot && growPlan && !instant ? (
                <DockReel
                  key={dockRank}
                  strip={reelStrip(
                    model.dots[growPlan.arrivals[dockRank - 1]!]!.rowIndex,
                    dockDot.rowIndex,
                    rows.length,
                  )}
                  durationMs={timing.settle}
                  renderRow={(rowIndex, position, last) => (
                    <ReelRow
                      key={position}
                      columns={columns}
                      record={rows[rowIndex]!}
                      rowIndex={rowIndex}
                      titleColumn={titleColumn}
                      features={growFeatures}
                      labelColumn={labelColumn}
                      dotFill={
                        position === 0
                          ? labelFill(
                              model.grouping.indexOf(
                                model.dots[growPlan.arrivals[dockRank - 1]!]!.label,
                              ),
                            )
                          : last
                            ? intakeFill
                            : undefined
                      }
                    />
                  )}
                />
              ) : null}
              {topOn ? (
                <div key={dockRank} className={styles.sweep} aria-hidden>
                  <span
                    className={styles.sweepBand}
                    style={{
                      animationDelay: `${timing.settle}ms`,
                      animationDuration: `${timing.scan}ms`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={styles.dock}>
          <div
            className={`${styles.sheetLayer} ${sheetOn ? styles.sheetLayerOn : ""}`}
            aria-hidden={!sheetOn || undefined}
          >
            {hasTest && row && current
              ? sheet(
                  row,
                  current.result.rowIndex,
                  `Row ${current.result.rowIndex + 1} from the table`,
                  treeFeatures,
                  {
                    featureClass: (feature) =>
                      feature === activeFeature ? styles.tdAsked : "",
                    featureStyle: (feature) =>
                      feature === activeFeature || feature === previousFeature
                        ? boldDelay
                        : undefined,
                    labelRef: labelCellRef,
                    label: state.guessed ? (
                      <span
                        className={`${styles.guess} ${styles.guessEnter}`}
                        style={
                          instant
                            ? undefined
                            : { animationDelay: `${guessLandMs}ms` }
                        }
                      >
                        <FaIcon
                          name={wrong ? "circle-xmark" : "circle-check"}
                          fontSize="12px"
                        />
                        {current.result.predicted}
                      </span>
                    ) : null,
                  },
                )
              : null}
          </div>
        </div>
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
            {rowsIn !== undefined ? (
              <span className={styles.phaseCount}>
                {rowsIn.toLocaleString()} of {rows.length.toLocaleString()}{" "}
                {noun(rows.length)}
              </span>
            ) : null}
            <FaIcon name="spinner" fontSize="14px" className={styles.spinner} />
          </span>
        )}
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
  delayMs = GUESS_DELAY_MS,
  durationMs = GUESS_FLY_MS,
  arcPx = FLY_ARC,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  labelCellRef: RefObject<HTMLTableCellElement | null>;
  leafKey: string | undefined;
  flyKey: string | undefined;
  label: string;
  fill: string;
  delayMs?: number;
  durationMs?: number;
  arcPx?: number;
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
          transform: at(dx * 0.5, dy * 0.5 - arcPx, (scale + 1) / 2 + 0.06),
          opacity: 1,
        },
        { offset: 0.9, transform: at(0, 0, 1), opacity: 1 },
        { transform: at(0, 0, 1), opacity: 0 },
      ],
      {
        duration: durationMs,
        delay: delayMs,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      },
    );
    return () => fly.cancel();
  }, [flight, durationMs, delayMs, arcPx]);

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

/**
 * `grow`: once the scanner is done, a copy of the label cell's dot drops
 * into the tree (the cell keeps its own), curving out sideways and then
 * down onto its pile. The target is
 * re-read every frame, so it ends on the dot's exact box even if the tree
 * rescales mid-flight, and it keeps tracking until the real dot takes over
 * with no fade (`model.handoff`).
 */
function IntakeDrop({
  boardRef,
  dotId,
  fill,
  timing,
  landed,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  dotId: number;
  fill: string;
  timing: IntakeTiming;
  landed: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let frame = 0;
    const timer = window.setTimeout(() => {
      const board = boardRef.current;
      const el = ref.current;
      const source = board?.querySelector("[data-intake-dot]");
      if (!board || !el || !source) {
        setDone(true);
        return;
      }
      const from = source.getBoundingClientRect();
      const start = performance.now();
      let finished = false;
      const tick = (now: number) => {
        const dot = board.querySelector(`[data-dot-id="${dotId}"]`);
        if (!dot) return;
        const b = board.getBoundingClientRect();
        const d = dot.getBoundingClientRect();
        const t = Math.min(1, (now - start) / timing.fly);
        const u = easeInOutCubic(t);
        /* Quadratic curve with its corner level with the cell, over the
           pile: out sideways first, then down. */
        const x0 = from.left + from.width / 2;
        const y0 = from.top + from.height / 2;
        const x2 = d.left + d.width / 2;
        const y2 = d.top + d.height / 2;
        const x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * x2 + u * u * x2;
        const y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * y0 + u * u * y2;
        const size = from.width + (d.width - from.width) * u;
        el.style.opacity = "1";
        el.style.left = `${x - size / 2 - b.left}px`;
        el.style.top = `${y - size / 2 - b.top}px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        if (t >= 1 && !finished) {
          finished = true;
          setDone(true);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, timing.settle + timing.scan);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    /* Measured once per row, when it lifts off. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done && landed) return null;
  return (
    <div
      ref={ref}
      className={styles.drop}
      style={{ background: fill }}
      aria-hidden
    />
  );
}

/** Rows flicking past between one dock row and the next. */
const REEL_FILLERS = 5;
/** Mirrors `.reelRow` in `TableIntro.module.scss` (28px face + 1px rule). */
const REEL_PITCH = 29;
/** How far the reel coasts past the new row before settling back. */
const REEL_OVERSHOOT = 5;

/** The old row, a few others, then the new one (row indexes). */
function reelStrip(from: number, to: number, rowCount: number): number[] {
  const fillers = Array.from(
    { length: REEL_FILLERS },
    (_, index) => (to + 7 * (index + 1) + 3) % Math.max(1, rowCount),
  );
  return [from, ...fillers, to];
}

/**
 * `grow`: between slow rows the dock spins like the intro's lotto wheel:
 * the old row slides up, a few rows flick by, and it slows onto the new
 * one. Covers the dock's data row while it spins; its last frame is that
 * row, so it simply goes.
 */
function DockReel({
  strip,
  durationMs,
  renderRow,
}: {
  strip: number[];
  durationMs: number;
  renderRow: (rowIndex: number, position: number, last: boolean) => ReactNode;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const land = -(strip.length - 1) * REEL_PITCH;

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const spin = el.animate(
      [
        { transform: "translateY(0)", easing: "cubic-bezier(0.25, 0.6, 0.3, 1)" },
        {
          offset: 0.86,
          transform: `translateY(${land - REEL_OVERSHOOT}px)`,
          easing: "cubic-bezier(0.3, 0, 0.3, 1)",
        },
        { transform: `translateY(${land}px)` },
      ],
      { duration: durationMs, fill: "forwards" },
    );
    spin.onfinish = () => setDone(true);
    return () => spin.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  return (
    <div className={styles.reel} aria-hidden>
      <div ref={stripRef}>
        {strip.map((rowIndex, position) =>
          renderRow(rowIndex, position, position === strip.length - 1),
        )}
      </div>
    </div>
  );
}

function easeInOutCubic(u: number): number {
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

function cellText(value: string | number | undefined): string {
  return value === undefined ? "—" : formatCell(value);
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
