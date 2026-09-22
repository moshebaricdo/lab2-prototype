import { useMemo } from "react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { useElementSize } from "../../../../../hooks/useElementSize";
import { columnById, treeBranches } from "../../../../../lib/aiLab";
import type { AiLabColumn, AiLabTreeNode } from "../../../../../types/aiLab";
import { DistributionBar, describeCounts } from "./LabelMarks";
import { labelFill, labelIndexer } from "./labelPalette";
import {
  elbowPathVertical,
  layoutTree,
  NODE_SIZES,
  type LaidOutNode,
  type TreeLayout,
} from "./treeLayout";
import styles from "./TreeGrowth.module.scss";

const LEAF_HEIGHT = NODE_SIZES.card.height + 24;
const EDGE_LABEL_HEIGHT = 22;
const EDGE_LABEL_GAP = 8;

/** Leaves: how many of the rows that landed here the prediction gets right. */
export function leafScore(node: AiLabTreeNode): { right: number; wrong: number } {
  if (node.type !== "leaf") return { right: 0, wrong: 0 };
  const right = node.labelCounts[node.prediction] ?? 0;
  return { right, wrong: node.sampleCount - right };
}

/** Sum of `leafScore` over the tree — the training rows the tree gets right. */
export function treeScore(root: AiLabTreeNode): { right: number; total: number } {
  let right = 0;
  let total = 0;
  const walk = (node: AiLabTreeNode) => {
    if (node.type === "leaf") {
      right += leafScore(node).right;
      total += node.sampleCount;
      return;
    }
    treeBranches(node).forEach(({ child }) => walk(child));
  };
  walk(root);
  return { right, total };
}

/**
 * Top-down layout (root at the top, leaves in columns) with every node at
 * card size and leaves tall enough for a right / wrong row. Nodes come back
 * in growth order: depth by depth, left to right.
 */
export function useGrowthLayout(root: AiLabTreeNode): {
  layout: TreeLayout;
  order: LaidOutNode[];
} {
  return useMemo(() => {
    const layout = layoutTree(
      root,
      () => "card",
      "vertical",
      undefined,
      (node) =>
        node.type === "leaf"
          ? { width: NODE_SIZES.card.width, height: LEAF_HEIGHT }
          : NODE_SIZES.card,
    );
    const order = [...layout.nodes].sort((a, b) => a.depth - b.depth || a.x - b.x);
    return { layout, order };
  }, [root]);
}

interface TreeGrowthProps {
  root: AiLabTreeNode;
  columns: AiLabColumn[];
  labels: string[];
  /** Nodes drawn so far, in `useGrowthLayout().order`. */
  revealedCount: number;
  /** Leaves show how many rows they got right / wrong. */
  showVerdicts: boolean;
  /** Frames a fully-grown tree and marks the leaves without any motion. */
  instant?: boolean;
  /** Pixel height cap; the tree scales down to fit width and this height. */
  maxHeight?: number;
}

/**
 * The tree as it forms during training. Each revealed node fades in below
 * its parent with the connector and edge label; once every node is in,
 * leaves settle into right / wrong marks. Scales to its container so the
 * whole tree is always visible.
 */
