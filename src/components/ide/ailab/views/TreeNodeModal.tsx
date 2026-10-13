import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Button,
  Modal,
  SegmentedButton,
  Tabs,
  Tooltip,
} from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import {
  columnById,
  findTreeNode,
  formatCell,
  rowsByNode,
  treeBranches,
  type AiLabTreeCondition,
} from "../../../../lib/aiLab";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabTrainedModel,
  AiLabTreeNode,
} from "../../../../types/aiLab";
import sheet from "./DataStudio.module.scss";
import results from "./ResultsModal.module.scss";
import styles from "./TreeNodeModal.module.scss";

const PAGE_SIZE = 200;

type RowFilter = "correct" | "incorrect";
type RowPopulation = "test" | "trained";

const EMPTY_ROWS = new Map<string, number[]>();

/** The example on Testing, so the modal can show it on nodes it passed through. */
export interface TreeNodeExample {
  values: AiLabDataRow;
  /** Sheet row the inputs came from, when they are a real row. */
  rowIndex: number | undefined;
  pathKeys: string[];
  /** The leaf the example lands on, shown on every node of its path. */
  prediction: string;
}

interface TreeNodeModalProps {
  lab: AiLabController;
  /** Node to show; `undefined` keeps the modal closed. */
  nodeKey: string | undefined;
  example?: TreeNodeExample;
  onClose: () => void;
}

/**
 * Rows that reached a decision-tree node. When the model reserved a test
 * set, the sheet has two tabs: Test rows (those reserved rows; a leaf can
 * split them Correct / Incorrect) and Trained rows (the rows the tree
 * learned from). The pills on the diagram stay on the test set. A level
 * with no holdout shows the whole sheet and no tabs.
 * Remounted per node (via `key`) so the tab and filter reset.
 */
export function TreeNodeModal({
  lab,
  nodeKey,
  example,
  onClose,
}: TreeNodeModalProps) {
  const model = lab.model;
  const tree = model?.tree;
  const columns = lab.config.dataset.columns;

  const found = useMemo(
    () => (tree && nodeKey ? findTreeNode(tree, nodeKey) : undefined),
    [nodeKey, tree],
  );
  const reserved = model?.holdoutRowIndexes ?? [];
  const hasSplit = reserved.length > 0;
  const testMembership = useMemo(
    () =>
      tree
        ? rowsByNode(tree, lab.rows, hasSplit ? reserved : undefined)
        : EMPTY_ROWS,
    [hasSplit, lab.rows, reserved, tree],
  );
  const trainedMembership = useMemo(() => {
    if (!tree || !hasSplit) return EMPTY_ROWS;
    const held = new Set(reserved);
    const indexes: number[] = [];
    for (let index = 0; index < lab.rows.length; index += 1) {
      if (!held.has(index)) indexes.push(index);
    }
    return rowsByNode(tree, lab.rows, indexes);
  }, [hasSplit, lab.rows, reserved, tree]);

  if (!model || !found || !nodeKey) return null;

  const featureName = (feature: string) =>
    columnById(columns, feature)?.name ?? feature;
  const title =
    found.node.type === "leaf"
      ? `Predicts ${found.node.prediction}`
      : `${featureName(found.node.feature)}?`;

  return (
    <Modal
      open
      title={title}
      maxWidth={800}
      className={results.modal}
      isDismissable
      hasSecondaryAction={false}
      primaryActionLabel="Back to Testing"
      onPrimaryAction={onClose}
      onClose={onClose}
    >
      <NodeDetail
        key={nodeKey}
        lab={lab}
        model={model}
        nodeKey={nodeKey}
        node={found.node}
        conditions={found.conditions}
        hasSplit={hasSplit}
        testMembership={testMembership}
        trainedMembership={trainedMembership}
        example={example}
        title={title}
        featureName={featureName}
      />
    </Modal>
  );
}

interface NodeDetailProps {
  lab: AiLabController;
  model: AiLabTrainedModel;
  nodeKey: string;
  node: AiLabTreeNode;
  conditions: AiLabTreeCondition[];
  hasSplit: boolean;
  testMembership: Map<string, number[]>;
  trainedMembership: Map<string, number[]>;
  example: TreeNodeExample | undefined;
  title: string;
  featureName: (feature: string) => string;
}

function rowCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Row" : "Rows"}`;
}

/** A question lists its rows branch by branch; a leaf keeps sheet order. */
function rowsAtNode(
  node: AiLabTreeNode,
  nodeKey: string,
  membership: Map<string, number[]>,
): number[] {
  return node.type === "decision"
    ? treeBranches(node).flatMap(
        (branch) => membership.get(branch.child.pathKey) ?? [],
      )
    : (membership.get(nodeKey) ?? []);
}

interface PathStepItem {
  content: ReactNode;
  /** Plain text for a collapsed step's accessible name. */
  text: string;
}

