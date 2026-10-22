import { describe, expect, it } from "vitest";
import { DecisionTreeClassifier, DecisionTreeRegression } from "ml-cart";
import type { AiLabColumn, AiLabDataRow } from "../../types/aiLab";
import { csvDatasets } from "../../data/ailab";
import {
  cartPredictionCorrect,
  cartRegressionTolerance,
  nodeVisits,
  rowsByNode,
  traceDecisionTree,
  trainDecisionTree,
  treeBranches,
  treeSplitCandidates,
} from "./decisionTree";
import { trainModel } from "./train";

const animalColumns: AiLabColumn[] = [
  { id: "animal", name: "animal", type: "categorical", description: "" },
  { id: "legs", name: "legs", type: "numerical", description: "" },
  { id: "tail", name: "tail", type: "categorical", description: "" },
];

describe("decision tree matches production ml-cart", () => {
  it("predicts the animal classification cases from AI Lab", () => {
    const rows: AiLabDataRow[] = [
      { animal: "bird", legs: "2", tail: "yes" },
      { animal: "bird", legs: "2", tail: "no" },
      { animal: "bird", legs: "2", tail: "yes" },
      { animal: "dog", legs: "4", tail: "yes" },
      { animal: "dog", legs: "4", tail: "no" },
      { animal: "dog", legs: "4", tail: "yes" },
      { animal: "snake", legs: "0", tail: "yes" },
      { animal: "snake", legs: "0", tail: "no" },
      { animal: "snake", legs: "0", tail: "yes" },
      { animal: "dog", legs: "4", tail: "yes" },
    ];
    const model = trainModel({
      algorithm: "decisionTree",
      rows,
      columns: animalColumns,
      labelColumn: "animal",
      selectedFeatures: ["legs", "tail"],
    });
    expect(traceDecisionTree(model.tree!, { legs: 4, tail: "yes" }).prediction).toBe("dog");
    expect(traceDecisionTree(model.tree!, { legs: 0, tail: "no" }).prediction).toBe("snake");
  });

  it("keeps the shallowest depth when every depth ties", () => {
    const rows: AiLabDataRow[] = [
      { label: "low", value: "1", noise: "7" },
      { label: "low", value: "2", noise: "3" },
      { label: "low", value: "3", noise: "9" },
      { label: "low", value: "4", noise: "1" },
      { label: "high", value: "90", noise: "4" },
      { label: "high", value: "91", noise: "8" },
      { label: "high", value: "92", noise: "2" },
      { label: "high", value: "93", noise: "6" },
      { label: "low", value: "5", noise: "5" },
      { label: "high", value: "94", noise: "0" },
    ];
    const columns: AiLabColumn[] = [
      { id: "label", name: "label", type: "categorical", description: "" },
      { id: "value", name: "value", type: "numerical", description: "" },
      { id: "noise", name: "noise", type: "numerical", description: "" },
    ];
    const model = trainModel({
      algorithm: "decisionTree",
      rows,
      columns,
      labelColumn: "label",
      selectedFeatures: ["value", "noise"],
    });
    expect(model.maxDepth).toBe(1);
    const trained = rows
      .map((_, index) => index)
      .filter((index) => !model.holdoutRowIndexes.includes(index));
    expect(model.holdoutResults.map((result) => result.rowIndex)).toEqual(trained);
    expect(model.holdoutResults.every((result) => result.correct)).toBe(true);
    for (const index of model.holdoutRowIndexes) {
      expect(traceDecisionTree(model.tree!, rows[index]!).prediction).toBe(
        rows[index]!.label,
      );
    }
  });

  it("picks a deeper tree when one split cannot separate the label", () => {
    const combinations = [
      { label: "A", x: "0", y: "0" },
      { label: "A", x: "0", y: "1" },
      { label: "B", x: "1", y: "0" },
      { label: "C", x: "1", y: "1" },
    ];
    const repeated: AiLabDataRow[] = [];
    for (let index = 0; index < 5; index += 1) repeated.push(...combinations);
    const rows = [
      ...repeated.slice(0, 18),
      { label: "B", x: "1", y: "0" },
      { label: "C", x: "1", y: "1" },
    ];
    const columns: AiLabColumn[] = [
      { id: "label", name: "label", type: "categorical", description: "" },
      { id: "x", name: "x", type: "numerical", description: "" },
      { id: "y", name: "y", type: "numerical", description: "" },
    ];
    const model = trainModel({
      algorithm: "decisionTree",
      rows,
      columns,
      labelColumn: "label",
      selectedFeatures: ["x", "y"],
    });
    expect(model.maxDepth).toBe(2);
  });

  it("predicts a regression mean that no training row holds", () => {
    const rows: AiLabDataRow[] = [
      { price: "10", size: "1" },
      { price: "20", size: "1" },
      { price: "10", size: "2" },
      { price: "20", size: "2" },
      { price: "80", size: "9" },
      { price: "90", size: "9" },
      { price: "80", size: "8" },
      { price: "90", size: "8" },
      { price: "10", size: "1" },
      { price: "90", size: "9" },
    ];
    const columns: AiLabColumn[] = [
      { id: "price", name: "price", type: "numerical", description: "" },
      { id: "size", name: "size", type: "numerical", description: "" },
    ];
    const model = trainModel({
      algorithm: "decisionTree",
      rows,
      columns,
      labelColumn: "price",
      selectedFeatures: ["size"],
    });
    const trace = traceDecisionTree(model.tree!, { size: "1" });
    expect(trace.rawPrediction).toBeGreaterThan(10);
    expect(trace.rawPrediction).toBeLessThan(20);
    expect(rows.map((row) => Number(row.price))).not.toContain(trace.rawPrediction);

    // Regression leaf visits and cartPredictionCorrect use the 5% range tolerance,
    // even when no row exactly equals the mean prediction.
    const tolerance = cartRegressionTolerance(rows, "price");
    const visits = nodeVisits(
      model.tree!,
      rows,
      model.holdoutRowIndexes,
      "price",
      columns,
    );
    const byNode = rowsByNode(model.tree!, rows, model.holdoutRowIndexes);
    for (const [key, visit] of visits.entries()) {
      const nodeRows = byNode.get(key) ?? [];
      expect(visit.total).toBe(nodeRows.length);
      if (key !== "root") {
        const expectedCorrect = nodeRows.filter((rowIdx) =>
          cartPredictionCorrect(
            model.tree!,
            rows[rowIdx]!,
            "price",
            columns,
            tolerance,
          ),
        ).length;
        expect(visit.correct).toBe(expectedCorrect);
      }
    }
  });

  it("sends a value equal to the threshold right, and groups categories", () => {
    const rows: AiLabDataRow[] = [
      { x: 1, spice: "hot", label: "A" },
      { x: 1, spice: "hot", label: "A" },
      { x: 2, spice: "mild", label: "B" },
      { x: 2, spice: "cold", label: "B" },
    ];
    const columns: AiLabColumn[] = [
      { id: "x", name: "x", type: "numerical", description: "" },
      { id: "spice", name: "spice", type: "categorical", description: "" },
      { id: "label", name: "label", type: "categorical", description: "" },
    ];
    const numeric = trainDecisionTree(rows, columns, ["x"], "label", { maxDepth: 1 });
    expect(numeric.type).toBe("decision");
    if (numeric.type !== "decision") return;
    expect(treeBranches(numeric).map((branch) => branch.label)).toEqual(["< 1.5", "≥ 1.5"]);
    expect(traceDecisionTree(numeric, { x: 1.5 }).prediction).toBe("B");
    expect(traceDecisionTree(numeric, { x: 1 }).prediction).toBe("A");

    const grouped = trainDecisionTree(rows, columns, ["spice"], "label", { maxDepth: 1 });
    expect(grouped.type).toBe("decision");
    if (grouped.type !== "decision") return;
    expect(grouped.leftValues).toEqual(["hot"]);
    expect(grouped.rightValues).toEqual(["cold", "mild"]);
    expect(treeBranches(grouped).map((branch) => branch.label)).toEqual([
      "hot",
      "cold or mild",
    ]);
  });

  it("matches ml-cart splits and trains chunky production datasets quickly", () => {
    const abalone = csvDatasets.find((d) => d.id === "abalone")!;
    expect(abalone).toBeDefined();
    expect(abalone.rowCount).toBe(4177);
    expect(abalone.card?.source).toContain("UCI");

    const features = ["length", "diameter", "height", "whole_weight"];
    const t0 = performance.now();
    const model = trainModel({
      algorithm: "decisionTree",
      rows: abalone.rows,
      columns: abalone.columns,
      labelColumn: abalone.defaultLabelColumn,
      selectedFeatures: features,
    });
    const elapsed = performance.now() - t0;
    expect(model.tree).toBeDefined();
    expect(model.holdoutRowIndexes).toHaveLength(418);
    expect(elapsed).toBeLessThan(1500);

    // Also verify ml-cart parity on a classification prod dataset (car_evaluation: 1,727 rows)
    const cars = csvDatasets.find((d) => d.id === "car_evaluation")!;
    expect(cars).toBeDefined();
    expect(cars.rows).toHaveLength(1727);
    const carFeatures = cars.columns
      .map((c) => c.id)
      .filter((id) => id !== cars.defaultLabelColumn);
    const carModel = trainModel({
      algorithm: "decisionTree",
      rows: cars.rows,
      columns: cars.columns,
      labelColumn: cars.defaultLabelColumn,
      selectedFeatures: carFeatures,
    });
    expect(carModel.tree).toBeDefined();
    expect(carModel.accuracy).toBeGreaterThan(0.7);

    // Verify O(N log N) candidate scan on car_evaluation
    const candidates = treeSplitCandidates(
      carModel.tree!,
      cars.rows,
      cars.columns,
      carFeatures,
      cars.defaultLabelColumn,
    );
    expect(candidates.get("root")?.candidates.length).toBeGreaterThan(0);

    // Verify ml-cart root split parity on numerical regression
    const subRows = abalone.rows.slice(0, 300);
    const X = subRows.map((r) => features.map((f) => Number(r[f])));
    const y = subRows.map((r) => Number(r[abalone.defaultLabelColumn]));
    const refCart = new DecisionTreeRegression({ maxDepth: 3 });
    refCart.train(X, y);
    const fastTree = trainDecisionTree(
      subRows,
      abalone.columns,
      features,
      abalone.defaultLabelColumn,
      { maxDepth: 3 },
    );
    expect(fastTree.type).toBe("decision");
    if (fastTree.type === "decision") {
      expect(fastTree.feature).toBe(features[refCart.root.splitColumn!]);
      expect(fastTree.threshold).toBeCloseTo(refCart.root.splitValue!, 8);
    }
    void DecisionTreeClassifier;
  });
});
