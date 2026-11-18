/**
 * The split intro's bloom, simulated once and recorded so a timeline can
 * scrub it. The cluster grows from its middle the way a sunflower head
 * does: each new dot appears at the center and every dot already out is
 * pushed one place further along its own ray. So at every moment the dots
 * out so far are aiming at a complete, evenly packed disc, and the last
 * disc is the final cluster: there is no separate "arrange" step to snap
 * into. The dots that end on the rim are the first out; the center fills
 * last.
 *
 * Each dot follows its moving place on a spring, leaves the center with a
 * small outward kick, and bumps off its neighbors, which is where the
 * jostle comes from. Once the last dot is out the places stop moving and
 * the springs carry every dot the last of the way.
 *
 * Coordinates are relative to the cluster's center, in px.
 */

/** Golden angle, for sunflower packing. */
export const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export interface BloomPhysics {
  /** Spring pulling each dot to its place (1/s²). */
  spring: number;
  /** Damping on that spring (1/s); a little under critical gives some give. */
  damping: number;
  /** How hard dots bounce off each other (0 dead, 1 elastic). */
  restitution: number;
  /** Outward kick a dot leaves the center with, px/s (low and high end). */
  kickMin: number;
  kickMax: number;
  /** Seconds over which the dots come out, rim dots first. */
  spawnWindow: number;
  /** Seconds a dot takes to pop up to full size once it is out. */
  popIn: number;
  /** How far a kick may stray from the dot's own ray, in degrees. */
  aimSpread: number;
  /** Seconds collisions take to fade once the last dot is out and full size. */
  collisionFade: number;
}

export const DEFAULT_BLOOM_PHYSICS: BloomPhysics = {
  spring: 90,
  damping: 13,
  restitution: 0.4,
  kickMin: 20,
  kickMax: 90,
  spawnWindow: 0.8,
  popIn: 0.18,
  aimSpread: 70,
  collisionFade: 0.3,
};

/** Recording rate and the cap on how long the settle may run. */
const FPS = 60;
const SUBSTEPS = 4;
const SETTLE_MAX = 3;
/** Share of an overlap undone per substep: soft, so a spring can always win through. */
const PUSH = 0.8;
/** At rest: every dot this close to its spot (px) and this slow (px/s). */
const REST_DISTANCE = 0.2;
const REST_SPEED = 2;
/** Any distance left at the cap is blended away over this many frames, never snapped. */
const BLEND_FRAMES = 24;
/** At rest, the last fraction of a pixel still eases in over a few frames. */
const REST_FRAMES = 6;

