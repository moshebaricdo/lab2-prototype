import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { useElementSize } from "../../../../../hooks/useElementSize";
import { columnById, traceDecisionTree, treeBranches } from "../../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow, AiLabTreeNode } from "../../../../../types/aiLab";
import { groupLabels, type LabelGrouping } from "./labelGroups";
import { labelFill } from "./labelPalette";
import {
  elbowPathVertical,
  layoutTree,
  TREE_METRICS,
  type LaidOutNode,
  type TreeLayout,
} from "./treeLayout";
import { leafScore } from "./TreeGrowth";
import styles from "./SortingTree.module.scss";

/**
 * `default` is the lab's tree; `compact` is the Figma refinement (160px
 * cards, 12px type, 6.5px dots, plain edge labels, a higher elbow).
 */
export type SortingLook = "default" | "compact";

/* Geometry. `.node` / `.tray` (and `.compact` overrides) in the SCSS must
 * agree; dot size and gap reach the SCSS as `--dot` / `--dot-gap`. */
interface LookGeometry {
  leafMin: number;
  leafMax: number;
  /** Questions run longer than labels; decisions span 2+ leaf lanes, so they fit. */
  decision: number;
  /** Rough glyph width of a leaf label, for `leafWidth`. */
  glyph: number;
  /** Room for the ✓ / ✗ pills beside a leaf label. */
  pills: number;
  /** Border + padding from the node edge to its content box. */
  insetX: number;
  insetTop: number;
  insetBottom: number;
  headHeight: number;
  headGap: number;
  levelGap: number;
  /** Elbow run, as a share of the parent → child gap. */
  bend: number;
  dots: [DotGeometry, DotGeometry, DotGeometry];
}

const LOOKS: Record<SortingLook, LookGeometry> = {
  default: {
    leafMin: 168,
    leafMax: 224,
    decision: 208,
    glyph: 7.6,
    pills: 108,
    insetX: 12,
    insetTop: 10,
    insetBottom: 10,
    headHeight: 18,
    headGap: 6,
    levelGap: TREE_METRICS.levelGap,
    bend: 0.45,
    dots: [
      { dot: 10, gap: 4 },
      { dot: 8, gap: 3 },
      { dot: 6, gap: 3 },
    ],
  },
  compact: {
    leafMin: 160,
    leafMax: 200,
    decision: 160,
    glyph: 6.6,
    pills: 84,
    insetX: 9.5,
    insetTop: 7.5,
    insetBottom: 9.5,
    headHeight: 18,
    headGap: 4,
    levelGap: 55,
    bend: 16 / 55,
    dots: [
      { dot: 6.5, gap: 3 },
      { dot: 5.5, gap: 2.5 },
      { dot: 4.5, gap: 2 },
    ],
  },
};

/**
 * Wide enough for the longest label beside the ✓ / ✗ pills (rough glyph
 * estimate at the title size), so `Iris-versicolor` isn't `Iris-v…`.
 */
function leafWidth(labels: string[], look: LookGeometry): number {
  const longest = Math.max(0, ...labels.map((label) => label.length));
  const estimate = look.insetX * 2 + longest * look.glyph + look.pills;
  return Math.round(Math.min(look.leafMax, Math.max(look.leafMin, estimate)));
}

/** Past this, one dot stands for several rows so a pile stays readable. */
const MAX_DOTS = 240;
const MARBLE = 18;

interface DotGeometry {
  dot: number;
  gap: number;
}

/** Every row stays a dot as long as it can; bigger sheets get smaller dots. */
function dotGeometry(count: number, look: LookGeometry): DotGeometry {
  if (count <= 60) return look.dots[0];
  if (count <= 120) return look.dots[1];
  return look.dots[2];
}

/** Dots per tray row; matches how the flex-wrap tray wraps at this width. */
function perRow(width: number, { dot, gap }: DotGeometry, look: LookGeometry): number {
  return Math.floor((width - look.insetX * 2 + gap) / (dot + gap));
}

