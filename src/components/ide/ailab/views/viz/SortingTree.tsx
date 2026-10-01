import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { useElementSize } from "../../../../../hooks/useElementSize";
import { columnById, traceDecisionTree, treeBranches } from "../../../../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow, AiLabTreeNode } from "../../../../../types/aiLab";
import { labelFill, labelIndexer } from "./labelPalette";
import { elbowPathVertical, layoutTree, type LaidOutNode, type TreeLayout } from "./treeLayout";
import { leafScore } from "./TreeGrowth";
import styles from "./SortingTree.module.scss";

/* Geometry. `.node` / `.tray` in the SCSS must agree; dot size and gap
 * reach the SCSS as `--dot` / `--dot-gap`. */
const LEAF_MIN_WIDTH = 168;
const LEAF_MAX_WIDTH = 224;
/** Questions run longer than labels; decisions span 2+ leaf lanes, so they fit. */
const DECISION_WIDTH = 208;

/**
 * Wide enough for the longest label beside the ✓ / ✗ pills (rough glyph
 * estimate at body-3 semibold), so `Iris-versicolor` isn't `Iris-v…`.
 */
function leafWidth(labels: string[]): number {
  const longest = Math.max(0, ...labels.map((label) => label.length));
  const estimate = INSET_X * 2 + 16 + longest * 7.6 + 92;
  return Math.round(Math.min(LEAF_MAX_WIDTH, Math.max(LEAF_MIN_WIDTH, estimate)));
}
/** Border + padding from the node edge to its content box. */
const INSET_X = 12;
const INSET_Y = 10;
const HEAD_HEIGHT = 18;
const HEAD_GAP = 6;

/** Past this, one dot stands for several rows so a pile stays readable. */
const MAX_DOTS = 240;
const MARBLE = 18;

interface DotGeometry {
  dot: number;
  gap: number;
}

/** Every row stays a dot as long as it can; bigger sheets get smaller dots. */
function dotGeometry(count: number): DotGeometry {
  if (count <= 60) return { dot: 10, gap: 4 };
  if (count <= 120) return { dot: 8, gap: 3 };
  return { dot: 6, gap: 3 };
}

/** Dots per tray row; matches how the flex-wrap tray wraps at this width. */
function perRow(width: number, { dot, gap }: DotGeometry): number {
  return Math.floor((width - INSET_X * 2 + gap) / (dot + gap));
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
}

function trayHeight(count: number, width: number, geometry: DotGeometry): number {
  const rows = Math.max(1, Math.ceil(count / perRow(width, geometry)));
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
): SortingModel {
  return useMemo(() => {
    const indexOf = labelIndexer(labels);
    const leafOrder = new Map<string, number>();
    const walk = (node: AiLabTreeNode) => {
      if (node.type === "leaf") leafOrder.set(node.pathKey, leafOrder.size);
      else treeBranches(node).forEach(({ child }) => walk(child));
    };
    walk(tree);

    const traced = rows.map((row, rowIndex) => {
      const trace = traceDecisionTree(tree, row);
      const label = String(row[labelColumn]);
      return {
        rowIndex,
        label,
        pathKeys: trace.pathKeys,
        leaf: leafOrder.get(trace.pathKeys[trace.pathKeys.length - 1]!) ?? 0,
        rank: label === trace.prediction ? -1 : indexOf(label),
      };
    });
    traced.sort((a, b) => a.leaf - b.leaf || a.rank - b.rank || a.rowIndex - b.rowIndex);
    const picked = condense(traced, MAX_DOTS);
    const geometry = dotGeometry(picked.length);
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

    const leaf = leafWidth(labels);
    const layout = layoutTree(tree, () => "card", "vertical", undefined, (node) => {
      const width = node.type === "leaf" ? leaf : DECISION_WIDTH;
      return {
        width,
        height:
          INSET_Y * 2 +
          HEAD_HEIGHT +
          HEAD_GAP +
          trayHeight(members.get(node.pathKey)?.length ?? 0, width, geometry),
      };
    });
    const splits = layout.nodes
      .filter((laid) => laid.node.type === "decision")
      .sort((a, b) => a.depth - b.depth || a.x - b.x);

    return {
      layout,
      splits,
      splitIndex: new Map(splits.map((laid, index) => [laid.key, index])),
      dots,
      rowsPerDot: rows.length / Math.max(1, dots.length),
      geometry,
      members,
    };
  }, [tree, rows, labelColumn, labels]);
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
): { x: number; y: number } {
  const columns = perRow(node.width, geometry);
  const pitch = geometry.dot + geometry.gap;
  return {
    x: node.x + INSET_X + (slot % columns) * pitch,
    y: node.y + INSET_Y + HEAD_HEIGHT + HEAD_GAP + Math.floor(slot / columns) * pitch,
  };
}

/** Everything the sorting tree draws, as plain flags the caller steps through. */
export interface SortingTreeState {
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
  /** Piles step back so the quiz marble reads. */
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
  /** Pixel height cap; the stage scales down to fit width and this height. */
  maxHeight?: number;
  ariaLabel: string;
}

/**
 * A decision tree drawn as a sorting machine. Every row is a dot in its
 * real label's color; each question splits a pile into smaller piles until
 * each leaf is mostly one color and names itself after it. During testing a
 * grey marble (answer unknown) rolls down the connectors into a leaf. All
 * sizes come from the finished tree, so the stage never changes size.
 */
