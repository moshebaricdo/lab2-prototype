import { describe, expect, it } from "vitest";
import { pretrainedFromDataset, trainDecisionTree, trainModel } from "../../lib/aiLab";
import type { AiLabTreeNode } from "../../types/aiLab";
import {
  AI_LAB_PLAYTEST_LABEL_COLUMN,
  AI_LAB_PLAYTEST_TREE_FEATURES,
  aiLabPlaytestDataset,
  aiLabPlaytestTryConfig,
} from "./index";

describe("AI Lab playtest sheet", () => {
  it("has 52 rows and mixed water animals", () => {
    const { rows } = aiLabPlaytestDataset;
    expect(rows).toHaveLength(52);
    expect(new Set(rows.map((row) => row.animal)).size).toBe(52);

    const birds = rows.filter((row) => row.type === "Bird");
    const fish = rows.filter((row) => row.type === "Fish");
    expect(birds.every((row) => row.has_feathers === "yes")).toBe(true);
    expect(fish.every((row) => row.breathes_with_lungs === "no")).toBe(true);

    const waterAnimals = rows
      .filter((row) => row.lives_in_water === "yes")
      .map((row) => row.animal);
    expect(waterAnimals).toEqual(
      expect.arrayContaining(["Penguin", "Duck", "Dolphin", "Whale"]),
    );
  });

  it("ships an explicit feathers + lungs tree, not the auto first-three lookup", () => {
    expect(aiLabPlaytestTryConfig.pretrained?.selectedFeatures).toEqual([
      ...AI_LAB_PLAYTEST_TREE_FEATURES,
    ]);
    expect(aiLabPlaytestTryConfig.pretrained?.labelColumn).toBe(
      AI_LAB_PLAYTEST_LABEL_COLUMN,
    );

    const auto = pretrainedFromDataset(aiLabPlaytestDataset, "decisionTree");
    expect(auto.selectedFeatures).toEqual([
      "has_feathers",
      "breathes_with_lungs",
      "lives_in_water",
    ]);
    expect(aiLabPlaytestTryConfig.pretrained?.selectedFeatures).not.toContain(
      "animal",
    );
  });

  it("trains the curriculum tree: feathers → Bird; else lungs → Mammal / Fish", () => {
    const trained = trainDecisionTree(
      aiLabPlaytestDataset.rows,
      aiLabPlaytestDataset.columns,
      [...AI_LAB_PLAYTEST_TREE_FEATURES],
      AI_LAB_PLAYTEST_LABEL_COLUMN,
    );
    expect(curriculumTree(trained)).toEqual({
      feature: "has_feathers",
      yes: "Bird",
      no: {
        feature: "breathes_with_lungs",
        yes: "Mammal",
        no: "Fish",
      },
    });

    const model = trainModel({
      algorithm: "decisionTree",
      rows: aiLabPlaytestDataset.rows,
      columns: aiLabPlaytestDataset.columns,
      labelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
      selectedFeatures: [...AI_LAB_PLAYTEST_TREE_FEATURES],
    });
    expect(curriculumTree(model.tree!)).toEqual(curriculumTree(trained));
  });
});

function side(
  node: AiLabTreeNode,
  value: string,
): AiLabTreeNode | undefined {
  if (node.type !== "decision") return undefined;
  if (node.leftValues?.includes(value)) return node.left;
  if (node.rightValues?.includes(value)) return node.right;
  return undefined;
}

function curriculumTree(node: AiLabTreeNode): unknown {
  if (node.type !== "decision") return node.prediction;
  return {
    feature: node.feature,
    yes: curriculumTree(side(node, "yes")!),
    no: curriculumTree(side(node, "no")!),
  };
}
