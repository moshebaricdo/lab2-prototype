import { describe, expect, it } from "vitest";
import type { AiLabColumn, AiLabDataRow } from "../../types/aiLab";
import { firstSeenValues } from "./encode";
import {
  classificationKCandidates,
  majorityVote,
  predictKnn,
  regressionKnnK,
} from "./knn";
import { holdoutIndexes, isPredictionCorrect, trainModel } from "./train";

const columns: AiLabColumn[] = [
  { id: "x", name: "x", type: "numerical", description: "" },
  { id: "y", name: "y", type: "numerical", description: "" },
  { id: "label", name: "label", type: "categorical", description: "" },
];

function row(x: number, y: number, label: string): AiLabDataRow {
  return { x, y, label };
}

describe("majorityVote", () => {
  it("gives each neighbor one vote and keeps the first class to hit the winning count", () => {
    expect(majorityVote(["D", "B", "A"])).toBe("D");
    expect(majorityVote(["A", "A", "B"])).toBe("A");
    expect(majorityVote(["B", "A", "B"])).toBe("B");
  });
});

describe("classificationKCandidates", () => {
  it("uses k = n on small classification sets", () => {
    expect(classificationKCandidates(8)).toEqual([8]);
  });

  it("tries the AI Lab list plus √n, never n/3", () => {
    expect(classificationKCandidates(900)).toEqual([
      1, 3, 5, 7, 17, 31, 45, 61, 30,
    ]);
  });
});

describe("regressionKnnK", () => {
  it("is 1 below 100 rows and 5 at or above", () => {
    expect(regressionKnnK(25)).toBe(1);
    expect(regressionKnnK(99)).toBe(1);
    expect(regressionKnnK(100)).toBe(5);
  });
});

describe("holdoutIndexes", () => {
  it("reserves the last 10% from the end", () => {
    expect(holdoutIndexes(1000)).toEqual(
      Array.from({ length: 100 }, (_, index) => 900 + index),
    );
  });

  it("returns no holdout when count is 0", () => {
    expect(holdoutIndexes(100, 0)).toEqual([]);
  });
});

describe("isPredictionCorrect", () => {
  it("uses exact match for categories", () => {
    expect(isPredictionCorrect("A", "A", "categorical", 10)).toBe(true);
    expect(isPredictionCorrect("A", "B", "categorical", 10)).toBe(false);
  });

  it("treats a numeric label as correct within 5% of the column range", () => {
    expect(isPredictionCorrect("50", "54", "numerical", 100)).toBe(true);
    expect(isPredictionCorrect("50", "56", "numerical", 100)).toBe(false);
  });
});

describe("firstSeenValues", () => {
  it("encodes categories in sheet order, not sorted order", () => {
    expect(
      firstSeenValues([{ cat: "B" }, { cat: "A" }, { cat: "B" }], "cat"),
    ).toEqual(["B", "A"]);
  });
});

describe("predictKnn", () => {
  it("predicts the nearest label on a 1–1–1 vote, not the alphabetically first", () => {
    const rows = [
      row(0, 0, "D"),
      row(1.9, 0, "B"),
      row(2.2, 0, "A"),
    ];
    const result = predictKnn(rows, row(0, 0, ""), ["x", "y"], "label", columns, 3);
    expect(result.neighbors.map((neighbor) => rows[neighbor.rowIndex]!.label)).toEqual([
      "D",
      "B",
      "A",
    ]);
    expect(result.prediction).toBe("D");
  });
});

describe("trainModel knn", () => {
  it("searches k on the holdout when k is not locked", () => {
    const rows: AiLabDataRow[] = [];
    for (let index = 0; index < 40; index += 1) {
      const cluster = index < 20 ? 0 : 10;
      rows.push(row(cluster + (index % 5) * 0.1, 0, cluster === 0 ? "A" : "B"));
    }
    const model = trainModel({
      algorithm: "knn",
      rows,
      columns,
      labelColumn: "label",
      selectedFeatures: ["x", "y"],
    });
    expect(model.holdoutRowIndexes).toHaveLength(4);
    expect(model.holdoutResults).toHaveLength(4);
    expect(model.knnK).toBeGreaterThanOrEqual(1);
    expect(classificationKCandidates(36)).toContain(model.knnK);
  });

  it("honors a locked k and leave-one-out when holdoutCount is 0", () => {
    const rows = [row(0, 0, "A"), row(0.1, 0, "A"), row(8, 0, "B")];
    const model = trainModel({
      algorithm: "knn",
      rows,
      columns,
      labelColumn: "label",
      selectedFeatures: ["x"],
      knnK: 1,
      holdoutCount: 0,
    });
    expect(model.knnK).toBe(1);
    expect(model.holdoutRowIndexes).toEqual([]);
    expect(model.holdoutResults).toHaveLength(3);
  });
});