/**
 * Keep `target` of the sorted rows, split across each (leaf, label) run in
 * proportion to its size (largest remainder), so a condensed pile keeps
 * its real mix and every run keeps at least one dot.
 */
function condense<T extends { leaf: number; rank: number }>(sorted: T[], target: number): T[] {
  if (sorted.length <= target) return sorted;
  const runs: T[][] = [];
  sorted.forEach((entry, index) => {
    const previous = sorted[index - 1];
    if (previous && previous.leaf === entry.leaf && previous.rank === entry.rank) {
      runs[runs.length - 1]!.push(entry);
    } else {
      runs.push([entry]);
    }
  });
  const exact = runs.map((run) => (run.length * target) / sorted.length);
  const quota = exact.map((value) => Math.max(1, Math.floor(value)));
  let left = target - quota.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (left <= 0) break;
    if (quota[index]! < runs[index]!.length) {
      quota[index]! += 1;
      left -= 1;
    }
  }
  return runs.flatMap((run, index) => run.slice(0, quota[index]));
}
const EDGE_LABEL_HEIGHT = 22;
const EDGE_LABEL_GAP = 8;

export interface SortDot {
  id: number;
  label: string;
  /** Root → leaf keys this row falls through. */
  pathKeys: string[];
}

export interface SortingModel {
  look: SortingLook;
  layout: TreeLayout;
  /** Decision nodes in the order their questions are asked (depth, then left to right). */
  splits: LaidOutNode[];
  splitIndex: Map<string, number>;
  dots: SortDot[];
  /** Rows each dot stands for (1 when every row has its own dot). */
  rowsPerDot: number;
  geometry: DotGeometry;
  /** Node key → dot ids in slot order. */
  members: Map<string, number[]>;
  /**
   * Label → color. Past the palette, the labels the tree predicts most keep
   * a color and the rest fold into one neutral Other (`groupLabels`).
   */
  grouping: LabelGrouping;
}

function trayHeight(
  count: number,
  width: number,
  geometry: DotGeometry,
  look: LookGeometry,
): number {
  const rows = Math.max(1, Math.ceil(count / perRow(width, geometry, look)));
  return rows * geometry.dot + (rows - 1) * geometry.gap;
}

/**
 * One dot per row (condensed past `MAX_DOTS`), each carrying the path it
 * falls through. Dots are ordered once, globally, by leaf then label (the
 * leaf's own prediction first), so every pile is in the same order as its
 * parent: a split divides the pile left / right instead of shuffling it,
 * and each finished pile leads with its winning color. Node heights come
 * from their final dot counts, so nothing reflows while the tree fills.
 */
