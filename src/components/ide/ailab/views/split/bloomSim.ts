/**
 * The split intro's bloom, simulated once and recorded so a timeline can
 * scrub it: grey dots spawn at the cluster's center one after another
 * (center out), each with a random outward kick, spring toward their own
 * sunflower spot, and bump off the dots already there. Each kick aims at
 * the dot's own spot (with some spread), so dots fan out rather than cross
 * the cluster and jam. Collisions fade out once every dot is in, leaving
 * the springs to carry each dot the last of the way, so it comes to rest
 * on its spot with no snap; the spots are the later beats' start.
 *
 * Coordinates are relative to the cluster's center, in px.
 */

/** Golden angle, for sunflower packing. */
export const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export interface BloomPhysics {
  /** Spring pulling each dot to its spot (1/s²). */
  spring: number;
  /** Damping on that spring (1/s); a little under critical gives some give. */
  damping: number;
  /** How hard dots bounce off each other (0 dead, 1 elastic). */
  restitution: number;
  /** Outward kick a dot spawns with, px/s (low and high end). */
  kickMin: number;
  kickMax: number;
  /** Seconds over which the dots spawn, center first. */
  spawnWindow: number;
  /** Seconds a dot takes to pop up to full size after it spawns. */
  popIn: number;
  /** How far a kick may stray from the line to the dot's spot, in degrees. */
  aimSpread: number;
  /** Seconds after the last spawn that collisions take to fade out. */
  collisionFade: number;
}

export const DEFAULT_BLOOM_PHYSICS: BloomPhysics = {
  spring: 75,
  damping: 10,
  restitution: 0.55,
  kickMin: 90,
  kickMax: 220,
  spawnWindow: 0.55,
  popIn: 0.16,
  aimSpread: 50,
  collisionFade: 0.7,
};

/** Recording rate and the cap on how long the settle may run. */
const FPS = 60;
const SUBSTEPS = 4;
const SETTLE_MAX = 3;
/** At rest: every dot this close to its spot (px) and this slow (px/s). */
const REST_DISTANCE = 0.25;
const REST_SPEED = 3;
/** Any distance left at the cap is blended away over this many frames, never snapped. */
const BLEND_FRAMES = 12;

export interface BloomRecording {
  /** Simulated seconds from the first spawn to rest. */
  seconds: number;
  /** One frame per 1/60 s: `[x, y, scale]` per dot (scale 0 before it spawns). */
  frames: Float32Array[];
}

