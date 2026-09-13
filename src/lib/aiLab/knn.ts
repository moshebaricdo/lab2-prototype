import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabFeatureDelta,
  AiLabKnnDistances,
  AiLabKnnNeighbor,
  AiLabKnnPrediction,
} from "../../types/aiLab";
import { columnType } from "./columnStats";
import { buildEncodings, encodeRow, type FeatureEncodings } from "./encode";

export const DEFAULT_KNN_K = 3;

/** Classification k search, matching AI Lab / ml-knn trainer order. */
export const CLASSIFICATION_K_CANDIDATES = [
  1, 3, 5, 7, 17, 31, 45, 61,
] as const;

/**
 * k values to try on the holdout. n ≤ 10 uses k = n (global majority).
 * √n is appended when it is new and in range. n/3 is deliberately not a
 * candidate: on features that carry no signal it always "wins" by
 * collapsing into a majority-class guess, and a k that is a third of the
 * sheet is unreadable as a neighborhood.
 */
export function classificationKCandidates(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 10) return [n];
  const extras = [Math.round(Math.sqrt(n))];
  const seen = new Set<number>();
  const candidates: number[] = [];
  for (const raw of [...CLASSIFICATION_K_CANDIDATES, ...extras]) {
    const k = Math.min(n, Math.max(1, raw));
    if (seen.has(k)) continue;
    seen.add(k);
    candidates.push(k);
  }
  return candidates;
}

/** Regression does not search: k = 1 below 100 rows, else 5. */
export function regressionKnnK(n: number): number {
  if (n <= 0) return 1;
  return Math.min(n, n < 100 ? 1 : 5);
}

/**
 * Unweighted plurality, ml-knn 3.0.0 style: walk neighbors nearest-first
 * and keep the class that first hits the winning count. Distance is not a
 * vote weight; ties are not alphabetical or "closest label wins".
 */
export function majorityVote(labels: string[]): string {
  const pointsPerClass = new Map<string, number>();
  let predictedClass = labels[0] ?? "";
  let maxPoints = 0;
  for (const currentClass of labels) {
    const currentPoints = (pointsPerClass.get(currentClass) ?? 0) + 1;
    pointsPerClass.set(currentClass, currentPoints);
    if (currentPoints > maxPoints) {
      predictedClass = currentClass;
      maxPoints = currentPoints;
    }
  }
  return predictedClass;
}

interface EncodedSpace {
  encodings: FeatureEncodings;
  /** Row-major `rows.length × features.length` feature matrix. */
  matrix: Float64Array;
}

/**
 * Encoded training matrix, cached per (rows identity, feature list). Scoring
 * a sheet leave-one-out calls `predictKnn` once per row; without this every
 * call re-sorted categorical values and re-encoded every row (O(N² log N)).
 */
const spaceCache = new WeakMap<AiLabDataRow[], Map<string, EncodedSpace>>();

function encodedSpace(
  rows: AiLabDataRow[],
  columns: AiLabColumn[],
  features: string[],
): EncodedSpace {
  let byFeatures = spaceCache.get(rows);
  if (!byFeatures) {
    byFeatures = new Map();
    spaceCache.set(rows, byFeatures);
  }
  const key = features.join("\u0000");
  let space = byFeatures.get(key);
  if (!space) {
    const encodings = buildEncodings(rows, columns, features);
    const width = features.length;
    const matrix = new Float64Array(rows.length * width);
    rows.forEach((row, rowIndex) => {
      const vector = encodeRow(row, features, columns, encodings);
      for (let f = 0; f < width; f += 1) {
        matrix[rowIndex * width + f] = vector[f] ?? 0;
      }
    });
    space = { encodings, matrix };
    byFeatures.set(key, space);
  }
  return space;
}

/**
 * Keep the `k` closest rows in ascending distance. Ties resolve to the lower
 * row index, matching what a stable full sort produced before.
 */
function insertNeighbor(
  neighbors: AiLabKnnNeighbor[],
  candidate: AiLabKnnNeighbor,
  k: number,
) {
  if (neighbors.length === k && candidate.distance >= neighbors[k - 1].distance) {
    return;
  }
  let position = neighbors.length;
  while (position > 0 && neighbors[position - 1].distance > candidate.distance) {
    position -= 1;
  }
  neighbors.splice(position, 0, candidate);
  if (neighbors.length > k) neighbors.pop();
}