export function useSortingModel(
  tree: AiLabTreeNode,
  rows: AiLabDataRow[],
  labelColumn: string,
  labels: string[],
  lookName: SortingLook = "default",
): SortingModel {
  return useMemo(() => {
    const look = LOOKS[lookName];
    const leafOrder = new Map<string, number>();
    const walk = (node: AiLabTreeNode) => {
      if (node.type === "leaf") leafOrder.set(node.pathKey, leafOrder.size);
      else treeBranches(node).forEach(({ child }) => walk(child));
    };
    walk(tree);

    const routed = rows.map((row) => traceDecisionTree(tree, row));
    const totals = new Map<string, number>();
    const predicted = new Map<string, number>();
    rows.forEach((row, rowIndex) => {
      const label = String(row[labelColumn]);
      totals.set(label, (totals.get(label) ?? 0) + 1);
      const guess = routed[rowIndex]!.prediction;
      predicted.set(guess, (predicted.get(guess) ?? 0) + 1);
    });
    const grouping = groupLabels(
      labels,
      [...predicted].map(([label, count]) => ({ label, count })),
      totals,
    );
    /* Folded labels share Other's neutral, so they sort after the named colors. */
    const rankOf = (label: string) => {
      const index = grouping.indexOf(label);
      return index < 0 ? labels.length : index;
    };

    const traced = rows.map((row, rowIndex) => {
      const trace = routed[rowIndex]!;
      const label = String(row[labelColumn]);
      return {
        rowIndex,
        label,
        pathKeys: trace.pathKeys,
        leaf: leafOrder.get(trace.pathKeys[trace.pathKeys.length - 1]!) ?? 0,
        rank: label === trace.prediction ? -1 : rankOf(label),
      };
    });
    traced.sort((a, b) => a.leaf - b.leaf || a.rank - b.rank || a.rowIndex - b.rowIndex);
    const picked = condense(traced, MAX_DOTS);
    const geometry = dotGeometry(picked.length, look);
    const dots = picked.map((entry, id) => ({
      id,
      label: entry.label,
      pathKeys: entry.pathKeys,
    }));

    const members = new Map<string, number[]>();
    for (const dot of dots) {
      for (const key of dot.pathKeys) {
        const list = members.get(key);
        if (list) list.push(dot.id);
        else members.set(key, [dot.id]);
      }
    }

    const leaf = leafWidth(labels, look);
    const layout = layoutTree(
      tree,
      () => "card",
      "vertical",
      undefined,
      (node) => {
        const width = node.type === "leaf" ? leaf : look.decision;
        return {
          width,
          height:
            look.insetTop +
            look.insetBottom +
            look.headHeight +
            look.headGap +
            trayHeight(members.get(node.pathKey)?.length ?? 0, width, geometry, look),
        };
      },
      look.levelGap,
    );
    const splits = layout.nodes
      .filter((laid) => laid.node.type === "decision")
      .sort((a, b) => a.depth - b.depth || a.x - b.x);

    return {
      look: lookName,
      layout,
      splits,
      splitIndex: new Map(splits.map((laid, index) => [laid.key, index])),
      dots,
      rowsPerDot: rows.length / Math.max(1, dots.length),
      geometry,
      members,
      grouping,
    };
  }, [tree, rows, labelColumn, labels, lookName]);
}

/** Where a dot rests after `splitsDone` questions have sorted the piles. */
function restingKey(model: SortingModel, dot: SortDot, splitsDone: number): string {
  let index = 0;
  while (index < dot.pathKeys.length - 1) {
    const split = model.splitIndex.get(dot.pathKeys[index]!);
    if (split === undefined || split >= splitsDone) break;
    index += 1;
  }
  return dot.pathKeys[index]!;
}

function slotPosition(
  node: LaidOutNode,
  slot: number,
  geometry: DotGeometry,
  look: LookGeometry,
): { x: number; y: number } {
  const columns = perRow(node.width, geometry, look);
  const pitch = geometry.dot + geometry.gap;
  return {
    x: node.x + look.insetX + (slot % columns) * pitch,
    y:
      node.y +
      look.insetTop +
      look.headHeight +
      look.headGap +
      Math.floor(slot / columns) * pitch,
  };
}

/** Everything the sorting tree draws, as plain flags the caller steps through. */
export interface SortingTreeState {
  /** The root node has slid in (empty until `read`); treated as true when omitted. */
  rootShown?: boolean;
  /** Dots have popped into the root pile. */
  read: boolean;
  /** Questions visible: `splits[i]` shows its feature when `i < splitsShown`. */
  splitsShown: number;
  /** Child piles, connectors, and edge labels visible under the first N splits. */
  childrenShown: number;
  /** Dots have fallen through the first N splits. */
  splitsDone: number;
  /** Leaves show the label they guess. */
  named: boolean;
  /** Testing: dots hold still (no move stagger) while the quiz row runs. */
  quiet: boolean;
  /** Odd-colored dots in each leaf go hollow; leaves show ✓ / ✗ counts. */
  checked: boolean;
}

export interface SortingMarble {
  /** Change per quiz row so the marble starts fresh at the root. */
  id: string | number;
  pathKeys: string[];
  /** Index into `pathKeys` the marble sits on; −1 hides it. */
  step: number;
  /** The real label once revealed; a grey "?" until then. */
  revealedLabel?: string;
  /** The leaf it landed in is announcing its guess. */
  answering?: boolean;
  /** Travel time for one step. */
  travelMs: number;
}

