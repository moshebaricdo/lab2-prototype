import { describe, expect, it } from "vitest";
import { GOLDEN } from "./bloomSim";
import { orderRuns, type WalkCandidate } from "./orderRuns";

interface Row extends WalkCandidate {
  index: number;
}

/** `count` test rows in cluster order; `shape` sets each one's ending and whether it was right. */
function rows(
  count: number,
  shape: (index: number) => { end: string; correct: boolean } = () => ({ end: "a", correct: true }),
): Row[] {
  return Array.from({ length: count }, (_, index) => {
    const { end, correct } = shape(index);
    return { index, result: { correct }, path: ["root", end] };
  });
}

/** The smallest turn between any two of these rows' directions in the cluster, in degrees. */
function closestTurn(picked: Row[]): number {
  let least = 180;
  picked.forEach((a, i) =>
    picked.slice(i + 1).forEach((b) => {
      const turn = (Math.abs(a.index - b.index) * GOLDEN * 180) / Math.PI % 360;
      least = Math.min(least, turn > 180 ? 360 - turn : turn);
    }),
  );
  return least;
}

describe("orderRuns", () => {
  it.each([6, 11, 29, 60])("walks rows from different sides of a %i-dot cluster", (count) => {
    const walked = orderRuns(rows(count), 4).slice(0, 4);
    /* Four directions as far apart as they can be are 90° apart; these come close. */
    expect(closestTurn(walked)).toBeGreaterThan(count <= 6 ? 40 : 60);
  });

  it("leads with a right guess and includes a miss", () => {
    const tests = rows(20, (index) => ({ end: "a", correct: index % 7 !== 3 }));
    const walked = orderRuns(tests, 3).slice(0, 3);
    expect(walked[0]!.result!.correct).toBe(true);
    expect(walked.some((row) => !row.result!.correct)).toBe(true);
  });

  it("varies the endings where it can", () => {
    const tests = rows(24, (index) => ({ end: ["a", "b", "c"][index % 3]!, correct: true }));
    const walked = orderRuns(tests, 4).slice(0, 4);
    expect(new Set(walked.map((row) => row.path[1])).size).toBe(3);
  });

  it("keeps every row, the walked ones first", () => {
    const tests = rows(15);
    const ordered = orderRuns(tests, 5);
    expect(ordered).toHaveLength(15);
    expect(new Set(ordered).size).toBe(15);
  });
});