export interface BloomRecording {
  /** Simulated seconds from the first dot out to rest. */
  seconds: number;
  /** One frame per 1/60 s: `[x, y, scale]` per dot (scale 0 before it is out). */
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
  /* Each dot's own ray: the angle of its final spot. */
  const cos = new Float64Array(n);
  const sin = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    cos[i] = Math.cos(i * GOLDEN);
    sin[i] = Math.sin(i * GOLDEN);
  }
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const born = new Float64Array(n).fill(-1);
  const random = seeded(n * 7919 + 17);
  const spawnWindow = Math.max(0.01, physics.spawnWindow);
  const popIn = Math.max(0.01, physics.popIn);
  /* Dots bump at a dot's width, or a little under the tightest gap in
     the final cluster if that is closer: at rest nothing is touching, so
     no dot is held off its spot. */
  let tightest = Infinity;
  for (let i = 0; i < n; i += 1) {
    const ri = pitch * Math.sqrt(i + 0.5);
    for (let j = i + 1; j < n; j += 1) {
      const rj = pitch * Math.sqrt(j + 0.5);
      tightest = Math.min(
        tightest,
        Math.hypot(rj * cos[j]! - ri * cos[i]!, rj * sin[j]! - ri * sin[i]!),
      );
    }
  }
  const minD = Math.min(dot * 1.02, tightest * 0.96);
  const minD2 = minD * minD;
  const frames: Float32Array[] = [];
  const dt = 1 / FPS / SUBSTEPS;
  let t = 0;
  /* Dots out so far: the last `out` indexes (the rim's dots come first). */
  let out = 0;

  /**
   * Dot `i`'s place when `grown` dots' worth of the cluster is out: `i`
   * is that disc's rank `i - (n - grown)`, on its own ray. At `grown = n`
   * this is its final spot.
   */
  const placeRadius = (i: number, grown: number) =>
    pitch * Math.sqrt(Math.max(0, i - (n - grown) + 0.5));

  const record = () => {
    const frame = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const age = born[i]! < 0 ? -1 : (t - born[i]!) / popIn;
      frame[i * 3] = px[i]!;
      frame[i * 3 + 1] = py[i]!;
      frame[i * 3 + 2] = age < 0 ? 0 : age >= 1 ? 1 : easeOutBack(age);
    }
    frames.push(frame);
  };

  const settled = () => {
    if (out < n) return false;
    for (let i = 0; i < n; i += 1) {
      if (Math.hypot(vx[i]!, vy[i]!) > REST_SPEED) return false;
      const r = placeRadius(i, n);
      if (Math.hypot(r * cos[i]! - px[i]!, r * sin[i]! - py[i]!) > REST_DISTANCE) return false;
    }
    return true;
  };

  record();
  while (!(settled() && t >= spawnWindow + popIn) && t < spawnWindow + SETTLE_MAX) {
    for (let sub = 0; sub < SUBSTEPS; sub += 1) {
      t += dt;
      /* Quick out of the middle, easing to a stop as the last dots come out. */
      const u = Math.min(1, t / spawnWindow);
      const grown = n * (1 - (1 - u) * (1 - u));
      while (out < n && n - 1 - out + 0.5 > n - grown) {
        /* Out at the center, kicked along its own ray, give or take the spread. */
        const i = n - 1 - out;
        const angle = i * GOLDEN + (random() - 0.5) * ((physics.aimSpread * Math.PI) / 180);
        /* The further out a dot ends, the harder its kick: the middle's
           dots, out last, have nowhere to go and come out still. */
        const reach = Math.sqrt((i + 0.5) / n);
        const speed =
          (physics.kickMin + random() * Math.max(0, physics.kickMax - physics.kickMin)) * reach;
        px[i] = Math.cos(angle) * 0.5;
        py[i] = Math.sin(angle) * 0.5;
        vx[i] = Math.cos(angle) * speed;
        vy[i] = Math.sin(angle) * speed;
        born[i] = t;
        out += 1;
      }
      for (let i = n - out; i < n; i += 1) {
        const r = placeRadius(i, grown);
        vx[i] += (physics.spring * (r * cos[i]! - px[i]!) - physics.damping * vx[i]!) * dt;
        vy[i] += (physics.spring * (r * sin[i]! - py[i]!) - physics.damping * vy[i]!) * dt;
        px[i] += vx[i]! * dt;
        py[i] += vy[i]! * dt;
      }
      /* Push overlapping pairs apart and trade their closing speed, less
         and less once every dot is out. The places never overlap, so this
         only acts on dots that are ahead of or behind their place. */
      const fadeFrom = spawnWindow + popIn;
      const contact =
        physics.collisionFade <= 0
          ? t < fadeFrom ? 1 : 0
          : 1 - Math.min(1, Math.max(0, (t - fadeFrom) / physics.collisionFade));
      for (let i = n - out; contact > 0 && i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
          const dx = px[j]! - px[i]!;
          const dy = py[j]! - py[i]!;
          const d2 = dx * dx + dy * dy;
          if (d2 >= minD2) continue;
          const d = Math.sqrt(d2) || 0.01;
          const nx = d2 === 0 ? 1 : dx / d;
          const ny = d2 === 0 ? 0 : dy / d;
          /* A dot still popping in is small: it pushes in proportion. */
          const young = Math.min(
            1,
            (t - born[i]!) / popIn,
            (t - born[j]!) / popIn,
          );
          const push = ((minD - d) / 2) * PUSH * contact * young;
          px[i] -= nx * push;
          py[i] -= ny * push;
          px[j] += nx * push;
          py[j] += ny * push;
          const closing = (vx[j]! - vx[i]!) * nx + (vy[j]! - vy[i]!) * ny;
          if (closing < 0) {
            const impulse = ((-(1 + physics.restitution) * closing) / 2) * contact * young;
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
  /* Rest exactly on the spots: ease away whatever is left (sub-pixel when
     it settled in time), never a jump. */
  const leftX = Float64Array.from(px);
  const leftY = Float64Array.from(py);
  const blend = settled() ? REST_FRAMES : BLEND_FRAMES;
  for (let frame = 1; frame <= blend; frame += 1) {
    const u = frame / blend;
    const eased = u * u * (3 - 2 * u);
    t += 1 / FPS;
    for (let i = 0; i < n; i += 1) {
      const r = placeRadius(i, n);
      px[i] = leftX[i]! + (r * cos[i]! - leftX[i]!) * eased;
      py[i] = leftY[i]! + (r * sin[i]! - leftY[i]!) * eased;
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
