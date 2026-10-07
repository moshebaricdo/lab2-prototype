import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Button, Modal, SegmentedButton, Tag, Tooltip } from "@moshebari/cads-react";
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
export function TreeNodeModal({ lab, nodeKey, example, onClose }: TreeNodeModalProps) {
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
      ? treeBranches(node).flatMap((branch) => membership.get(branch.child.pathKey) ?? [])
      : membership.get(nodeKey) ?? [];
  const isCorrect = (rowIndex: number) =>
    String(lab.rows[rowIndex]?.[labelColumn] ?? "") === prediction;
  const filteredRows = isLeaf
    ? nodeRows.filter((rowIndex) =>
        filter === "correct"
          ? heldOut.has(rowIndex) || isCorrect(rowIndex)
          : !heldOut.has(rowIndex) && !isCorrect(rowIndex),
      )
    : nodeRows;

  // Only the features asked on the way here (and the question's own), in
  // path order — the rest played no part in reaching this node.
  const featureColumns = [
    ...new Set([
      ...conditions.map((condition) => condition.feature),
      ...(node.type === "decision" ? [node.feature] : []),
    ]),
  ]
    .map((feature) => columnById(columns, feature))
    .filter((column): column is AiLabColumn => Boolean(column));

  const pathSteps: ReactNode[] = [
    ...conditions.map((condition, index) => (
      <Fragment key={index}>
        {featureName(condition.feature)} is <strong>{condition.branchLabel}</strong>
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
  const rowNoun = lab.config.dataset.story?.rowNoun ?? "example";
  const columnCount = 2 + featureColumns.length + (titleColumn ? 1 : 0);

  // The example leads the table in bold. A real row moves to the top (when it
  // belongs to the current filter); a typed one is added there, with the
  // leaf's prediction as its label.
  const exampleHere = example?.pathKeys.includes(nodeKey) ? example : undefined;
  const exampleRowIndex = exampleHere?.rowIndex;
  const showExample =
    Boolean(exampleHere) &&
    (exampleRowIndex === undefined || filteredRows.includes(exampleRowIndex));
  const otherRows = filteredRows.filter((rowIndex) => rowIndex !== exampleRowIndex);
  const visibleRows = otherRows.slice(0, pageCount * PAGE_SIZE);
  const hiddenCount = otherRows.length - visibleRows.length;
  const lastRowNumber = Math.max(1, ...nodeRows.map((index) => index + 1));

  const renderRow = (rowIndex: number | undefined, isExample: boolean) => {
    const row = rowIndex === undefined ? exampleHere?.values : lab.rows[rowIndex];
    const cell = (value: string | number | undefined, shown = true) =>
      shown && value !== undefined && value !== "" ? (
        isExample ? (
          <strong className={styles.exampleValue}>{formatCell(value)}</strong>
        ) : (
          formatCell(value)
        )
      ) : null;
    return (
      <tr key={isExample ? "example" : rowIndex} className={isExample ? styles.exampleRow : undefined}>
        <td className={`${sheet.td} ${sheet.tdIndex}`}>
          {isExample ? (
            <Tooltip title="Your example" placement="top">
              <span className={styles.examplePin} role="img" aria-label="Your example">
                <FaIcon name="location-dot" fontSize="11px" />
              </span>
            </Tooltip>
          ) : (
            (rowIndex ?? 0) + 1
          )}
        </td>
        {titleColumn ? (
          <td className={sheet.td}>
            {rowIndex === undefined ? (
              <span className={styles.examplePlaceholder}>Your {rowNoun}</span>
            ) : (
              cell(row?.[titleColumn.id])
            )}
          </td>
        ) : null}
        {featureColumns.map((column) => (
          <td
            key={column.id}
            className={`${sheet.td} ${sheet.tdFeature} ${
              column.type === "numerical" ? sheet.tdNumeric : ""
            }`}
          >
            {cell(row?.[column.id])}
          </td>
        ))}
        <td className={`${sheet.td} ${sheet.tdLabel}`}>
          <span className={styles.labelCell}>
            {cell(rowIndex === undefined ? prediction : row?.[labelColumn])}
            {rowIndex !== undefined && heldOut.has(rowIndex) ? (
              <Tag size="small" color="neutral" label="Held out" />
            ) : null}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
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
                  <FaIcon name="caret-right" fontSize="10px" className={styles.pathSeparator} />
                ) : null}
                <span className={styles.pathIndex} aria-hidden>
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            );
          })}
        </ol>
        {isLeaf ? (
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
        ) : null}
      </div>

      <div className={`${results.tableWrap} ${styles.tableWrap}`}>
        <table
          className={sheet.grid}
          aria-label={`Rows at ${title}`}
          style={{ "--index-col-ch": String(lastRowNumber).length } as CSSProperties}
        >
          <thead>
            <tr>
              <th className={`${sheet.th} ${sheet.thIndex}`} aria-label="Row" />
              {titleColumn ? <th className={sheet.th}>{titleColumn.name}</th> : null}
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
              <th className={`${sheet.th} ${sheet.thLabel}`}>{labelName}</th>
            </tr>
          </thead>
          <tbody>
            {showExample ? renderRow(exampleRowIndex, true) : null}
            {visibleRows.length === 0 ? (
              <tr>
                <td className={`${sheet.td} ${results.emptyCell}`} colSpan={columnCount}>
                  No rows in this filter.
                </td>
              </tr>
            ) : (
              visibleRows.map((rowIndex) => renderRow(rowIndex, false))
            )}
          </tbody>
        </table>
        {hiddenCount > 0 ? (
          <div className={results.showMore}>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => setPageCount((count) => count + 1)}
            >
              Show {Math.min(hiddenCount, PAGE_SIZE)} more rows ({hiddenCount} remaining)
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
