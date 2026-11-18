import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DialRoot, DialTimeline, useDialKit, useDialTimeline } from "dialkit";
import "dialkit/styles.css";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  DEFAULT_TESTING,
  DEFAULT_TREE_PACE,
  SplitIntroStage,
  type StageActions,
  type TestingOptions,
  type TreePace,
} from "../../components/ide/ailab/views/split/SplitIntroStage";
import {
  END_HOLD,
  SPLIT_INTRO_TIMELINE,
  type SplitTuning,
} from "../../components/ide/ailab/views/split/splitIntroTimeline";
import {
  DEFAULT_BLOOM_PHYSICS,
  type BloomPhysics,
} from "../../components/ide/ailab/views/split/bloomSim";
import {
  useTrainingWalk,
  type TrainingWalkParams,
} from "../../components/ide/ailab/views/trainingWalk";
import { TRAINING_FIXTURES, trainingFixture } from "../../data/ailab/trainingFixtures";
import styles from "./AiLabSplitLabPage.module.scss";

/** Stills show the action row too; nothing in it does anything. */
const STILL_ACTIONS: StageActions = {
  paused: true,
  onTogglePause: () => {},
  onRestart: () => {},
  onSkip: () => {},
};

/** The walk only supplies the split's data here (model, holdout, keys); a stable object keeps it memoized. */
const NO_OVERRIDES: Partial<TrainingWalkParams> = {};
const DEV = import.meta.env.DEV;

/**
 * Sandbox for the training animation, from the Figma refinements (AI Lab
 * 2, node 6340:23871): bloom, color, split, tree, test. Choreography lives
 * in the DialKit timeline dock (drag clips to retime, resize to change
 * speed, scrub to inspect any frame); the bloom's physics, the tree's
 * pace, and the testing options in the panels. Not linked from the lab.
 *
 * Deep links: `?data=zoo` picks the dataset, `?t=12.5` opens paused at
 * that second, `?ui=0` hides the DialKit panels, and `?frames=1,4,8.5`
 * lays those seconds out side by side as stills.
 */
export function AiLabSplitLabPage() {
  const [searchParams] = useSearchParams();
  const frames = searchParams.get("frames");
  const fixtureId =
    TRAINING_FIXTURES.find((entry) => entry.id === searchParams.get("data"))?.id ??
    TRAINING_FIXTURES[0]!.id;
  if (frames !== null) {
    return (
      <SplitFrames
        fixtureId={fixtureId}
        times={frames
          .split(",")
          .map(Number)
          .filter((time) => Number.isFinite(time))}
      />
    );
  }
  const at = searchParams.get("t");
  return (
    <SplitSandbox
      initialFixtureId={fixtureId}
      startAt={at === null || !Number.isFinite(Number(at)) ? null : Number(at)}
      showDials={searchParams.get("ui") !== "0"}
    />
  );
}

