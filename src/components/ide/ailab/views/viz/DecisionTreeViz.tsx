import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type {
  AiLabColumn,
  AiLabTreeNode,
  AiLabTreeTrace,
} from "../../../../../types/aiLab";
import { columnById, formatCell } from "../../../../../lib/aiLab";
import { useElementSize } from "../../../../../hooks/useElementSize";
import { CanvasCards, CARD_INSET, type CanvasChrome } from "./CanvasCards";
import { DistributionBar, LabelSwatch, describeCounts } from "./LabelMarks";
import { labelFill, labelIndexer } from "./labelPalette";
import { NavigatorCard } from "./NavigatorCard";
import { type TraceStep } from "./TraceBar";
import { useStepPlayback, type StepPlayback } from "./useStepPlayback";
import {
  elbowPath,
  elbowPathVertical,
  layoutTree,
  NODE_SIZES,
  TREE_METRICS,
  treeRules,
  type LaidOutNode,
  type NodeDimensions,
  type NodeSize,
  type TreeBundle,
  type TreeBundleOptions,
  type TreeLink,
  type TreeOrientation,
} from "./treeLayout";
import { VizFrame } from "./VizFrame";
import styles from "./DecisionTreeViz.module.scss";

export type TreeView = "diagram" | "rules";

/** A split this wide (or wider) bundles same-prediction leaves when the flag is on. */
const BUNDLE_MIN_BRANCHES = 7;

/**
 * Rows-modal pills carry a disagree badge beside the row count; the extra
 * width keeps a label like "Mammal" from truncating. Nothing grows in place
 * in this mode, so no detail card needs to share the width.
 */
const MODAL_NODE_WIDTH = 224;

interface DecisionTreeVizProps {
  root: AiLabTreeNode;
  columns: AiLabColumn[];
  /** Every label value in palette order. */
  labels: string[];
  trace: AiLabTreeTrace | undefined;
  view: TreeView;
  /**
   * Canvas layout: the floating NavigatorCard is replaced by a trace toolbar,
   * the dashboard's input card, and an end-state prediction card.
   */
  canvasChrome?: CanvasChrome;
  /** Fold same-prediction leaves under wide splits into one bundle per outcome. */
  bundleWideSplits?: boolean;
  /**
   * Walk a new prediction's path from the root instead of landing on the
   * answer. The toolbar's Play / Skip mirrors the walk.
   */
  autoPlay?: boolean;
  /** Fires as the walk starts / ends so the dashboard can hold new inputs until it is over. */
  onPlayingChange?: (playing: boolean) => void;
  /**
   * Canvas testing rail lives beside the viz. Hide the floating cards, keep
   * the tree vertical, and follow the dashboard's step index and playback.
   */
  externalRail?: boolean;
  /**
   * Pixels the floating prediction rail covers on the right. Fit and
   * follow-pan stay in the open strip; the canvas is not clipped.
   */
  frameInsetRight?: number;
  controlledStep?: number;
  onControlledStep?: (index: number) => void;
  controlledPlayback?: StepPlayback;
  /**
   * Rows-modal experiment: a node click calls this instead of growing the
   * node in place, nothing auto-opens, and mixed leaves carry a disagree
   * count. Bundles still unfold on click.
   */
  onOpenNode?: (key: string) => void;
  /** Node whose modal is open; drawn selected while it is. */
  openedKey?: string;
}

/** Rows that reached a leaf but carry a different label than it predicts. */
function disagreeCount(node: AiLabTreeNode): number {
  if (node.type !== "leaf") return 0;
  return node.sampleCount - (node.labelCounts[node.prediction] ?? 0);
}

/** `X is V → branch`, or just `X is V` when the branch *is* the value. */
function StepStatement({
  name,
  value,
  branchLabel,
}: {
  name: string;
  value: string;
  branchLabel: string;
}) {
  return (
    <>
      {name} is <strong>{value}</strong>
      {branchLabel === value ? null : (
        <>
          <StepArrow />
          <strong>{branchLabel}</strong>
        </>
      )}
    </>
  );
}

function StepArrow() {
  return (
    <span className={styles.stepArrow} aria-hidden>
      <FaIcon name="arrow-right" size="small" />
    </span>
  );
}

function featureName(columns: AiLabColumn[], feature: string): string {
  return columnById(columns, feature)?.name ?? feature;
}

function rowsText(count: number): string {
  return `${count} Row${count === 1 ? "" : "s"}`;
}

function purity(node: AiLabTreeNode): number {
  if (node.sampleCount === 0) return 0;
  const top = Math.max(0, ...Object.values(node.labelCounts));
  return Math.round((top / node.sampleCount) * 100);
}

/** Labels present in the node, palette order — one row each on the detail card. */
function presentLabels(node: AiLabTreeNode, labels: string[]): string[] {
  return labels.filter((label) => (node.labelCounts[label] ?? 0) > 0);
}

/*
 * Detail card geometry, mirrored by `.nodeDetail` in the stylesheet: the
 * layout needs the height before the card renders, so it is summed here
 * rather than measured.
 */
const DETAIL_CHROME = 4 + 20; // 2px border ×2 + 10px vertical padding ×2
const DETAIL_HEAD = 24 + 8; // title row + gap to the rows
const DETAIL_ROW = 18;
const DETAIL_ROW_GAP = 4;
const DETAIL_NOTE_CHROME = 8 + 1 + 8; // gap + rule + padding above the note
const DETAIL_NOTE_LINE = 18;
/** Rough body-4 characters per line in the card's 172px content width. */
const DETAIL_NOTE_CHARS_PER_LINE = 28;
/** `.nodeNote` clamps to this many lines. */
const DETAIL_NOTE_MAX_LINES = 3;