interface SortingTreeProps {
  model: SortingModel;
  columns: AiLabColumn[];
  labels: string[];
  state: SortingTreeState;
  marble?: SortingMarble;
  /** No transitions (Skip, reduced motion). */
  instant?: boolean;
  /**
   * Drawn inside the scaled stage, in layout pixels — a variant can park
   * labels on the connectors without knowing the stage's scale.
   */
  overlay?: ReactNode;
  /** Edge into this node lights up before the marble has taken it. */
  hotEdgeKey?: string;
  /** Pixel height cap; the stage scales down to fit width and this height. */
  maxHeight?: number;
  /** Largest scale the stage may grow to when there's room (1 = never past layout size). */
  maxScale?: number;
  /**
   * CSS timing (`duration easing`) for scale changes, e.g. when `maxHeight`
   * moves with a panel sliding in. Unset, the stage snaps to its new size.
   */
  resizeTransition?: string;
  /**
   * A question (or a leaf's label) shows as soon as its node appears,
   * before its dots arrive, and the row count waits for the dots to land:
   * title, dots, count.
   */
  askOnArrival?: boolean;
  /** Color dot beside each leaf's label (the dots and key already carry it). */
  labelSwatch?: boolean;
  /**
   * `marble` rolls the grey "?" dot down the connectors. `trace` drops the
   * dot: each taken connector draws itself parent → child, and the node and
   * edge label it reaches light up when the line arrives (`traceMs`).
   * `rider` is `trace` with a plain grey marble riding the line's tip; it
   * takes the landing leaf's color as it starts the last connector.
   */
  marbleStyle?: SortingMarbleStyle;
  ariaLabel: string;
}

export type SortingMarbleStyle = "marble" | "trace" | "rider";

/** Extra draw time on each taken connector in `trace` mode, on top of its share of the step. */
const TRACE_EXTRA_MS = 50;

/** How long a taken connector takes to draw in `trace` mode. */
export function traceMs(travelMs: number): number {
  return Math.round(travelMs * CONNECTOR_SHARE) + TRACE_EXTRA_MS;
}

/**
 * A decision tree drawn as a sorting machine. Every row is a dot in its
 * real label's color; each question splits a pile into smaller piles until
 * each leaf is mostly one color and names itself after it. During testing a
 * grey marble (answer unknown) rolls down the connectors into a leaf. All
 * sizes come from the finished tree, so the stage only rescales when its
 * `maxHeight` or width changes.
 */
