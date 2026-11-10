import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DialRoot, DialTimeline, useDialKit, useDialTimeline } from "dialkit";
import "dialkit/styles.css";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import {
  DEFAULT_TREE_PACE,
  SplitIntroStage,
  type TestingOptions,
  type TreePace,
} from "../../components/ide/ailab/views/split/SplitIntroStage";
import { SPLIT_INTRO_TIMELINE } from "../../components/ide/ailab/views/split/splitIntroTimeline";
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

/** The walk only supplies the split's data here (model, holdout, keys); a stable object keeps it memoized. */
const NO_OVERRIDES: Partial<TrainingWalkParams> = {};
const DEV = import.meta.env.DEV;

/**
 * Sandbox for the training animation's opening, from the Figma refinements
 * (AI Lab 2, node 6340:23871): bloom, color, split. Choreography lives in
 * the DialKit timeline dock (drag clips to retime, resize to change speed,
 * scrub to inspect any frame); the bloom's physics in the Bloom physics
 * panel. Not linked from the lab itself.
 */
export function AiLabSplitLabPage() {
  const [fixtureId, setFixtureId] = useState(TRAINING_FIXTURES[0]!.id);
  const fixture = useMemo(() => trainingFixture(fixtureId), [fixtureId]);
  const walk = useTrainingWalk(fixture.data, "split", NO_OVERRIDES);

  // TODO(production): DialKit's clip.current values are the scrubbable authoring preview.
  // Replace them with equivalent real Motion animations using the tuned timeline
  // timings and transitions, then remove useDialTimeline and <DialTimeline />.
  const timeline = useDialTimeline("Split intro", SPLIT_INTRO_TIMELINE, {
    id: "ailab-split-intro-v2",
    persist: DEV,
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
    { id: "ailab-split-bloom-v2", persist: DEV },
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
    { rowCard: true },
    { id: "ailab-split-testing-v1", persist: DEV },
  );
  const testing = useMemo<TestingOptions>(
    () => ({ rowCard: testingDials.rowCard }),
    [testingDials.rowCard],
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

  /* Reduced motion: land on the end state instead of playing. */
  const { seek, duration } = timeline;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) seek(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <span className={styles.note}>{fixture.note}</span>
          <button type="button" className={styles.replay} onClick={() => timeline.replay()}>
            Replay
          </button>
        </header>
        <main className={styles.stage}>
          <SplitIntroStage
            data={fixture.data}
            walk={walk}
            timeline={timeline}
            physics={physics}
            pace={pace}
            testing={testing}
          />
        </main>
      </div>
      <DialRoot position="top-right" theme="light" productionEnabled />
      <DialTimeline theme="light" defaultOpen productionEnabled />
    </CadsLabProvider>
  );
}