function detailDimensions(
  node: AiLabTreeNode,
  labels: string[],
  memberNames: string[],
): NodeDimensions {
  const rows = presentLabels(node, labels).length;
  const rowsHeight = rows * DETAIL_ROW + Math.max(0, rows - 1) * DETAIL_ROW_GAP;
  const note = leafNote(node, memberNames);
  const noteLines = note
    ? Math.min(DETAIL_NOTE_MAX_LINES, Math.ceil(note.length / DETAIL_NOTE_CHARS_PER_LINE))
    : 0;
  const noteHeight = note ? DETAIL_NOTE_CHROME + noteLines * DETAIL_NOTE_LINE : 0;
  return {
    width: NODE_SIZES.detail.width,
    height: DETAIL_CHROME + DETAIL_HEAD + rowsHeight + noteHeight,
  };
}

/** The short "why" under an opened leaf. */
function leafNote(node: AiLabTreeNode, memberNames: string[]): string {
  if (node.type !== "leaf") return "";
  if (memberNames.length > 0) {
    return `${memberNames.length} branches (${memberNames.join(", ")}) all predict ${node.prediction}.`;
  }
  const top = node.labelCounts[node.prediction] ?? 0;
  const total = node.sampleCount;
  return `${top} of ${total} example${total === 1 ? "" : "s"} here ${
    top === 1 ? "is" : "are"
  } ${node.prediction}, so this predicts ${node.prediction}.`;
}

function nodeTitle(node: AiLabTreeNode, columns: AiLabColumn[]): string {
  return node.type === "leaf"
    ? node.prediction
    : `${featureName(columns, node.feature)}?`;
}

/** Idle first, then pending, then taken — SVG later siblings paint on top. */
function linkPaintOrder(
  link: TreeLink,
  revealed: Set<string>,
  currentKey: string | undefined,
  nextKey: string | undefined,
): number {
  if (revealed.has(link.sourceKey) && revealed.has(link.targetKey)) return 2;
  if (link.sourceKey === currentKey && link.targetKey === nextKey) return 1;
  return 0;
}

