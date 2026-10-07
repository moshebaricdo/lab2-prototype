import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, SegmentedButton } from "@moshebari/cads-react";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import { TrainingModalShell } from "../../components/ide/ailab/views/TrainingModalShell";
import {
  beatTimes,
  stateAfter,
  useTrainingWalk,
  type Beat,
  type TrainingWalk,
  type TrainingWalkData,
  type WalkState,
} from "../../components/ide/ailab/views/trainingWalk";
import { TRAINING_FIXTURES, trainingFixture } from "../../data/ailab/trainingFixtures";
import { TRAINING_VARIANTS, type TrainingVariant } from "./trainingLabVariants";
import styles from "./AiLabTrainingLabPage.module.scss";

/** Hold on the final frame before the clock stops. */
const END_HOLD_MS = 800;
const SPEEDS = ["0.5", "1", "2"];

/**
 * Sandbox for the AI Lab training animation: pick a fixture dataset and
 * a variant, then play, scrub, or step it inside the real (inline) training
 * modal. Not linked from the level index.
 */
export function AiLabTrainingLabPage() {
  const [fixtureId, setFixtureId] = useState(TRAINING_FIXTURES[0]!.id);
  const [variantId, setVariantId] = useState(TRAINING_VARIANTS[0]!.id);
  const fixture = useMemo(() => trainingFixture(fixtureId), [fixtureId]);
  const variant =
    TRAINING_VARIANTS.find((entry) => entry.id === variantId) ?? TRAINING_VARIANTS[0]!;

  return (
    <CadsLabProvider>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/levels" className={styles.back}>
            ← Levels
          </Link>
          <h1 className={styles.title}>Training animation lab</h1>
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Variant</span>
            <select
              className={styles.select}
              value={variant.id}
              title={variant.note}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {TRAINING_VARIANTS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </header>
        <Player key={fixture.id} data={fixture.data} variant={variant} />
      </div>
    </CadsLabProvider>
  );
}

function Player({ data, variant }: { data: TrainingWalkData; variant: TrainingVariant }) {
  const walk = useTrainingWalk(data);
  const { beats } = walk;
  const times = useMemo(() => beatTimes(beats), [beats]);
  const total = (times[times.length - 1] ?? 0) + END_HOLD_MS;
  const phases = useMemo(() => phaseBands(beats, times, total), [beats, times, total]);

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  // Beat count the clock last jumped to: render that state without
  // animating, then animate again once playback lands the next beat.
  const [jumpedAt, setJumpedAt] = useState(-1);
  const timeRef = useRef(0);

  const seek = useCallback(
    (next: number, animate = false) => {
      const clamped = Math.max(0, Math.min(total, next));
      timeRef.current = clamped;
      setTime(clamped);
      if (!animate) setJumpedAt(countAt(times, clamped));
    },
    [times, total],
  );

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(total, timeRef.current + (now - last) * speed);
      last = now;
      timeRef.current = next;
      setTime(next);
      if (next >= total) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, total]);

  const count = countAt(times, time);
  const state = useMemo(() => {
    const at = stateAfter(beats, count);
    return speed === 1 ? at : { ...at, travelMs: at.travelMs / speed };
  }, [beats, count, speed]);
  const instant = jumpedAt === count;

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (timeRef.current >= total) seek(0);
    setPlaying(true);
  }, [playing, seek, total]);
  const restart = useCallback(() => {
    seek(0);
    setPlaying(true);
  }, [seek]);
  const toEnd = useCallback(() => {
    setPlaying(false);
    seek(total);
  }, [seek, total]);
  const stepBack = useCallback(() => {
    setPlaying(false);
    const current = countAt(times, timeRef.current);
    seek(current >= 2 ? times[current - 2]! : 0);
  }, [seek, times]);
  const stepForward = useCallback(() => {
    setPlaying(false);
    const current = countAt(times, timeRef.current);
    seek(times[current] ?? total, true);
  }, [seek, times, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea")) return;
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepForward();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBack();
      } else if (event.key === "r") {
        restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBack, restart]);

  return (
    <>
      <div className={styles.transport}>
        <div className={styles.buttons}>
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="rotate-left"
            aria-label="Restart (R)"
            onClick={restart}
          />
          <Button
            size="extraSmall"
            variant="outlined"
            color="secondary"
            iconOnly
            startIconName="backward-step"
            aria-label="Previous beat (←)"
            disabled={count === 0}
            onClick={stepBack}
          />
          <Button
            size="extraSmall"
            variant="contained"
            color="primary"
            iconOnly
            startIconName={playing ? "pause" : "play"}
            aria-label={playing ? "Pause (Space)" : "Play (Space)"}
            onClick={togglePlay}
          />
          <Button
            size="extraSmall"
            variant="outlined"
            color="secondary"
            iconOnly
            startIconName="forward-step"
            aria-label="Next beat (→)"
            disabled={count >= beats.length}
            onClick={stepForward}
          />
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            iconOnly
            startIconName="forward-fast"
            aria-label="Jump to end"
            onClick={toEnd}
          />
        </div>
        <div className={styles.scrubber}>
          <div className={styles.bands} aria-hidden>
            {phases.map((band) => (
              <span
                key={band.label}
                className={styles.band}
                style={{ left: `${(band.from / total) * 100}%`, width: `${((band.to - band.from) / total) * 100}%` }}
              >
                {band.label}
              </span>
            ))}
            {times.map((at, index) => (
              <span
                key={index}
                className={`${styles.tick} ${index < count ? styles.tickDone : ""}`}
                style={{ left: `${(at / total) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            className={styles.range}
            min={0}
            max={total}
            step={10}
            value={time}
            aria-label="Timeline"
            onChange={(event) => {
              setPlaying(false);
              seek(Number(event.target.value));
            }}
          />
        </div>
        <div className={styles.readout}>
          <span className={styles.clock}>
            {(time / 1000).toFixed(1)}s / {(total / 1000).toFixed(1)}s
          </span>
          <span className={styles.beat}>
            {count === 0 ? "Start" : `${count}/${beats.length} · ${describeBeat(beats[count - 1]!, state)}`}
          </span>
        </div>
        <SegmentedButton
          size="extraSmall"
          aria-label="Speed"
          value={String(speed)}
          onChange={(value) => setSpeed(Number(value))}
          options={SPEEDS.map((value) => ({ value, label: `${value}×` }))}
        />
      </div>
      <main className={styles.frames}>
        <VariantFrame
          key={variant.id}
          variant={variant}
          data={data}
          walk={walk}
          state={state}
          instant={instant}
          onSkip={toEnd}
          onRestart={restart}
        />
      </main>
    </>
  );
}

const VariantFrame = memo(function VariantFrame({
  variant,
  data,
  walk,
  state,
  instant,
  onSkip,
  onRestart,
}: {
  variant: TrainingVariant;
  data: TrainingWalkData;
  walk: TrainingWalk;
  state: WalkState;
  instant: boolean;
  onSkip: () => void;
  onRestart: () => void;
}) {
  const { Stage } = variant;
  return (
    <section className={styles.frame} aria-label={variant.name}>
      <div className={styles.frameLabel}>
        <span className={styles.frameName}>{variant.name}</span>
        <span className={styles.frameNote}>{variant.note}</span>
      </div>
      <TrainingModalShell
        open
        surfaceOnly
        title={variant.title?.(state)}
        onClose={onRestart}
        onTest={onRestart}
        columns={data.columns}
        labelColumn={data.labelColumn}
        features={data.features}
        canTest
        done={state.act === "done"}
        onSkip={onSkip}
        maxWidth={variant.maxWidth ?? 880}
        flush
        hideStatement={variant.hideStatement}
        persistentBack={variant.persistentBack}
      >
        <Stage data={data} walk={walk} state={state} instant={instant} />
      </TrainingModalShell>
    </section>
  );
});

/** Beats landed by clock time `ms`. */
function countAt(times: number[], ms: number): number {
  const next = times.findIndex((at) => at > ms);
  return next < 0 ? times.length : next;
}

function phaseBands(beats: Beat[], times: number[], total: number) {
  const startOf = (act: WalkState["act"]) => {
    const index = beats.findIndex((beat) => beat.patch.act === act);
    return index < 0 ? total : times[index]!;
  };
  const testing = startOf("testing");
  const checking = startOf("checking");
  return [
    { label: "Training", from: 0, to: testing },
    { label: "Testing", from: testing, to: checking },
    { label: "Score", from: checking, to: total },
  ];
}

function describeBeat(beat: Beat, state: WalkState): string {
  const { patch } = beat;
  if (patch.act === "testing") return "Testing starts";
  if (patch.act === "checking") return "Checking every row";
  if (patch.act === "done") return "Done";
  if (patch.read) return "Rows pour into the top pile";
  if (patch.splitsShown !== undefined) return `Question ${patch.splitsShown} appears`;
  if (patch.childrenShown !== undefined) return `Question ${patch.childrenShown} branches`;
  if (patch.splitsDone !== undefined) return `Question ${patch.splitsDone} sorts its pile`;
  if (patch.named) return "Groups name their guess";
  if (patch.quiz !== undefined) return `Test row ${patch.quiz + 1} enters`;
  if (patch.step !== undefined) return `Test row ${state.quiz + 1} moves to step ${patch.step}`;
  if (patch.guessed) return `Test row ${state.quiz + 1} gets its guess`;
  if (patch.revealed !== undefined) return `Test row ${patch.revealed} shows its real label`;
  return "Beat";
}
