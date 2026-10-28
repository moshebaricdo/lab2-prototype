import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, SegmentedButton } from "@moshebari/cads-react";
import { FaIcon } from "@moshebari/cads-react/icons";
import { CadsLabProvider } from "../../components/lab2/CadsLabProvider";
import { TrainingModalShell } from "../../components/ide/ailab/views/TrainingModalShell";
import {
  DEFAULT_TRAINING_PARAMS,
  beatTimes,
  diffTrainingParams,
  formatTrainingParamsExport,
  parseTrainingParamsFromSearch,
  serializeTrainingParamsToSearch,
  stateAfter,
  useTrainingWalk,
  type Beat,
  type DotEasePreset,
  type GrowthMode,
  type TrainingStory,
  type TrainingWalk,
  type TrainingWalkData,
  type TrainingWalkParams,
  type WalkState,
} from "../../components/ide/ailab/views/trainingWalk";
import type { SortingLook, SortingMarbleStyle } from "../../components/ide/ailab/views/viz/SortingTree";
import { TRAINING_FIXTURES, trainingFixture } from "../../data/ailab/trainingFixtures";
import { TRAINING_VARIANTS, type TrainingVariant } from "./trainingLabVariants";
import styles from "./AiLabTrainingLabPage.module.scss";

/** Hold on the final frame before the clock stops. */
const END_HOLD_MS = 800;
const SPEEDS = ["0.5", "1", "2"];

type LoopMode = "off" | "beat" | "training" | "testing" | "score";
type ExportFormat = "ts" | "diff" | "full";

interface SliderSpec<K extends keyof TrainingWalkParams = keyof TrainingWalkParams> {
  key: K;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  note?: string;
}

const GEOMETRY_SLIDERS: SliderSpec[] = [
  { key: "maxDots", label: "Max dots cap", min: 24, max: 600, step: 12, note: "Condenses rows past this count" },
  { key: "dotScale", label: "Dot size scale", min: 0.6, max: 1.6, step: 0.05, unit: "×" },
  { key: "maxTreeScale", label: "Max tree scale", min: 0.8, max: 1.8, step: 0.05, unit: "×" },
  { key: "levelGap", label: "Level gap", min: 32, max: 90, step: 1, unit: "px" },
  { key: "bendRatio", label: "Connector elbow", min: 0.15, max: 0.75, step: 0.01 },
];

const MOTION_SLIDERS: SliderSpec[] = [
  { key: "dotGlideMs", label: "Dot glide", min: 120, max: 1400, step: 20, unit: "ms" },
  { key: "popStaggerMaxMs", label: "Root pop stagger", min: 0, max: 1400, step: 20, unit: "ms" },
  { key: "moveStaggerMaxMs", label: "Split move stagger", min: 0, max: 900, step: 20, unit: "ms" },
  { key: "nodeEnterMs", label: "Node entrance", min: 80, max: 800, step: 20, unit: "ms" },
  { key: "sheetInMs", label: "Dock slide in", min: 80, max: 700, step: 15, unit: "ms" },
  { key: "sheetOutMs", label: "Dock slide out", min: 80, max: 600, step: 15, unit: "ms" },
];

const SORT_BEAT_SLIDERS: SliderSpec[] = [
  { key: "openLegendMs", label: "Open: legend wait", min: 0, max: 1200, step: 50, unit: "ms" },
  { key: "openRootMs", label: "Open: root wait", min: 0, max: 1200, step: 50, unit: "ms" },
  { key: "openReadMs", label: "Open: pour wait", min: 0, max: 1200, step: 50, unit: "ms" },
  { key: "firstSplitWaitMs", label: "1st question wait", min: 200, max: 2600, step: 50, unit: "ms" },
  { key: "splitWaitMs", label: "Next question wait", min: 200, max: 2200, step: 50, unit: "ms" },
  { key: "branchWaitMs", label: "Branch sprout wait", min: 100, max: 1500, step: 25, unit: "ms" },
  { key: "sortWaitMs", label: "Pile sort wait", min: 100, max: 1500, step: 25, unit: "ms" },
  { key: "splitPaceFloor", label: "Deep tree pace floor", min: 0.25, max: 1, step: 0.05, unit: "×" },
  { key: "namedWaitMs", label: "Leaf naming wait", min: 200, max: 2200, step: 50, unit: "ms" },
  { key: "preTestHoldMs", label: "Pre-test hold", min: 200, max: 3000, step: 50, unit: "ms" },
];

