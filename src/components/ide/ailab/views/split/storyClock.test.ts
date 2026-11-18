import { describe, expect, it } from "vitest";
import { DialStore } from "dialkit/store";
import {
  buildTimelineValues,
  computeStaticTimeline,
  parseTimelineConfig,
} from "dialkit/timeline";
import { SPLIT_INTRO_TIMELINE, type SplitTuning } from "./splitIntroTimeline";
import { clipProgress, clipValue, type StoryClip } from "./storyClock";

/** DialKit's own reading of the timeline at `time`: what `clip.current` returns in the dock. */
function dialkitAt(time: number) {
  const parsed = parseTimelineConfig(SPLIT_INTRO_TIMELINE);
  DialStore.registerPanel("story-clock-test", "Split intro", parsed.dialConfig, undefined, {
    kind: "timeline",
  });
  const { clips, duration } = computeStaticTimeline(
    parsed,
    DialStore.getValues("story-clock-test"),
  );
  const noop = () => {};
  return buildTimelineValues(
    clips,
    { time, playing: false, duration, wraps: 0 },
    duration,
    0,
    { play: noop, pause: noop, replay: noop, seek: noop },
  ) as unknown as Record<string, Record<string, { current?: Record<string, number> }>>;
}

const tuning: SplitTuning = SPLIT_INTRO_TIMELINE;
const groups = Object.entries(tuning) as [keyof SplitTuning, Record<string, StoryClip>][];

describe("storyClock", () => {
  it("reads every clip as DialKit does, at any time", () => {
    for (let time = 0; time <= SPLIT_INTRO_TIMELINE.duration; time += 0.037) {
      const dialkit = dialkitAt(time);
      for (const [group, clips] of groups) {
        for (const [name, clip] of Object.entries(clips)) {
          const current = dialkit[group]?.[name]?.current;
          if (!clip.from || !current) continue;
          for (const key of Object.keys(clip.from)) {
            expect(clipValue(clip, key, time), `${group}.${name}.${key} at ${time.toFixed(2)}s`).toBeCloseTo(
              current[key]!,
              4,
            );
          }
        }
      }
    }
  });

  it("holds a clip's start before it and its end after it", () => {
    const { count } = SPLIT_INTRO_TIMELINE.cluster;
    expect(clipValue(count, "opacity", count.at - 1)).toBe(0);
    expect(clipValue(count, "y", count.at - 1)).toBe(6);
    expect(clipValue(count, "opacity", count.at + 5)).toBe(1);
    expect(clipValue(count, "y", count.at + 5)).toBe(0);
  });

  it("runs a marker straight, and a zero-length one at once", () => {
    expect(clipProgress({ at: 2, duration: 4 }, 3)).toBe(0.25);
    expect(clipProgress({ at: 2, duration: 4 }, 9)).toBe(1);
    expect(clipProgress({ at: 2, duration: 0 }, 1.99)).toBe(0);
    expect(clipProgress({ at: 2, duration: 0 }, 2.01)).toBe(1);
  });

  it("plays a clip later by reading it at an earlier time", () => {
    const { panel } = SPLIT_INTRO_TIMELINE.test;
    const later = 4.2;
    expect(clipProgress(panel, panel.at + 0.3)).toBe(
      clipProgress({ ...panel, at: panel.at + later }, panel.at + later + 0.3),
    );
  });
});