export function SortingTree({
  model,
  columns,
  labels,
  state,
  marble,
  instant = false,
  maxHeight = 340,
  maxScale = 1,
  resizeTransition,
  overlay,
  hotEdgeKey,
  askOnArrival = false,
  labelSwatch = true,
  marbleStyle = "marble",
  ariaLabel,
}: SortingTreeProps) {
  const trace = marbleStyle !== "marble";
  const rider = marbleStyle === "rider";
  const { layout, splits, splitIndex, dots, members, geometry } = model;
  const look = LOOKS[model.look];
  const compact = model.look === "compact";
  const indexOf = model.grouping.indexOf;
  const { ref, size } = useElementSize<HTMLDivElement>();
  const scale = Math.min(
    maxScale,
    maxHeight / layout.height,
    size.width ? size.width / layout.width : maxScale,
  );
  /* Center on the nodes, not the layout box, which can carry a lane gap on
     one side and would sit the tree off-center. */
  const centerShift = useMemo(() => {
    if (layout.nodes.length === 0) return 0;
    const left = Math.min(...layout.nodes.map((laid) => laid.x));
    const right = Math.max(...layout.nodes.map((laid) => laid.x + laid.width));
    return layout.width / 2 - (left + right) / 2;
  }, [layout]);

  const slotOf = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    members.forEach((ids, key) => map.set(key, new Map(ids.map((id, slot) => [id, slot]))));
    return map;
  }, [members]);

  const visible = (laid: LaidOutNode) =>
    laid.parentKey
      ? (splitIndex.get(laid.parentKey) ?? Infinity) < state.childrenShown
      : state.rootShown !== false;
  const asked = (laid: LaidOutNode) =>
    (splitIndex.get(laid.key) ?? Infinity) < state.splitsShown;
  const sorted = (laid: LaidOutNode) =>
    (splitIndex.get(laid.key) ?? Infinity) < state.splitsDone;
  const filled = (laid: LaidOutNode) =>
    laid.parentKey
      ? (splitIndex.get(laid.parentKey) ?? Infinity) < state.splitsDone
      : state.read;

  const marbleKeys = new Set(marble ? marble.pathKeys.slice(0, marble.step + 1) : []);
  const onMarblePath = (sourceKey: string, targetKey: string) =>
    marbleKeys.has(sourceKey) && marbleKeys.has(targetKey);
  // Siblings share the elbow's first segment; the lit one must paint last.
  const links = [...layout.links].sort(
    (a, b) =>
      Number(onMarblePath(a.sourceKey, a.targetKey)) -
      Number(onMarblePath(b.sourceKey, b.targetKey)),
  );
  const landedKey =
    marble && marble.step === marble.pathKeys.length - 1 ? marble.pathKeys[marble.step] : undefined;
  /** In `trace` mode, the node the line is still drawing toward. */
  const arrivingKey =
    trace && marble && marble.step > 0 ? marble.pathKeys[marble.step] : undefined;
  const arriveDelay = (key: string): CSSProperties | undefined =>
    key === arrivingKey && !instant ? { transitionDelay: `${traceMs(marble!.travelMs)}ms` } : undefined;
  const linkPathD = (sourceKey: string, targetKey: string) => {
    const source = layout.byKey.get(sourceKey);
    const target = layout.byKey.get(targetKey);
    if (!source || !target) return undefined;
    return elbowPathVertical(
      source.cx,
      source.y + source.height,
      target.cx,
      target.y,
      8,
      look.bend,
    );
  };

  const lastSplit = state.splitsDone > 0 ? splits[state.splitsDone - 1] : undefined;
  const popStep = Math.min(28, 700 / Math.max(1, dots.length));
  const movingSlots = lastSplit ? slotOf.get(lastSplit.key) : undefined;
  const moveStep = Math.min(22, 320 / Math.max(1, movingSlots?.size ?? 1));

  return (
    <div
      ref={ref}
      className={[styles.frame, compact ? styles.compact : "", instant ? styles.instant : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: Math.ceil(layout.height * scale),
        transition: resizeTransition && !instant ? `height ${resizeTransition}` : undefined,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className={styles.stage}
        style={
          {
            width: layout.width,
            height: layout.height,
            transform: `translateX(calc(-50% + ${centerShift * scale}px)) scale(${scale})`,
            transition: resizeTransition && !instant ? `transform ${resizeTransition}` : undefined,
            "--dot": `${geometry.dot}px`,
            "--dot-gap": `${geometry.gap}px`,
          } as CSSProperties
        }
      >
        <svg className={styles.links} width={layout.width} height={layout.height} aria-hidden>
          {links.map((link) => {
            const target = layout.byKey.get(link.targetKey);
            const d = linkPathD(link.sourceKey, link.targetKey);
            if (!target || !d) return null;
            const onPath = !trace && onMarblePath(link.sourceKey, link.targetKey);
            const hot = hotEdgeKey === link.targetKey;
            return (
              <path
                key={`${link.sourceKey}→${link.targetKey}`}
                className={[
                  styles.link,
                  visible(target) ? styles.linkOn : "",
                  onPath || hot ? styles.linkPath : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                d={d}
              />
            );
          })}
          {trace && marble
            ? marble.pathKeys.slice(1, marble.step + 1).map((targetKey, index) => {
                const sourceKey = marble.pathKeys[index]!;
                const d = linkPathD(sourceKey, targetKey);
                if (!d) return null;
                return (
                  <path
                    key={`${marble.id}:${targetKey}`}
                    className={`${styles.linkTrace} ${targetKey === arrivingKey ? styles.linkTraceDraw : ""}`}
                    style={{ "--trace-ms": `${traceMs(marble.travelMs)}ms` } as CSSProperties}
                    pathLength={1}
                    d={d}
                  />
                );
              })
            : null}
        </svg>

        {layout.nodes.map((laid) => {
          const { node } = laid;
          const isLeaf = node.type === "leaf";
          const on = visible(laid);
          const decided = askOnArrival ? on : isLeaf ? state.named : asked(laid);
          const onPath = marbleKeys.has(laid.key);
          const hot = hotEdgeKey === laid.key;
          const score = isLeaf && state.checked ? leafScore(node) : undefined;
          const ids = members.get(laid.key) ?? [];
          return (
            <div key={laid.key} className={styles.slot}>
              {laid.branchLabel ? (
                <span
                  className={[
                    styles.edgeLabel,
                    on ? styles.edgeLabelOn : "",
                    onPath || hot ? styles.edgeLabelPath : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    left: laid.cx,
                    top: laid.y - EDGE_LABEL_GAP,
                    height: compact ? 20 : EDGE_LABEL_HEIGHT,
                    ...arriveDelay(laid.key),
                  }}
                >
                  {laid.branchLabel}
                </span>
              ) : null}
              <div
                className={[
                  styles.node,
                  on ? styles.nodeOn : "",
                  !isLeaf && sorted(laid) ? styles.nodeSorted : "",
                  onPath ? styles.nodePath : "",
                  landedKey === laid.key && marble?.answering ? styles.nodeAnswer : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: laid.x,
                  top: laid.y,
                  width: laid.width,
                  height: laid.height,
                  ...arriveDelay(laid.key),
                }}
                data-node-key={laid.key}
              >
                <div className={styles.head}>
                  {decided ? (
                    <p className={styles.title} data-node-title>
                      {isLeaf && labelSwatch ? (
                        <span
                          className={styles.titleDot}
                          style={{ background: labelFill(indexOf(node.prediction)) }}
                          aria-hidden
                        />
                      ) : null}
                      <span className={styles.titleText}>
                        {isLeaf
                          ? node.prediction
                          : `${columnById(columns, node.feature)?.name ?? node.feature}${compact ? "" : "?"}`}
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  {score ? (
                    <span className={styles.scores}>
                      <span className={`${styles.mark} ${styles.markRight}`}>
                        <FaIcon name="circle-check" fontSize="10px" />
                        {score.right}
                      </span>
                      {score.wrong > 0 ? (
                        <span className={`${styles.mark} ${styles.markWrong}`}>
                          <FaIcon name="circle-xmark" fontSize="10px" />
                          {score.wrong}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span
                      className={[
                        styles.count,
                        askOnArrival ? styles.countLate : "",
                        filled(laid) ? styles.countOn : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {node.sampleCount}
                    </span>
                  )}
                </div>
                {isLeaf ? null : (
                  <div className={styles.tray} aria-hidden>
                    {ids.map((id) => (
                      <span
                        key={id}
                        className={styles.ghost}
                        style={{ background: labelFill(indexOf(dots[id]!.label)) }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {dots.map((dot) => {
          const key = restingKey(model, dot, state.splitsDone);
          const laid = layout.byKey.get(key);
          if (!laid) return null;
          const { x, y } = slotPosition(laid, slotOf.get(key)?.get(dot.id) ?? 0, geometry, look);
          const moving = movingSlots?.get(dot.id);
          const delay =
            state.splitsShown === 0
              ? Math.min(dot.id * popStep, 700)
              : !state.quiet && moving !== undefined
                ? moving * moveStep
                : 0;
          const wrong =
            state.checked &&
            laid.node.type === "leaf" &&
            laid.node.prediction !== dot.label;
          const answering = key === landedKey && marble?.answering === true;
          return (
            <span
              key={dot.id}
              className={[
                styles.dot,
                state.read ? "" : styles.dotHidden,
                wrong ? styles.dotWrong : "",
                answering ? styles.dotAnswer : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                color: labelFill(indexOf(dot.label)),
                transform: `translate(${x}px, ${y}px) scale(${state.read ? 1 : 0.2})`,
                transitionDelay: `${delay}ms`,
                transformOrigin: answering
                  ? `${laid.x + laid.width / 2}px ${laid.y + laid.height / 2}px`
                  : undefined,
              }}
              aria-hidden
            />
          );
        })}

        {overlay}
        {marble && marble.step >= 0 && rider ? (
          <RiderMarble
            key={marble.id}
            layout={layout}
            marble={marble}
            pathOf={linkPathD}
            color={
              marble.step > 0 && marble.step === marble.pathKeys.length - 1
                ? leafFill(layout.byKey.get(marble.pathKeys[marble.step]!), indexOf)
                : undefined
            }
            instant={instant}
          />
        ) : null}
        {marble && marble.step >= 0 && !trace ? (
          <Marble
            key={marble.id}
            layout={layout}
            bend={look.bend}
            marble={marble}
            color={
              marble.revealedLabel !== undefined
                ? labelFill(indexOf(marble.revealedLabel))
                : undefined
            }
            instant={instant}
          />
        ) : null}
      </div>
    </div>
  );
}

function topCenter(laid: LaidOutNode) {
  return { x: laid.cx, y: laid.y };
}

function bottomCenter(laid: LaidOutNode) {
  return { x: laid.cx, y: laid.y + laid.height };
}

/** Decisions: where the outgoing connector starts. Leaves: where it landed. */
function restPoint(laid: LaidOutNode) {
  return laid.node.type === "leaf" ? topCenter(laid) : bottomCenter(laid);
}

const placeAt = (point: { x: number; y: number }) =>
  `translate(${point.x - MARBLE / 2}px, ${point.y - MARBLE / 2}px)`;

/** Share of a step spent on the connector; the rest drops it through the next question. */
const CONNECTOR_SHARE = 0.8;

/**
 * The quiz row, answer unknown. Waits on the bottom edge of the question
 * it's at, where the connector starts; each step rolls it along the elbow
 * connector only, into the top of the next node, and — if that node is
 * another question — out of its bottom edge, never sliding across a card.
 * Like a marble in a Plinko board.
 */
function Marble({
  layout,
  bend,
  marble,
  color,
  instant,
}: {
  layout: TreeLayout;
  bend: number;
  marble: SortingMarble;
  color: string | undefined;
  instant: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(marble.step);
  const at = layout.byKey.get(marble.pathKeys[marble.step]!);

  useLayoutEffect(() => {
    const from = shown.current;
    shown.current = marble.step;
    const el = ref.current;
    if (!el || instant || marble.step !== from + 1) return;
    const parent = layout.byKey.get(marble.pathKeys[from]!);
    const child = layout.byKey.get(marble.pathKeys[marble.step]!);
    if (!parent || !child) return;
    const bottom = parent.y + parent.height;
    const midY = bottom + (child.y - bottom) * bend;
    const points = [
      bottomCenter(parent),
      { x: parent.cx, y: midY },
      { x: child.cx, y: midY },
      topCenter(child),
    ];
    const lengths = points.map((point, index) =>
      index === 0
        ? 0
        : Math.hypot(point.x - points[index - 1]!.x, point.y - points[index - 1]!.y),
    );
    const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
    const passThrough = child.node.type === "decision";
    const share = passThrough ? CONNECTOR_SHARE : 1;
    let run = 0;
    const frames: Keyframe[] = points.map((point, index) => {
      run += lengths[index]!;
      return { transform: placeAt(point), opacity: 1, offset: (run / total) * share };
    });
    if (passThrough) {
      const exit = bottomCenter(child);
      frames.push(
        { transform: `${placeAt(topCenter(child))} scale(0.4)`, opacity: 0, offset: share + 0.06 },
        { transform: `${placeAt(exit)} scale(0.4)`, opacity: 0, offset: share + 0.08 },
        { transform: placeAt(exit), opacity: 1, offset: 1 },
      );
    }
    el.animate(frames, {
      duration: marble.travelMs,
      easing: "cubic-bezier(0.45, 0, 0.25, 1)",
    });
  }, [layout, bend, marble.pathKeys, marble.step, marble.travelMs, instant]);

  if (!at) return null;
  return (
    <span ref={ref} className={styles.marble} style={{ transform: placeAt(restPoint(at)) }} aria-hidden>
      <MarbleBody color={color} />
    </span>
  );
}

function leafFill(
  laid: LaidOutNode | undefined,
  indexOf: (label: string) => number,
): string | undefined {
  return laid?.node.type === "leaf" ? labelFill(indexOf(laid.node.prediction)) : undefined;
}

/** `.linkTraceDraw`'s easing, so the marble stays on the line's tip. */
const TRACE_EASE = "cubic-bezier(0.45, 0, 0.25, 1)";
/** The marble popping back out under a question to wait for the next line. */
const MARBLE_DROP_MS = 180;

/**
 * `rider` mode's marble: a plain grey dot carried along the connector the
 * trace is drawing — the same SVG path (`offset-path`), duration (`traceMs`)
 * and easing — then dropped out of the bottom of a question to wait for the
 * next one. It takes on its leaf's color (`color`) for the last connector.
 */
function RiderMarble({
  layout,
  marble,
  pathOf,
  color,
  instant,
}: {
  layout: TreeLayout;
  marble: SortingMarble;
  pathOf: (sourceKey: string, targetKey: string) => string | undefined;
  color: string | undefined;
  instant: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(marble.step);
  /* A fresh function each render; reading it through a ref keeps a
     re-render from cancelling the ride mid-line. */
  const pathRef = useRef(pathOf);
  pathRef.current = pathOf;
  const at = layout.byKey.get(marble.pathKeys[marble.step]!);

  useLayoutEffect(() => {
    const from = shown.current;
    shown.current = marble.step;
    const el = ref.current;
    if (!el || instant || marble.step !== from + 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sourceKey = marble.pathKeys[from]!;
    const child = layout.byKey.get(marble.pathKeys[marble.step]!);
    const d = pathRef.current(sourceKey, marble.pathKeys[marble.step]!);
    if (!child || !d) return;
    /* The path lives only in the keyframes: an `offset-path` left on the
       element would stack on its resting `transform`. A question's exit
       drop-in rides the same timeline. */
    const path = `path("${d}")`;
    const rideMs = traceMs(marble.travelMs);
    const ride: Keyframe[] = [
      { offsetPath: path, offsetRotate: "0deg", offsetDistance: "0%", transform: "none", easing: TRACE_EASE },
      { offsetPath: path, offsetRotate: "0deg", offsetDistance: "100%", transform: "none" },
    ];
    if (child.node.type !== "decision") {
      const anim = el.animate(ride, { duration: rideMs });
      return () => anim.cancel();
    }
    const total = rideMs + MARBLE_DROP_MS;
    const at = rideMs / total;
    const exit = placeAt(bottomCenter(child));
    ride[1]!.offset = at;
    const anim = el.animate(
      [
        ...ride,
        {
          offset: Math.min(1, at + 0.001),
          offsetPath: "none",
          transform: `${exit} scale(0.4)`,
          opacity: 0,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        },
        { offsetPath: "none", transform: exit, opacity: 1 },
      ],
      { duration: total },
    );
    return () => anim.cancel();
  }, [layout, marble.pathKeys, marble.step, marble.travelMs, instant]);

  if (!at) return null;
  return (
    <span ref={ref} className={styles.marble} style={{ transform: placeAt(restPoint(at)) }} aria-hidden>
      <span
        className={`${styles.marbleBody} ${styles.marblePlain}`}
        style={color ? { background: color } : undefined}
      />
    </span>
  );
}

function MarbleBody({ color }: { color: string | undefined }) {
  return (
    <span
      key={color ? "revealed" : "hidden"}
      className={`${styles.marbleBody} ${color ? styles.marbleRevealed : ""}`}
      style={color ? { background: color } : undefined}
    >
      {color ? null : "?"}
    </span>
  );
}