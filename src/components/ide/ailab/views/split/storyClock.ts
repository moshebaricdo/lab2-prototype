import type { TransitionConfig } from "dialkit";

/**
 * Reading a timeline clip at any time, without DialKit running it.
 *
 * The stage needs this because half of its story does not sit at fixed
 * times: how long the tree takes to grow and how long the test rows take
 * depend on the tree, so those clips play later than where the dock shows
 * them (see `splitIntroTimeline.ts`). DialKit's own `clip.current` only
 * knows the dock's time, so the stage samples every clip itself, at
 * whatever time that clip is really playing.
 *
 * The math is DialKit 1.4.3's sampler (`transition-math`), so a clip reads
 * the same here as its curve does in the dock. It is also all the stage
 * needs to run in the lab: a plain clock and the tuned config.
 */
export interface StoryClip {
  at: number;
  duration: number;
  from?: Record<string, number | string>;
  to?: Record<string, number | string>;
  transition?: TransitionConfig;
}

/**
 * How far through `clip` the story is at `time`: 0 before it starts, 1
 * once it is over. A spring may pass 1 on the way (its bounce); an easing
 * follows its curve; a marker (no transition) runs straight.
 */
export function clipProgress(clip: StoryClip, time: number): number {
  const elapsed = time - clip.at;
  if (elapsed <= 0) return 0;
  const { transition } = clip;
  if (!transition) return clip.duration > 0 ? Math.min(1, elapsed / clip.duration) : 1;
  if (transition.type === "easing") {
    return clip.duration > 0
      ? cubicBezier(transition.ease, Math.min(1, elapsed / clip.duration))
      : 1;
  }
  const spring = springParams(transition, clip.duration);
  return elapsed >= settleTime(spring) ? 1 : springProgress(elapsed, spring);
}

/** `clip`'s value for `key` at `time`: its `from`, on the way to its `to`. */
export function clipValue(clip: StoryClip, key: string, time: number, fallback = 0): number {
  const from = Number(clip.from?.[key] ?? fallback);
  const to = Number(clip.to?.[key] ?? from);
  return from + (to - from) * clipProgress(clip, time);
}

interface Spring {
  stiffness: number;
  damping: number;
  mass: number;
}

/** A time spring takes its length from the clip's bar; a physics spring from its own numbers. */
function springParams(
  transition: Extract<TransitionConfig, { type: "spring" }>,
  duration: number,
): Spring {
  if (
    transition.stiffness !== undefined ||
    transition.damping !== undefined ||
    transition.mass !== undefined
  ) {
    return {
      stiffness: transition.stiffness ?? 200,
      damping: transition.damping ?? 25,
      mass: transition.mass ?? 1,
    };
  }
  const visualDuration = Math.max(0.05, duration);
  const bounce = transition.bounce ?? 0.2;
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  const stiffness = root * root;
  const damping = 2 * Math.min(1, Math.max(0.05, 1 - bounce)) * Math.sqrt(stiffness);
  return { stiffness, damping, mass: 1 };
}

function springProgress(t: number, { stiffness, damping, mass }: Spring): number {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 0.9999) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  if (zeta < 1.0001) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w0 + wd;
  const r2 = -zeta * w0 - wd;
  return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
}

/** When a spring is within half a percent of rest: it is held at 1 from here. */
function settleTime({ stiffness, damping, mass }: Spring): number {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const decay = zeta >= 1 ? zeta * w0 - w0 * Math.sqrt(Math.max(0, zeta * zeta - 1)) : zeta * w0;
  const seconds = Math.log(200) / Math.max(decay, 1e-6);
  return Math.round(Math.min(10, Math.max(0.05, seconds)) * 100) / 100;
}

/** CSS cubic-bezier easing at `x` (0–1): Newton's method, then bisection if it stalls. */
function cubicBezier([x1, y1, x2, y2]: [number, number, number, number], x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const axis = (u: number, a: number, b: number) =>
    (1 - 3 * b + 3 * a) * u * u * u + (3 * b - 6 * a) * u * u + 3 * a * u;
  const slope = (u: number, a: number, b: number) =>
    3 * (1 - 3 * b + 3 * a) * u * u + 2 * (3 * b - 6 * a) * u + 3 * a;
  let u = x;
  for (let i = 0; i < 8; i += 1) {
    const off = axis(u, x1, x2) - x;
    if (Math.abs(off) < 1e-5) return axis(u, y1, y2);
    const d = slope(u, x1, x2);
    if (Math.abs(d) < 1e-6) break;
    u -= off / d;
  }
  let lo = 0;
  let hi = 1;
  u = x;
  while (hi - lo > 1e-5) {
    if (axis(u, x1, x2) < x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return axis(u, y1, y2);
}