export function SortingTree({
  model,
  columns,
  labels,
  state,
  marble,
  instant = false,
  maxHeight = 340,
  ariaLabel,
}: SortingTreeProps) {
  const { layout, splits, splitIndex, dots, members, geometry } = model;
  const indexOf = useMemo(() => labelIndexer(labels), [labels]);
  const { ref, size } = useElementSize<HTMLDivElement>();
  const scale = Math.min(
    1,
    maxHeight / layout.height,
    size.width ? size.width / layout.width : 1,
  );

  const slotOf = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    members.forEach((ids, key) => map.set(key, new Map(ids.map((id, slot) => [id, slot]))));
    return map;
  }, [members]);

  const visible = (laid: LaidOutNode) =>
    !laid.parentKey || (splitIndex.get(laid.parentKey) ?? Infinity) < state.childrenShown;
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

  const lastSplit = state.splitsDone > 0 ? splits[state.splitsDone - 1] : undefined;
  const popStep = Math.min(28, 700 / Math.max(1, dots.length));
  const movingSlots = lastSplit ? slotOf.get(lastSplit.key) : undefined;
  const moveStep = Math.min(22, 320 / Math.max(1, movingSlots?.size ?? 1));

  return (
    <div
      ref={ref}
      className={`${styles.frame} ${instant ? styles.instant : ""}`}
      style={{ height: Math.ceil(layout.height * scale) }}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className={styles.stage}
        style={
          {
            width: layout.width,
            height: layout.height,
            transform: `translateX(-50%) scale(${scale})`,
            "--dot": `${geometry.dot}px`,
            "--dot-gap": `${geometry.gap}px`,
          } as CSSProperties
        }
      >
        <svg className={styles.links} width={layout.width} height={layout.height} aria-hidden>
          {links.map((link) => {
            const source = layout.byKey.get(link.sourceKey);
            const target = layout.byKey.get(link.targetKey);
            if (!source || !target) return null;
            const onPath = onMarblePath(link.sourceKey, link.targetKey);
            return (
              <path
                key={`${link.sourceKey}→${link.targetKey}`}
                className={[
                  styles.link,
                  visible(target) ? styles.linkOn : "",
                  onPath ? styles.linkPath : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                d={elbowPathVertical(source.cx, source.y + source.height, target.cx, target.y)}
              />
            );
          })}
        </svg>

        {layout.nodes.map((laid) => {
          const { node } = laid;
          const isLeaf = node.type === "leaf";
          const on = visible(laid);
          const decided = isLeaf ? state.named : asked(laid);
          const onPath = marbleKeys.has(laid.key);
          const score = isLeaf && state.checked ? leafScore(node) : undefined;
          const ids = members.get(laid.key) ?? [];
          return (
            <div key={laid.key} className={styles.slot}>
              {laid.branchLabel ? (
                <span
                  className={[
                    styles.edgeLabel,
                    on ? styles.edgeLabelOn : "",
                    onPath ? styles.edgeLabelPath : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ left: laid.cx, top: laid.y - EDGE_LABEL_GAP, height: EDGE_LABEL_HEIGHT }}
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
                style={{ left: laid.x, top: laid.y, width: laid.width, height: laid.height }}
              >
                <div className={styles.head}>
                  {decided ? (
                    <p className={styles.title}>
                      {isLeaf ? (
                        <span
                          className={styles.titleDot}
                          style={{ background: labelFill(indexOf(node.prediction)) }}
                          aria-hidden
                        />
                      ) : null}
                      <span className={styles.titleText}>
                        {isLeaf
                          ? node.prediction
                          : `${columnById(columns, node.feature)?.name ?? node.feature}?`}
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  {score ? (
                    <span className={styles.scores}>
                      <span className={`${styles.mark} ${styles.markRight}`}>
                        <FaIcon name="check" fontSize="9px" />
                        {score.right}
                      </span>
                      {score.wrong > 0 ? (
                        <span className={`${styles.mark} ${styles.markWrong}`}>
                          <FaIcon name="xmark" fontSize="9px" />
                          {score.wrong}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className={`${styles.count} ${filled(laid) ? styles.countOn : ""}`}>
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
          const { x, y } = slotPosition(laid, slotOf.get(key)?.get(dot.id) ?? 0, geometry);
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
          return (
            <span
              key={dot.id}
              className={[
                styles.dot,
                state.read ? "" : styles.dotHidden,
                state.quiet ? styles.dotQuiet : "",
                wrong ? styles.dotWrong : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                color: labelFill(indexOf(dot.label)),
                transform: `translate(${x}px, ${y}px) scale(${state.read ? 1 : 0.2})`,
                transitionDelay: `${delay}ms`,
              }}
              aria-hidden
            />
          );
        })}

        {marble && marble.step >= 0 ? (
          <Marble
            key={marble.id}
            layout={layout}
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
  marble,
  color,
  instant,
}: {
  layout: TreeLayout;
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
    const midY = bottom + (child.y - bottom) * 0.45;
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
  }, [layout, marble.pathKeys, marble.step, marble.travelMs, instant]);

  if (!at) return null;
  return (
    <span ref={ref} className={styles.marble} style={{ transform: placeAt(restPoint(at)) }} aria-hidden>
      <span
        key={color ? "revealed" : "hidden"}
        className={`${styles.marbleBody} ${color ? styles.marbleRevealed : ""}`}
        style={color ? { background: color } : undefined}
      >
        {color ? null : "?"}
      </span>
    </span>
  );
}
