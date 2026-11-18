import { GOLDEN } from "./bloomSim";

/** What choosing the walked rows needs to know about a test row. */
export interface WalkCandidate {
  /** How the model scored it, when it was scored. */
  result?: { correct: boolean };
  /** The tree nodes it passes, root to leaf. */
  path: string[];
}

/**
 * The test rows, the `walked` ones first: a right guess leads (a clean
 * first walk), a miss is among them when there is one, and their endings
 * vary where they can. Among rows that would do equally well, the one
 * picked sits in the cluster in the direction furthest from those already
 * picked (and out from the middle), so each close-up comes in from a
 * different side. `tests` are in the cluster's own order: row `i` sits at
 * the sunflower's spot `i`.
 */
export function orderRuns<Run extends WalkCandidate>(tests: Run[], walked: number): Run[] {
  const place = new Map(
    tests.map((run, index) => [
      run,
      { angle: index * GOLDEN, out: Math.sqrt((index + 0.5) / tests.length) },
    ]),
  );
  const picked: Run[] = [];
  /** How far round the cluster `run` is from every row picked so far (0–π), nudged outward. */
  const apart = (run: Run): number => {
    const { angle, out } = place.get(run)!;
    const nearest = picked.reduce((least, other) => {
      const turn = Math.abs(angle - place.get(other)!.angle) % (2 * Math.PI);
      return Math.min(least, turn > Math.PI ? 2 * Math.PI - turn : turn);
    }, Math.PI);
    return nearest + 0.6 * out;
  };
  /** Of `candidates` not picked yet, the one furthest round from the rest. */
  const take = (candidates: Run[]): Run | undefined => {
    if (picked.length >= walked) return undefined;
    let best: Run | undefined;
    let bestScore = -Infinity;
    candidates.forEach((run) => {
      if (picked.includes(run)) return;
      const score = apart(run);
      if (score > bestScore) {
        best = run;
        bestScore = score;
      }
    });
    if (best) picked.push(best);
    return best;
  };
  const endOf = (run: Run) => run.path[run.path.length - 1];
  take(tests.filter((run) => run.result?.correct));
  /* Then one row for each ending not seen yet, leaving a turn for a miss. */
  while (picked.length < walked - 1) {
    const seen = new Set(picked.map(endOf));
    if (!take(tests.filter((run) => !seen.has(endOf(run))))) break;
  }
  take(tests.filter((run) => run.result && !run.result.correct));
  while (take(tests)) {
    /* Fill the turns that are left. */
  }
  return [...picked, ...tests.filter((run) => !picked.includes(run))];
}
