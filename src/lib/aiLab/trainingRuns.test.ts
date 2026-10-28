import { describe, expect, it } from "vitest";
import type {
  AiLabColumn,
  AiLabLevelConfig,
  AiLabTrainingRun,
} from "../../types/aiLab";
import { trainingRunLoadBlock } from "./trainingRuns";

const columns: AiLabColumn[] = [
  { id: "type", name: "Type", type: "categorical", description: "" },
  { id: "feathers", name: "Has feathers", type: "categorical", description: "" },
  { id: "lungs", name: "Breathes with lungs", type: "categorical", description: "" },
];

function level(
  partial: Partial<AiLabLevelConfig> = {},
): AiLabLevelConfig {
  return {
    dataset: {
      id: "animals",
      name: "Animals",
      description: "",
      defaultLabelColumn: "type",
      columns,
      rows: [],
    },
    ...partial,
  };
}

function run(
  partial: Partial<
    Pick<AiLabTrainingRun, "algorithm" | "labelColumn" | "selectedFeatures">
  > = {},
): Pick<AiLabTrainingRun, "algorithm" | "labelColumn" | "selectedFeatures"> {
  return {
    algorithm: "decisionTree",
    labelColumn: "type",
    selectedFeatures: ["feathers"],
    ...partial,
  };
}

describe("trainingRunLoadBlock", () => {
  it("allows a run whose columns are still on the sheet", () => {
    expect(trainingRunLoadBlock(level(), run(), columns)).toBeUndefined();
  });

  it("blocks a different algorithm when the level locks one", () => {
    expect(
      trainingRunLoadBlock(
        level({ algorithmLock: "decisionTree" }),
        run({ algorithm: "knn" }),
        columns,
      ),
    ).toMatch(/algorithm/);
  });

  it("blocks a different label when Predict is locked", () => {
    expect(
      trainingRunLoadBlock(
        level({ lockLabelColumn: true, presetLabelColumn: "type" }),
        run({ labelColumn: "feathers", selectedFeatures: ["lungs"] }),
        columns,
      ),
    ).toMatch(/label/);
  });

  it("blocks a different feature set when Using is locked", () => {
    expect(
      trainingRunLoadBlock(
        level({ lockFeatures: true, presetFeatures: ["feathers", "lungs"] }),
        run({ selectedFeatures: ["feathers"] }),
        columns,
      ),
    ).toMatch(/feature/);
  });

  it("allows a locked feature set in any order", () => {
    expect(
      trainingRunLoadBlock(
        level({ lockFeatures: true, presetFeatures: ["lungs", "feathers"] }),
        run({ selectedFeatures: ["feathers", "lungs"] }),
        columns,
      ),
    ).toBeUndefined();
  });

  it("blocks a column that is no longer on the sheet", () => {
    expect(
      trainingRunLoadBlock(
        level(),
        run({ selectedFeatures: ["missing"] }),
        columns,
      ),
    ).toMatch(/sheet/);
  });
});