const SCAN_BEAT_SLIDERS: SliderSpec[] = [
  { key: "rootScanMax", label: "Root tries shown", min: 1, max: 12, step: 1 },
  { key: "deepScanMax", label: "Deep tries shown", min: 1, max: 8, step: 1 },
  { key: "scanRootStepMs", label: "Root try dwell", min: 150, max: 1800, step: 25, unit: "ms" },
  { key: "scanDeepStepMs", label: "Deep try dwell", min: 120, max: 1200, step: 20, unit: "ms" },
  { key: "scanPickHoldMs", label: "Winner hold", min: 200, max: 2000, step: 50, unit: "ms" },
  { key: "scanPreviewDots", label: "Preview pile dots", min: 12, max: 120, step: 4 },
];

const GROW_BEAT_SLIDERS: SliderSpec[] = [
  { key: "growSlowCount", label: "Slow docked rows", min: 1, max: 12, step: 1 },
  { key: "intakeSettleMs", label: "Reel settle", min: 250, max: 2200, step: 50, unit: "ms" },
  { key: "intakeScanMs", label: "Scanner sweep", min: 300, max: 3200, step: 50, unit: "ms" },
  { key: "intakeFlyMs", label: "Dot drop flight", min: 180, max: 1600, step: 20, unit: "ms" },
  { key: "intakeGapMs", label: "Row gap", min: 40, max: 800, step: 20, unit: "ms" },
  { key: "intakePaceDecay", label: "Slow-row acceleration", min: 0.55, max: 1, step: 0.01, unit: "×" },
  { key: "pourBatchWaitMs", label: "Batch pour wait", min: 80, max: 700, step: 20, unit: "ms" },
];

const INTRO_SLIDERS: SliderSpec[] = [
  { key: "introFilterMs", label: "Column narrow", min: 150, max: 1600, step: 25, unit: "ms" },
  { key: "introScrollMs", label: "Lotto wheel spin", min: 800, max: 6000, step: 100, unit: "ms" },
  { key: "introHoldMs", label: "Landed row hold", min: 50, max: 1200, step: 25, unit: "ms" },
  { key: "introFadeMs", label: "Intro → dock fade", min: 100, max: 1200, step: 25, unit: "ms" },
  { key: "introSpinRows", label: "Wheel rows spun", min: 12, max: 120, step: 4 },
  { key: "introOvershootPx", label: "Wheel overshoot", min: 0, max: 24, step: 1, unit: "px" },
  { key: "introShrinkFrom", label: "Window shrink start", min: 0.1, max: 0.8, step: 0.05 },
];

const TESTING_SLIDERS: SliderSpec[] = [
  { key: "quizSize", label: "Quizzed rows", min: 1, max: 6, step: 1 },
  { key: "quizTravelMs", label: "Step travel", min: 200, max: 1600, step: 20, unit: "ms" },
  { key: "quizPaceDecay", label: "Row-to-row speedup", min: 0.5, max: 1, step: 0.05, unit: "×" },
  { key: "connectorShare", label: "Connector share", min: 0.45, max: 0.95, step: 0.05 },
  { key: "traceExtraMs", label: "Trace extra draw", min: 0, max: 250, step: 10, unit: "ms" },
  { key: "guessDelayMs", label: "Leaf bounce delay", min: 0, max: 700, step: 25, unit: "ms" },
  { key: "guessFlyMs", label: "Guess flight", min: 150, max: 1400, step: 20, unit: "ms" },
  { key: "flyArcPx", label: "Guess flight arc", min: 0, max: 80, step: 2, unit: "px" },
  { key: "postRevealHoldMs", label: "Post-guess hold", min: 100, max: 1500, step: 50, unit: "ms" },
  { key: "checkingHoldMs", label: "Checking hold", min: 200, max: 2600, step: 50, unit: "ms" },
  { key: "doneHoldMs", label: "Score done hold", min: 300, max: 3000, step: 50, unit: "ms" },
];

function presetParamsForVariant(variant: TrainingVariant): TrainingWalkParams {
  return {
    ...DEFAULT_TRAINING_PARAMS,
    intro: variant.intro ?? false,
    growth: variant.growth ?? "organic",
    scanMeter: variant.scanMeter ?? true,
  };
}

/**
 * Sandbox for the AI Lab training animation: pick a fixture dataset and
 * a variant preset, then play, scrub, step, loop, and tune every timing,
 * geometry, and story parameter live inside the real (inline) training modal.
 * Not linked from the level index.
 */