export function predictKnn(
  rows: AiLabDataRow[],
  query: AiLabDataRow,
  features: string[],
  labelColumn: string,
  columns: AiLabColumn[],
  k = DEFAULT_KNN_K,
  excludeRowIndexes: number[] = [],
): AiLabKnnPrediction {
  const excluded = new Set(excludeRowIndexes);
  const { encodings, matrix } = encodedSpace(rows, columns, features);
  const queryVector = encodeRow(query, features, columns, encodings);
  const width = features.length;
  const limit = Math.min(k, rows.length - excluded.size);
  const neighbors: AiLabKnnNeighbor[] = [];

  if (limit > 0) {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      if (excluded.has(rowIndex)) continue;
      let sum = 0;
      const offset = rowIndex * width;
      for (let f = 0; f < width; f += 1) {
        const delta = queryVector[f] - matrix[offset + f];
        sum += delta * delta;
      }
      insertNeighbor(neighbors, { rowIndex, distance: Math.sqrt(sum) }, limit);
    }
  }

  return {
    prediction: majorityVote(
      neighbors.map((neighbor) => String(rows[neighbor.rowIndex][labelColumn])),
    ),
    neighbors,
  };
}

/**
 * Distance from `query` to every row, plus the nearest-first row order. The
 * visualization needs the whole field (not just the k winners) to place each
 * row on the distance target; one O(N·F) sweep over the cached matrix.
 */
export function knnDistances(
  rows: AiLabDataRow[],
  query: AiLabDataRow,
  features: string[],
  columns: AiLabColumn[],
  excludeRowIndexes: number[] = [],
): AiLabKnnDistances {
  const excluded = new Set(excludeRowIndexes);
  const { encodings, matrix } = encodedSpace(rows, columns, features);
  const queryVector = encodeRow(query, features, columns, encodings);
  const width = features.length;
  const distances = new Float64Array(rows.length);
  const eligible: number[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (excluded.has(rowIndex)) {
      distances[rowIndex] = Number.POSITIVE_INFINITY;
      continue;
    }
    let sum = 0;
    const offset = rowIndex * width;
    for (let f = 0; f < width; f += 1) {
      const delta = queryVector[f] - matrix[offset + f];
      sum += delta * delta;
    }
    distances[rowIndex] = Math.sqrt(sum);
    eligible.push(rowIndex);
  }
  eligible.sort((a, b) => distances[a] - distances[b] || a - b);
  return { order: eligible, distances };
}

/**
 * Feature-by-feature comparison of a query against one training row, in the
 * same encoded space the distance uses. Lets students see *why* a row is
 * near (matching categories, close numbers) and which feature dominates.
 */
export function neighborFeatureDeltas(
  rows: AiLabDataRow[],
  rowIndex: number,
  query: AiLabDataRow,
  features: string[],
  columns: AiLabColumn[],
): AiLabFeatureDelta[] {
  const { encodings } = encodedSpace(rows, columns, features);
  const row = rows[rowIndex];
  const queryVector = encodeRow(query, features, columns, encodings);
  const rowVector = encodeRow(row, features, columns, encodings);
  return features.map((feature, index) => {
    // Categorical values are ordinal-encoded, so their delta is the encoded
    // gap the algorithm really uses (a known, called-out limitation).
    const delta = Math.abs(queryVector[index] - rowVector[index]);
    return {
      feature,
      queryValue: query[feature],
      rowValue: row[feature],
      delta,
      match:
        columnType(columns, feature) === "categorical"
          ? String(query[feature]) === String(row[feature])
          : delta === 0,
    };
  });
}

/** Label tally among the k neighbors, most votes first. */
export function knnVotes(
  rows: AiLabDataRow[],
  labelColumn: string,
  neighbors: AiLabKnnNeighbor[],
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  neighbors.forEach((neighbor) => {
    const label = String(rows[neighbor.rowIndex][labelColumn]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * "108 Nissin, 24 Mama, 23 Maruchan, and 63 others" — the tally as prose,
 * cut off after `limit` labels so a wide vote stays one sentence.
 */
export function summarizeVotes(
  votes: { label: string; count: number }[],
  limit = 5,
): string {
  const shown = votes.slice(0, limit).map((vote) => `${vote.count} ${vote.label}`);
  const rest = votes.length - shown.length;
  if (rest <= 0) return shown.join(", ");
  return `${shown.join(", ")}, and ${rest} other${rest === 1 ? "" : "s"}`;
}
