import { describe, expect, it } from "vitest";
import {
  MAX_UPLOADED_CSV_CHARS,
  clearUploadedSheets,
  mergeUploadedSheets,
  readUploadedSheets,
  retainUploadedSheets,
  sheetsToDatasets,
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
});