function PathStepContent({
  step,
  index,
  isCurrent,
  collapsed,
  measuring = false,
}: {
  step: PathStepItem;
  index: number;
  isCurrent: boolean;
  /** Just the number badge; the step reads in its tooltip. */
  collapsed: boolean;
  /** Off-screen copy: no focusable button or tooltip. */
  measuring?: boolean;
}) {
  return (
    <>
      {index > 0 ? (
        <FaIcon
          name="caret-right"
          fontSize="12px"
          className={styles.pathSeparator}
        />
      ) : null}
      {collapsed && measuring ? (
        <span className={styles.pathIndex}>{index + 1}</span>
      ) : collapsed ? (
        <Tooltip title={step.content} placement="bottom">
          <button
            type="button"
            className={`${styles.pathIndex} ${styles.pathIndexButton}`}
            aria-label={`${index + 1}. ${step.text}`}
          >
            {index + 1}
          </button>
        </Tooltip>
      ) : (
        <>
          <span className={styles.pathIndex} aria-hidden>
            {index + 1}
          </span>
          <span className={isCurrent ? styles.pathText : undefined}>
            {step.content}
          </span>
        </>
      )}
    </>
  );
}

/**
 * One line of numbered steps. When they don't fit, the earliest steps
 * collapse to their number badges (tooltip on hover / focus); the current
 * step always keeps its text.
 */
