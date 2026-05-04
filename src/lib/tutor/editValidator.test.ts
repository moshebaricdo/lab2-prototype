import { describe, expect, it } from "vitest";
import { countChangedLines } from "./editValidator";

describe("countChangedLines", () => {
  it("counts inserted lines without marking shifted lines as changed", () => {
    const before = [
      "<main>",
      "  <h1>Planet Facts</h1>",
      "  <p>Earth is rocky.</p>",
      "</main>",
    ].join("\n");
    const after = [
      "<main>",
      "  <h1>Planet Facts</h1>",
      "  <button>Show Mars</button>",
      "  <p>Earth is rocky.</p>",
      "</main>",
    ].join("\n");

    expect(countChangedLines(before, after)).toEqual({
      linesAdded: 1,
      linesRemoved: 0,
    });
  });

  it("does not count a trailing newline as a changed blank line", () => {
    expect(countChangedLines("", "const ready = true;\n")).toEqual({
      linesAdded: 1,
      linesRemoved: 0,
    });
  });

  it("counts replacements as an addition and removal", () => {
    expect(countChangedLines("color: red;\n", "color: blue;\n")).toEqual({
      linesAdded: 1,
      linesRemoved: 1,
    });
  });
});
