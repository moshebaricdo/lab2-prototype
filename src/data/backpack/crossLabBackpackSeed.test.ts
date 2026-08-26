import { describe, expect, it } from "vitest";
import { canImportBackpackItemToLab } from "../../lib/backpack/backpackImportAllowlist";
import { getBackpackTypeFilterOptions } from "../../lib/backpack/backpackFilters";
import type { BackpackImportLab } from "../../types/backpack";
import { CROSS_LAB_BACKPACK_SEED_ITEMS } from "./crossLabBackpackSeed";

function namesFor(lab: BackpackImportLab, supported: boolean) {
  return CROSS_LAB_BACKPACK_SEED_ITEMS.filter(
    (item) => canImportBackpackItemToLab(item, lab) === supported,
  ).map((item) => item.name);
}

describe("CROSS_LAB_BACKPACK_SEED_ITEMS", () => {
  it("includes supported and unsupported files for each IDE lab", () => {
    expect(namesFor("sketch-lab", true)).toEqual(
      expect.arrayContaining(["wireframe.png", "hero.jpg"]),
    );
    expect(namesFor("sketch-lab", false)).toEqual(
      expect.arrayContaining(["portfolio.html", "greet.py", "rubric.pdf"]),
    );

    expect(namesFor("weblab2", true)).toEqual(
      expect.arrayContaining([
        "portfolio.html",
        "theme.css",
        "app.js",
        "config.json",
        "scratch-notes.txt",
        "wireframe.png",
      ]),
    );
    expect(namesFor("weblab2", false)).toEqual(
      expect.arrayContaining(["greet.py", "rubric.pdf"]),
    );

    expect(namesFor("pythonlab", true)).toEqual(
      expect.arrayContaining(["greet.py", "scratch-notes.txt", "lab-notes.md", "attendance.csv"]),
    );
    expect(namesFor("pythonlab", false)).toEqual(
      expect.arrayContaining(["portfolio.html", "wireframe.png", "rubric.pdf"]),
    );
  });

  it("does not seed extensionless, svg, or pptx files", () => {
    expect(CROSS_LAB_BACKPACK_SEED_ITEMS.map((item) => item.name)).not.toEqual(
      expect.arrayContaining(["LICENSE", "logo.svg", "pitch.pptx"]),
    );
  });

  it("treats every seed file as importable in AI Chat Lab", () => {
    expect(namesFor("aichatlab", false)).toEqual([]);
    expect(namesFor("aichatlab", true)).toHaveLength(CROSS_LAB_BACKPACK_SEED_ITEMS.length);
  });

  it("produces a type dropdown with media and seeded extensions", () => {
    const options = getBackpackTypeFilterOptions(CROSS_LAB_BACKPACK_SEED_ITEMS);
    expect(options.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "all",
        "media",
        "html",
        "css",
        "js",
        "json",
        "py",
        "txt",
        "md",
        "csv",
        "pdf",
      ]),
    );
    expect(options.map((option) => option.id)).not.toEqual(
      expect.arrayContaining(["other", "svg", "pptx"]),
    );
  });
});
