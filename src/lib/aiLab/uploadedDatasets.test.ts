import { describe, expect, it } from "vitest";
import type { AiLabDataset } from "../../types/aiLab";
import { recommendedAlgorithmFor } from "./catalog";
import {
  MAX_UPLOADED_CSV_CHARS,
  clearUploadedSheets,
  combineDatasetCatalog,
  labDatasetCatalog,
  mergeUploadedSheets,
  readActiveAlgorithm,
  readActiveDatasetId,
  readUploadedSheets,
  retainUploadedSheets,
  sheetsToDatasets,
  writeActiveAlgorithm,
  writeActiveDatasetId,
  writeUploadedSheets,
} from "./uploadedDatasets";

const animals = `animal,trait,type
Hawk,feathers,Bird
Salmon,scales,Fish
`;

const pets = `name,weight,kind
Ada,12,dog
Grace,4,cat
`;

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

describe("mergeUploadedSheets", () => {
  it("keeps several sheets and opens the last file that parsed", () => {
    const result = mergeUploadedSheets(
      [],
      [
        { name: "animals.csv", content: animals },
        { name: "pets.csv", content: pets },
      ],
      () => "2026-10-13T00:00:00.000Z",
    );

    expect(result.error).toBeUndefined();
    expect(result.sheets.map((sheet) => sheet.fileName)).toEqual([
      "animals.csv",
      "pets.csv",
    ]);
    expect(result.focusId).toBe("pets");
    expect(sheetsToDatasets(result.sheets).map((dataset) => dataset.name)).toEqual([
      "Animals",
      "Pets",
    ]);
  });

  it("replaces a sheet when the same file name is uploaded again", () => {
    const first = mergeUploadedSheets(
      [],
      [{ name: "animals.csv", content: animals }],
      () => "t1",
    );
    const revised = `${animals}Otter,fur,Mammal\n`;
    const second = mergeUploadedSheets(
      first.sheets,
      [{ name: "Animals.csv", content: revised }],
      () => "t2",
    );

    expect(second.sheets).toHaveLength(1);
    expect(second.sheets[0]?.id).toBe("animals");
    expect(second.sheets[0]?.updatedAt).toBe("t2");
    expect(sheetsToDatasets(second.sheets)[0]?.rows).toHaveLength(3);
    expect(second.focusId).toBe("animals");
  });

  it("skips a file that is not a sheet and keeps the ones that are", () => {
    const result = mergeUploadedSheets([], [
      { name: "notes.csv", content: "just a heading" },
      { name: "pets.csv", content: pets },
    ]);

    expect(result.sheets.map((sheet) => sheet.id)).toEqual(["pets"]);
    expect(result.focusId).toBe("pets");
    expect(result.error).toMatch(/notes\.csv/);
  });

  it("refuses a batch that would overflow the tab", () => {
    const huge = `a,b\n${"x".repeat(MAX_UPLOADED_CSV_CHARS)},1\n`;
    const result = mergeUploadedSheets([], [{ name: "huge.csv", content: huge }]);

    expect(result.sheets).toEqual([]);
    expect(result.focusId).toBeUndefined();
    expect(result.error).toMatch(/too large/);
  });
});

describe("retainUploadedSheets", () => {
  it("drops the sheets whose file names are left out", () => {
    const { sheets } = mergeUploadedSheets([], [
      { name: "animals.csv", content: animals },
      { name: "pets.csv", content: pets },
    ]);

    expect(retainUploadedSheets(sheets, ["pets.csv"]).map((sheet) => sheet.id)).toEqual([
      "pets",
    ]);
    expect(retainUploadedSheets(sheets, [])).toEqual([]);
  });
});

function dataset(id: string): AiLabDataset {
  return {
    id,
    name: id,
    description: "",
    defaultLabelColumn: "label",
    columns: [],
    rows: [],
  };
}

describe("combineDatasetCatalog", () => {
  it("keeps samples and uploads, and lets an upload replace a matching sample id", () => {
    const parts = combineDatasetCatalog(
      [dataset("iris"), dataset("pets")],
      [dataset("pets"), dataset("mine")],
    );

    expect(parts.samples.map((entry) => entry.id)).toEqual(["iris"]);
    expect(parts.uploads.map((entry) => entry.id)).toEqual(["pets", "mine"]);
    expect(parts.catalog.map((entry) => entry.id)).toEqual(["iris", "pets", "mine"]);
    expect(labDatasetCatalog(parts, [undefined]).map((entry) => entry.id)).toEqual([
      "iris",
    ]);
    expect(labDatasetCatalog(parts, ["mine"]).map((entry) => entry.id)).toEqual([
      "iris",
      "mine",
    ]);
  });
});

describe("session storage", () => {
  it("round-trips sheets and clears them", () => {
    const storage = memoryStorage();
    const { sheets } = mergeUploadedSheets([], [
      { name: "pets.csv", content: pets },
    ]);
    writeUploadedSheets(sheets, storage);

    expect(readUploadedSheets(storage)).toEqual(sheets);
    clearUploadedSheets(storage);
    expect(readUploadedSheets(storage)).toEqual([]);
  });

  it("remembers the dataset and algorithm the student chose", () => {
    const storage = memoryStorage();
    writeActiveDatasetId("iris_species", storage);
    writeActiveAlgorithm("knn", storage);
    expect(readActiveDatasetId(storage)).toBe("iris_species");
    expect(readActiveAlgorithm(storage)).toBe("knn");
    writeActiveDatasetId(undefined, storage);
    writeActiveAlgorithm(undefined, storage);
    expect(readActiveDatasetId(storage)).toBeUndefined();
    expect(readActiveAlgorithm(storage)).toBeUndefined();
  });
});

describe("recommendedAlgorithmFor", () => {
  it("uses authored recommendedAlgorithm metadata when present", () => {
    expect(
      recommendedAlgorithmFor({
        ...dataset("custom"),
        recommendedAlgorithm: "knn",
        columns: [
          { id: "a", name: "A", type: "categorical", description: "" },
          { id: "b", name: "B", type: "categorical", description: "" },
        ],
      }),
    ).toBe("knn");
  });

  it("falls back to column-type heuristic when recommendedAlgorithm is omitted", () => {
    const numericalHeavy: AiLabDataset = {
      ...dataset("measurements"),
      defaultLabelColumn: "species",
      columns: [
        { id: "id", name: "Id", type: "numerical", description: "" },
        { id: "length", name: "Length", type: "numerical", description: "" },
        { id: "width", name: "Width", type: "numerical", description: "" },
        { id: "species", name: "Species", type: "categorical", description: "" },
      ],
    };
    const categoricalHeavy: AiLabDataset = {
      ...dataset("traits"),
      defaultLabelColumn: "type",
      columns: [
        { id: "feathers", name: "Feathers", type: "categorical", description: "" },
        { id: "lungs", name: "Lungs", type: "categorical", description: "" },
        { id: "type", name: "Type", type: "categorical", description: "" },
      ],
    };
    expect(recommendedAlgorithmFor(numericalHeavy)).toBe("knn");
    expect(recommendedAlgorithmFor(categoricalHeavy)).toBe("decisionTree");
  });
});
