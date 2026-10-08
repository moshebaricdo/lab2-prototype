import {
  Fragment,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Button, Modal, SegmentedButton, Tag } from "@moshebari/cads-react";
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

/** The example on Testing, so the modal can show it on nodes it passed through. */
export interface TreeNodeExample {
  values: AiLabDataRow;
  /** Sheet row the inputs came from, when they are a real row. */
  rowIndex: number | undefined;
  pathKeys: string[];
}

interface TreeNodeModalProps {
  lab: AiLabController;
  /** Node to show; `undefined` keeps the modal closed. */
  nodeKey: string | undefined;
  example?: TreeNodeExample;
  onClose: () => void;
}

/**
 * Rows-modal experiment: the sheet rows a decision-tree node sorted while
 * the model learned. A leaf splits them like the Scorecard — Correct rows
 * carry the leaf's answer, Incorrect rows do not. A question lists its rows
 * in branch order. Remounted per node (via `key`) so the filter resets.
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
  const membership = useMemo(
    () => (tree ? rowsByNode(tree, lab.rows) : new Map<string, number[]>()),
    [lab.rows, tree],
  );

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
        membership={membership}
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
  membership: Map<string, number[]>;
  example: TreeNodeExample | undefined;
  title: string;
  featureName: (feature: string) => string;
}

function rowCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Row" : "Rows"}`;
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
  membership,
  example,
  title,
  featureName,
}: NodeDetailProps) {
  const [filter, setFilter] = useState<RowFilter>("correct");
  const [pageCount, setPageCount] = useState(1);

  const columns = lab.config.dataset.columns;
  const isLeaf = node.type === "leaf";
  const prediction = node.type === "leaf" ? node.prediction : "";
  const labelColumn = model.labelColumn;
  const labelName = columnById(columns, labelColumn)?.name ?? labelColumn;
  const heldOut = new Set(model.holdoutRowIndexes);

  // A question lists its rows branch by branch, so the column it asks reads
  // as sorted runs; a leaf keeps sheet order.
  const nodeRows =
    node.type === "decision"
      ? treeBranches(node).flatMap(
          (branch) => membership.get(branch.child.pathKey) ?? [],
        )
      : (membership.get(nodeKey) ?? []);
  const isCorrect = (rowIndex: number) =>
    String(lab.rows[rowIndex]?.[labelColumn] ?? "") === prediction;
  const filteredRows = isLeaf
    ? nodeRows.filter((rowIndex) =>
        filter === "correct"
          ? heldOut.has(rowIndex) || isCorrect(rowIndex)
          : !heldOut.has(rowIndex) && !isCorrect(rowIndex),
      )
    : nodeRows;

  // Every node shows the same columns: the card title, every feature the
  // model was trained on, and the label.
  const featureColumns = model.selectedFeatures
    .map((feature) => columnById(columns, feature))
    .filter((column): column is AiLabColumn => Boolean(column));
  // The example only fills a feature once the trace has answered it.
  const askedFeatures = new Set([
    ...conditions.map((condition) => condition.feature),
    ...(node.type === "decision" ? [node.feature] : []),
  ]);

  const pathSteps: ReactNode[] = [
    ...conditions.map((condition, index) => (
      <Fragment key={index}>
        {featureName(condition.feature)} is{" "}
        <strong>{condition.branchLabel}</strong>
      </Fragment>
    )),
    node.type === "leaf" ? (
      <>
        AI predicts <strong>{node.prediction}</strong>
      </>
    ) : (
      title
    ),
  ];

  const titleColumnId = lab.config.cardTitleColumn;
  const titleColumn =
    titleColumnId &&
    titleColumnId !== labelColumn &&
    !model.selectedFeatures.includes(titleColumnId)
      ? columnById(columns, titleColumnId)
      : undefined;
  // The example gets its own table above the sheet, so it never reads as one
  // of the rows the filter sorts into correct / incorrect.
  const exampleHere = example?.pathKeys.includes(nodeKey) ? example : undefined;
  const visibleRows = filteredRows.slice(0, pageCount * PAGE_SIZE);
  const hiddenCount = filteredRows.length - visibleRows.length;
  const lastRowNumber = Math.max(1, ...nodeRows.map((index) => index + 1));

  const dataCaption = !isLeaf
    ? "Rows from your dataset that reached this question."
    : filter === "correct"
      ? "Rows from your dataset where the AI's prediction is correct."
      : "Rows from your dataset where the AI's prediction is incorrect.";

  const filterControl = isLeaf ? (
    <SegmentedButton
      size="extraSmall"
      aria-label="Filter rows"
      value={filter}
      onChange={(value) => {
        setFilter(value as RowFilter);
        setPageCount(1);
      }}
      options={[
        { value: "correct", label: "Correct" },
        { value: "incorrect", label: "Incorrect" },
      ]}
    />
  ) : null;

  return (
    <div className={styles.root}>
      {conditions.length > 0 ? (
      <ol className={styles.path} aria-label="Path to this node">
        {pathSteps.map((step, index) => {
          const isCurrent = index === pathSteps.length - 1;
          return (
            <li
              key={index}
              className={`${styles.pathStep} ${isCurrent ? styles.pathStepCurrent : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {index > 0 ? (
                <FaIcon
                  name="caret-right"
                  fontSize="12px"
                  className={styles.pathSeparator}
                />
              ) : null}
              <span className={styles.pathIndex} aria-hidden>
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
      ) : null}

      <div className={styles.content}>
        {exampleHere ? (
          <section
            className={styles.section}
            aria-labelledby="tree-node-example"
          >
            <RowCaption
              titleId="tree-node-example"
              title="Your example"
              detail={
                isLeaf
                  ? "This is the prediction you made"
                  : "These are the answers you gave"
              }
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
                        className={`${sheet.td} ${sheet.tdFeature}`}
                      >
                        {askedFeatures.has(column.id)
                          ? formatCell(exampleHere.values[column.id] ?? "")
                          : ""}
                      </td>
                    ))}
                    <td
                      className={`${sheet.td} ${sheet.tdLabel} ${styles.exampleGuess}`}
                    >
                      {isLeaf ? prediction : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section
          className={`${styles.section} ${styles.dataSection}`}
          aria-labelledby="tree-node-data"
        >
          <div className={styles.head}>
            <RowCaption
              titleId="tree-node-data"
              title={rowCountLabel(filteredRows.length)}
              detail={dataCaption}
            />
            {filterControl}
          </div>
          <div className={`${results.tableWrap} ${styles.tableWrap}`}>
            <table
              className={sheet.grid}
              aria-label={`Rows at ${title}`}
              style={
                {
                  "--index-col-ch": String(lastRowNumber).length,
                } as CSSProperties
              }
            >
              <thead>
                <tr>
                  <th
                    className={`${sheet.th} ${sheet.thIndex}`}
                    aria-label="Row"
                  />
                  {titleColumn ? (
                    <th className={sheet.th}>{titleColumn.name}</th>
                  ) : null}
                  {featureColumns.map((column) => (
                    <th
                      key={column.id}
                      className={`${sheet.th} ${sheet.thFeature} ${
                        column.type === "numerical" ? sheet.thNumeric : ""
                      }`}
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className={`${sheet.th} ${sheet.thLabel}`}>
                    {labelName}
                  </th>
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
                            }`}
                          >
                            {formatCell(row?.[column.id] ?? "")}
                          </td>
                        ))}
                        <td className={`${sheet.td} ${sheet.tdLabel}`}>
                          <span className={styles.labelCell}>
                            {formatCell(row?.[labelColumn] ?? "")}
                            {heldOut.has(rowIndex) ? (
                              <Tag
                                size="small"
                                color="neutral"
                                label="Held out"
                              />
                            ) : null}
                          </span>
                        </td>
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
  );
}
