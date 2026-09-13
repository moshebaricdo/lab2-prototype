import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type {
  AiLabColumn,
  AiLabTreeNode,
  AiLabTreeTrace,
} from "../../../../../types/aiLab";
import {
  columnById,
  formatCell,
  treeBranches,
} from "../../../../../lib/aiLab";
import { CanvasCards, CARD_INSET, type CanvasChrome } from "./CanvasCards";
import { DistributionBar, LabelSwatch, describeCounts } from "./LabelMarks";
import { labelIndexer } from "./labelPalette";
import { NavigatorCard } from "./NavigatorCard";
import { type TraceStep } from "./TraceBar";
import {
  elbowPath,
  elbowPathVertical,
  layoutTree,
  TREE_METRICS,
  treeRules,
  type LaidOutNode,
  type NodeSize,
  type TreeLink,
  type TreeOrientation,
} from "./treeLayout";
import { VizFrame } from "./VizFrame";
import styles from "./DecisionTreeViz.module.scss";

export type TreeView = "diagram" | "rules";

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
}

function featureName(columns: AiLabColumn[], feature: string): string {
  return columnById(columns, feature)?.name ?? feature;
}

function rowsText(count: number): string {
  return `${count} row${count === 1 ? "" : "s"}`;
}

function purity(node: AiLabTreeNode): number {
  if (node.sampleCount === 0) return 0;
  const top = Math.max(0, ...Object.values(node.labelCounts));
  return Math.round((top / node.sampleCount) * 100);
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
}: DecisionTreeVizProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const indexOf = useMemo(() => labelIndexer(labels), [labels]);

  useEffect(() => {
    setSelectedKey(undefined);
  }, [view]);

  const steps = useMemo<TraceStep[]>(() => {
    if (!trace) return [];
    const questionSteps = trace.steps.map<TraceStep>((step, index) => {
      const name = featureName(columns, step.feature);
      const value = formatCell(step.value);
      return {
        id: step.pathKey,
        label: `Question ${index + 1}: ${name}`,
        statement: (
          <>
            <strong>{name}</strong> is {value}
            <span className={styles.stepArrow} aria-hidden>
              →
            </span>
            <strong>{step.branchLabel}</strong>
          </>
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

  // New prediction: land on the answer and drop any node selection so the
  // path is what the student sees.
  const traceKey = trace?.pathKeys.join(">") ?? "";
  useEffect(() => {
    setStepIndex(Math.max(0, steps.length - 1));
    setSelectedKey(undefined);
  }, [steps.length, traceKey]);

  const clampedStep = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const revealedPath = useMemo(
    () => (trace ? trace.pathKeys.slice(0, clampedStep + 1) : []),
    [clampedStep, trace],
  );
  const revealedSet = useMemo(() => new Set(revealedPath), [revealedPath]);
  const currentKey = revealedPath[revealedPath.length - 1];
  const nextKey = trace?.pathKeys[clampedStep + 1];
  const finalLeafKey = trace?.pathKeys[trace.pathKeys.length - 1];

  // Content follows the path: only nodes your example passed through earn
  // a full card; everything else is a pill.
  const sizeOf = useCallback(
    (key: string): NodeSize => (revealedSet.has(key) ? "card" : "pill"),
    [revealedSet],
  );
  // Canvas mode reads top→bottom so the tree grows away from the right-hand
  // cards instead of under them.
  const orientation: TreeOrientation = canvasChrome ? "vertical" : "horizontal";
  const layout = useMemo(
    () => layoutTree(root, sizeOf, orientation),
    [orientation, root, sizeOf],
  );

  const selected = selectedKey ? layout.byKey.get(selectedKey)?.node : undefined;
  const detail = selected ? (
    <NodeDetail node={selected} columns={columns} labels={labels} indexOf={indexOf} />
  ) : undefined;
  const onStep = (index: number) => {
    setSelectedKey(undefined);
    setStepIndex(index);
  };

  return (
    <VizFrame
      hideToolbar
      iconName="diagram-project"
      title="Decision tree"
      ariaLabel="Decision tree visualization"
    >
      <div className={styles.stageWrap}>
        {view === "diagram" ? (
          <TreeDiagram
            scrollerRef={scrollerRef}
            layout={layout}
            columns={columns}
            labels={labels}
            indexOf={indexOf}
            revealed={revealedSet}
            currentKey={currentKey}
            nextKey={nextKey}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            orientation={orientation}
            besideCards={Boolean(canvasChrome)}
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
        {canvasChrome ? (
          <CanvasCards
            steps={steps}
            index={clampedStep}
            onIndexChange={onStep}
            showStepper={view === "diagram"}
            docked={view === "rules"}
            outcome={canvasChrome.outcome}
            inputCard={canvasChrome.inputCard}
            detail={detail}
            onDismissDetail={() => setSelectedKey(undefined)}
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
            detail={detail}
            onDismissDetail={() => setSelectedKey(undefined)}
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
  const indexClass = (index: number) =>
    [
      styles.pathIndex,
      index <= stepIndex ? styles.pathIndexLit : "",
      index === stepIndex ? styles.pathIndexCurrent : "",
    ]
      .filter(Boolean)
      .join(" ");
  const leafIndex = trace.steps.length;

  return (
    <div className={styles.path}>
      <p className={styles.pathEyebrow}>Path</p>
      <ol className={styles.pathList}>
        {trace.steps.map((step, index) => (
          <li
            key={step.pathKey}
            className={styles.pathRow}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className={indexClass(index)} aria-hidden>
              {index + 1}
            </span>
            <span className={styles.pathText}>
              <strong>{featureName(columns, step.feature)}</strong> is{" "}
              {formatCell(step.value)}
              <span className={styles.stepArrow} aria-hidden>
                →
              </span>
              <strong>{step.branchLabel}</strong>
            </span>
          </li>
        ))}
        <li
          className={`${styles.pathRow} ${styles.pathRowLeaf}`}
          aria-current={leafIndex === stepIndex ? "step" : undefined}
        >
          <span className={indexClass(leafIndex)} aria-hidden>
            {leafIndex + 1}
          </span>
          <span className={styles.pathText}>
            Predicts{" "}
            <LabelSwatch label={trace.prediction} index={indexOf(trace.prediction)} />
          </span>
        </li>
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Footer detail for the selected node                                       */
/* ------------------------------------------------------------------------ */

function NodeDetail({
  node,
  columns,
  labels,
  indexOf,
}: {
  node: AiLabTreeNode;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
}) {
  const counts = describeCounts(node.labelCounts, labels);
  return (
    <>
      {node.type === "leaf" ? (
        <>
          <span className={styles.detailLead}>
            Predicts{" "}
            <LabelSwatch label={node.prediction} index={indexOf(node.prediction)} />
          </span>
          <span className={styles.detailSep} aria-hidden>
            ·
          </span>
          <span>
            {purity(node)}% of {rowsText(node.sampleCount)}
          </span>
        </>
      ) : (
        <>
          <strong>{nodeTitle(node, columns)}</strong>
          <span className={styles.detailSep} aria-hidden>
            ·
          </span>
          <span>{rowsText(node.sampleCount)}</span>
          <span className={styles.detailSep} aria-hidden>
            ·
          </span>
          <span>{treeBranches(node).length} branches</span>
        </>
      )}
      <DistributionBar
        counts={node.labelCounts}
        labels={labels}
        description={counts}
        className={styles.detailBar}
      />
      <span className={styles.detailCounts}>{counts}</span>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Diagram                                                                   */
/* ------------------------------------------------------------------------ */

interface TreeDiagramProps {
  scrollerRef: RefObject<HTMLDivElement | null>;
  layout: ReturnType<typeof layoutTree>;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
  revealed: Set<string>;
  currentKey: string | undefined;
  nextKey: string | undefined;
  selectedKey: string | undefined;
  onSelect: (key: string | undefined) => void;
  orientation: TreeOrientation;
  /** Canvas layout: keep the stage's resting spot clear of the right-hand cards. */
  besideCards: boolean;
}

function TreeDiagram({
  scrollerRef,
  layout,
  columns,
  labels,
  indexOf,
  revealed,
  currentKey,
  nextKey,
  selectedKey,
  onSelect,
  orientation,
  besideCards,
}: TreeDiagramProps) {
  const vertical = orientation === "vertical";
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Stepping the trace scrolls the current node (and, when it fits, the
  // question it came from) into view without moving focus — the student is
  // still on the trace controls.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const laid = currentKey ? layout.byKey.get(currentKey) : undefined;
    if (!scroller || !laid) return;
    const parent = laid.parentKey ? layout.byKey.get(laid.parentKey) : undefined;
    const { edgeLabelWidth } = TREE_METRICS;
    const pad = 24;
    // Node coordinates are stage-relative; the stage itself sits after the
    // scroller's padding (and centering margin) in scroll space.
    const offsetX = stageRef.current?.offsetLeft ?? 0;
    const offsetY = stageRef.current?.offsetTop ?? 0;
    // The floating cards cover the right strip of the viewport in canvas mode.
    const viewWidth = scroller.clientWidth - (besideCards ? CARD_INSET : 0);
    const viewHeight = scroller.clientHeight;
    // The incoming edge label sits left of a node (horizontal) or above it.
    const rect = (node: LaidOutNode) => ({
      left: offsetX + node.x - (vertical ? 0 : edgeLabelWidth) - pad,
      right: offsetX + node.x + node.width + pad,
      top: offsetY + node.y - (vertical ? 22 : 0) - pad,
      bottom: offsetY + node.y + node.height + pad,
    });
    const own = rect(laid);
    const target = parent
      ? {
          left: Math.min(own.left, rect(parent).left),
          right: Math.max(own.right, rect(parent).right),
          top: Math.min(own.top, rect(parent).top),
          bottom: Math.max(own.bottom, rect(parent).bottom),
        }
      : own;
    const fits =
      target.right - target.left <= viewWidth &&
      target.bottom - target.top <= viewHeight;
    const box = fits ? target : own;
    let { scrollLeft, scrollTop } = scroller;
    if (box.left < scrollLeft) scrollLeft = box.left;
    else if (box.right > scrollLeft + viewWidth) {
      scrollLeft = box.right - viewWidth;
    }
    if (box.top < scrollTop) scrollTop = box.top;
    else if (box.bottom > scrollTop + viewHeight) {
      scrollTop = box.bottom - viewHeight;
    }
    scroller.scrollTo({ left: scrollLeft, top: scrollTop, behavior: "smooth" });
  }, [besideCards, currentKey, layout, scrollerRef, vertical]);

  const focusKey = (key: string | undefined) => {
    if (!key) return;
    setFocusedKey(key);
    nodeRefs.current.get(key)?.focus();
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
        onSelect(laid.key);
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

  return (
    <div
      ref={scrollerRef}
      className={`${styles.scroller} ${
        besideCards ? styles.scrollerBesideCards : ""
      }`}
      onClick={(event) => {
        // Clicking the empty canvas clears the selection.
        if (event.target === event.currentTarget) onSelect(undefined);
      }}
    >
      <div
        ref={stageRef}
        className={styles.stage}
        style={{ width: layout.width, height: layout.height }}
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
                  ? { left: target.cx, top: target.y - 8 }
                  : { left: target.x - 8, top: target.cy }
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
              onFocus={() => setFocusedKey(laid.key)}
              onActivate={() => onSelect(laid.key)}
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
  );
}

interface DiagramNodeProps {
  laid: LaidOutNode;
  columns: AiLabColumn[];
  labels: string[];
  indexOf: (label: string) => number;
  isFocused: boolean;
  isSelected: boolean;
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
  onFocus,
  onActivate,
  onPath,
  isCurrent,
  registerRef,
  style,
}: DiagramNodeProps) {
  const { node } = laid;
  const isDecision = node.type === "decision";
  const isCard = laid.size === "card";
  const title = nodeTitle(node, columns);
  const countsText = describeCounts(node.labelCounts, labels);
  const name = [
    laid.branchLabel ? `Branch ${laid.branchLabel}.` : "",
    isDecision ? `Question: ${title}` : `Prediction: ${title}.`,
    `${rowsText(node.sampleCount)}, ${countsText}.`,
    isCurrent
      ? "Current step."
      : onPath
        ? "On your example's path."
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
      className={[
        styles.node,
        isCard ? styles.nodeCard : styles.nodePill,
        isDecision ? styles.nodeDecision : styles.nodeLeaf,
        onPath ? styles.nodeOnPath : "",
        isCurrent ? styles.nodeCurrent : "",
        isSelected ? styles.nodeSelected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onFocus={onFocus}
      onClick={onActivate}
    >
      <div className={styles.nodeBody}>
        <p className={styles.nodeTitle}>
          {isDecision ? (
            title
          ) : (
            <LabelSwatch label={title} index={indexOf(title)} />
          )}
        </p>
        {isCard ? (
          <div className={styles.nodeStats}>
            <DistributionBar
              counts={node.labelCounts}
              labels={labels}
              description={countsText}
              className={styles.nodeBar}
            />
            <span className={styles.nodeCount}>
              {isDecision
                ? rowsText(node.sampleCount)
                : `${rowsText(node.sampleCount)} · ${purity(node)}%`}
            </span>
          </div>
        ) : null}
      </div>
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