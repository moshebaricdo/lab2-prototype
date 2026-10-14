import { describe, expect, it } from "vitest";
import templateCsv from "../../data/ailab/dataset-template.csv?raw";
import { parseCsvDataset } from "./csvDataset";

describe("AI Lab dataset template", () => {
  it("parses as a sheet whose last column is the label", () => {
    const dataset = parseCsvDataset(templateCsv, { id: "template" });

    expect(dataset.columns.map((column) => column.name)).toEqual([
      "Item",
      "Color",
      "Weight (g)",
      "Category",
    ]);
    expect(dataset.rows).toHaveLength(4);
    expect(dataset.defaultLabelColumn).toBe("category");
    expect(dataset.columns.find((column) => column.id === "weight_g")?.type).toBe(
      "numerical",
    );
    expect(dataset.columns.find((column) => column.id === "color")?.type).toBe(
      "categorical",
    );
  });
});
