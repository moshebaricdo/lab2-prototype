import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Button, Tooltip } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabFeatureDelta,
  AiLabKnnPrediction,
} from "../../../../../types/aiLab";
import {
  columnById,
  formatCell,
  formatDistance,
  formatNumber,
  frequencies,
  knnDistances,
  knnVotes,
  neighborFeatureDeltas,
  summarizeVotes,
} from "../../../../../lib/aiLab";
import { useElementSize } from "../../../../../hooks/useElementSize";
import { CanvasCards, CARD_INSET, type CanvasChrome } from "./CanvasCards";
import { LabelSwatch } from "./LabelMarks";
import { groupLabels, OTHER_WEDGE, type LabelGrouping } from "./labelGroups";
import { labelFill, OTHER_LABEL_INDEX } from "./labelPalette";
import { NavigatorCard } from "./NavigatorCard";
import { type TraceStep } from "./TraceBar";
import { VizFrame } from "./VizFrame";
import styles from "./KnnViz.module.scss";

export type KnnView = "target" | "table";
type Vote = { label: string; count: number };

/** Rows drawn on the target; everything farther is summarized. */
const RENDER_CAP = 400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
const TIE_EPSILON = 1e-9;
/**
 * Above this k the target stops drawing one spoke and one numbered badge
 * per neighbor (they become a solid disc) and shows the vote as arcs.
 */
const DENSE_K = 30;
/** Neighbors previewed in the floating card; the table has the rest. */
const RAIL_PREVIEW = 3;
/** Ranked rows the table always lists (query row sits above these). */
const TABLE_ROWS = 100;
/** Vote rows the rail tally shows before folding the rest into "others". */
const TALLY_ROWS = 6;

/** Steps in a KNN trace: place, measure, vote. */
export const KNN_TRACE_STEP_COUNT = 3;

interface KnnVizProps {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  /** Every label value in palette order. */
  labels: string[];
  k: number;
  /** Holdout rows are not neighbors; keep them out of the field. */
  excludeRowIndexes?: number[];
  query: AiLabDataRow | undefined;
  prediction: AiLabKnnPrediction | undefined;
  view: KnnView;
  onViewChange: (view: KnnView) => void;
  /**
   * Canvas layout: the floating NavigatorCard is replaced by a trace toolbar,
   * the dashboard's input card, and an end-state prediction card.
   */
  canvasChrome?: CanvasChrome;
  /**
   * Canvas testing rail lives beside the viz. Hide the floating neighbor
   * card and follow the dashboard's step index.
   */
  externalRail?: boolean;
  /**
   * Pixels the floating prediction rail covers on the right. The resting
   * view stays in the open strip; the canvas is not clipped.
   */
  frameInsetRight?: number;
  controlledStep?: number;
  onControlledStep?: (index: number) => void;
}

interface Placed {
  rowIndex: number;
  distance: number;
  label: string;
  /** 1-based rank when this row is one of the k neighbors. */
  rank?: number;
}

function featureName(columns: AiLabColumn[], feature: string): string {
  return columnById(columns, feature)?.name ?? feature;
}