export function DecisionTreeViz({
  root,
  columns,
  labels,
  trace,
  view,
  canvasChrome,
  bundleWideSplits = false,
  autoPlay = false,
  onPlayingChange,
  externalRail = false,
  frameInsetRight = 0,
  controlledStep,
  onControlledStep,
  controlledPlayback,
  onOpenNode,
  openedKey,
}: DecisionTreeVizProps) {
  const modalDetail = onOpenNode != null;
  const [internalStep, setInternalStep] = useState(0);
  const stepIndex = controlledStep ?? internalStep;
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  /**
   * The root and the answer leaf open themselves once the trace reaches
   * them; a click closes one for this prediction (recorded here) and a
   * second click selects it back open.
   */
  const [dismissedPins, setDismissedPins] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [expandedBundles, setExpandedBundles] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const indexOf = useMemo(() => labelIndexer(labels), [labels]);

  useEffect(() => {
    setSelectedKey(undefined);
  }, [view]);
  useEffect(() => {
    setExpandedBundles(new Set());
  }, [root]);

  const steps = useMemo<TraceStep[]>(() => {
    if (!trace) return [];
    const questionSteps = trace.steps.map<TraceStep>((step, index) => {
      const name = featureName(columns, step.feature);
      const value = formatCell(step.value);
      return {
        id: step.pathKey,
        label: `Question ${index + 1}: ${name}`,
        statement: (
          <StepStatement name={name} value={value} branchLabel={step.branchLabel} />
        ),
        announcement: `Question ${index + 1}. ${name} is ${value}, so follow the ${step.branchLabel} branch.`,
      };
    });
    const leafKey = trace.pathKeys[trace.pathKeys.length - 1];
    return [
      ...questionSteps,
      {
        id: `${leafKey}-prediction`,
        label: "Prediction",
        statement: (
          <>
            Predicts <strong>{trace.prediction}</strong>
          </>
        ),
        announcement: `Prediction: ${trace.prediction}.`,
      },
    ];
  }, [columns, trace]);

  const onStep = useCallback((index: number) => {
    setSelectedKey(undefined);
    if (onControlledStep) onControlledStep(index);
    else setInternalStep(index);
  }, [onControlledStep]);
  const internalPlayback = useStepPlayback(steps.length, onStep);
  const playback = controlledPlayback ?? internalPlayback;
  const { playing, play: startPlayback } = playback;
  const playbackIsExternal = controlledPlayback != null;
  useEffect(() => {
    onPlayingChange?.(playing);
  }, [onPlayingChange, playing]);

  // New prediction: drop any node selection so the path is what the student
  // sees, then either walk it from the root (auto-play) or land on the answer.
  // The canvas rail owns that timer itself.
  const traceKey = trace?.pathKeys.join(">") ?? "";
  useEffect(() => {
    setSelectedKey(undefined);
    setDismissedPins(new Set());
    if (playbackIsExternal) return;
    if (autoPlay && steps.length >= 2) {
      startPlayback({ reducedMotion: "end" });
    } else {
      setInternalStep(Math.max(0, steps.length - 1));
    }
  }, [autoPlay, playbackIsExternal, startPlayback, steps.length, traceKey]);

  useEffect(() => {
    if (!playbackIsExternal) return;
    setSelectedKey(undefined);
  }, [controlledStep, playbackIsExternal]);

  const clampedStep = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const revealedPath = useMemo(
    () => (trace ? trace.pathKeys.slice(0, clampedStep + 1) : []),
    [clampedStep, trace],
  );
  const revealedSet = useMemo(() => new Set(revealedPath), [revealedPath]);
  const currentKey = revealedPath[revealedPath.length - 1];
  const nextKey = trace?.pathKeys[clampedStep + 1];
  const finalLeafKey = trace?.pathKeys[trace.pathKeys.length - 1];
  const rootKey = root.pathKey;

  // The first question and the answer open on their own once revealed — the
  // two nodes a first-time reader needs to see in full.
  const isPinnedOpen = useCallback(
    (key: string) =>
      !externalRail &&
      !modalDetail &&
      (key === rootKey || key === finalLeafKey) &&
      revealedSet.has(key) &&
      !dismissedPins.has(key),
    [dismissedPins, externalRail, finalLeafKey, modalDetail, revealedSet, rootKey],
  );

  // Content follows the path: only nodes your example passed through earn
  // a full card; everything else is a pill. The node the student opened
  // (or a pinned node) grows into a detail card in place.
  const sizeOf = useCallback(
    (key: string): NodeSize =>
      key === selectedKey || isPinnedOpen(key)
        ? "detail"
        : revealedSet.has(key) && !externalRail
          ? "card"
          : "pill",
    [externalRail, isPinnedOpen, revealedSet, selectedKey],
  );
  // Canvas mode reads top→bottom so the tree grows away from the right-hand
  // cards instead of under them.
  const orientation: TreeOrientation =
    canvasChrome || externalRail ? "vertical" : "horizontal";
  // The whole traced path (not just the revealed prefix) opens its bundle, so
  // stepping never reflows the group mid-trace.
  const pathKeysText = trace?.pathKeys.join("|") ?? "";
  const bundling = useMemo<TreeBundleOptions | undefined>(
    () =>
      bundleWideSplits
        ? {
            minBranches: BUNDLE_MIN_BRANCHES,
            expanded: expandedBundles,
            pathKeys: new Set(pathKeysText ? pathKeysText.split("|") : []),
          }
        : undefined,
    [bundleWideSplits, expandedBundles, pathKeysText],
  );
  const measure = useCallback(
    (node: AiLabTreeNode, size: NodeSize, bundle: TreeBundle | undefined): NodeDimensions =>
      size === "detail"
        ? detailDimensions(
            node,
            labels,
            bundle?.members.map((member) => member.branchLabel) ?? [],
          )
        : modalDetail
          ? { ...NODE_SIZES[size], width: MODAL_NODE_WIDTH }
          : NODE_SIZES[size],
    [labels, modalDetail],
  );
  const layout = useMemo(
    () => layoutTree(root, sizeOf, orientation, bundling, measure),
    [bundling, measure, orientation, root, sizeOf],
  );

  const onSelect = (key: string | undefined) => {
    if (onOpenNode) {
      if (key) onOpenNode(key);
      return;
    }
    if (key && isPinnedOpen(key)) {
      setDismissedPins((current) => new Set(current).add(key));
      return;
    }
    setSelectedKey((current) => (key === current ? undefined : key));
  };
  const onToggleBundle = (key: string) =>
    setExpandedBundles((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // Clicking the empty canvas clears the selection, or, with nothing
  // selected, folds every opened bundle back up.
  const onCanvasClick = () => {
    if (selectedKey) setSelectedKey(undefined);
    else if (expandedBundles.size > 0) setExpandedBundles(new Set());
  };

  return (
    <VizFrame
      hideToolbar
      iconName="diagram-project"
      title="Decision tree"
      ariaLabel="Decision tree visualization"
    >
      <div
        className={`${styles.stageWrap} ${externalRail ? styles.railMode : ""}`}
      >
        {view === "diagram" ? (
          <TreeDiagram
            root={root}
            layout={layout}
            columns={columns}
            labels={labels}
            indexOf={indexOf}
            revealed={revealedSet}
            currentKey={currentKey}
            nextKey={nextKey}
            selectedKey={modalDetail ? openedKey : selectedKey}
            showDisagree={modalDetail}
            traceKey={pathKeysText}
            onSelect={onSelect}
            onToggleBundle={onToggleBundle}
            onCanvasClick={onCanvasClick}
            orientation={orientation}
            besideCards={Boolean(canvasChrome) && !externalRail}
            frameInsetRight={frameInsetRight}
          />
        ) : (
          <TreeRules
            root={root}
            columns={columns}
            labels={labels}
            indexOf={indexOf}
            matchedLeafKey={finalLeafKey}
            besideCards={false}
          />
        )}
        {externalRail ? null : canvasChrome ? (
          <CanvasCards
            steps={steps}
            index={clampedStep}
            onIndexChange={onStep}
            showStepper={view === "diagram"}
            docked={view === "rules"}
            outcome={canvasChrome.outcome}
            inputCard={canvasChrome.inputCard}
            inlineBody
            playback={playback}
          >
            {trace ? (
              <TracePath
                trace={trace}
                columns={columns}
                indexOf={indexOf}
                stepIndex={clampedStep}
              />
            ) : null}
          </CanvasCards>
        ) : view === "rules" ? null : (
          <NavigatorCard
            steps={steps}
            index={clampedStep}
            onIndexChange={onStep}
            emptyText="Fill in the inputs to trace your example."
            playback={playback}
          />
        )}
      </div>
    </VizFrame>
  );
}

/* ------------------------------------------------------------------------ */
/* Canvas-mode path — the whole trace; step numbers light up as Play runs    */
/* ------------------------------------------------------------------------ */

function TracePath({
  trace,
  columns,
  indexOf,
  stepIndex,
}: {
  trace: AiLabTreeTrace;
  columns: AiLabColumn[];
  indexOf: (label: string) => number;
  stepIndex: number;
}) {
  const leafIndex = trace.steps.length;
  // Badges stay neutral; the step Play is on wears a ring so the list and
  // the canvas point at the same question.
  const rowClass = (index: number) =>
    [
      styles.pathRow,
      index === stepIndex ? styles.pathRowCurrent : "",
      index === leafIndex ? styles.pathRowLeaf : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <ol className={styles.pathList}>
      {trace.steps.map((step, index) => (
        <li
          key={step.pathKey}
          className={rowClass(index)}
          aria-current={index === stepIndex ? "step" : undefined}
        >
          <span className={styles.pathIndex} aria-hidden>
            {index + 1}
          </span>
          <span className={styles.pathText}>
            <StepStatement
              name={featureName(columns, step.feature)}
              value={formatCell(step.value)}
              branchLabel={step.branchLabel}
            />
          </span>
        </li>
      ))}
      <li
        className={rowClass(leafIndex)}
        aria-current={leafIndex === stepIndex ? "step" : undefined}
      >
        <span className={`${styles.pathIndex} ${styles.pathIndexFinal}`} aria-hidden>
          <FaIcon name="flag" fontSize="10px" />
        </span>
        <span className={styles.pathText}>
          AI predicts
          <span className={styles.pathPrediction}>
            <span
              className={styles.pathDot}
              style={{ background: labelFill(indexOf(trace.prediction)) }}
              aria-hidden
            />
            <strong>{trace.prediction}</strong>
          </span>
        </span>
      </li>
    </ol>
  );
}

/* ------------------------------------------------------------------------ */
/* Diagram                                                                   */
/* ------------------------------------------------------------------------ */

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
/** Fit never enlarges past 1:1 — the 14px node titles are already sized to read. */
const MAX_FIT_ZOOM = 1;
/** Below this, a fitted tree is too small to read; recentering frames the path instead. */
const LEGIBLE_FIT_ZOOM = 0.5;
/** Pointer travel before a press on the canvas becomes a drag. */
const CLICK_SLOP = 4;
/** Breathing room kept around a fitted box. */
const FIT_PAD = 24;
/** Edge label pill: 18px line + 2px vertical padding, and its gap from the node. */
const EDGE_LABEL_HEIGHT = 22;
const EDGE_LABEL_GAP = 8;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

interface Viewport {
  zoom: number;
  /** Frame-pixel position of the stage's top-left corner. */
  x: number;
  y: number;
  /** Programmatic moves glide; wheel and drag track the pointer directly. */
  smooth: boolean;
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface View {
  width: number;
  height: number;
  /** Right strip covered by the floating cards. */
  insetRight: number;
}

const unionBox = (boxes: Box[]): Box => ({
  left: Math.min(...boxes.map((box) => box.left)),
  top: Math.min(...boxes.map((box) => box.top)),
  right: Math.max(...boxes.map((box) => box.right)),
  bottom: Math.max(...boxes.map((box) => box.bottom)),
});

/** Scale `box` to fill the open part of the frame (capped at `MAX_FIT_ZOOM`), centered. */
function fitBox(box: Box, view: View): Viewport {
  const availWidth = Math.max(1, view.width - view.insetRight - FIT_PAD * 2);
  const availHeight = Math.max(1, view.height - FIT_PAD * 2);
  const boxWidth = Math.max(1, box.right - box.left);
  const boxHeight = Math.max(1, box.bottom - box.top);
  const zoom = clampZoom(
    Math.min(MAX_FIT_ZOOM, availWidth / boxWidth, availHeight / boxHeight),
  );
  return {
    zoom,
    x: FIT_PAD + (availWidth - boxWidth * zoom) / 2 - box.left * zoom,
    y: FIT_PAD + (availHeight - boxHeight * zoom) / 2 - box.top * zoom,
    smooth: true,
  };
}

/**
 * Pan `current` just enough that `box` (stage space) sits inside the open
 * part of the frame; a box taller or wider than the frame aligns its start edge.
 */
function panIntoView(current: Viewport, box: Box, view: View): Viewport {
  const viewWidth = view.width - view.insetRight;
  const left = current.x + box.left * current.zoom - FIT_PAD;
  const right = current.x + box.right * current.zoom + FIT_PAD;
  const top = current.y + box.top * current.zoom - FIT_PAD;
  const bottom = current.y + box.bottom * current.zoom + FIT_PAD;
  let dx = 0;
  let dy = 0;
  if (left < 0) dx = -left;
  else if (right > viewWidth) dx = Math.max(viewWidth - right, -left);
  if (top < 0) dy = -top;
  else if (bottom > view.height) dy = Math.max(view.height - bottom, -top);
  if (dx === 0 && dy === 0) return current;
  return { ...current, x: current.x + dx, y: current.y + dy, smooth: true };
}

const sameViewport = (a: Viewport, b: Viewport) =>
  Math.abs(a.zoom - b.zoom) < 0.001 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;

interface TreeDiagramProps {
  /** Identity of the trained tree; a new tree starts back at Fit. */
  root: AiLabTreeNode;
  layout: ReturnType<typeof layoutTree>;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
  revealed: Set<string>;
  currentKey: string | undefined;
  nextKey: string | undefined;
  selectedKey: string | undefined;
  /** Mark mixed leaves with how many of their rows disagree. */
  showDisagree: boolean;
  /** Identity of the current prediction's path; a change recenters the canvas. */
  traceKey: string;
  onSelect: (key: string | undefined) => void;
  onToggleBundle: (key: string) => void;
  onCanvasClick: () => void;
  orientation: TreeOrientation;
  /** Canvas layout: keep the stage's resting spot clear of the right-hand cards. */
  besideCards: boolean;
  /** Extra right inset when the dashboard's rail floats over this frame. */
  frameInsetRight: number;
}

function TreeDiagram({
  root,
  layout,
  columns,
  labels,
  indexOf,
  revealed,
  currentKey,
  nextKey,
  selectedKey,
  showDisagree,
  traceKey,
  onSelect,
  onToggleBundle,
  onCanvasClick,
  orientation,
  besideCards,
  frameInsetRight,
}: TreeDiagramProps) {
  const vertical = orientation === "vertical";
  const { ref: frameRef, size } = useElementSize<HTMLDivElement>();
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [focusedKey, setFocusedKey] = useState<string>(layout.nodes[0]?.key);
  const paintedLinks = useMemo(
    () =>
      [...layout.links].sort(
        (a, b) =>
          linkPaintOrder(a, revealed, currentKey, nextKey) -
          linkPaintOrder(b, revealed, currentKey, nextKey),
      ),
    [currentKey, layout.links, nextKey, revealed],
  );

  useEffect(() => {
    if (layout.byKey.has(focusedKey)) return;
    setFocusedKey(layout.nodes[0]?.key);
  }, [focusedKey, layout]);

  /* Viewport (zoom + pan) --------------------------------------------- */

  const view = useMemo<View>(
    () => ({
      width: size.width,
      height: size.height,
      // Floating cards cover the right strip. Fit stays clear of them; the
      // frame itself is not clipped, so a pan can still run underneath.
      insetRight: besideCards ? CARD_INSET : frameInsetRight,
    }),
    [besideCards, frameInsetRight, size.height, size.width],
  );
  const measured = view.width > 0 && view.height > 0;

  // Stage-space box around a node including its incoming edge label, which
  // sits left of the node (horizontal) or above it (vertical).
  const nodeBox = useCallback(
    (node: LaidOutNode): Box => ({
      left: node.x - (vertical ? 0 : TREE_METRICS.edgeLabelWidth),
      right: node.x + node.width,
      top: node.y - (vertical ? EDGE_LABEL_HEIGHT + EDGE_LABEL_GAP : 0),
      bottom: node.y + node.height,
    }),
    [vertical],
  );

  // What the student sees, not the layout box: the layout carries a trailing
  // lane gap on one side, so centering it would sit the nodes off-center.
  const wholeBox = useMemo<Box>(
    () => unionBox(layout.nodes.map(nodeBox)),
    [layout.nodes, nodeBox],
  );
  const pathBox = useMemo<Box | undefined>(() => {
    const boxes = layout.nodes.filter((laid) => revealed.has(laid.key)).map(nodeBox);
    return boxes.length > 0 ? unionBox(boxes) : undefined;
  }, [layout.nodes, nodeBox, revealed]);
  // The full path, not the revealed prefix — right after a new prediction the
  // step index may still be catching up in this render.
  const fullPathBox = useMemo<Box | undefined>(() => {
    const keys = new Set(traceKey ? traceKey.split("|") : []);
    const boxes = layout.nodes.filter((laid) => keys.has(laid.key)).map(nodeBox);
    return boxes.length > 0 ? unionBox(boxes) : undefined;
  }, [layout.nodes, nodeBox, traceKey]);
  const fitAll = useMemo(() => fitBox(wholeBox, view), [view, wholeBox]);
  const fitPath = useMemo(
    () => (fullPathBox ? fitBox(fullPathBox, view) : undefined),
    [fullPathBox, view],
  );

  const [viewport, setViewport] = useState<Viewport>(fitAll);
  /**
   * While set, the view keeps re-applying Fit (or the path frame) as the
   * frame resizes or the layout reflows, so the tree stays centered through
   * a sidebar resize, a node opening in place, or a bundle unfolding. Any
   * manual zoom or pan lets go.
   */
  const [follow, setFollow] = useState<"fit" | "path" | null>("fit");

  // A new tree starts at Fit without animating.
  const fittedFor = useRef<AiLabTreeNode | null>(null);
  useEffect(() => {
    if (!measured || fittedFor.current === root) return;
    fittedFor.current = root;
    setFollow("fit");
    setViewport({ ...fitAll, smooth: false });
  }, [fitAll, measured, root]);

  // A new prediction turns its path into cards (and may open a bundle), which
  // grows the stage and would leave the tree sitting off-center. Recenter:
  // Fit when the whole tree stays legible at fit, otherwise frame the path.
  const recenteredFor = useRef(traceKey);
  useEffect(() => {
    if (!measured || recenteredFor.current === traceKey) return;
    recenteredFor.current = traceKey;
    setFollow(fitAll.zoom >= LEGIBLE_FIT_ZOOM || !fitPath ? "fit" : "path");
  }, [fitAll.zoom, fitPath, measured, traceKey]);

  useEffect(() => {
    if (!measured || !follow) return;
    const target = follow === "path" && fitPath ? fitPath : fitAll;
    setViewport((current) => (sameViewport(current, target) ? current : target));
  }, [fitAll, fitPath, follow, measured]);

  const zoomAt = useCallback(
    (factor: number, at?: { x: number; y: number }) => {
      setFollow(null);
      setViewport((current) => {
        const next = clampZoom(current.zoom * factor);
        const ratio = next / current.zoom;
        // Keep the point under the cursor (or the open area's center) fixed.
        const ax = at?.x ?? (view.width - view.insetRight) / 2;
        const ay = at?.y ?? view.height / 2;
        return {
          zoom: next,
          x: ax - (ax - current.x) * ratio,
          y: ay - (ay - current.y) * ratio,
          smooth: !at,
        };
      });
    },
    [view.height, view.insetRight, view.width],
  );
  const panBy = (dx: number, dy: number) => {
    setFollow(null);
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy, smooth: true }));
  };
  const fit = () => {
    setFollow("fit");
    setViewport(fitAll);
  };
  const zoomToPath = () => {
    if (!pathBox) return;
    // Frames the revealed prefix (what the student can see so far); following
    // the path keeps the whole route framed as the layout reflows.
    setFollow("path");
    setViewport(fitBox(pathBox, view));
  };

  const ensureVisible = useCallback(
    (box: Box) => setViewport((current) => panIntoView(current, box, view)),
    [view],
  );

  // Stepping the trace pans the current node (and, when both fit, the
  // question it came from) into view without moving focus — the student is
  // still on the trace controls.
  useEffect(() => {
    const laid = currentKey ? layout.byKey.get(currentKey) : undefined;
    if (!measured || !laid) return;
    const parent = laid.parentKey ? layout.byKey.get(laid.parentKey) : undefined;
    const own = nodeBox(laid);
    setViewport((current) => {
      const pair = parent ? unionBox([own, nodeBox(parent)]) : own;
      const fits =
        (pair.right - pair.left) * current.zoom + FIT_PAD * 2 <= view.width - view.insetRight &&
        (pair.bottom - pair.top) * current.zoom + FIT_PAD * 2 <= view.height;
      return panIntoView(current, fits ? pair : own, view);
    });
  }, [currentKey, layout, measured, nodeBox, view]);

  // Opening a node in place grows it (and reflows its siblings), so keep the
  // detail card on screen wherever it lands.
  useEffect(() => {
    const laid = selectedKey ? layout.byKey.get(selectedKey) : undefined;
    if (!measured || !laid) return;
    setViewport((current) => panIntoView(current, nodeBox(laid), view));
  }, [layout, measured, nodeBox, selectedKey, view]);

  // React registers wheel listeners as passive, so preventDefault (keeping
  // the page from scrolling while zooming) needs a native listener.
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      zoomAt(event.deltaY < 0 ? 1.18 : 1 / 1.18, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [frameRef, zoomAt]);

  // Drag-to-pan. The pointer is only captured once the press travels past
  // the click slop, so a plain click on a node still reaches the node; a
  // drag that started on a node ends on the frame and never clicks it.
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: viewport.x,
      panY: viewport.y,
      moved: false,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < CLICK_SLOP) return;
    if (!start.moved) {
      start.moved = true;
      suppressClick.current = true;
      setDragging(true);
      setFollow(null);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers cannot be captured; the
        // drag still works while the pointer stays over the frame.
      }
    }
    setViewport((current) => ({
      ...current,
      x: start.panX + dx,
      y: start.panY + dy,
      smooth: false,
    }));
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const onFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[role="treeitem"]')) onCanvasClick();
  };

  const activate = (laid: LaidOutNode) => {
    if (laid.bundle) onToggleBundle(laid.bundle.key);
    else onSelect(laid.key);
  };

  const onFrameKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = 40;
    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault();
        zoomAt(1.5);
        break;
      case "-":
      case "_":
        event.preventDefault();
        zoomAt(1 / 1.5);
        break;
      case "0":
        event.preventDefault();
        fit();
        break;
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown": {
        // Inside the tree, arrows move between nodes; only the frame itself pans.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        if (event.key === "ArrowLeft") panBy(step, 0);
        else if (event.key === "ArrowRight") panBy(-step, 0);
        else if (event.key === "ArrowUp") panBy(0, step);
        else panBy(0, -step);
        break;
      }
      default:
    }
  };

  const focusKey = (key: string | undefined) => {
    if (!key) return;
    setFocusedKey(key);
    nodeRefs.current.get(key)?.focus({ preventScroll: true });
    const laid = layout.byKey.get(key);
    if (laid) ensureVisible(nodeBox(laid));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = layout.nodes.findIndex((laid) => laid.key === focusedKey);
    if (index < 0) return;
    const laid = layout.nodes[index];
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusKey(layout.nodes[Math.min(layout.nodes.length - 1, index + 1)]?.key);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusKey(layout.nodes[Math.max(0, index - 1)]?.key);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (laid.childKeys.length > 0) focusKey(laid.childKeys[0]);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusKey(laid.parentKey);
        break;
      case "Home":
        event.preventDefault();
        focusKey(layout.nodes[0]?.key);
        break;
      case "End":
        event.preventDefault();
        focusKey(layout.nodes[layout.nodes.length - 1]?.key);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(laid);
        break;
      case "Escape":
        if (selectedKey) {
          event.preventDefault();
          onSelect(undefined);
        }
        break;
      default:
    }
  };

  const atFit = sameViewport(viewport, fitAll);

  return (
    <div
      ref={frameRef}
      className={[styles.frame, dragging ? styles.frameDragging : ""]
        .filter(Boolean)
        .join(" ")}
      tabIndex={0}
      role="group"
      aria-label="Decision tree canvas. Plus and minus zoom, arrow keys pan, 0 fits."
      onClick={onFrameClick}
      onKeyDown={onFrameKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Pan on the outer element, zoom on the inner: CSS `zoom` re-lays out
          text and strokes at the new scale (crisp, unlike `scale()`, which
          upsamples a rasterized layer), and keeping it on its own element
          means the frame-pixel pan is never multiplied by it. The pan is
          left/top, not a transform: Chromium hit-tests `zoom` content under a
          transformed ancestor at the wrong spot, so :hover and clicks land
          off the drawn nodes. */}
      <div
        className={[styles.stage, viewport.smooth ? styles.stageSmooth : ""]
          .filter(Boolean)
          .join(" ")}
        style={{ left: viewport.x, top: viewport.y }}
      >
      <div
        className={styles.zoomed}
        style={{ width: layout.width, height: layout.height, zoom: viewport.zoom }}
      >
        <svg
          className={styles.links}
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {paintedLinks.map((link) => {
            const source = layout.byKey.get(link.sourceKey);
            const target = layout.byKey.get(link.targetKey);
            if (!source || !target) return null;
            const taken =
              revealed.has(link.sourceKey) && revealed.has(link.targetKey);
            const pending =
              link.sourceKey === currentKey && link.targetKey === nextKey;
            return (
              <path
                key={`${link.sourceKey}>${link.targetKey}`}
                className={`${styles.link} ${taken ? styles.linkTaken : ""} ${
                  pending ? styles.linkPending : ""
                }`}
                d={
                  vertical
                    ? elbowPathVertical(
                        source.cx,
                        source.y + source.height,
                        target.cx,
                        target.y,
                      )
                    : elbowPath(
                        source.x + source.width,
                        source.cy,
                        target.x,
                        target.cy,
                      )
                }
              />
            );
          })}
        </svg>

        {layout.links.map((link) => {
          const target = layout.byKey.get(link.targetKey);
          if (!target) return null;
          const taken =
            revealed.has(link.sourceKey) && revealed.has(link.targetKey);
          const pending =
            link.sourceKey === currentKey && link.targetKey === nextKey;
          return (
            <span
              key={`${link.targetKey}-label`}
              className={[
                styles.edgeLabel,
                vertical ? styles.edgeLabelVertical : "",
                taken ? styles.edgeLabelTaken : "",
                pending ? styles.edgeLabelPending : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                vertical
                  ? { left: target.cx, top: target.y - EDGE_LABEL_GAP }
                  : { left: target.x - EDGE_LABEL_GAP, top: target.cy }
              }
              aria-hidden
            >
              {link.label}
            </span>
          );
        })}

        <div
          role="tree"
          aria-label="Decision tree. Arrow keys move between questions; Enter shows details."
          className={styles.tree}
          onKeyDown={onKeyDown}
        >
          {layout.nodes.map((laid) => (
            <DiagramNode
              key={laid.key}
              laid={laid}
              columns={columns}
              labels={labels}
              indexOf={indexOf}
              isFocused={laid.key === focusedKey}
              isSelected={laid.key === selectedKey}
              disagree={showDisagree ? disagreeCount(laid.node) : 0}
              opensModal={showDisagree && !laid.bundle}
              onFocus={() => setFocusedKey(laid.key)}
              onActivate={() => activate(laid)}
              onPath={revealed.has(laid.key)}
              isCurrent={laid.key === currentKey}
              registerRef={(element) => {
                if (element) nodeRefs.current.set(laid.key, element);
                else nodeRefs.current.delete(laid.key);
              }}
              style={{
                left: laid.x,
                top: laid.y,
                width: laid.width,
                height: laid.height,
              }}
            />
          ))}
        </div>
      </div>
      </div>

      <div className={styles.zoomTools} role="group" aria-label="Zoom">
        <Tooltip title="Zoom in" placement="right">
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="magnifying-glass-plus"
            aria-label="Zoom in"
            disabled={viewport.zoom >= MAX_ZOOM}
            onClick={() => zoomAt(1.5)}
          />
        </Tooltip>
        <Tooltip title="Zoom out" placement="right">
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="magnifying-glass-minus"
            aria-label="Zoom out"
            disabled={viewport.zoom <= MIN_ZOOM}
            onClick={() => zoomAt(1 / 1.5)}
          />
        </Tooltip>
        <Tooltip title="Zoom to your path" placement="right">
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="arrows-to-dot"
            aria-label="Zoom to your path"
            disabled={!pathBox}
            onClick={zoomToPath}
          />
        </Tooltip>
        <Tooltip title="Fit everything" placement="right">
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="expand-wide"
            aria-label="Fit everything"
            disabled={atFit}
            onClick={fit}
          />
        </Tooltip>
      </div>
    </div>
  );
}