export function AiLabTrainingLabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariantId =
    TRAINING_VARIANTS.find((v) => v.id === searchParams.get("variant"))?.id ??
    TRAINING_VARIANTS.find((v) => v.id === "table")?.id ??
    TRAINING_VARIANTS[0]!.id;
  const initialVariant =
    TRAINING_VARIANTS.find((v) => v.id === initialVariantId) ?? TRAINING_VARIANTS[0]!;
  const initialFixtureId =
    TRAINING_FIXTURES.find((f) => f.id === searchParams.get("fixture"))?.id ??
    TRAINING_FIXTURES[0]!.id;
  const initialStory = ((): TrainingStory => {
    const raw = searchParams.get("story");
    if (raw === "sort" || raw === "scan" || raw === "grow") return raw;
    return initialVariant.story ?? "sort";
  })();

  const [fixtureId, setFixtureId] = useState(initialFixtureId);
  const [variantId, setVariantId] = useState(initialVariantId);
  const [story, setStory] = useState<TrainingStory>(initialStory);
  const [params, setParams] = useState<TrainingWalkParams>(() => ({
    ...presetParamsForVariant(initialVariant),
    ...parseTrainingParamsFromSearch(window.location.search),
  }));
  const [controlsOpen, setControlsOpen] = useState(true);
  const [replayOnTweak, setReplayOnTweak] = useState(true);
  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [lastTweakedKey, setLastTweakedKey] = useState<{
    key: keyof TrainingWalkParams;
    seq: number;
  } | null>(null);

  const fixture = useMemo(() => trainingFixture(fixtureId), [fixtureId]);
  const variant =
    TRAINING_VARIANTS.find((entry) => entry.id === variantId) ?? TRAINING_VARIANTS[0]!;

  const baseForPreset = useMemo(() => presetParamsForVariant(variant), [variant]);
  const modifiedDiff = useMemo(
    () => diffTrainingParams(params, DEFAULT_TRAINING_PARAMS),
    [params],
  );
  const modifiedCount = Object.keys(modifiedDiff).length;

  const selectVariantPreset = useCallback((nextId: string) => {
    const next =
      TRAINING_VARIANTS.find((entry) => entry.id === nextId) ?? TRAINING_VARIANTS[0]!;
    setVariantId(next.id);
    setStory(next.story ?? "sort");
    setParams((prev) => ({
      ...prev,
      intro: next.intro ?? false,
      growth: next.growth ?? "organic",
      scanMeter: next.scanMeter ?? true,
    }));
  }, []);

  const updateParam = useCallback(
    <K extends keyof TrainingWalkParams>(key: K, value: TrainingWalkParams[K]) => {
      setParams((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
      setLastTweakedKey((prev) => ({ key, seq: (prev?.seq ?? 0) + 1 }));
    },
    [],
  );

  const resetKeys = useCallback(
    (keys: (keyof TrainingWalkParams)[]) => {
      setParams((prev) => {
        const next = { ...prev };
        keys.forEach((key) => {
          (next as Record<string, unknown>)[key] = baseForPreset[key];
        });
        return next;
      });
    },
    [baseForPreset],
  );

  const resetAll = useCallback(() => {
    setStory(variant.story ?? "sort");
    setParams(presetParamsForVariant(variant));
  }, [variant]);

  // Keep URL search params synced so tuned states can be bookmarked or shared.
  useEffect(() => {
    const query = serializeTrainingParamsToSearch(
      params,
      {
        fixture: fixtureId !== TRAINING_FIXTURES[0]!.id ? fixtureId : undefined,
        variant: variantId !== "table" ? variantId : undefined,
        story: story !== (variant.story ?? "sort") ? story : undefined,
      },
      presetParamsForVariant(variant),
    );
    const nextSearch = query.startsWith("?") ? query.slice(1) : query;
    if (nextSearch !== searchParams.toString()) {
      setSearchParams(nextSearch, { replace: true });
    }
  }, [params, fixtureId, variantId, story, variant, searchParams, setSearchParams]);

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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Preset</span>
            <select
              className={styles.select}
              value={variant.id}
              title={variant.note}
              onChange={(event) => selectVariantPreset(event.target.value)}
            >
              {TRAINING_VARIANTS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <span className={styles.note}>{fixture.note}</span>
          <div className={styles.headerActions}>
            {modifiedCount > 0 ? (
              <span className={styles.dirtyBadge}>
                {modifiedCount} tuned
              </span>
            ) : null}
            <Button
              size="extraSmall"
              variant={controlsOpen ? "contained" : "outlined"}
              color="secondary"
              startIconName="sliders"
              onClick={() => setControlsOpen((open) => !open)}
            >
              {controlsOpen ? "Hide parameters" : "Parameters"}
            </Button>
          </div>
        </header>
        <Player
          fixtureId={fixture.id}
          data={fixture.data}
          variant={variant}
          story={story}
          onChangeStory={setStory}
          params={params}
          onUpdateParam={updateParam}
          onResetKeys={resetKeys}
          onResetAll={resetAll}
          modifiedCount={modifiedCount}
          controlsOpen={controlsOpen}
          replayOnTweak={replayOnTweak}
          onChangeReplayOnTweak={setReplayOnTweak}
          loopMode={loopMode}
          onChangeLoopMode={setLoopMode}
          lastTweakedKey={lastTweakedKey}
        />
      </div>
    </CadsLabProvider>
  );
}

function Player({
  fixtureId,
  data,
  variant,
  story,
  onChangeStory,
  params,
  onUpdateParam,
  onResetKeys,
  onResetAll,
  modifiedCount,
  controlsOpen,
  replayOnTweak,
  onChangeReplayOnTweak,
  loopMode,
  onChangeLoopMode,
  lastTweakedKey,
}: {
  fixtureId: string;
  data: TrainingWalkData;
  variant: TrainingVariant;
  story: TrainingStory;
  onChangeStory: (story: TrainingStory) => void;
  params: TrainingWalkParams;
  onUpdateParam: <K extends keyof TrainingWalkParams>(
    key: K,
    value: TrainingWalkParams[K],
  ) => void;
  onResetKeys: (keys: (keyof TrainingWalkParams)[]) => void;
  onResetAll: () => void;
  modifiedCount: number;
  controlsOpen: boolean;
  replayOnTweak: boolean;
  onChangeReplayOnTweak: (value: boolean) => void;
  loopMode: LoopMode;
  onChangeLoopMode: (mode: LoopMode) => void;
  lastTweakedKey: { key: keyof TrainingWalkParams; seq: number } | null;
}) {
  const walk = useTrainingWalk(data, story, params);
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
  const prevBeatAnchorRef = useRef<{ count: number; frac: number }>({
    count: 0,
    frac: 0,
  });

  const seek = useCallback(
    (next: number, animate = false) => {
      const clamped = Math.max(0, Math.min(total, next));
      timeRef.current = clamped;
      setTime(clamped);
      if (!animate) setJumpedAt(countAt(times, clamped));
      else setJumpedAt(-1);
    },
    [times, total],
  );

  // Track current beat index + fractional progress so parameter edits
  // preserve the user's logical place on the timeline instead of jumping.
  useEffect(() => {
    const c = countAt(times, time);
    const start = c > 0 ? (times[c - 1] ?? 0) : 0;
    const end = times[c] ?? total;
    const span = Math.max(1, end - start);
    prevBeatAnchorRef.current = {
      count: c,
      frac: Math.min(1, Math.max(0, (time - start) / span)),
    };
  }, [time, times, total]);

  // Reset to start when switching dataset fixture or story mode.
  const identityKey = `${fixtureId}:${story}:${params.intro}:${params.growth}`;
  const prevIdentityRef = useRef(identityKey);
  useEffect(() => {
    if (prevIdentityRef.current !== identityKey) {
      prevIdentityRef.current = identityKey;
      seek(0);
      setPlaying(true);
    }
  }, [identityKey, seek]);

  // When a parameter slider is tweaked:
  // - If `replayOnTweak` is enabled, replay the active beat (or phase) with animation
  //   so the user immediately sees the effect of their slider adjustment.
  // - Otherwise keep the playhead anchored at the same beat index.
  const prevTweakSeqRef = useRef(0);
  useEffect(() => {
    if (!lastTweakedKey || lastTweakedKey.seq === prevTweakSeqRef.current) return;
    prevTweakSeqRef.current = lastTweakedKey.seq;
    const { count, frac } = prevBeatAnchorRef.current;
    const clampedCount = Math.min(times.length, Math.max(0, count));
    if (replayOnTweak && !playing && clampedCount > 0) {
      const beatTime = times[clampedCount - 1] ?? 0;
      timeRef.current = beatTime;
      setTime(beatTime);
      setJumpedAt(-1);
      return;
    }
    const start = clampedCount > 0 ? (times[clampedCount - 1] ?? 0) : 0;
    const end = times[clampedCount] ?? total;
    const mapped = start + (end - start) * frac;
    const clamped = Math.max(0, Math.min(total, mapped));
    timeRef.current = clamped;
    setTime(clamped);
  }, [lastTweakedKey, times, total, replayOnTweak, playing]);

  // Compute loop window bounds from `loopMode`.
  const loopBounds = useMemo((): { from: number; to: number } | null => {
    if (loopMode === "off") return null;
    if (loopMode === "beat") {
      const c = Math.max(1, countAt(times, timeRef.current));
      const from = c >= 2 ? (times[c - 2] ?? 0) : 0;
      const to = times[c] ?? total;
      return { from, to: Math.max(from + 200, to) };
    }
    const labelMap: Record<Exclude<LoopMode, "off" | "beat">, string> = {
      training: "Training",
      testing: "Testing",
      score: "Score",
    };
    const band = phases.find((b) => b.label === labelMap[loopMode]);
    if (!band) return null;
    return { from: band.from, to: Math.max(band.from + 200, band.to) };
  }, [loopMode, phases, times, total]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) * speed;
      last = now;
      if (loopBounds) {
        const next = timeRef.current + delta;
        if (next >= loopBounds.to) {
          timeRef.current = loopBounds.from;
          setTime(loopBounds.from);
          setJumpedAt(countAt(times, loopBounds.from));
        } else {
          timeRef.current = next;
          setTime(next);
          setJumpedAt(-1);
        }
        frame = requestAnimationFrame(tick);
        return;
      }
      const next = Math.min(total, timeRef.current + delta);
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
  }, [playing, speed, total, loopBounds, times]);

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
    if (loopBounds) {
      if (timeRef.current < loopBounds.from || timeRef.current >= loopBounds.to) {
        seek(loopBounds.from);
      }
    } else if (timeRef.current >= total) {
      seek(0);
    }
    setPlaying(true);
  }, [playing, seek, total, loopBounds]);

  const restart = useCallback(() => {
    seek(loopBounds ? loopBounds.from : 0);
    setPlaying(true);
  }, [seek, loopBounds]);

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

  const replayCurrentBeat = useCallback(() => {
    setPlaying(false);
    const current = Math.max(1, countAt(times, timeRef.current));
    const beatTime = times[current - 1] ?? 0;
    timeRef.current = beatTime;
    setTime(beatTime);
    setJumpedAt(-1);
  }, [times]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, button")) return;
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
      } else if (event.key === "b") {
        replayCurrentBeat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBack, restart, replayCurrentBeat]);

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
          <Button
            size="extraSmall"
            variant="outlined"
            color="secondary"
            iconOnly
            startIconName="arrows-rotate"
            aria-label="Replay current beat (B)"
            title="Replay current beat (B)"
            disabled={count === 0}
            onClick={replayCurrentBeat}
          />
        </div>
        <div className={styles.scrubber}>
          <div className={styles.bands} aria-hidden>
            {phases.map((band) => {
              const isLooped =
                (loopMode === "training" && band.label === "Training") ||
                (loopMode === "testing" && band.label === "Testing") ||
                (loopMode === "score" && band.label === "Score");
              return (
                <button
                  type="button"
                  key={band.label}
                  className={`${styles.band} ${isLooped ? styles.bandActive : ""}`}
                  style={{
                    left: `${(band.from / total) * 100}%`,
                    width: `${((band.to - band.from) / total) * 100}%`,
                  }}
                  title={`Click to jump to ${band.label} (Shift+click to loop ${band.label})`}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      const targetLoop = band.label.toLowerCase() as LoopMode;
                      onChangeLoopMode(loopMode === targetLoop ? "off" : targetLoop);
                    }
                    seek(band.from);
                  }}
                >
                  {band.label}
                </button>
              );
            })}
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
            {count > 0 && beats[count - 1]
              ? ` · ${beats[count - 1]!.wait}ms`
              : ""}
          </span>
          <span className={styles.beat}>
            {count === 0
              ? "Start"
              : `${count}/${beats.length} · ${describeBeat(beats[count - 1]!, state)}`}
          </span>
        </div>
        <div className={styles.transportRight}>
          <label className={styles.loopSelectWrap} title="Loop a phase or beat continuously">
            <FaIcon name="repeat" fontSize="11px" />
            <select
              className={styles.compactSelect}
              aria-label="Loop mode"
              value={loopMode}
              onChange={(event) => {
                const nextMode = event.target.value as LoopMode;
                onChangeLoopMode(nextMode);
                if (nextMode !== "off" && !playing) {
                  setPlaying(true);
                }
              }}
            >
              <option value="off">Loop: Off</option>
              <option value="beat">Loop: Beat</option>
              <option value="training">Loop: Training</option>
              <option value="testing">Loop: Testing</option>
              <option value="score">Loop: Score</option>
            </select>
          </label>
          <SegmentedButton
            size="extraSmall"
            aria-label="Speed"
            value={String(speed)}
            onChange={(value) => setSpeed(Number(value))}
            options={SPEEDS.map((value) => ({ value, label: `${value}×` }))}
          />
        </div>
      </div>
      <div className={`${styles.workbench} ${controlsOpen ? styles.workbenchWithRail : ""}`}>
        <main className={styles.frames}>
          <VariantFrame
            key={variant.id}
            variant={variant}
            data={data}
            walk={walk}
            state={state}
            instant={instant}
            speed={speed}
            onSkip={toEnd}
            onRestart={restart}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        </main>
        {controlsOpen ? (
          <ParametricInspector
            story={story}
            onChangeStory={onChangeStory}
            params={params}
            onUpdateParam={onUpdateParam}
            onResetKeys={onResetKeys}
            onResetAll={onResetAll}
            modifiedCount={modifiedCount}
            replayOnTweak={replayOnTweak}
            onChangeReplayOnTweak={onChangeReplayOnTweak}
            onReplayBeat={replayCurrentBeat}
          />
        ) : null}
      </div>
    </>
  );
}