export function KnnViz({
  rows,
  columns,
  features,
  labelColumn,
  labels,
  k,
  excludeRowIndexes,
  query,
  prediction,
  view,
  onViewChange,
  canvasChrome,
  externalRail = false,
  frameInsetRight = 0,
  controlledStep,
  onControlledStep,
}: KnnVizProps) {
  const [internalStep, setInternalStep] = useState(0);
  const stepIndex = controlledStep ?? internalStep;
  const [hoveredRow, setHoveredRow] = useState<number | undefined>(undefined);

  const labelName = featureName(columns, labelColumn);
  const dense = k > DENSE_K;

  const queryKey = query
    ? features.map((feature) => `${feature}=${String(query[feature])}`).join("|")
    : "";
  // `query` is rebuilt every render by the dashboard; key on its values so
  // the O(N·F) sweep only reruns when an input actually changes.
  const excludeKey = excludeRowIndexes?.join(",") ?? "";
  const field = useMemo(
    () =>
      query
        ? knnDistances(rows, query, features, columns, excludeRowIndexes)
        : undefined,
    [columns, excludeKey, features, queryKey, rows], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const neighborRank = useMemo(() => {
    const ranks = new Map<number, number>();
    prediction?.neighbors.forEach((neighbor, index) =>
      ranks.set(neighbor.rowIndex, index + 1),
    );
    return ranks;
  }, [prediction]);

  const placed = useMemo<Placed[]>(() => {
    if (!field) return [];
    return field.order.slice(0, RENDER_CAP).map((rowIndex) => ({
      rowIndex,
      distance: field.distances[rowIndex],
      label: String(rows[rowIndex][labelColumn]),
      rank: neighborRank.get(rowIndex),
    }));
  }, [field, labelColumn, neighborRank, rows]);

  const votes = useMemo<Vote[]>(
    () => (prediction ? knnVotes(rows, labelColumn, prediction.neighbors) : []),
    [labelColumn, prediction, rows],
  );

  const totals = useMemo(() => {
    const counts = new Map<string, number>();
    frequencies(rows, labelColumn).forEach((entry) =>
      counts.set(entry.value, entry.count),
    );
    return counts;
  }, [labelColumn, rows]);

  const grouping = useMemo(
    () => groupLabels(labels, votes, totals),
    [labels, totals, votes],
  );

  // The k-th distance, and how many non-voting rows tie with it. Ties are a
  // real property of KNN on coarse data, so they are shown, not hidden.
  const ringDistance =
    prediction && prediction.neighbors.length > 0
      ? prediction.neighbors[prediction.neighbors.length - 1].distance
      : undefined;
  const tiedCount = useMemo(() => {
    if (!field || ringDistance === undefined) return 0;
    let count = 0;
    for (let index = k; index < field.order.length; index += 1) {
      const distance = field.distances[field.order[index]];
      if (Math.abs(distance - ringDistance) > TIE_EPSILON) break;
      count += 1;
    }
    return count;
  }, [field, k, ringDistance]);

  const winnerCount =
    votes.find((vote) => vote.label === prediction?.prediction)?.count ?? 0;

  const steps = useMemo<TraceStep[]>(() => {
    if (!prediction) return [];
    const voteText = summarizeVotes(votes);
    return [
      {
        id: "place",
        label: "Place your example",
        statement: <strong>Your input is placed in the center</strong>,
        announcement: "Your input is placed in the center.",
      },
      {
        id: "measure",
        label: "Measure distances",
        statement: <strong>Your nearest neighbors are mapped</strong>,
        announcement: "Your nearest neighbors are mapped.",
      },
      {
        id: "vote",
        label: `The ${k} nearest vote`,
        statement: (
          <>
            <strong>{prediction.prediction}</strong> wins with {winnerCount} of{" "}
            {k} votes
          </>
        ),
        announcement: `${prediction.prediction} wins with ${winnerCount} of ${k} votes. ${voteText}`,
      },
    ];
  }, [k, prediction, votes, winnerCount]);

  useEffect(() => {
    setHoveredRow(undefined);
    if (onControlledStep) return;
    setInternalStep(Math.max(0, steps.length - 1));
  }, [onControlledStep, queryKey, steps.length]);

  const clampedStep = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const reveal = {
    dots: !prediction || clampedStep >= 1,
    ring: Boolean(prediction) && clampedStep >= 2,
    vote: Boolean(prediction) && clampedStep >= 2,
  };

  const hiddenCount = field ? Math.max(0, field.order.length - placed.length) : 0;

  const detailFor = (rowIndex: number): AiLabFeatureDelta[] | undefined =>
    query ? neighborFeatureDeltas(rows, rowIndex, query, features, columns) : undefined;

  return (
    <VizFrame
      hideToolbar
      iconName="bullseye-arrow"
      title="Nearest neighbors"
      ariaLabel="Nearest neighbors visualization"
    >
      <div className={styles.stage}>
        <div
          className={`${styles.canvas} ${
            !externalRail && !canvasChrome && view !== "table"
              ? styles.canvasBesideCard
              : ""
          }`}
        >
          {view === "table" ? (
            <NeighborTable
              rows={rows}
              columns={columns}
              features={features}
              labelColumn={labelColumn}
              labelName={labelName}
              indexOf={grouping.indexOf}
              query={query}
              order={field?.order}
              distances={field?.distances}
              k={k}
              prediction={prediction}
            />
          ) : (
            <TargetView
              grouping={grouping}
              totals={totals}
              placed={placed}
              k={k}
              dense={dense}
              votes={votes}
              prediction={prediction}
              ringDistance={ringDistance}
              tiedCount={tiedCount}
              reveal={reveal}
              hasQuery={Boolean(query)}
              queryKey={queryKey}
              hoveredRow={hoveredRow}
              onHover={setHoveredRow}
              hiddenCount={hiddenCount}
              detailFor={detailFor}
              columns={columns}
              insetRight={canvasChrome ? CARD_INSET : frameInsetRight}
            />
          )}
        </div>
        {externalRail || (view === "table" && !canvasChrome) ? null : (
          <NeighborRail
            rows={rows}
            columns={columns}
            features={features}
            labelColumn={labelColumn}
            labelName={labelName}
            grouping={grouping}
            k={k}
            query={query}
            prediction={prediction}
            votes={votes}
            reveal={reveal}
            hoveredRow={hoveredRow}
            onHover={setHoveredRow}
            detailFor={detailFor}
            steps={steps}
            stepIndex={clampedStep}
            onStepIndexChange={onControlledStep ?? setInternalStep}
            view={view}
            onViewChange={onViewChange}
            canvasChrome={canvasChrome}
          />
        )}
      </div>
    </VizFrame>
  );
}

/* ------------------------------------------------------------------------ */
/* Distance target                                                           */
/* ------------------------------------------------------------------------ */

interface Reveal {
  dots: boolean;
  ring: boolean;
  vote: boolean;
}

interface TargetViewProps {
  columns: AiLabColumn[];
  grouping: LabelGrouping;
  totals: Map<string, number>;
  placed: Placed[];
  k: number;
  dense: boolean;
  votes: Vote[];
  prediction: AiLabKnnPrediction | undefined;
  ringDistance: number | undefined;
  tiedCount: number;
  reveal: Reveal;
  hasQuery: boolean;
  queryKey: string;
  hoveredRow: number | undefined;
  onHover: (rowIndex: number | undefined) => void;
  hiddenCount: number;
  detailFor: (rowIndex: number) => AiLabFeatureDelta[] | undefined;
  /** Width of floating cards on the right; the rings center left of them. */
  insetRight?: number;
}

interface Positioned extends Placed {
  wedge: string;
  angle: number;
}

/** Several rows that share one cell of the polar grid at the current zoom. */
interface Bubble {
  key: string;
  wedge: string;
  angle: number;
  /** Mean screen radius of the members (already zoomed). */
  screenR: number;
  members: Positioned[];
  minDistance: number;
  maxDistance: number;
  hasNeighbor: boolean;
  allTied: boolean;
}

type Mark = { kind: "dot"; point: Positioned } | { kind: "bubble"; bubble: Bubble };

const GOLDEN = 0.6180339887;
/** Share of the radius given to the neighborhood (0 … ~2× the k-th distance). */
const NEAR_SHARE = 0.62;
/**
 * Polar grid cell size (screen px) below which rows merge into one bubble.
 * Scales with the number of drawn rows so a crowded sheet groups into a few
 * dozen readable counts at Fit, while a small sheet keeps individual dots.
 */
function binSize(rowCount: number): number {
  return Math.min(64, Math.max(22, 20 * Math.sqrt(rowCount / 100)));
}
/** Pointer travel (px) under which a press on a bubble counts as a click. */
const CLICK_SLOP = 4;

interface Viewport {
  zoom: number;
  /** Screen-pixel offset of the query center from the frame center. */
  x: number;
  y: number;
}
const FIT: Viewport = { zoom: 1, x: 0, y: 0 };
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

function arcPath(cx: number, cy: number, r: number, start: number, span: number) {
  const sweep = Math.min(span, Math.PI * 2 - 0.001);
  const x0 = cx + Math.cos(start) * r;
  const y0 = cy + Math.sin(start) * r;
  const x1 = cx + Math.cos(start + sweep) * r;
  const y1 = cy + Math.sin(start + sweep) * r;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}

function bubbleRadius(count: number): number {
  return Math.min(18, 7 + Math.sqrt(count) * 1.4);
}

/**
 * Radial "distance target": the query sits at the center, every rendered
 * row is a dot at radius = its real distance, and each label owns a wedge
 * so the k-ring reads as a vote at a glance. Unlike a 2-axis scatter, the
 * geometry here *is* what KNN computes, for any number of features.
 *
 * The radial scale is piecewise: most of the radius goes to the
 * neighborhood around the k-th distance so "nearest" is visibly nearest,
 * and the long tail is compressed into the outer band. Wheel / drag /
 * keyboard zoom and pan for a closer look.
 *
 * Density is handled in two ways. Rows that land in the same cell of a
 * polar grid (at the current zoom) merge into one counted bubble and split
 * apart as you zoom in. And once k is large, per-neighbor spokes and
 * numbered badges give way to a filled disc with one vote arc per wedge.
 */
function TargetView({
  columns,
  grouping,
  totals,
  placed,
  k,
  dense,
  votes,
  prediction,
  ringDistance,
  tiedCount,
  reveal,
  hasQuery,
  queryKey,
  hoveredRow,
  onHover,
  hiddenCount,
  detailFor,
  insetRight = 0,
}: TargetViewProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const width = size.width;
  const height = size.height;
  // Cards floating on the right don't clip the target — dots still render
  // under them — but the rings center in the open strip beside them.
  const open = Math.max(0, width - insetRight);
  const cx = open / 2;
  const cy = height / 2;
  // Labels sit left/right of the rings, so width costs more than height.
  const radius = Math.max(60, Math.min(height / 2 - 32, open / 2 - 104));
  const inner = 22;

  const [viewport, setViewport] = useState<Viewport>(FIT);
  const [hoveredBubble, setHoveredBubble] = useState<string | undefined>(undefined);
  const [hoveredWedge, setHoveredWedge] = useState<string | undefined>(undefined);
  const { zoom, x: panX, y: panY } = viewport;
  const pan = { x: panX, y: panY };
  useEffect(() => {
    setViewport(FIT);
  }, [queryKey]);
  // Marks are rebuilt on every zoom / pan, so the element under the pointer
  // can vanish without ever firing mouseleave. Drop hover state instead of
  // leaving a card pinned to a mark that no longer exists.
  useEffect(() => {
    setHoveredBubble(undefined);
    setHoveredWedge(undefined);
    onHover(undefined);
  }, [viewport, onHover]);
  const clearHover = () => {
    setHoveredBubble(undefined);
    setHoveredWedge(undefined);
    onHover(undefined);
  };

  const dMax = placed.length > 0 ? placed[placed.length - 1].distance || 1 : 1;
  const smallestPositive =
    placed.find((point) => point.distance > TIE_EPSILON)?.distance ?? dMax;
  // Neighborhood boundary: twice the k-th distance (or the first non-zero
  // step when every neighbor is an exact match).
  const near =
    ringDistance !== undefined
      ? Math.min(dMax, Math.max(ringDistance * 2, smallestPositive))
      : undefined;
  const span = radius - inner;
  const rWorld = useCallback(
    (distance: number) => {
      if (near === undefined || near >= dMax) {
        return inner + (distance / dMax) * span;
      }
      if (distance <= near) {
        return inner + (distance / near) * span * NEAR_SHARE;
      }
      return (
        inner +
        span * NEAR_SHARE +
        ((distance - near) / (dMax - near)) * span * (1 - NEAR_SHARE)
      );
    },
    [dMax, near, span],
  );
  const ox = cx + pan.x;
  const oy = cy + pan.y;
  const toScreen = (angle: number, distance: number) => ({
    x: ox + Math.cos(angle) * rWorld(distance) * zoom,
    y: oy + Math.sin(angle) * rWorld(distance) * zoom,
  });

  const wedges = grouping.wedges;
  const wedgeGeom = useMemo(() => {
    const wedgeSpan = (Math.PI * 2) / Math.max(1, wedges.length);
    const index = new Map(wedges.map((wedge, position) => [wedge, position]));
    return (wedge: string) => ({
      start: -Math.PI / 2 + (index.get(wedge) ?? 0) * wedgeSpan,
      span: wedgeSpan,
    });
  }, [wedges]);

  // Spread same-wedge rows around their wedge with a golden-ratio walk so
  // rows at similar distances do not stack on one radial line.
  const positioned = useMemo<Positioned[]>(() => {
    const perWedge = new Map<string, number>();
    return placed.map((point) => {
      const wedge = grouping.wedgeOf(point.label);
      const n = perWedge.get(wedge) ?? 0;
      perWedge.set(wedge, n + 1);
      const { start, span: wedgeSpan } = wedgeGeom(wedge);
      const pad = wedgeSpan * 0.08;
      const t = (n * GOLDEN) % 1;
      const angle = start + pad + t * (wedgeSpan - pad * 2);
      return { ...point, wedge, angle };
    });
  }, [grouping, placed, wedgeGeom]);

  const isTied = (point: Placed) =>
    reveal.ring &&
    point.rank === undefined &&
    ringDistance !== undefined &&
    Math.abs(point.distance - ringDistance) <= TIE_EPSILON;

  // Polar-grid binning at the current zoom: cells about BIN_PX wide in both
  // the radial and angular direction. Zooming in makes more, smaller cells,
  // so bubbles split back into rows. Ranked neighbors keep their own dot
  // while k is small enough to number them; the hovered row always does.
  const marks = useMemo<Mark[]>(() => {
    const singles: Positioned[] = [];
    const bins = new Map<string, Positioned[]>();
    const BIN_PX = binSize(positioned.length);
    for (const point of positioned) {
      const keepSingle =
        point.rowIndex === hoveredRow ||
        (!dense && reveal.ring && point.rank !== undefined);
      if (keepSingle) {
        singles.push(point);
        continue;
      }
      const r = rWorld(point.distance) * zoom;
      const { start, span: wedgeSpan } = wedgeGeom(point.wedge);
      const ring = Math.round(r / BIN_PX);
      const sectors = Math.max(1, Math.floor((wedgeSpan * Math.max(r, 1)) / BIN_PX));
      const sector = Math.min(
        sectors - 1,
        Math.max(0, Math.floor(((point.angle - start) / wedgeSpan) * sectors)),
      );
      const key = `${point.wedge}|${ring}|${sector}`;
      const members = bins.get(key);
      if (members) members.push(point);
      else bins.set(key, [point]);
    }
    const out: Mark[] = [];
    bins.forEach((members, key) => {
      if (members.length === 1) {
        out.push({ kind: "dot", point: members[0] });
        return;
      }
      let angle = 0;
      let screenR = 0;
      let minDistance = Infinity;
      let maxDistance = -Infinity;
      let hasNeighbor = false;
      let allTied = true;
      for (const member of members) {
        angle += member.angle;
        screenR += rWorld(member.distance) * zoom;
        minDistance = Math.min(minDistance, member.distance);
        maxDistance = Math.max(maxDistance, member.distance);
        if (member.rank !== undefined) hasNeighbor = true;
        if (!isTied(member)) allTied = false;
      }
      out.push({
        kind: "bubble",
        bubble: {
          key,
          wedge: members[0].wedge,
          angle: angle / members.length,
          screenR: screenR / members.length,
          members,
          minDistance,
          maxDistance,
          hasNeighbor,
          allTied,
        },
      });
    });
    // Singles last so hovered / ranked rows paint above the bubbles.
    singles.forEach((point) => out.push({ kind: "dot", point }));
    return out;
  }, [dense, hoveredRow, positioned, reveal.ring, ringDistance, rWorld, wedgeGeom, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const wedgeVotes = useMemo(() => {
    const counts = new Map<string, number>();
    votes.forEach((vote) => {
      const wedge = grouping.wedgeOf(vote.label);
      counts.set(wedge, (counts.get(wedge) ?? 0) + vote.count);
    });
    return counts;
  }, [grouping, votes]);
  const wedgeTotals = useMemo(() => {
    const counts = new Map<string, number>();
    totals.forEach((count, label) => {
      const wedge = grouping.wedgeOf(label);
      counts.set(wedge, (counts.get(wedge) ?? 0) + count);
    });
    return counts;
  }, [grouping, totals]);
  const maxWedgeVotes = Math.max(1, ...wedgeVotes.values());
  const winnerWedge = prediction ? grouping.wedgeOf(prediction.prediction) : undefined;
  const wedgeIndex = (wedge: string) =>
    wedge === OTHER_WEDGE ? OTHER_LABEL_INDEX : grouping.indexOf(wedge);

  // Guide rings at meaningful distances: the neighborhood edge, half of it,
  // and the farthest drawn row. The k-ring itself is drawn separately.
  const guides = useMemo(() => {
    const ticks: number[] = [];
    if (near !== undefined && near < dMax) ticks.push(near / 2, near, dMax);
    else ticks.push(dMax / 3, (dMax * 2) / 3, dMax);
    // Skip ticks that would sit on top of the k-ring or each other.
    const seen: number[] =
      ringDistance !== undefined ? [rWorld(ringDistance) * zoom + 9] : [];
    return ticks.filter((tick) => {
      const r = rWorld(tick) * zoom;
      if (seen.some((other) => Math.abs(other - r) < 18)) return false;
      seen.push(r);
      return true;
    });
  }, [dMax, near, ringDistance, rWorld, zoom]);

  const ringRadius =
    ringDistance !== undefined ? rWorld(ringDistance) * zoom + 9 : undefined;

  /* Zoom + pan -------------------------------------------------------- */

  const zoomAt = useCallback(
    (factor: number, at?: { x: number; y: number }) => {
      setViewport((current) => {
        const next = clampZoom(current.zoom * factor);
        const ratio = next / current.zoom;
        if (!at) return { zoom: next, x: current.x * ratio, y: current.y * ratio };
        // Keep the point under the cursor fixed.
        const ax = at.x - cx;
        const ay = at.y - cy;
        return {
          zoom: next,
          x: ax - (ax - current.x) * ratio,
          y: ay - (ay - current.y) * ratio,
        };
      });
    },
    [cx, cy],
  );
  const panBy = (dx: number, dy: number) =>
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  const fit = () => setViewport(FIT);
  const zoomToNeighbors = () => {
    if (ringDistance === undefined) return;
    setViewport({
      zoom: clampZoom((radius * 0.85) / (rWorld(ringDistance) + 12)),
      x: 0,
      y: 0,
    });
  };

  // React registers wheel listeners as passive, so preventDefault (keeping
  // the page from scrolling while zooming) needs a native listener.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!hasQuery) return;
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      zoomAt(event.deltaY < 0 ? 1.18 : 1 / 1.18, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [hasQuery, ref, zoomAt]);

  // Drag-to-pan captures the pointer on the frame, which means a plain
  // `click` never reaches a bubble underneath. So a press that starts on a
  // bubble and does not travel is treated as the bubble's click here.
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    bubble?: string;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!hasQuery || event.button !== 0 || !target?.closest("svg")) return;
    const bubble = target.closest<SVGElement>("[data-bubble]")?.dataset.bubble;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      bubble,
      moved: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers cannot be captured; the drag
      // still works while the pointer stays over the frame.
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < CLICK_SLOP) return;
    if (!start.moved) {
      start.moved = true;
      setDragging(true);
    }
    setViewport((current) => ({ ...current, x: start.panX + dx, y: start.panY + dy }));
  };
  const onPointerUp = () => {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    if (!start || start.moved || !start.bubble) return;
    const mark = marks.find(
      (candidate): candidate is { kind: "bubble"; bubble: Bubble } =>
        candidate.kind === "bubble" && candidate.bubble.key === start.bubble,
    );
    if (!mark) return;
    zoomAt(2.2, {
      x: ox + Math.cos(mark.bubble.angle) * mark.bubble.screenR,
      y: oy + Math.sin(mark.bubble.angle) * mark.bubble.screenR,
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasQuery) return;
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
        event.preventDefault();
        panBy(step, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        panBy(-step, 0);
        break;
      case "ArrowUp":
        event.preventDefault();
        panBy(0, step);
        break;
      case "ArrowDown":
        event.preventDefault();
        panBy(0, -step);
        break;
      default:
    }
  };

  const hovered = positioned.find((point) => point.rowIndex === hoveredRow);
  const hoveredScreen = hovered ? toScreen(hovered.angle, hovered.distance) : undefined;
  const activeBubble = marks.find(
    (mark): mark is { kind: "bubble"; bubble: Bubble } =>
      mark.kind === "bubble" && mark.bubble.key === hoveredBubble,
  )?.bubble;
  const hoveredVote =
    hoveredWedge && ringRadius !== undefined
      ? (() => {
          const count = wedgeVotes.get(hoveredWedge) ?? 0;
          const { start, span: wedgeSpan } = wedgeGeom(hoveredWedge);
          const pad = wedgeSpan * 0.06;
          const weight = 3 + 9 * (count / maxWedgeVotes);
          const mid = start + pad + (wedgeSpan - pad * 2) / 2;
          const r = ringRadius + 6 + weight / 2;
          return {
            wedge: hoveredWedge,
            count,
            x: ox + Math.cos(mid) * r,
            y: oy + Math.sin(mid) * r,
          };
        })()
      : undefined;
  const farthest = Math.max(width, height) * 1.5;

  return (
    <div
      ref={ref}
      className={[
        styles.target,
        hasQuery ? styles.targetPannable : "",
        dragging ? styles.targetDragging : "",
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={hasQuery ? 0 : -1}
      role="group"
      aria-label={
        hasQuery
          ? "Distance target. Plus and minus zoom, arrow keys pan, 0 fits."
          : "Distance target"
      }
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={clearHover}
    >
      {width > 0 && height > 0 ? (
        <svg width={width} height={height} aria-hidden>
          {/* Wedge dividers radiate from the (panned) center. */}
          {wedges.length > 1
            ? wedges.map((wedge) => {
                const { start } = wedgeGeom(wedge);
                return (
                  <line
                    key={wedge}
                    className={styles.wedgeLine}
                    x1={ox + Math.cos(start) * inner * zoom}
                    y1={oy + Math.sin(start) * inner * zoom}
                    x2={ox + Math.cos(start) * farthest}
                    y2={oy + Math.sin(start) * farthest}
                  />
                );
              })
            : null}

          {hasQuery
            ? guides.map((tick) => {
                const r = rWorld(tick) * zoom;
                return (
                  <g key={tick}>
                    <circle className={styles.guideRing} cx={ox} cy={oy} r={r} />
                    <text
                      className={styles.guideLabel}
                      x={ox + 4}
                      y={oy - r - 3}
                    >
                      {formatDistance(tick)}
                    </text>
                  </g>
                );
              })
            : [0.33, 0.66, 1].map((step) => (
                <circle
                  key={step}
                  className={styles.guideRing}
                  cx={ox}
                  cy={oy}
                  r={inner + span * step}
                />
              ))}

          {/* Wedge labels orbit the (panned) center at a fixed screen
           * radius so they stay readable under zoom but move with a pan. */}
          {wedges.map((wedge) => {
            const { start, span: wedgeSpan } = wedgeGeom(wedge);
            const mid = start + wedgeSpan / 2;
            const lx = ox + Math.cos(mid) * (radius + 18);
            const ly = oy + Math.sin(mid) * (radius + 18);
            const anchor =
              Math.abs(Math.cos(mid)) < 0.25
                ? "middle"
                : Math.cos(mid) > 0
                  ? "start"
                  : "end";
            const voteCount = wedgeVotes.get(wedge) ?? 0;
            const isWinner = reveal.vote && winnerWedge === wedge;
            const isOther = wedge === OTHER_WEDGE;
            return (
              <text
                key={wedge}
                className={[
                  styles.wedgeLabel,
                  isWinner ? styles.wedgeLabelWinner : "",
                  isOther ? styles.wedgeLabelOther : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill={isOther ? "var(--text-neutral-tertiary)" : labelFill(wedgeIndex(wedge))}
              >
                <tspan className={styles.wedgeLabelName}>{grouping.nameOf(wedge)}</tspan>
                <tspan className={styles.wedgeLabelCount} dx={6}>
                  {reveal.vote
                    ? `${voteCount} vote${voteCount === 1 ? "" : "s"}`
                    : `${wedgeTotals.get(wedge) ?? 0} rows`}
                </tspan>
              </text>
            );
          })}

          {/* Tie band: rows that share the k-th distance but did not make the cut. */}
          {reveal.ring && ringDistance !== undefined && tiedCount > 0 ? (
            <circle
              className={styles.tieBand}
              cx={ox}
              cy={oy}
              r={rWorld(ringDistance) * zoom}
            />
          ) : null}

          {/* Small k: a spoke to each voter. Large k: the disc is the vote. */}
          {reveal.ring && !dense
            ? positioned
                .filter((point) => point.rank !== undefined)
                .map((point) => {
                  const p = toScreen(point.angle, point.distance);
                  return (
                    <line
                      key={`spoke-${point.rowIndex}`}
                      className={styles.spoke}
                      x1={ox}
                      y1={oy}
                      x2={p.x}
                      y2={p.y}
                    />
                  );
                })
            : null}

          {reveal.dots
            ? marks.map((mark) => {
                if (mark.kind === "bubble") {
                  const { bubble } = mark;
                  const bx = ox + Math.cos(bubble.angle) * bubble.screenR;
                  const by = oy + Math.sin(bubble.angle) * bubble.screenR;
                  const r = bubbleRadius(bubble.members.length);
                  const fill = labelFill(wedgeIndex(bubble.wedge));
                  const dim = reveal.ring && !bubble.hasNeighbor && !bubble.allTied;
                  const isActive = bubble.key === hoveredBubble;
                  return (
                    <g
                      key={bubble.key}
                      data-bubble={bubble.key}
                      className={styles.bubbleGroup}
                      onPointerEnter={() => setHoveredBubble(bubble.key)}
                      onPointerLeave={() => setHoveredBubble(undefined)}
                    >
                      <circle
                        cx={bx}
                        cy={by}
                        r={r}
                        fill={bubble.allTied ? "var(--background-neutral-primary)" : fill}
                        stroke={bubble.allTied ? fill : undefined}
                        className={[
                          styles.bubble,
                          dim ? styles.bubbleDim : "",
                          bubble.allTied ? styles.bubbleTied : "",
                          reveal.ring && bubble.hasNeighbor ? styles.bubbleNeighbor : "",
                          isActive ? styles.bubbleActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      <text
                        className={`${styles.bubbleCount} ${
                          bubble.allTied ? styles.bubbleCountTied : ""
                        }`}
                        x={bx}
                        y={by}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={bubble.allTied ? fill : undefined}
                      >
                        {bubble.members.length}
                      </text>
                    </g>
                  );
                }

                const { point } = mark;
                const isNeighbor = point.rank !== undefined;
                const tied = isTied(point);
                const dim = reveal.ring && !isNeighbor && !tied;
                const { x: px, y: py } = toScreen(point.angle, point.distance);
                const isHovered = point.rowIndex === hoveredRow;
                const ranked = isNeighbor && reveal.ring;
                const showRank = ranked && (!dense || isHovered);
                return (
                  <g
                    key={point.rowIndex}
                    className={styles.dotGroup}
                    onPointerEnter={() => onHover(point.rowIndex)}
                    onPointerLeave={() => onHover(undefined)}
                  >
                    <circle cx={px} cy={py} r={9} className={styles.dotHit} />
                    <circle
                      cx={px}
                      cy={py}
                      r={showRank ? 9 : isHovered ? 6 : ranked ? 4 : 3.5}
                      fill={tied ? "var(--background-neutral-primary)" : labelFill(grouping.indexOf(point.label))}
                      stroke={tied ? labelFill(grouping.indexOf(point.label)) : undefined}
                      className={[
                        styles.dot,
                        dim ? styles.dotDim : "",
                        tied ? styles.dotTied : "",
                        ranked ? styles.dotNeighbor : "",
                        isHovered ? styles.dotHovered : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    {showRank ? (
                      <text
                        className={styles.dotRank}
                        x={px}
                        y={py}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {point.rank}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          {reveal.ring && ringRadius !== undefined ? (
            <g>
              <circle
                className={`${styles.kRing} ${dense ? styles.kRingDense : ""}`}
                cx={ox}
                cy={oy}
                r={ringRadius}
              />
              {/* Large k: one arc per wedge just outside the ring, thicker
               * with more votes, so the tally is legible without badges. */}
              {dense
                ? wedges.map((wedge) => {
                    const count = wedgeVotes.get(wedge) ?? 0;
                    if (count === 0) return null;
                    const { start, span: wedgeSpan } = wedgeGeom(wedge);
                    const pad = wedgeSpan * 0.06;
                    const weight = 3 + 9 * (count / maxWedgeVotes);
                    const d = arcPath(
                      ox,
                      oy,
                      ringRadius + 6 + weight / 2,
                      start + pad,
                      wedgeSpan - pad * 2,
                    );
                    const isHovered = hoveredWedge === wedge;
                    return (
                      <g
                        key={`arc-${wedge}`}
                        onMouseEnter={() => setHoveredWedge(wedge)}
                        onMouseLeave={() => setHoveredWedge(undefined)}
                      >
                        <path
                          className={styles.voteArcHit}
                          d={d}
                          strokeWidth={Math.max(weight + 10, 16)}
                        />
                        <path
                          className={`${styles.voteArc} ${
                            winnerWedge === wedge ? styles.voteArcWinner : ""
                          } ${isHovered ? styles.voteArcHovered : ""}`}
                          d={d}
                          stroke={labelFill(wedgeIndex(wedge))}
                          strokeWidth={isHovered ? weight + 2 : weight}
                        />
                      </g>
                    );
                  })
                : null}
              <text
                className={styles.kRingLabel}
                x={ox}
                y={oy - ringRadius - (dense ? 20 : 6)}
                textAnchor="middle"
              >
                {k} nearest
              </text>
            </g>
          ) : null}

          {hasQuery ? (
            <g className={styles.query}>
              <circle cx={ox} cy={oy} r={11} className={styles.queryHalo} />
              <circle cx={ox} cy={oy} r={6} className={styles.queryCore} />
            </g>
          ) : (
            <g>
              <circle cx={ox} cy={oy} r={11} className={styles.queryGhost} />
            </g>
          )}
        </svg>
      ) : null}

      {hasQuery && hiddenCount > 0 ? (
        <p className={styles.hiddenNote}>
          {placed.length} of {placed.length + hiddenCount} rows shown
        </p>
      ) : null}

      {hasQuery ? (
        <div className={styles.zoomTools} role="group" aria-label="Zoom">
          <Tooltip title="Zoom in" placement="left">
            <Button
              size="extraSmall"
              variant="text"
              color="tertiary"
              iconOnly
              startIconName="magnifying-glass-plus"
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => zoomAt(1.5)}
            />
          </Tooltip>
          <Tooltip title="Zoom out" placement="left">
            <Button
              size="extraSmall"
              variant="text"
              color="tertiary"
              iconOnly
              startIconName="magnifying-glass-minus"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => zoomAt(1 / 1.5)}
            />
          </Tooltip>
          <Tooltip title="Zoom to the neighbors" placement="left">
            <Button
              size="extraSmall"
              variant="text"
              color="tertiary"
              iconOnly
              startIconName="arrows-to-dot"
              aria-label="Zoom to the neighbors"
              disabled={!reveal.ring}
              onClick={zoomToNeighbors}
            />
          </Tooltip>
          <Tooltip title="Fit everything" placement="left">
            <Button
              size="extraSmall"
              variant="text"
              color="tertiary"
              iconOnly
              startIconName="expand-wide"
              aria-label="Fit everything"
              disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              onClick={fit}
            />
          </Tooltip>
        </div>
      ) : null}

      {hovered && hoveredScreen ? (
        <RowCard
          className={styles.hoverCard}
          style={{ left: hoveredScreen.x, top: hoveredScreen.y }}
          rowIndex={hovered.rowIndex}
          rank={hovered.rank}
          label={hovered.label}
          labelIndex={grouping.indexOf(hovered.label)}
          distance={hovered.distance}
          deltas={detailFor(hovered.rowIndex)}
          columns={columns}
        />
      ) : activeBubble ? (
        <BubbleCard
          className={styles.hoverCard}
          style={{
            left: ox + Math.cos(activeBubble.angle) * activeBubble.screenR,
            top: oy + Math.sin(activeBubble.angle) * activeBubble.screenR,
          }}
          bubble={activeBubble}
          name={grouping.nameOf(activeBubble.wedge)}
          labelIndex={wedgeIndex(activeBubble.wedge)}
          showVotes={reveal.ring}
        />
      ) : hoveredVote ? (
        <VoteCard
          className={styles.hoverCard}
          style={{ left: hoveredVote.x, top: hoveredVote.y }}
          name={grouping.nameOf(hoveredVote.wedge)}
          labelIndex={wedgeIndex(hoveredVote.wedge)}
          count={hoveredVote.count}
          k={k}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Neighbor rail — stepper + step-responsive contents                        */
/* ------------------------------------------------------------------------ */

interface NeighborRailProps {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  labelName: string;
  grouping: LabelGrouping;
  k: number;
  query: AiLabDataRow | undefined;
  prediction: AiLabKnnPrediction | undefined;
  votes: Vote[];
  reveal: Reveal;
  hoveredRow: number | undefined;
  onHover: (rowIndex: number | undefined) => void;
  detailFor: (rowIndex: number) => AiLabFeatureDelta[] | undefined;
  steps: TraceStep[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  view: KnnView;
  onViewChange: (view: KnnView) => void;
  canvasChrome?: CanvasChrome;
}

function NeighborRail({
  rows,
  columns,
  features,
  labelColumn,
  labelName,
  grouping,
  k,
  query,
  prediction,
  votes,
  reveal,
  hoveredRow,
  onHover,
  detailFor,
  steps,
  stepIndex,
  onStepIndexChange,
  view,
  onViewChange,
  canvasChrome,
}: NeighborRailProps) {
  // Canvas mode keeps the card in its end state; only the target animates.
  const endState = Boolean(canvasChrome);
  const showVote = Boolean(prediction) && (endState || reveal.vote);
  const showMeasure =
    !endState && Boolean(prediction) && reveal.dots && !reveal.vote;
  const showPlace = !endState && Boolean(query) && !reveal.dots;
  const indexOf = grouping.indexOf;
  const listed = prediction?.neighbors.slice(0, RAIL_PREVIEW) ?? [];
  const showNeighbors = Boolean(prediction) && (showMeasure || showVote);

  const metrics =
    showPlace && query ? (
      <dl className={styles.exampleList}>
        {features.map((feature) => (
          <div key={feature} className={styles.exampleRow}>
            <dt>{featureName(columns, feature)}</dt>
            <span className={styles.exampleLeader} aria-hidden />
            <dd>{formatCell(query[feature])}</dd>
          </div>
        ))}
      </dl>
    ) : showMeasure || showVote ? (
      <VoteTally
        votes={votes}
        k={k}
        indexOf={indexOf}
        winner={prediction!.prediction}
        muted={showMeasure}
      />
    ) : null;

  const footer = (
    <div className={styles.railMore}>
      {view === "table" ? (
        <Button
          size="extraSmall"
          variant="outlined"
          color="secondary"
          fullWidth
          startIconName="arrow-left"
          onClick={() => onViewChange("target")}
        >
          Back to the target
        </Button>
      ) : (
        <Button
          size="extraSmall"
          variant="outlined"
          color="secondary"
          fullWidth
          endIconName="arrow-right"
          disabled={!prediction}
          onClick={() => onViewChange("table")}
        >
          See all rows
        </Button>
      )}
    </div>
  );

  const neighbors = (
    <div className={styles.neighborBlock}>
      <p className={styles.exampleEyebrow}>Nearest neighbors</p>
      {showNeighbors ? (
        <ol className={styles.railList}>
          {listed.map((neighbor, index) => {
            const row = rows[neighbor.rowIndex];
            const label = String(row[labelColumn]);
            const deltas = detailFor(neighbor.rowIndex) ?? [];
            const matches = deltas.filter((delta) => delta.match).length;
            const isHovered = hoveredRow === neighbor.rowIndex;
            const name = `Neighbor ${index + 1}, row ${neighbor.rowIndex + 1}: ${labelName} ${label}, distance ${formatDistance(neighbor.distance)}, ${matches} of ${features.length} features match.`;
            return (
              <li key={neighbor.rowIndex}>
                <button
                  type="button"
                  className={`${styles.railItem} ${
                    isHovered ? styles.railItemActive : ""
                  }`}
                  aria-label={name}
                  aria-pressed={isHovered}
                  onMouseEnter={() => onHover(neighbor.rowIndex)}
                  onMouseLeave={() => onHover(undefined)}
                  onFocus={() => onHover(neighbor.rowIndex)}
                  onBlur={() => onHover(undefined)}
                  onClick={() =>
                    onHover(isHovered ? undefined : neighbor.rowIndex)
                  }
                >
                  {showVote ? (
                    <span
                      className={styles.railRank}
                      style={{ background: labelFill(indexOf(label)) }}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                  ) : (
                    <span className={styles.railRankEmpty} aria-hidden />
                  )}
                  <span className={styles.railItemBody}>
                    <span className={styles.railLabel}>{label}</span>
                    <span className={styles.railMeta}>
                      <span>Row {neighbor.rowIndex + 1}</span>
                      <span className={styles.railDot} aria-hidden />
                      <span>{formatDistance(neighbor.distance)} away</span>
                      <span className={styles.railDot} aria-hidden />
                      <span>
                        {matches}/{features.length} match
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className={styles.railList} aria-hidden>
          {Array.from({ length: RAIL_PREVIEW }, (_, index) => (
            <li key={index} className={styles.railSlot}>
              <span className={styles.railRankEmpty} />
              <span className={styles.railItemBody}>
                <span className={styles.railLabelMuted}>Neighbor Name</span>
                <span className={styles.railMeta}>
                  <span>Row #</span>
                  <span className={styles.railDot} />
                  <span>0.0 away</span>
                  <span className={styles.railDot} />
                  <span>0/0 match</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  if (canvasChrome) {
    return (
      <CanvasCards
        steps={steps}
        index={stepIndex}
        onIndexChange={onStepIndexChange}
        showStepper={view === "target"}
        docked={view === "table"}
        outcome={canvasChrome.outcome}
        inputCard={canvasChrome.inputCard}
        metrics={metrics}
        footer={footer}
      >
        {neighbors}
      </CanvasCards>
    );
  }

  return (
    <NavigatorCard
      steps={steps}
      index={stepIndex}
      onIndexChange={onStepIndexChange}
      emptyText="Fill in the inputs to place your example."
      metrics={metrics}
      footer={footer}
    >
      {neighbors}
    </NavigatorCard>
  );
}

/** Top labels by votes with a proportion bar each; the rest fold into one row. */
function VoteTally({
  votes,
  k,
  indexOf,
  winner,
  muted = false,
}: {
  votes: Vote[];
  k: number;
  indexOf: (label: string) => number;
  winner: string;
  muted?: boolean;
}) {
  // Ties keep the vote order, so hoist the actual winner to the first row.
  const ordered = [
    ...votes.filter((vote) => vote.label === winner),
    ...votes.filter((vote) => vote.label !== winner),
  ];
  const shown = ordered.slice(0, TALLY_ROWS);
  const rest = ordered.slice(TALLY_ROWS);
  const restCount = rest.reduce((sum, vote) => sum + vote.count, 0);
  const row = (label: string, count: number, index: number, isOther = false) => (
    <li
      key={label}
      className={[styles.tallyRow, isOther ? styles.tallyRowOther : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.tallyLabel}>{label}</span>
      <span className={styles.tallyTrack} aria-hidden>
        <span
          className={`${styles.tallyFill} ${muted ? styles.tallyFillQuiet : ""}`}
          style={{
            width: `${(count / k) * 100}%`,
            ...(muted ? {} : { background: labelFill(index) }),
          }}
        />
      </span>
      <span className={styles.tallyCount}>{count}</span>
    </li>
  );
  return (
    <ul className={styles.tally} aria-label="Votes by label">
      {shown.map((vote) => row(vote.label, vote.count, indexOf(vote.label)))}
      {rest.length > 0
        ? row(`${rest.length} others`, restCount, OTHER_LABEL_INDEX, true)
        : null}
    </ul>
  );
}

/* ------------------------------------------------------------------------ */
/* Row card (hover / focus detail)                                           */
/* ------------------------------------------------------------------------ */

interface RowCardProps {
  rowIndex: number;
  rank: number | undefined;
  label: string;
  labelIndex: number;
  distance: number | undefined;
  deltas: AiLabFeatureDelta[] | undefined;
  columns: AiLabColumn[];
  className?: string;
  style?: CSSProperties;
}

function RowCard({
  rowIndex,
  rank,
  label,
  labelIndex,
  distance,
  deltas,
  columns,
  className = "",
  style,
}: RowCardProps) {
  return (
    <div className={`${styles.rowCard} ${className}`} style={style} role="tooltip">
      <p className={styles.rowCardTitle}>
        {rank !== undefined ? (
          <span className={styles.rowCardRank}>#{rank}</span>
        ) : null}
        Row {rowIndex + 1}
        <span className={styles.rowCardLabel}>
          <LabelSwatch label={label} index={labelIndex} />
        </span>
      </p>
      {distance !== undefined ? (
        <p className={styles.rowCardDistance}>
          {formatDistance(distance)} away
        </p>
      ) : null}
      {deltas ? (
        <ul className={styles.rowCardList}>
          {deltas.map((delta) => (
            <li key={delta.feature} className={styles.rowCardItem}>
              <span className={styles.rowCardFeature}>
                {featureName(columns, delta.feature)}
              </span>
              <span className={styles.rowCardValue}>
                {formatCell(delta.rowValue)}
              </span>
              <DeltaMark delta={delta} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function VoteCard({
  name,
  labelIndex,
  count,
  k,
  className = "",
  style,
}: {
  name: string;
  labelIndex: number;
  count: number;
  k: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`${styles.rowCard} ${className}`} style={style} role="tooltip">
      <p className={styles.rowCardTitle}>
        <LabelSwatch label={name} index={labelIndex} />
      </p>
      <p className={styles.rowCardDistance}>
        {count} of {k} votes
      </p>
    </div>
  );
}

function BubbleCard({
  bubble,
  name,
  labelIndex,
  showVotes,
  className = "",
  style,
}: {
  bubble: Bubble;
  name: string;
  labelIndex: number;
  showVotes: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const count = bubble.members.length;
  const voters = bubble.members.filter((member) => member.rank !== undefined).length;
  const range =
    Math.abs(bubble.maxDistance - bubble.minDistance) <= TIE_EPSILON
      ? `${formatDistance(bubble.minDistance)} away`
      : `${formatDistance(bubble.minDistance)}–${formatDistance(bubble.maxDistance)} away`;
  return (
    <div className={`${styles.rowCard} ${className}`} style={style} role="tooltip">
      <p className={styles.rowCardTitle}>
        {count} rows
        <span className={styles.rowCardLabel}>
          <LabelSwatch label={name} index={labelIndex} />
        </span>
      </p>
      <p className={styles.rowCardDistance}>
        {range}
        {showVotes && voters > 0 ? ` · ${voters} vote${voters === 1 ? "" : "s"}` : ""}
      </p>
      <p className={styles.rowCardHint}>Click to zoom in</p>
    </div>
  );
}

function DeltaMark({ delta }: { delta: AiLabFeatureDelta }) {
  if (delta.match) {
    return (
      <span className={`${styles.deltaMark} ${styles.deltaMatch}`}>
        <FaIcon name="check" size="small" />
        <span className={styles.srOnly}>matches</span>
      </span>
    );
  }
  return (
    <span className={styles.deltaMark}>
      <span aria-hidden>Δ </span>
      <span className={styles.srOnly}>differs by </span>
      {formatNumber(delta.delta)}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Table (full comparison, fully readable)                                   */
/* ------------------------------------------------------------------------ */

interface NeighborTableProps {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  labelName: string;
  indexOf: (label: string) => number;
  query: AiLabDataRow | undefined;
  order: number[] | undefined;
  distances: Float64Array | undefined;
  k: number;
  prediction: AiLabKnnPrediction | undefined;
}

function NeighborTable({
  rows,
  columns,
  features,
  labelColumn,
  labelName,
  indexOf,
  query,
  order,
  distances,
  k,
  prediction,
}: NeighborTableProps) {
  if (!query || !order || !distances) {
    return (
      <div className={styles.tableEmpty}>
        <p className={styles.tableEmptyText}>Nothing to compare yet.</p>
      </div>
    );
  }

  const shown = order.slice(0, TABLE_ROWS);

  const cell = (delta: AiLabFeatureDelta): ReactNode => (
    <span className={styles.tableCell}>
      <span>{formatCell(delta.rowValue)}</span>
      <DeltaMark delta={delta} />
    </span>
  );

  return (
    <div className={styles.tableScroller}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Rows ranked by distance from your example. The first {k} vote.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.thRank}>
              #
            </th>
            <th scope="col">Distance</th>
            {features.map((feature) => (
              <th key={feature} scope="col">
                {featureName(columns, feature)}
              </th>
            ))}
            <th scope="col">{labelName}</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.queryRow}>
            <th scope="row" className={styles.thRank}>
              <FaIcon name="location-dot" size="small" />
              <span className={styles.srOnly}>Your example</span>
            </th>
            <td>0</td>
            {features.map((feature) => (
              <td key={feature}>
                <strong>{formatCell(query[feature])}</strong>
              </td>
            ))}
            <td>
              <span className={styles.tablePrediction}>
                {prediction ? (
                  <LabelSwatch
                    label={prediction.prediction}
                    index={indexOf(prediction.prediction)}
                  />
                ) : (
                  "?"
                )}
                <span className={styles.tablePredictionNote}>predicted</span>
              </span>
            </td>
          </tr>
          {shown.map((rowIndex, position) => {
            const row = rows[rowIndex];
            const label = String(row[labelColumn]);
            const isVoter = position < k;
            const deltas = neighborFeatureDeltas(rows, rowIndex, query, features, columns);
            return (
              <tr
                key={rowIndex}
                className={isVoter ? styles.voterRow : styles.otherRow}
              >
                <th scope="row" className={styles.thRank}>
                  {position + 1}
                  {isVoter ? <span className={styles.srOnly}> (votes)</span> : null}
                </th>
                <td>{formatDistance(distances[rowIndex])}</td>
                {deltas.map((delta) => (
                  <td key={delta.feature}>{cell(delta)}</td>
                ))}
                <td>
                  <LabelSwatch label={label} index={indexOf(label)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