export function TreeGrowth({
  root,
  columns,
  labels,
  revealedCount,
  showVerdicts,
  instant = false,
  maxHeight = 420,
}: TreeGrowthProps) {
  const { layout, order } = useGrowthLayout(root);
  const indexOf = useMemo(() => labelIndexer(labels), [labels]);
  const { ref, size } = useElementSize<HTMLDivElement>();
  const frameWidth = size.width;
  const revealed = useMemo(
    () => new Set(order.slice(0, revealedCount).map((node) => node.key)),
    [order, revealedCount],
  );

  const scale = frameWidth
    ? Math.min(1, frameWidth / layout.width, maxHeight / layout.height)
    : 1;
  const stageHeight = Math.ceil(layout.height * scale);

  return (
    <div
      ref={ref}
      className={`${styles.frame} ${instant ? styles.frameInstant : ""}`}
      style={{ height: stageHeight }}
      role="img"
      aria-label={`Decision tree, ${revealedCount} of ${order.length} nodes drawn`}
    >
      <div
        className={styles.stage}
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <svg
          className={styles.links}
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {layout.links.map((link) => {
            const source = layout.byKey.get(link.sourceKey);
            const target = layout.byKey.get(link.targetKey);
            if (!source || !target) return null;
            const on = revealed.has(link.targetKey);
            return (
              <path
                key={`${link.sourceKey}→${link.targetKey}`}
                className={`${styles.link} ${on ? styles.linkOn : ""}`}
                d={elbowPathVertical(
                  source.cx,
                  source.y + source.height,
                  target.cx,
                  target.y,
                )}
              />
            );
          })}
        </svg>

        {layout.nodes.map((laid) => {
          const on = revealed.has(laid.key);
          const { node } = laid;
          const isLeaf = node.type === "leaf";
          const title = isLeaf
            ? node.prediction
            : `${columnById(columns, node.feature)?.name ?? node.feature}?`;
          const counts = describeCounts(node.labelCounts, labels);
          const score = isLeaf ? leafScore(node) : undefined;
          return (
            <div key={laid.key} className={styles.slot}>
              {laid.branchLabel ? (
                <span
                  className={`${styles.edgeLabel} ${on ? styles.edgeLabelOn : ""}`}
                  style={{
                    left: laid.cx,
                    top: laid.y - EDGE_LABEL_GAP,
                    height: EDGE_LABEL_HEIGHT,
                  }}
                >
                  {laid.branchLabel}
                </span>
              ) : null}
              <div
                className={[
                  styles.node,
                  isLeaf ? styles.nodeLeaf : styles.nodeDecision,
                  on ? styles.nodeOn : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: laid.x,
                  top: laid.y,
                  width: laid.width,
                  height: laid.height,
                }}
              >
                <div className={styles.nodeHead}>
                  <p className={styles.nodeTitle}>
                    {isLeaf ? (
                      <span
                        className={styles.nodeDot}
                        style={{ background: labelFill(indexOf(title)) }}
                        aria-hidden
                      />
                    ) : null}
                    <span className={styles.nodeTitleText}>{title}</span>
                  </p>
                  <span className={styles.nodeRows}>
                    {node.sampleCount} {node.sampleCount === 1 ? "row" : "rows"}
                  </span>
                </div>
                <DistributionBar
                  counts={node.labelCounts}
                  labels={labels}
                  description={counts}
                  className={styles.nodeBar}
                />
                {score ? (
                  <div
                    className={`${styles.score} ${showVerdicts ? styles.scoreOn : ""}`}
                    aria-hidden={!showVerdicts}
                  >
                    <span className={`${styles.mark} ${styles.markRight}`}>
                      <FaIcon name="check" fontSize="10px" />
                      {score.right}
                    </span>
                    {score.wrong > 0 ? (
                      <span className={`${styles.mark} ${styles.markWrong}`}>
                        <FaIcon name="xmark" fontSize="10px" />
                        {score.wrong}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TreeThumbnailProps {
  root: AiLabTreeNode;
  labels: string[];
  className?: string;
}

/**
 * The finished tree as a static mini-map: link strokes and colored blocks,
 * no text. Sits on the Results card so the shape the student watched grow
 * stays on screen after the modal closes.
 */
export function TreeThumbnail({ root, labels, className = "" }: TreeThumbnailProps) {
  const { layout } = useGrowthLayout(root);
  const indexOf = useMemo(() => labelIndexer(labels), [labels]);
  return (
    <svg
      className={`${styles.thumbnail} ${className}`}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Decision tree preview"
    >
      {layout.links.map((link) => {
        const source = layout.byKey.get(link.sourceKey);
        const target = layout.byKey.get(link.targetKey);
        if (!source || !target) return null;
        return (
          <path
            key={`${link.sourceKey}→${link.targetKey}`}
            className={styles.thumbLink}
            d={elbowPathVertical(source.cx, source.y + source.height, target.cx, target.y)}
          />
        );
      })}
      {layout.nodes.map((laid) => (
        <rect
          key={laid.key}
          className={styles.thumbNode}
          x={laid.x}
          y={laid.y}
          width={laid.width}
          height={laid.height}
          rx={12}
          style={
            laid.node.type === "leaf"
              ? { fill: labelFill(indexOf(laid.node.prediction)) }
              : undefined
          }
        />
      ))}
    </svg>
  );
}
