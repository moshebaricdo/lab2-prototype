import { createElement, Fragment, type ReactNode } from "react";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
  AiLabTreeTrace,
} from "../../types/aiLab";
import { columnById, formatCell, formatNumber } from "./columnStats";
import { knnVotes } from "./knn";

function featureQuestion(name: string): string {
  const trimmed = name.trim();
  return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
}

function formatTraceAnswer(value: string | number): string {
  const text = formatCell(value);
  if (text.toLowerCase() === "yes") return "Yes.";
  if (text.toLowerCase() === "no") return "No.";
  return text.endsWith(".") ? text : `${text}.`;
}

/** Decision-tree path for the prediction card: "Has feathers? **No.** → Bird". */
export function explainTreeTrace(
  columns: AiLabColumn[],
  trace: AiLabTreeTrace,
): ReactNode {
  if (trace.steps.length === 0) {
    return `Every training example in this group is ${trace.prediction}.`;
  }

  return createElement(
    Fragment,
    null,
    ...trace.steps.flatMap((step, index) => {
      const name = columnById(columns, step.feature)?.name ?? step.feature;
      return [
        index > 0 ? " " : null,
        createElement(
          "span",
          { key: `${step.feature}-${index}` },
          featureQuestion(name),
          " ",
          createElement("strong", null, formatTraceAnswer(step.value)),
        ),
      ];
    }),
    " → ",
    trace.prediction,
  );
}

export function explainKnn(
  rows: AiLabDataRow[],
  labelColumn: string,
  prediction: AiLabKnnPrediction,
): string {
  const k = prediction.neighbors.length;
  const tally = knnVotes(rows, labelColumn, prediction.neighbors);
  const matching =
    tally.find((vote) => vote.label === prediction.prediction)?.count ?? 0;
  const rowsWord = k === 1 ? "row" : "rows";
  const line = `${prediction.prediction} got the most votes among the ${k} nearest ${rowsWord}.`;
  const tied = tally.filter((vote) => vote.count === matching).length > 1;
  if (tied) {
    return `${line} Tied; first to that count wins.`;
  }
  return line;
}

export function formatDistance(distance: number): string {
  if (distance === 0) return "0";
  return formatNumber(distance);
}