/** Sunflower spot `rank`, relative to the center, at `pitch` px. */
export function sunflower(rank: number, pitch: number): { x: number; y: number } {
  const r = pitch * Math.sqrt(rank + 0.5);
  const a = rank * GOLDEN;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

export function recordBloom(
  count: number,
  dot: number,
  pitch: number,
  physics: BloomPhysics = DEFAULT_BLOOM_PHYSICS,
): BloomRecording {
  const n = count;
  const tx = new Float64Array(n);
  const ty = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const s = sunflower(i, pitch);
    tx[i] = s.x;
    ty[i] = s.y;
  }
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const born = new Float64Array(n).fill(-1);
  const random = seeded(n * 7919 + 17);
  const spawnAt = (i: number) => (i / Math.max(1, n)) * physics.spawnWindow;
  const minD = dot * 1.02;
  const minD2 = minD * minD;
  const frames: Float32Array[] = [];
  const dt = 1 / FPS / SUBSTEPS;
  let t = 0;
  let live = 0;

  const record = () => {
    const frame = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const age = born[i]! < 0 ? -1 : (t - born[i]!) / Math.max(0.01, physics.popIn);
      frame[i * 3] = px[i]!;
      frame[i * 3 + 1] = py[i]!;
      frame[i * 3 + 2] = age < 0 ? 0 : age >= 1 ? 1 : easeOutBack(age);
    }
    frames.push(frame);
  };

  const settled = () => {
    if (live < n) return false;
    for (let i = 0; i < n; i += 1) {
      if (Math.hypot(vx[i]!, vy[i]!) > REST_SPEED) return false;
      if (Math.hypot(tx[i]! - px[i]!, ty[i]! - py[i]!) > REST_DISTANCE) return false;
    }
    return true;
  };

  record();
  while (!(settled() && t >= physics.spawnWindow + physics.popIn) && t < physics.spawnWindow + SETTLE_MAX) {
    for (let sub = 0; sub < SUBSTEPS; sub += 1) {
      t += dt;
      while (live < n && spawnAt(live) <= t) {
        /* Toward its own spot, give or take the spread. */
        const home = Math.atan2(ty[live]!, tx[live]!);
        const angle = home + (random() - 0.5) * ((physics.aimSpread * Math.PI) / 180);
        const speed = physics.kickMin + random() * Math.max(0, physics.kickMax - physics.kickMin);
        px[live] = Math.cos(angle) * 0.5;
        py[live] = Math.sin(angle) * 0.5;
        vx[live] = Math.cos(angle) * speed;
        vy[live] = Math.sin(angle) * speed;
        born[live] = t;
        live += 1;
      }
      for (let i = 0; i < live; i += 1) {
        vx[i] += (physics.spring * (tx[i]! - px[i]!) - physics.damping * vx[i]!) * dt;
        vy[i] += (physics.spring * (ty[i]! - py[i]!) - physics.damping * vy[i]!) * dt;
        px[i] += vx[i]! * dt;
        py[i] += vy[i]! * dt;
      }
      /* Push overlapping pairs apart and trade their closing speed, less
         and less once every dot is in. */
      const fadeFrom = physics.spawnWindow + physics.popIn;
      const contact =
        physics.collisionFade <= 0
          ? t < fadeFrom ? 1 : 0
          : 1 - Math.min(1, Math.max(0, (t - fadeFrom) / physics.collisionFade));
      for (let i = 0; contact > 0 && i < live; i += 1) {
        for (let j = i + 1; j < live; j += 1) {
          const dx = px[j]! - px[i]!;
          const dy = py[j]! - py[i]!;
          const d2 = dx * dx + dy * dy;
          if (d2 >= minD2) continue;
          const d = Math.sqrt(d2) || 0.01;
          const nx = d2 === 0 ? 1 : dx / d;
          const ny = d2 === 0 ? 0 : dy / d;
          const push = ((minD - d) / 2) * contact;
          px[i] -= nx * push;
          py[i] -= ny * push;
          px[j] += nx * push;
          py[j] += ny * push;
          const closing = (vx[j]! - vx[i]!) * nx + (vy[j]! - vy[i]!) * ny;
          if (closing < 0) {
            const impulse = ((-(1 + physics.restitution) * closing) / 2) * contact;
            vx[i] -= impulse * nx;
            vy[i] -= impulse * ny;
            vx[j] += impulse * nx;
            vy[j] += impulse * ny;
          }
        }
      }
    }
    record();
  }
  /* Rest exactly on the spots: blend whatever is left over a few frames
     (sub-pixel when it settled in time), never a jump. */
  const leftX = Float64Array.from(px);
  const leftY = Float64Array.from(py);
  const blend = settled() ? 1 : BLEND_FRAMES;
  for (let frame = 1; frame <= blend; frame += 1) {
    const u = frame / blend;
    const eased = u * u * (3 - 2 * u);
    t += 1 / FPS;
    for (let i = 0; i < n; i += 1) {
      px[i] = leftX[i]! + (tx[i]! - leftX[i]!) * eased;
      py[i] = leftY[i]! + (ty[i]! - leftY[i]!) * eased;
    }
    record();
  }
  return { seconds: t, frames };
}

/** The recording at 0–1 progress, as `[x, y, scale]` per dot (interpolated). */
export function sampleBloom(recording: BloomRecording, progress: number): Float32Array {
  const { frames } = recording;
  const at = Math.min(1, Math.max(0, progress)) * (frames.length - 1);
  const lo = Math.floor(at);
  const hi = Math.min(frames.length - 1, lo + 1);
  const mix = at - lo;
  const a = frames[lo]!;
  const b = frames[hi]!;
  if (mix === 0 || lo === hi) return a;
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i]! + (b[i]! - a[i]!) * mix;
  return out;
}

function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/** Deterministic 0–1 noise, so every replay blooms the same way. */
function seeded(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
