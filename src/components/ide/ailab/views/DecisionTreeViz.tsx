import { useEffect, useMemo, useState } from "react";
import { Group } from "@visx/group";
import {
  hierarchy,
  Tree,
  type HierarchyPointLink,
  type HierarchyPointNode,
} from "@visx/hierarchy";
import { ParentSize } from "@visx/responsive";
import { LinkHorizontalStep } from "@visx/shape";
import { Button } from "@moshebaricdo/cads-react";
import type {
  AiLabColumn,
  AiLabTreeNode,
  AiLabTreeTrace,
} from "../../../../types/aiLab";
import { columnById, formatNumber } from "../../../../lib/aiLab";
import styles from "./DecisionTreeViz.module.scss";

interface TreeDatum {
  pathKey: string;
  title: string;
  subtitle: string;
  detail?: string;
  leaf: boolean;
  branchLabel?: string;
  children?: TreeDatum[];
}

const NODE_WIDTH = 152;
const NODE_HEIGHT = 52;

function toDatum(
  node: AiLabTreeNode,
  columns: AiLabColumn[],
  detailed: boolean,
): TreeDatum {
  if (node.type === "leaf") {
    return {
      pathKey: node.pathKey,
      title: "Prediction",
      subtitle: detailed
        ? `${node.prediction} · ${node.sampleCount} orders`
        : `${node.prediction} · ${node.sampleCount}`,
      detail: `${node.sampleCount} training orders in this group`,
      leaf: true,
    };
  }

  const featureName = columnById(columns, node.feature)?.name ?? node.feature;
  const branches =
    node.splitType === "numerical"
      ? [
          { child: node.left, label: `≤ ${formatNumber(node.threshold)}` },
          { child: node.right, label: `> ${formatNumber(node.threshold)}` },
        ]
      : Object.entries(node.children).map(([value, child]) => ({
          child,
          label: value,
        }));

  return {
    pathKey: node.pathKey,
    title: featureName,
    subtitle: detailed
      ? `${node.sampleCount} orders · −${formatNumber(node.impurityReduction)} impurity`
      : node.splitType === "numerical"
        ? "numeric split"
        : "by value",
    detail: `${node.sampleCount} orders. This question reduces impurity by ${formatNumber(node.impurityReduction)}.`,
    leaf: false,
    children: branches.map((branch) => ({
      ...toDatum(branch.child, columns, detailed),
      branchLabel: branch.label,
    })),
  };
}

interface DecisionTreeVizProps {
  root: AiLabTreeNode;
  columns: AiLabColumn[];
  trace: AiLabTreeTrace | undefined;
  detailed?: boolean;
}

export function DecisionTreeViz({
  root,
  columns,
  trace,
  detailed = false,
}: DecisionTreeVizProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const traceKey = trace?.pathKeys.join(">") ?? "";
  useEffect(() => {
    setStepIndex(0);
  }, [traceKey]);

  const emphasized = useMemo(
    () =>
      trace
        ? new Set(
            trace.pathKeys.slice(
              0,
              Math.min(stepIndex + 1, trace.pathKeys.length),
            ),
          )
        : new Set<string>(),
    [stepIndex, trace],
  );
  const data = useMemo(
    () => toDatum(root, columns, detailed),
    [columns, detailed, root],
  );
  const totalSteps = trace ? trace.steps.length + 1 : 0;

  return (
    <div className={styles.root}>
      <p className={styles.caption}>
        Read left to right. Matching branches continue across; the others step
        down.
      </p>
      <div className={styles.canvas}>
        <ParentSize>
          {({ width, height }) =>
            width > 0 && height > 0 ? (
              <TreeChart
                data={data}
                width={width}
                height={height}
                activePath={emphasized}
              />
            ) : null
          }
        </ParentSize>
      </div>
      <div className={styles.trace}>
        <div className={styles.traceNav}>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={!trace || stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          >
            Previous
          </Button>
          <span>
            {trace
              ? `Step ${Math.min(stepIndex + 1, totalSteps)} of ${totalSteps}`
              : "Try a prediction to trace the path"}
          </span>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            disabled={!trace || stepIndex >= totalSteps - 1}
            onClick={() =>
              setStepIndex((index) => Math.min(totalSteps - 1, index + 1))
            }
          >
            Next
          </Button>
        </div>
        {trace ? (
          <ol className={styles.traceList}>
            {trace.steps.map((step, index) => (
              <li
                key={step.pathKey}
                className={
                  index === stepIndex ? styles.traceItemActive : styles.traceItem
                }
              >
                {columnById(columns, step.feature)?.name ?? step.feature}:{" "}
                {String(step.value)} → {step.branchLabel}
              </li>
            ))}
            <li
              className={
                stepIndex === trace.steps.length
                  ? styles.traceItemActive
                  : styles.traceItem
              }
            >
              Prediction: {trace.prediction}
            </li>
          </ol>
        ) : null}
      </div>
    </div>
  );
}

function TreeChart({
  data,
  width,
  height,
  activePath,
}: {
  data: TreeDatum;
  width: number;
  height: number;
  activePath: Set<string>;
}) {
  const margin = {
    top: 44,
    right: NODE_WIDTH / 2 + 16,
    bottom: 44,
    left: NODE_WIDTH / 2 + 16,
  };
  const innerWidth = Math.max(120, width - margin.left - margin.right);
  const innerHeight = Math.max(80, height - margin.top - margin.bottom);
  const root = hierarchy(data);

  return (
    <svg width={width} height={height} role="img" aria-label="Decision tree">
      <Tree<TreeDatum> root={root} size={[innerHeight, innerWidth]}>
        {(tree) => (
          <Group top={margin.top} left={margin.left}>
            {tree.links().map((link, index) => (
              <TreeLink
                key={`${link.source.data.pathKey}-${link.target.data.pathKey}-${index}`}
                link={link}
                active={activePath.has(link.target.data.pathKey)}
              />
            ))}
            {tree.descendants().map((node) => (
              <TreeNode
                key={node.data.pathKey}
                node={node}
                active={activePath.has(node.data.pathKey)}
              />
            ))}
          </Group>
        )}
      </Tree>
    </svg>
  );
}

function TreeLink({
  link,
  active,
}: {
  link: HierarchyPointLink<TreeDatum>;
  active: boolean;
}) {
  const label = link.target.data.branchLabel;
  return (
    <g>
      <LinkHorizontalStep
        data={link}
        fill="none"
        stroke={
          active
            ? "var(--border-selected-primary)"
            : "var(--border-neutral-primary)"
        }
        strokeWidth={active ? 2 : 1.25}
      />
      {label ? (
        <text
          className={styles.edgeLabel}
          x={(link.source.y + link.target.y) / 2}
          y={(link.source.x + link.target.x) / 2 - 8}
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function TreeNode({
  node,
  active,
}: {
  node: HierarchyPointNode<TreeDatum>;
  active: boolean;
}) {
  return (
    <Group top={node.x} left={node.y}>
      <foreignObject
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
      >
        <div
          className={`${styles.node} ${node.data.leaf ? styles.nodeLeaf : ""} ${
            active ? styles.nodeActive : ""
          }`}
          title={node.data.detail}
        >
          <p className={styles.label}>{node.data.title}</p>
          <p className={styles.value}>{node.data.subtitle}</p>
        </div>
      </foreignObject>
    </Group>
  );
}
