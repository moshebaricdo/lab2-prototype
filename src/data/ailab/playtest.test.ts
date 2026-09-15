import { describe, expect, it } from "vitest";
import { pretrainedFromDataset, trainDecisionTree } from "../../lib/aiLab";
import {
  AI_LAB_PLAYTEST_LABEL_COLUMN,
  AI_LAB_PLAYTEST_TREE_FEATURES,
  aiLabPlaytestDataset,
  aiLabPlaytestTryConfig,
} from "./index";

describe("AI Lab playtest sheet", () => {
  it("has 24 rows and mixed water animals", () => {
    const { rows } = aiLabPlaytestDataset;
    expect(rows).toHaveLength(24);

    const birds = rows.filter((row) => row.class === "Bird");
    const fish = rows.filter((row) => row.class === "Fish");
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
    expect(auto.selectedFeatures).toContain("animal");
    expect(aiLabPlaytestTryConfig.pretrained?.selectedFeatures).not.toContain(
      "animal",
    );
  });

  it("trains the curriculum tree: feathers → Bird; else lungs → Mammal / Fish", () => {
    const tree = trainDecisionTree(
      aiLabPlaytestDataset.rows,
      aiLabPlaytestDataset.columns,
      [...AI_LAB_PLAYTEST_TREE_FEATURES],
      AI_LAB_PLAYTEST_LABEL_COLUMN,
    );

    expect(tree.type).toBe("decision");
    if (tree.type !== "decision" || tree.splitType !== "categorical") {
      throw new Error("expected a categorical root");
    }
    expect(tree.feature).toBe("has_feathers");
    expect(tree.children.yes?.type).toBe("leaf");
    if (tree.children.yes?.type === "leaf") {
      expect(tree.children.yes.prediction).toBe("Bird");
    }

    const lungs = tree.children.no;
    expect(lungs?.type).toBe("decision");
    if (lungs?.type !== "decision" || lungs.splitType !== "categorical") {
      throw new Error("expected a lungs split");
    }
    expect(lungs.feature).toBe("breathes_with_lungs");
    if (lungs.children.yes?.type === "leaf") {
      expect(lungs.children.yes.prediction).toBe("Mammal");
    }
    if (lungs.children.no?.type === "leaf") {
      expect(lungs.children.no.prediction).toBe("Fish");
    }
  });
});