function SplitSandbox({
  initialFixtureId,
  startAt,
  showDials,
}: {
  initialFixtureId: string;
  /** Open paused at this second instead of playing. */
  startAt: number | null;
  showDials: boolean;
}) {
  const [fixtureId, setFixtureId] = useState(initialFixtureId);
  const fixture = useMemo(() => trainingFixture(fixtureId), [fixtureId]);
  const walk = useTrainingWalk(fixture.data, "split", NO_OVERRIDES);
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  /* How long this dataset's story runs: the stage works it out from the
     tree and the test rows. The dock is made that long (plus a hold on the
     last frame), so the playhead stops where the story does, whatever the
     tree. Clips never move for it: only the window's length changes. */
  const [storyEnd, setStoryEnd] = useState<number | null>(null);
  const config = useMemo(
    () => ({
      ...SPLIT_INTRO_TIMELINE,
      duration:
        storyEnd === null
          ? SPLIT_INTRO_TIMELINE.duration
          : Math.ceil((storyEnd + END_HOLD) * 10) / 10,
    }),
    [storyEnd],
  );

  // TODO(production): the stage already runs from a plain clock and
  // SPLIT_INTRO_TIMELINE (it samples every clip itself; see storyClock.ts).
  // To ship it, copy the dock's tuned values into SPLIT_INTRO_TIMELINE,
  // drive `time` from the modal's own clock, and drop useDialTimeline,
  // the useDialKit panels, <DialRoot /> and <DialTimeline />.
  const timeline = useDialTimeline("Split intro", config, {
    id: "ailab-split-intro-v4",
    persist: DEV,
    autoplay: startAt === null && !reducedMotion,
  });

  const dials = useDialKit(
    "Bloom physics",
    {
      spring: [DEFAULT_BLOOM_PHYSICS.spring, 20, 200],
      damping: [DEFAULT_BLOOM_PHYSICS.damping, 2, 30],
      restitution: [DEFAULT_BLOOM_PHYSICS.restitution, 0, 1],
      kickMin: [DEFAULT_BLOOM_PHYSICS.kickMin, 0, 400],
      kickMax: [DEFAULT_BLOOM_PHYSICS.kickMax, 0, 600],
      spawnWindow: [DEFAULT_BLOOM_PHYSICS.spawnWindow, 0.1, 1.5],
      popIn: [DEFAULT_BLOOM_PHYSICS.popIn, 0.05, 0.5],
      aimSpread: [DEFAULT_BLOOM_PHYSICS.aimSpread, 0, 360],
      collisionFade: [DEFAULT_BLOOM_PHYSICS.collisionFade, 0, 2],
    },
    { id: "ailab-split-bloom-v3", persist: DEV },
  );
  const physics = useMemo<BloomPhysics>(
    () => ({
      spring: dials.spring,
      damping: dials.damping,
      restitution: dials.restitution,
      kickMin: dials.kickMin,
      kickMax: dials.kickMax,
      spawnWindow: dials.spawnWindow,
      popIn: dials.popIn,
      aimSpread: dials.aimSpread,
      collisionFade: dials.collisionFade,
    }),
    [
      dials.spring,
      dials.damping,
      dials.restitution,
      dials.kickMin,
      dials.kickMax,
      dials.spawnWindow,
      dials.popIn,
      dials.aimSpread,
      dials.collisionFade,
    ],
  );

  const paceDials = useDialKit(
    "Tree pace",
    {
      falloff: [DEFAULT_TREE_PACE.falloff, 0.5, 1],
      minLevel: [DEFAULT_TREE_PACE.minLevel, 0.2, 2],
    },
    { id: "ailab-split-pace-v1", persist: DEV },
  );
  const pace = useMemo<TreePace>(
    () => ({ falloff: paceDials.falloff, minLevel: paceDials.minLevel }),
    [paceDials.falloff, paceDials.minLevel],
  );

  const testingDials = useDialKit(
    "Testing",
    {
      rows: [DEFAULT_TESTING.rows, 1, 8, 1],
      budget: [DEFAULT_TESTING.budget, 4, 40, 1],
    },
    { id: "ailab-split-testing-v3", persist: DEV },
  );
  const testing = useMemo<TestingOptions>(
    () => ({ rows: testingDials.rows, budget: testingDials.budget }),
    [testingDials.rows, testingDials.budget],
  );

  /* A new dataset plays from the top. */
  const firstRun = useRef(true);
  const { replay } = timeline;
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    replay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  /* Space plays and pauses (from the end, it replays). Left alone while a
     field or control has focus, so typing and buttons work as usual. */
  const transport = useRef(timeline);
  transport.current = timeline;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a, [contenteditable], [role='slider'], [role='button']",
        )
      ) {
        return;
      }
      event.preventDefault();
      const t = transport.current;
      if (t.playing) t.pause();
      else if (t.time >= t.duration - 0.01) t.replay();
      else t.play();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* A deep link opens on its second; reduced motion lands on the end
     state instead of playing. Both wait for the story's real length. */
  const { seek } = timeline;
  useEffect(() => {
    if (storyEnd === null) return;
    if (startAt !== null) seek(startAt);
    else if (reducedMotion) seek(storyEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyEnd]);

  const onDuration = useCallback((seconds: number) => setStoryEnd(seconds), []);

  /* The lab modal's action row, wired to the timeline: restart, pause, and
     Skip (to the end of this dataset's story). Cancel, Back to dataset and
     Continue leave the modal in the lab, so here they do nothing. */
  const actions: StageActions = {
    paused: !timeline.playing,
    onTogglePause: () => (timeline.playing ? timeline.pause() : timeline.play()),
    onRestart: () => timeline.replay(),
    onSkip: () => {
      timeline.pause();
      if (storyEnd !== null) timeline.seek(storyEnd);
    },
  };

  return (
    <CadsLabProvider>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/levels" className={styles.back}>
            ← Levels
          </Link>
          <h1 className={styles.title}>Training animation: the split</h1>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Data</span>
            <select
              className={styles.select}
              value={fixtureId}
              onChange={(event) => setFixtureId(event.target.value)}
            >
              {TRAINING_FIXTURES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <span className={styles.note}>
            {fixture.note}
            {storyEnd === null ? "" : ` · this tree's story runs ${storyEnd.toFixed(1)}s`}
          </span>
          <button type="button" className={styles.replay} onClick={() => timeline.replay()}>
            Replay
          </button>
        </header>
        <main className={styles.stage}>
          <SplitIntroStage
            data={fixture.data}
            walk={walk}
            tuning={timeline as SplitTuning}
            time={timeline.time}
            playing={timeline.playing}
            physics={physics}
            pace={pace}
            testing={testing}
            actions={actions}
            onDuration={onDuration}
          />
        </main>
      </div>
      {showDials ? (
        <>
          <DialRoot position="top-right" theme="light" productionEnabled />
          <DialTimeline theme="light" defaultOpen productionEnabled />
        </>
      ) : null}
    </CadsLabProvider>
  );
}

/**
 * Stills: the story at each of `times`, side by side, from the code's own
 * tuning (no dock, no saved edits). For checking a beat across the run,
 * or across datasets, at a glance.
 */
function SplitFrames({ fixtureId, times }: { fixtureId: string; times: number[] }) {
  const fixture = useMemo(() => trainingFixture(fixtureId), [fixtureId]);
  const walk = useTrainingWalk(fixture.data, "split", NO_OVERRIDES);
  return (
    <CadsLabProvider>
      <div className={styles.frames}>
        {times.map((time, index) => (
          <figure key={`${time}-${index}`} className={styles.frame}>
            <figcaption className={styles.frameTime}>
              {fixture.name} · {time.toFixed(2)}s
            </figcaption>
            <SplitIntroStage
              data={fixture.data}
              walk={walk}
              tuning={SPLIT_INTRO_TIMELINE}
              time={time}
              playing={false}
              actions={STILL_ACTIONS}
            />
          </figure>
        ))}
      </div>
    </CadsLabProvider>
  );
}