function PathStrip({ steps }: { steps: PathStepItem[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const measureRef = useRef<HTMLOListElement>(null);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const signature = steps.map((step) => step.text).join("\n");

  useLayoutEffect(() => {
    const list = listRef.current;
    const measure = measureRef.current;
    if (!list || !measure) return;
    const fit = () => {
      // The measure list holds every step in full, then every step collapsed.
      const items = [...measure.children] as HTMLElement[];
      const full = items.slice(0, steps.length).map((item) => item.offsetWidth);
      const compact = items.slice(steps.length).map((item) => item.offsetWidth);
      const style = getComputedStyle(list);
      const gap = parseFloat(style.columnGap) || 0;
      const available =
        list.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const widthWith = (count: number) =>
        full.reduce(
          (sum, width, index) =>
            sum + (index < count ? compact[index] : width) + gap,
          -gap,
        );
      let count = 0;
      while (count < full.length - 1 && widthWith(count) > available) {
        count += 1;
      }
      setCollapsedCount(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(list);
    return () => observer.disconnect();
    // `signature` stands in for `steps`, which is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const lastIndex = steps.length - 1;

  return (
    <>
      <ol ref={listRef} className={styles.path} aria-label="Path to this node">
        {steps.map((step, index) => {
          const isCurrent = index === lastIndex;
          return (
            <li
              key={index}
              className={`${styles.pathStep} ${isCurrent ? styles.pathStepCurrent : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <PathStepContent
                step={step}
                index={index}
                isCurrent={isCurrent}
                collapsed={index < collapsedCount}
              />
            </li>
          );
        })}
      </ol>
      <ol
        ref={measureRef}
        className={`${styles.path} ${styles.pathMeasure}`}
        aria-hidden
      >
        {[false, true].map((collapsed) =>
          steps.map((step, index) => (
            <li key={`${collapsed}-${index}`} className={styles.pathStep}>
              <PathStepContent
                step={step}
                index={index}
                isCurrent={false}
                collapsed={collapsed}
                measuring
              />
            </li>
          )),
        )}
      </ol>
    </>
  );
}

function RowCaption({
  title,
  detail,
  titleId,
}: {
  title: string;
  detail: string;
  titleId?: string;
}) {
  return (
    <p className={styles.caption}>
      <span id={titleId} className={styles.captionTitle}>
        {title}
      </span>
      <span className={styles.captionDot} aria-hidden />
      {detail}
    </p>
  );
}

function NodeDetail({
  lab,
  model,
  nodeKey,
  node,
  conditions,
  hasSplit,
  testMembership,
  trainedMembership,
  example,
  title,
  featureName,
}: NodeDetailProps) {
  const columns = lab.config.dataset.columns;
  const isLeaf = node.type === "leaf";
  const prediction = node.type === "leaf" ? node.prediction : "";
  const labelColumn = model.labelColumn;
  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  const testNodeRows = rowsAtNode(node, nodeKey, testMembership);
  const trainedNodeRows = rowsAtNode(node, nodeKey, trainedMembership);
  // Test rows match the pill. An empty test sheet opens on the rows that
  // taught the node instead.
  const exampleHere = example?.pathKeys.includes(nodeKey) ? example : undefined;
  const [population, setPopulation] = useState<RowPopulation>(() =>
    testNodeRows.length === 0 ? "trained" : "test",
  );
  const [filter, setFilter] = useState<RowFilter>("correct");
  const [pageCount, setPageCount] = useState(1);
  const showingTest = !hasSplit || population === "test";
  const nodeRows = showingTest ? testNodeRows : trainedNodeRows;
  const isCorrect = (rowIndex: number) =>
    String(lab.rows[rowIndex]?.[labelColumn] ?? "") === prediction;
  // Correct / Incorrect is only a fair split of rows the tree did not train on.
  const canFilter = isLeaf && showingTest;
  // Incorrect rows set the real answer beside the AI's, like the Scorecard.
  const showMisses = canFilter && filter === "incorrect";
  const nameTh = showMisses ? results.nameTh : "";
  const correctCount = canFilter
    ? nodeRows.filter((rowIndex) => isCorrect(rowIndex)).length
    : 0;
  const filteredRows = canFilter
    ? nodeRows.filter((rowIndex) =>
        filter === "correct" ? isCorrect(rowIndex) : !isCorrect(rowIndex),
      )
    : nodeRows;

  // Every node shows the same columns: the card title, every feature the
  // model was trained on, and the label.
  const featureColumns = model.selectedFeatures
    .map((feature) => columnById(columns, feature))
    .filter((column): column is AiLabColumn => Boolean(column));
  // The column this node decides on reads bold: the question's feature, or
  // the label on a leaf.
  const focusColumn = node.type === "decision" ? node.feature : labelColumn;
  const emphasis = (columnId: string) =>
    columnId === focusColumn ? styles.focusCell : "";

  const pathSteps: PathStepItem[] = [
    ...conditions.map((condition) => ({
      content: (
        <>
          {featureName(condition.feature)} is{" "}
          <strong>{condition.branchLabel}</strong>
        </>
      ),
      text: `${featureName(condition.feature)} is ${condition.branchLabel}`,
    })),
    node.type === "leaf"
      ? {
          content: (
            <>
              AI predicts <strong>{node.prediction}</strong>
            </>
          ),
          text: `AI predicts ${node.prediction}`,
        }
      : { content: title, text: title },
  ];

  const titleColumnId = lab.config.cardTitleColumn;
  const titleColumn =
    titleColumnId &&
    titleColumnId !== labelColumn &&
    !model.selectedFeatures.includes(titleColumnId)
      ? columnById(columns, titleColumnId)
      : undefined;
  const visibleRows = filteredRows.slice(0, pageCount * PAGE_SIZE);
  const hiddenCount = filteredRows.length - visibleRows.length;
  const lastRowNumber = Math.max(1, ...nodeRows.map((index) => index + 1));

  const dataCaption = !isLeaf
    ? "Rows from your dataset that reached this question."
    : filter === "correct"
      ? "Rows from your dataset where the AI's prediction is correct."
      : "Rows from your dataset where the AI's prediction is incorrect.";
  const populationSentence =
    population === "test"
      ? "These are the rows AI tested on that reached this step."
      : "These are the rows AI trained on that reached this step.";

  const filterControl = canFilter ? (
    <SegmentedButton
      size="extraSmall"
      aria-label="Filter rows"
      value={filter}
      onChange={(value) => {
        setFilter(value as RowFilter);
        setPageCount(1);
      }}
      options={[
        { value: "correct", label: `Correct (${correctCount})` },
        {
          value: "incorrect",
          label: `Incorrect (${nodeRows.length - correctCount})`,
        },
      ]}
    />
  ) : null;

  return (
    <div className={styles.root}>
      {conditions.length > 0 ? <PathStrip steps={pathSteps} /> : null}

      <div className={styles.content}>
        {exampleHere ? (
          <section
            className={styles.section}
            aria-labelledby="tree-node-example"
          >
            <RowCaption
              titleId="tree-node-example"
              title="Your example"
              detail="This is the prediction AI made based on your answers."
            />
            <div className={`${results.tableWrap} ${styles.exampleWrap}`}>
              <table className={`${sheet.grid} ${styles.exampleGrid}`}>
                <thead>
                  <tr>
                    <th
                      className={`${sheet.th} ${styles.groupTh}`}
                      colSpan={featureColumns.length}
                    >
                      Your answers
                    </th>
                    <th className={`${sheet.th} ${styles.groupTh}`}>
                      AI predicts
                    </th>
                  </tr>
                  <tr>
                    {featureColumns.map((column) => (
                      <th
                        key={column.id}
                        className={`${sheet.th} ${sheet.thFeature}`}
                      >
                        {column.name}
                      </th>
                    ))}
                    <th className={`${sheet.th} ${sheet.thLabel}`}>
                      {labelName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.exampleRow}>
                    {featureColumns.map((column) => (
                      <td
                        key={column.id}
                        className={`${sheet.td} ${sheet.tdFeature} ${emphasis(column.id)}`}
                      >
                        {formatCell(exampleHere.values[column.id] ?? "")}
                      </td>
                    ))}
                    <td
                      className={`${sheet.td} ${sheet.tdLabel} ${emphasis(labelColumn)}`}
                    >
                      {exampleHere.prediction}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div className={styles.rowsBlock}>
        {hasSplit ? (
          <div className={styles.populationTabs}>
            <Tabs
              type="primary"
              size="small"
              aria-label="Which rows"
              value={population}
              onChange={(value) => {
                setPopulation(value as RowPopulation);
                setPageCount(1);
              }}
              items={[
                { value: "test", label: "Test rows" },
                { value: "trained", label: "Trained rows" },
              ]}
            />
          </div>
        ) : null}

        <section
          className={`${styles.section} ${styles.dataSection}`}
          aria-labelledby="tree-node-data"
        >
          <div className={styles.head}>
            {hasSplit ? (
              <>
                <p id="tree-node-data" className={styles.sentence}>
                  {populationSentence}
                </p>
                <div className={styles.headEnd}>
                  {filterControl}
                  {canFilter ? null : (
                    <span className={styles.count}>
                      {rowCountLabel(nodeRows.length)}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <RowCaption
                  titleId="tree-node-data"
                  title={rowCountLabel(filteredRows.length)}
                  detail={dataCaption}
                />
                {filterControl}
              </>
            )}
          </div>
          <div className={`${results.tableWrap} ${styles.tableWrap}`}>
            <table
              className={sheet.grid}
              aria-label={`${hasSplit ? (showingTest ? "Test rows" : "Trained rows") : "Rows"} at ${title}`}
              style={
                {
                  "--index-col-ch": String(lastRowNumber).length,
                } as CSSProperties
              }
            >
              <thead>
                {showMisses ? (
                  <tr>
                    <th
                      className={`${sheet.th} ${sheet.thIndex}`}
                      aria-label="Row"
                    />
                    {titleColumn ? <th className={sheet.th} /> : null}
                    <th className={sheet.th} colSpan={featureColumns.length}>
                      Feature
                    </th>
                    <th className={sheet.th}>Actual</th>
                    <th className={sheet.th}>AI Prediction</th>
                  </tr>
                ) : null}
                <tr>
                  <th
                    className={`${sheet.th} ${sheet.thIndex} ${nameTh}`}
                    aria-label={showMisses ? undefined : "Row"}
                    aria-hidden={showMisses || undefined}
                  />
                  {titleColumn ? (
                    <th className={`${sheet.th} ${nameTh}`}>
                      {titleColumn.name}
                    </th>
                  ) : null}
                  {featureColumns.map((column) => (
                    <th
                      key={column.id}
                      className={`${sheet.th} ${sheet.thFeature} ${
                        column.type === "numerical" ? sheet.thNumeric : ""
                      } ${nameTh}`}
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className={`${sheet.th} ${sheet.thLabel} ${nameTh}`}>
                    {labelName}
                  </th>
                  {showMisses ? (
                    <th className={`${sheet.th} ${sheet.thLabel} ${nameTh}`}>
                      {labelName}
                    </th>
                  ) : null}
                </tr>
              </thead>
              {visibleRows.length > 0 ? (
              <tbody>
                {visibleRows.map((rowIndex) => {
                    const row = lab.rows[rowIndex];
                    return (
                      <tr key={rowIndex}>
                        <td className={`${sheet.td} ${sheet.tdIndex}`}>
                          {rowIndex + 1}
                        </td>
                        {titleColumn ? (
                          <td className={sheet.td}>
                            {formatCell(row?.[titleColumn.id] ?? "")}
                          </td>
                        ) : null}
                        {featureColumns.map((column) => (
                          <td
                            key={column.id}
                            className={`${sheet.td} ${sheet.tdFeature} ${
                              column.type === "numerical" ? sheet.tdNumeric : ""
                            } ${emphasis(column.id)}`}
                          >
                            {formatCell(row?.[column.id] ?? "")}
                          </td>
                        ))}
                        <td
                          className={`${sheet.td} ${sheet.tdLabel} ${emphasis(labelColumn)}`}
                        >
                          {formatCell(row?.[labelColumn] ?? "")}
                        </td>
                        {showMisses ? (
                          <td
                            className={`${sheet.td} ${sheet.tdLabel} ${emphasis(labelColumn)}`}
                          >
                            {prediction}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
              </tbody>
              ) : null}
            </table>
            {visibleRows.length === 0 ? (
              <p className={results.emptySheet}>No rows matched this filter</p>
            ) : null}
            {hiddenCount > 0 ? (
              <div className={results.showMore}>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => setPageCount((count) => count + 1)}
                >
                  Show {Math.min(hiddenCount, PAGE_SIZE)} more rows (
                  {hiddenCount} remaining)
                </Button>
              </div>
            ) : null}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
