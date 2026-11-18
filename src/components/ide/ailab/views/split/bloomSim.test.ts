import { describe, expect, it } from "vitest";
import { recordBloom, sunflower } from "./bloomSim";

/** Every crowd size the stage draws: its dot size and spacing follow the count. */
const CROWDS = [
  { count: 52, dot: 12 },
  { count: 101, dot: 9 },
  { count: 190, dot: 7 },
];

/** The furthest any dot moves between two frames, per frame. */
function frameSteps(frames: Float32Array[], count: number): number[] {
  return frames.slice(1).map((frame, index) => {
    const before = frames[index]!;
    let most = 0;
    for (let i = 0; i < count; i += 1) {
      /* A dot that is not out yet has no place to move from. */
      if (before[i * 3 + 2] === 0) continue;
      most = Math.max(
        most,
        Math.hypot(frame[i * 3]! - before[i * 3]!, frame[i * 3 + 1]! - before[i * 3 + 1]!),
      );
    }
    return most;
  });
}

describe("recordBloom", () => {
  it.each(CROWDS)("ends with $count dots exactly on their spots", ({ count, dot }) => {
    const pitch = dot * 0.66;
    const { frames } = recordBloom(count, dot, pitch);
    const last = frames[frames.length - 1]!;
    for (let i = 0; i < count; i += 1) {
      const spot = sunflower(i, pitch);
      expect(last[i * 3]).toBeCloseTo(spot.x, 1);
      expect(last[i * 3 + 1]).toBeCloseTo(spot.y, 1);
      expect(last[i * 3 + 2]).toBe(1);
    }
  });

  it.each(CROWDS)("comes to rest without a late snap ($count dots)", ({ count, dot }) => {
    const { frames } = recordBloom(count, dot, dot * 0.66);
    const steps = frameSteps(frames, count);
    const peak = Math.max(...steps);
    const tail = steps.slice(Math.floor(steps.length * 0.8));
    /* The last fifth only settles: nothing moves at more than a small share of the bloom's top speed. */
    expect(Math.max(...tail)).toBeLessThan(peak * 0.12);
    /* And it only slows: the motion never picks back up once it has died down. */
    const quiet = steps.findIndex((step, index) => index > 5 && step < peak * 0.08);
    expect(Math.max(...steps.slice(quiet))).toBeLessThan(peak * 0.16);
  });

  it.each(CROWDS)("grows as a filled disc, never a ring ($count dots)", ({ count, dot }) => {
    const { frames } = recordBloom(count, dot, dot * 0.66);
    /* Sampled through the growth: the dots out so far always include some near the middle. */
    for (const share of [0.15, 0.3, 0.45, 0.6]) {
      const frame = frames[Math.floor(frames.length * share)]!;
      const radii: number[] = [];
      for (let i = 0; i < count; i += 1) {
        if (frame[i * 3 + 2]! > 0) radii.push(Math.hypot(frame[i * 3]!, frame[i * 3 + 1]!));
      }
      const reach = Math.max(...radii);
      const inner = radii.filter((r) => r < reach * 0.5).length;
      /* A uniform disc holds a quarter of its dots in its inner half. */
      expect(inner / radii.length).toBeGreaterThan(0.12);
    }
  });

  it("has the dots clear of each other by the time the last one is out", () => {
    const count = 101;
    const dot = 9;
    const { frames } = recordBloom(count, dot, dot * 0.66);
    const allOut = frames.findIndex((frame) => frame[2] === 1);
    /* From there on, no two dots sit closer than most of a dot's width. */
    let worst = Infinity;
    frames.slice(allOut).forEach((frame) => {
      for (let i = 0; i < count; i += 1) {
        for (let j = i + 1; j < count; j += 1) {
          worst = Math.min(
            worst,
            Math.hypot(frame[i * 3]! - frame[j * 3]!, frame[i * 3 + 1]! - frame[j * 3 + 1]!),
          );
        }
      }
    });
    expect(worst).toBeGreaterThan(dot * 0.75);
  });
});
