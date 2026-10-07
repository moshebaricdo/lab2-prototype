import { trainModel, uniqueValues } from "../../lib/aiLab";
import type { AiLabColumn, AiLabDataRow, AiLabDataset } from "../../types/aiLab";
import type { TrainingWalkData } from "../../components/ide/ailab/views/trainingWalk";
import { csvDatasets } from "./datasets";
import { AI_LAB_PLAYTEST_LABEL_COLUMN, AI_LAB_PLAYTEST_TREE_FEATURES } from "./index";

/**
 * Frozen inputs for the training-animation sandbox
 * (`/experiments/ailab-training`). Each one is trained with the lab's real
 * `trainModel`, so a variant sees the same tree, rows, and scored results
 * the modal would.
 */
export interface TrainingFixture {
  id: string;
  name: string;
  /** What this fixture stresses, one line. */
  note: string;
  data: TrainingWalkData;
}

interface FixtureSpec {
  id: string;
  name: string;
  note: string;
  dataset: () => AiLabDataset;
  labelColumn: string;
  features: (dataset: AiLabDataset) => string[];
  titleColumn?: string;
  rowNoun: string;
}

const IRIS_FEATURES = ["sepallengthcm", "sepalwidthcm", "petallengthcm", "petalwidthcm"];

const SPECS: FixtureSpec[] = [
  {
    id: "animals",
    name: "Animals (P0)",
    note: "52 rows, 2 yes/no features, 3 labels — the P0 level",
    dataset: () => csv("bird_mammal_or_fish"),
    labelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
    features: () => [...AI_LAB_PLAYTEST_TREE_FEATURES],
    titleColumn: "animal",
    rowNoun: "animal",
  },
  {
    id: "animals-3",
    name: "Animals, 3 traits",
    note: "52 rows, adds Lives in water — one level deeper",
    dataset: () => csv("bird_mammal_or_fish"),
    labelColumn: AI_LAB_PLAYTEST_LABEL_COLUMN,
    features: () => ["has_feathers", "breathes_with_lungs", "lives_in_water"],
    titleColumn: "animal",
    rowNoun: "animal",
  },
  {
    id: "iris",
    name: "Iris",
    note: "150 rows, 4 number features, 3 labels",
    dataset: () => csv("iris_species"),
    labelColumn: "species",
    features: () => IRIS_FEATURES,
    rowNoun: "flower",
  },
  {
    id: "drug",
    name: "Drug",
    note: "200 rows, 5 mixed features, 5 labels",
    dataset: () => csv("drug200"),
    labelColumn: "drug",
    features: () => ["age", "sex", "bp", "cholesterol", "na_to_k"],
    rowNoun: "patient",
  },
  {
    id: "stress-rows",
    name: "Stress: 6,000 rows",
    note: "Iris ×40 with jitter and ~3% label noise — dot condensing at scale",
    dataset: () => stressRows(csv("iris_species"), 40),
    labelColumn: "species",
    features: () => IRIS_FEATURES,
    rowNoun: "flower",
  },
  {
    id: "stress-features",
    name: "Stress: 12 features",
    note: "Iris + 8 noise columns — long rows, mostly unused features",
    dataset: () => stressFeatures(csv("iris_species"), 8),
    labelColumn: "species",
    features: (dataset) =>
      dataset.columns
        .map((column) => column.id)
        .filter((id) => id !== "id" && id !== "species"),
    rowNoun: "flower",
  },
];

export const TRAINING_FIXTURES: { id: string; name: string; note: string }[] = SPECS.map(
  ({ id, name, note }) => ({ id, name, note }),
);

const built = new Map<string, TrainingFixture>();

/** Trains on first use and caches — the stress sets take a moment. */
export function trainingFixture(id: string): TrainingFixture {
  const cached = built.get(id);
  if (cached) return cached;
  const spec = SPECS.find((entry) => entry.id === id) ?? SPECS[0]!;
  const dataset = spec.dataset();
  const features = spec.features(dataset);
  const model = trainModel({
    algorithm: "decisionTree",
    rows: dataset.rows,
    columns: dataset.columns,
    labelColumn: spec.labelColumn,
    selectedFeatures: features,
  });
  const fixture: TrainingFixture = {
    id: spec.id,
    name: spec.name,
    note: spec.note,
    data: {
      tree: model.tree!,
      columns: dataset.columns,
      labelColumn: spec.labelColumn,
      features,
      labels: uniqueValues(dataset.rows, spec.labelColumn),
      rowNoun: spec.rowNoun,
      rows: dataset.rows,
      results: model.holdoutResults,
      titleColumn: spec.titleColumn,
    },
  };
  built.set(spec.id, fixture);
  return fixture;
}

function csv(id: string): AiLabDataset {
  const dataset = csvDatasets.find((entry) => entry.id === id);
  if (!dataset) throw new Error(`Missing AI Lab dataset: ${id}`);
  return dataset;
}

/** Deterministic 0–1 noise so fixtures are identical on every load. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function stressRows(base: AiLabDataset, copies: number): AiLabDataset {
  const random = seeded(7);
  const labels = uniqueValues(base.rows, "species");
  const numeric = base.columns.filter((column) => column.type === "numerical" && column.id !== "id");
  const rows: AiLabDataRow[] = [];
  for (let copy = 0; copy < copies; copy += 1) {
    base.rows.forEach((row) => {
      const next: AiLabDataRow = { ...row, id: rows.length + 1 };
      numeric.forEach((column) => {
        const value = Number(row[column.id]);
        next[column.id] = Math.round((value + (random() - 0.5) * 0.4) * 10) / 10;
      });
      if (random() < 0.03) next.species = labels[Math.floor(random() * labels.length)]!;
      rows.push(next);
    });
  }
  return { ...base, id: `${base.id}-stress-rows`, rows };
}

function stressFeatures(base: AiLabDataset, extra: number): AiLabDataset {
  const random = seeded(11);
  const added: AiLabColumn[] = Array.from({ length: extra }, (_, index) => ({
    id: `noise_${index + 1}`,
    name: `Noise ${String.fromCharCode(65 + index)}`,
    type: "numerical",
    description: "Random numbers with no link to the label.",
  }));
  const labelIndex = base.columns.findIndex((column) => column.id === "species");
  const columns = [
    ...base.columns.slice(0, labelIndex),
    ...added,
    ...base.columns.slice(labelIndex),
  ];
  const rows = base.rows.map((row) => {
    const next: AiLabDataRow = { ...row };
    added.forEach((column) => {
      next[column.id] = Math.round(random() * 100);
    });
    return next;
  });
  return { ...base, id: `${base.id}-stress-features`, columns, rows };
}