interface DiagramNodeProps {
  laid: LaidOutNode;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
  isFocused: boolean;
  isSelected: boolean;
  /** Rows on this leaf whose label is not its prediction; 0 hides the badge. */
  disagree: number;
  /** Activating opens the rows modal rather than growing the node. */
  opensModal: boolean;
  onFocus: () => void;
  onActivate: () => void;
  onPath: boolean;
  isCurrent: boolean;
  registerRef: (element: HTMLDivElement | null) => void;
  style: CSSProperties;
}

function DiagramNode({
  laid,
  columns,
  labels,
  indexOf,
  isFocused,
  isSelected,
  disagree,
  opensModal,
  onFocus,
  onActivate,
  onPath,
  isCurrent,
  registerRef,
  style,
}: DiagramNodeProps) {
  const { node, bundle } = laid;
  const isDecision = node.type === "decision";
  const isDetail = laid.size === "detail";
  const isCard = laid.size === "card";
  const title = nodeTitle(node, columns);
  const countsText = describeCounts(node.labelCounts, labels);
  const memberNames = bundle?.members.map((member) => member.branchLabel) ?? [];
  const note = isDetail ? leafNote(node, memberNames) : "";
  const name = [
    laid.branchLabel && !bundle ? `Branch ${laid.branchLabel}.` : "",
    bundle
      ? `${memberNames.length} branches predict ${title}: ${memberNames.join(", ")}.`
      : isDecision
        ? `Question: ${title}`
        : `Prediction: ${title}.`,
    `${rowsText(node.sampleCount)}, ${countsText}.`,
    disagree > 0
      ? `${disagree} ${disagree === 1 ? "row is" : "rows are"} not ${title}.`
      : "",
    isCurrent
      ? "Current step."
      : onPath
        ? "On your example's path."
        : "",
    bundle
      ? "Press Enter to open the branches."
      : opensModal
        ? "Press Enter to see its rows."
        : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={registerRef}
      role="treeitem"
      tabIndex={isFocused ? 0 : -1}
      aria-label={name}
      aria-level={laid.depth + 1}
      aria-setsize={laid.setSize}
      aria-posinset={laid.posInSet}
      aria-current={isCurrent ? "step" : undefined}
      aria-selected={isSelected || undefined}
      aria-expanded={bundle ? false : undefined}
      aria-haspopup={opensModal ? "dialog" : undefined}
      className={[
        styles.node,
        isCard ? styles.nodeCard : isDetail ? styles.nodeDetail : styles.nodePill,
        isDecision ? styles.nodeDecision : styles.nodeLeaf,
        bundle ? styles.nodeBundle : "",
        onPath ? styles.nodeOnPath : "",
        isSelected ? styles.nodeSelected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onFocus={onFocus}
      onClick={onActivate}
    >
      <div className={styles.nodeHead}>
        <p className={styles.nodeTitle}>
          {isDecision ? null : (
            <span
              className={styles.nodeDot}
              style={{ background: labelFill(indexOf(title)) }}
              aria-hidden
            />
          )}
          <span className={styles.nodeTitleText}>{title}</span>
          {bundle ? (
            <span className={styles.bundleCount} aria-hidden>
              ×{memberNames.length}
            </span>
          ) : null}
        </p>
        <span className={styles.nodeMeta}>
          {disagree > 0 ? (
            <span className={styles.disagreeBadge} aria-hidden>
              <FaIcon name="xmark" fontSize="10px" />
              {disagree}
            </span>
          ) : null}
          <span className={styles.nodeRows}>{rowsText(node.sampleCount)}</span>
        </span>
      </div>
      {isCard ? (
        <DistributionBar
          counts={node.labelCounts}
          labels={labels}
          description={countsText}
          className={styles.nodeBar}
        />
      ) : null}
      {isDetail ? (
        <ul className={styles.nodeCounts} aria-label={countsText}>
          {presentLabels(node, labels).map((label) => {
            const count = node.labelCounts[label] ?? 0;
            const share = node.sampleCount > 0 ? (count / node.sampleCount) * 100 : 0;
            return (
              <li key={label} className={styles.nodeCountRow}>
                <span className={styles.nodeCountLabel}>{label}</span>
                <span className={styles.nodeTrack}>
                  <span
                    className={styles.nodeFill}
                    style={{ width: `${share}%`, background: labelFill(indexOf(label)) }}
                  />
                </span>
                <span className={styles.nodeCount}>{count}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {note ? <p className={styles.nodeNote}>{note}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Rules                                                                     */
/* ------------------------------------------------------------------------ */

interface TreeRulesProps {
  root: AiLabTreeNode;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
  matchedLeafKey: string | undefined;
  besideCards: boolean;
}

/**
 * The tree read as if/then rules — one line per outcome. This is how you'd
 * say the model out loud, it reads top to bottom for a screen reader, and
 * it needs no canvas.
 */
function TreeRules({
  root,
  columns,
  labels,
  indexOf,
  matchedLeafKey,
  besideCards,
}: TreeRulesProps) {
  const rules = useMemo(() => treeRules(root), [root]);
  const matchedRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    matchedRef.current?.scrollIntoView({ block: "nearest" });
  }, [matchedLeafKey]);

  return (
    <div
      className={`${styles.rulesScroller} ${
        besideCards ? styles.rulesScrollerBesideCards : ""
      }`}
    >
      <table className={styles.rules} aria-label="Decision tree as rules">
        <thead>
          <tr>
            <th scope="col" className={styles.rulesIndex}>
              #
            </th>
            <th scope="col">If</th>
            <th scope="col">Then</th>
            <th scope="col" className={styles.rulesRows}>
              Rows
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule, index) => {
            const matched = rule.leaf.pathKey === matchedLeafKey;
            return (
              <tr
                key={rule.leaf.pathKey}
                ref={matched ? matchedRef : undefined}
                className={matched ? styles.ruleMatched : undefined}
                aria-current={matched ? "true" : undefined}
              >
                <th scope="row" className={styles.rulesIndex}>
                  {index + 1}
                </th>
                <td>
                  <span className={styles.ruleConditions}>
                    {rule.conditions.map((condition, conditionIndex) => (
                      <span key={conditionIndex} className={styles.ruleCondition}>
                        {conditionIndex > 0 ? (
                          <span className={styles.ruleAnd}>and</span>
                        ) : null}
                        <span className={styles.ruleChip}>
                          <span className={styles.ruleFeature}>
                            {featureName(columns, condition.feature)}
                          </span>{" "}
                          {condition.branchLabel}
                        </span>
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  <span className={styles.ruleThen}>
                    <LabelSwatch
                      label={rule.leaf.prediction}
                      index={indexOf(rule.leaf.prediction)}
                    />
                    {matched ? (
                      <span className={styles.ruleHere}>Your example</span>
                    ) : null}
                  </span>
                </td>
                <td className={styles.rulesRows}>
                  <span className={styles.ruleRows}>
                    {rule.leaf.sampleCount} · {purity(rule.leaf)}%
                  </span>
                  <DistributionBar
                    counts={rule.leaf.labelCounts}
                    labels={labels}
                    className={styles.ruleBar}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}