const VariantFrame = memo(function VariantFrame({
  variant,
  data,
  walk,
  state,
  instant,
  speed,
  onSkip,
  onRestart,
  playing,
  onTogglePlay,
}: {
  variant: TrainingVariant;
  data: TrainingWalkData;
  walk: TrainingWalk;
  state: WalkState;
  instant: boolean;
  speed: number;
  onSkip: () => void;
  onRestart: () => void;
  playing: boolean;
  onTogglePlay: () => void;
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
        playback={
          variant.persistentBack
            ? { paused: !playing, onTogglePause: onTogglePlay, onRestart }
            : undefined
        }
      >
        <Stage data={data} walk={walk} state={state} instant={instant} speed={speed} />
      </TrainingModalShell>
    </section>
  );
});

function ParametricInspector({
  story,
  onChangeStory,
  params,
  onUpdateParam,
  onResetKeys,
  onResetAll,
  modifiedCount,
  replayOnTweak,
  onChangeReplayOnTweak,
  onReplayBeat,
}: {
  story: TrainingStory;
  onChangeStory: (story: TrainingStory) => void;
  params: TrainingWalkParams;
  onUpdateParam: <K extends keyof TrainingWalkParams>(
    key: K,
    value: TrainingWalkParams[K],
  ) => void;
  onResetKeys: (keys: (keyof TrainingWalkParams)[]) => void;
  onResetAll: () => void;
  modifiedCount: number;
  replayOnTweak: boolean;
  onChangeReplayOnTweak: (value: boolean) => void;
  onReplayBeat: () => void;
}) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("ts");
  const [copied, setCopied] = useState<"config" | "url" | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);

  const exportText = useMemo(
    () => formatTrainingParamsExport(params, exportFormat),
    [params, exportFormat],
  );

  const copyText = useCallback(async (text: string, kind: "config" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1800);
    } catch {
      // Clipboard fallback ignored in prototype
    }
  }, []);

  const renderSliderGroup = (specs: SliderSpec[]) => (
    <div className={styles.sliderList}>
      {specs.map((spec) => {
        const value = Number(params[spec.key]);
        const defaultValue = Number(DEFAULT_TRAINING_PARAMS[spec.key]);
        const isDirty = value !== defaultValue;
        return (
          <div key={spec.key} className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label
                htmlFor={`param-${spec.key}`}
                className={`${styles.sliderLabel} ${isDirty ? styles.sliderLabelDirty : ""}`}
                title={spec.note ?? `Default: ${defaultValue}${spec.unit ?? ""}`}
              >
                {spec.label}
              </label>
              <div className={styles.sliderValueGroup}>
                <span className={styles.sliderValue}>
                  {value}
                  {spec.unit ?? ""}
                </span>
                {isDirty ? (
                  <button
                    type="button"
                    className={styles.resetDot}
                    title={`Reset to ${defaultValue}${spec.unit ?? ""}`}
                    aria-label={`Reset ${spec.label}`}
                    onClick={() => onUpdateParam(spec.key, defaultValue as never)}
                  >
                    ↺
                  </button>
                ) : null}
              </div>
            </div>
            <input
              id={`param-${spec.key}`}
              type="range"
              className={styles.paramRange}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              value={value}
              onChange={(event) =>
                onUpdateParam(spec.key, Number(event.target.value) as never)
              }
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <aside className={styles.inspector} aria-label="Animation parameters">
      <div className={styles.inspectorHeader}>
        <div className={styles.inspectorTitleRow}>
          <h2 className={styles.inspectorTitle}>Parameters</h2>
          <div className={styles.inspectorHeaderButtons}>
            <Button
              size="extraSmall"
              variant="text"
              color="tertiary"
              disabled={modifiedCount === 0}
              onClick={onResetAll}
            >
              Reset all
            </Button>
          </div>
        </div>
        <div className={styles.workflowToggles}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={replayOnTweak}
              onChange={(e) => onChangeReplayOnTweak(e.target.checked)}
            />
            <span>Replay beat when paused &amp; tuning</span>
          </label>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={params.scaleCssWithSpeed}
              onChange={(e) => onUpdateParam("scaleCssWithSpeed", e.target.checked)}
            />
            <span>Scale CSS transitions with 0.5× / 2× speed</span>
          </label>
        </div>
      </div>

      <div className={styles.inspectorBody}>
        {/* Section 1: Story & Visual Modes */}
        <InspectorSection
          title="Story & Style"
          onReset={() =>
            onResetKeys(["intro", "growth", "scanMeter", "marbleStyle", "look"])
          }
        >
          <div className={styles.controlGrid}>
            <div className={styles.controlField}>
              <span className={styles.controlLabel}>Training story</span>
              <SegmentedButton
                size="extraSmall"
                aria-label="Training story"
                value={story}
                onChange={(val) => onChangeStory(val as TrainingStory)}
                options={[
                  { value: "sort", label: "Sort" },
                  { value: "scan", label: "Scan" },
                  { value: "grow", label: "Grow" },
                ]}
              />
            </div>

            {story === "grow" ? (
              <>
                <div className={styles.controlField}>
                  <span className={styles.controlLabel}>Growth mode</span>
                  <SegmentedButton
                    size="extraSmall"
                    aria-label="Growth mode"
                    value={params.growth}
                    onChange={(val) => onUpdateParam("growth", val as GrowthMode)}
                    options={[
                      { value: "organic", label: "Organic" },
                      { value: "paired", label: "Paired" },
                      { value: "batch", label: "Batch" },
                    ]}
                  />
                </div>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={params.intro}
                    onChange={(e) => onUpdateParam("intro", e.target.checked)}
                  />
                  <span>Open with TableIntro lotto wheel</span>
                </label>
              </>
            ) : null}

            {story === "scan" ? (
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={params.scanMeter}
                  onChange={(e) => onUpdateParam("scanMeter", e.target.checked)}
                />
                <span>Show &ldquo;Sorts&rdquo; impurity bar</span>
              </label>
            ) : null}

            <div className={styles.controlField}>
              <span className={styles.controlLabel}>Testing marble style</span>
              <SegmentedButton
                size="extraSmall"
                aria-label="Testing marble style"
                value={params.marbleStyle}
                onChange={(val) => onUpdateParam("marbleStyle", val as SortingMarbleStyle)}
                options={[
                  { value: "rider", label: "Rider" },
                  { value: "trace", label: "Trace" },
                  { value: "marble", label: "Marble ?" },
                ]}
              />
            </div>

            <div className={styles.controlField}>
              <span className={styles.controlLabel}>Tree card look</span>
              <SegmentedButton
                size="extraSmall"
                aria-label="Tree card look"
                value={params.look}
                onChange={(val) => onUpdateParam("look", val as SortingLook)}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "default", label: "Default" },
                ]}
              />
            </div>
          </div>
        </InspectorSection>

        {/* Section 2: Dots, Piles & Geometry */}
        <InspectorSection
          title="Dots & Tree Geometry"
          onReset={() => onResetKeys(GEOMETRY_SLIDERS.map((s) => s.key))}
        >
          {renderSliderGroup(GEOMETRY_SLIDERS)}
        </InspectorSection>

        {/* Section 3: CSS Motion & Easing */}
        <InspectorSection
          title="Stage & Dot Motion (CSS)"
          onReset={() =>
            onResetKeys(["dotEase", ...MOTION_SLIDERS.map((s) => s.key)])
          }
        >
          <div className={styles.controlField}>
            <span className={styles.controlLabel}>Dot glide easing</span>
            <select
              className={styles.compactSelect}
              aria-label="Dot glide easing"
              value={params.dotEase}
              onChange={(e) =>
                onUpdateParam("dotEase", e.target.value as DotEasePreset)
              }
            >
              <option value="move">Move (0.55, 0, 0.25, 1) — Default</option>
              <option value="snappy">Snappy out (0.2, 0.8, 0.2, 1)</option>
              <option value="spring">Spring overshoot (0.34, 1.35, 0.64, 1)</option>
              <option value="smooth">Smooth ease (0.4, 0, 0.2, 1)</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          {renderSliderGroup(MOTION_SLIDERS)}
        </InspectorSection>

        {/* Section 4: Story-specific Training Choreography */}
        {story === "sort" ? (
          <InspectorSection
            title="Training Beats (Sort)"
            onReset={() => onResetKeys(SORT_BEAT_SLIDERS.map((s) => s.key))}
          >
            {renderSliderGroup(SORT_BEAT_SLIDERS)}
          </InspectorSection>
        ) : null}

        {story === "scan" ? (
          <InspectorSection
            title="Training Beats (Scan)"
            onReset={() =>
              onResetKeys([
                ...SCAN_BEAT_SLIDERS.map((s) => s.key),
                ...SORT_BEAT_SLIDERS.map((s) => s.key),
              ])
            }
          >
            {renderSliderGroup(SCAN_BEAT_SLIDERS)}
            <div className={styles.subDivider} />
            {renderSliderGroup(
              SORT_BEAT_SLIDERS.filter((s) =>
                ["openLegendMs", "openRootMs", "openReadMs", "branchWaitMs", "sortWaitMs", "splitPaceFloor", "namedWaitMs", "preTestHoldMs"].includes(
                  s.key,
                ),
              ),
            )}
          </InspectorSection>
        ) : null}

        {story === "grow" ? (
          <>
            <InspectorSection
              title="Training Beats (Grow Dock)"
              onReset={() => onResetKeys(GROW_BEAT_SLIDERS.map((s) => s.key))}
            >
              {renderSliderGroup(GROW_BEAT_SLIDERS)}
            </InspectorSection>
            {params.intro ? (
              <InspectorSection
                title="TableIntro (Lotto Wheel)"
                onReset={() => onResetKeys(INTRO_SLIDERS.map((s) => s.key))}
              >
                {renderSliderGroup(INTRO_SLIDERS)}
              </InspectorSection>
            ) : null}
          </>
        ) : null}

        {/* Section 5: Testing & Quiz Flight */}
        <InspectorSection
          title="Testing & Quiz Flight"
          onReset={() => onResetKeys(TESTING_SLIDERS.map((s) => s.key))}
        >
          {renderSliderGroup(TESTING_SLIDERS)}
        </InspectorSection>
      </div>

      {/* Footer: Export & Share */}
      <div className={styles.inspectorFooter}>
        <div className={styles.exportActions}>
          <Button
            size="extraSmall"
            variant="contained"
            color="primary"
            startIconName={copied === "config" ? "check" : "copy"}
            onClick={() => copyText(exportText, "config")}
          >
            {copied === "config" ? "Copied config" : "Copy TS / JSON"}
          </Button>
          <Button
            size="extraSmall"
            variant="outlined"
            color="secondary"
            startIconName={copied === "url" ? "check" : "link"}
            onClick={() => copyText(window.location.href, "url")}
          >
            {copied === "url" ? "Copied URL" : "Share URL"}
          </Button>
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            onClick={() => setShowExportPreview((v) => !v)}
          >
            {showExportPreview ? "Hide code" : "Code"}
          </Button>
          <Button
            size="extraSmall"
            variant="text"
            color="tertiary"
            onClick={onReplayBeat}
            title="Replay current beat (B)"
          >
            Replay beat
          </Button>
        </div>
        {showExportPreview ? (
          <div className={styles.exportDrawer}>
            <div className={styles.exportFormatRow}>
              <SegmentedButton
                size="extraSmall"
                aria-label="Export format"
                value={exportFormat}
                onChange={(val) => setExportFormat(val as ExportFormat)}
                options={[
                  { value: "ts", label: "TS diff" },
                  { value: "diff", label: "JSON diff" },
                  { value: "full", label: "Full JSON" },
                ]}
              />
            </div>
            <pre className={styles.exportCode}>{exportText}</pre>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function InspectorSection({
  title,
  defaultOpen = true,
  onReset,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <FaIcon
            name={open ? "chevron-down" : "chevron-right"}
            fontSize="10px"
          />
          <span>{title}</span>
        </button>
        {onReset ? (
          <button
            type="button"
            className={styles.sectionReset}
            title={`Reset ${title} to defaults`}
            onClick={onReset}
          >
            Reset
          </button>
        ) : null}
      </div>
      {open ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}

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
  if (patch.picked) return `Pile ${state.scan + 1} keeps its best question`;
  if (patch.scan !== undefined && patch.scan >= 0) return `Pile ${patch.scan + 1} starts trying questions`;
  if (patch.candidate !== undefined && patch.candidate >= 0) return `Pile ${state.scan + 1} tries another question`;
  if (patch.intro === 0) return "The data table appears";
  if (patch.intro === 1) return "It narrows to the chosen columns";
  if (patch.intro === 2) return "The rows scroll by";
  if (patch.intro === 3) return "The wheel stops on the first row; the tree appears";
  if (patch.intro === -1) return "The dock takes over the row";
  if (patch.intake !== undefined && patch.intake >= 0) return `Training row ${patch.intake + 1} drops in`;
  if (patch.intake === -1) return "The rest pour in";
  if (patch.dotsShown !== undefined && patch.dotsShown > 0 && patch.dotsShown <= 12 && patch.intake === undefined) {
    return `Training row ${patch.dotsShown} lands in the tree`;
  }
  if (patch.dotsShown !== undefined) return patch.dotsShown === 0 ? "Empty tree" : `${patch.dotsShown} rows in`;
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
