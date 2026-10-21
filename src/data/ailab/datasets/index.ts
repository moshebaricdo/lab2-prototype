import type {
  AiLabDataset,
  AiLabDatasetCard,
  AiLabDatasetStory,
} from "../../../types/aiLab";
import {
  datasetIdFromPath,
  parseCsvDataset,
} from "../../../lib/aiLab/csvDataset";

/**
 * Every `*.csv` dropped in this folder becomes an AI Lab dataset at build
 * time (Vite `import.meta.glob`, eager + raw). No registration needed —
 * add or remove a file and the studio catalog follows.
 *
 * Optional per-file overrides (display name, description, label column)
 * live in `overrides` below, keyed by the file's slug (`My Data.csv` →
 * `my_data`). Everything else is inferred; see `parseCsvDataset`.
 */
const overrides: Record<
  string,
  {
    name?: string;
    description?: string;
    labelColumn?: string;
    columnDescriptions?: Record<string, string>;
    story?: AiLabDatasetStory;
    card?: AiLabDatasetCard;
  }
> = {
  bird_mammal_fish: {
    card: {
      description:
        "A short list of animals described by three yes-or-no traits: whether each one has feathers, breathes with lungs, or lives in water. Each animal is labeled bird, mammal, or fish.",
      source: "Code.org",
      potentialUses: "Predict whether an animal is a bird, a mammal, or a fish from its traits.",
      potentialMisuses:
        "Three traits are not enough to classify every animal. Whales, penguins, and bats break the easy rules — what other traits would a scientist check?",
    },
  },
  online_food_delivery_dataset: {
    name: "Online food delivery",
    description:
      "Survey of food-delivery customers in Bengaluru. Predict whether a customer would order online again.",
    labelColumn: "Output",
  },
  drug200: {
    card: {
      description:
        "Patients described by age, sex, blood pressure, cholesterol, and the sodium-to-potassium ratio in their blood, along with which of five drugs they were given.",
      source: "Kaggle (kaggle.com/datasets/prathamtripathi/drug-classification)",
      lastUpdated: "2020",
      potentialUses: "Predict which drug a patient was given based on their measurements.",
      potentialMisuses:
        "This is a small teaching set, not medical advice. A real prescription depends on far more than five measurements — what else would a doctor need to know?",
    },
  },
  dinosaurs: {
    card: {
      description:
        "Fossil finds of dinosaurs, with each one's diet, body type, length, the age of the rock it was found in, and where it was found.",
      source: "The Paleobiology Database (paleobiodb.org)",
      potentialUses:
        "Predict a dinosaur's diet or family from its size, age, and where its fossil was found.",
      potentialMisuses:
        "Fossils survive in some places and rock layers far more than others, so the data shows where dinosaurs were found, not everywhere they lived.",
    },
  },
  destiny_v2: {
    card: {
      description:
        "Loadouts from players of the video game Destiny 2: each row is one character's class, subclass, stats, armor, and weapons.",
      source: "Bungie Destiny 2 API",
      potentialUses: "Predict a character's subclass from the gear and stats they chose.",
      potentialMisuses:
        "Players who share their loadouts are not every player. Many columns are game IDs, so check which ones actually describe a choice.",
    },
  },
  bird_mammal_or_fish: {
    name: "Bird, mammal, or fish",
    description:
      "52 animals. Predict Type from yes/no traits. Animal has more than 50 values, so it cannot be a feature.",
    labelColumn: "Type",
    columnDescriptions: {
      animal: "Name of each animal.",
      has_feathers: "Whether it has feathers.",
      breathes_with_lungs: "Whether it uses lungs.",
      lives_in_water: "Whether it lives in water.",
      type: "Bird, mammal, or fish.",
    },
    story: {
      rowNoun: "animal",
      whatIsARow:
        "Each row is one animal. The columns are things we know about it: whether it has feathers, breathes with lungs, or lives in water.",
      source:
        "A class made this sheet by looking up 52 animals in a field guide and writing down yes or no for each trait.",
      question: "Given an animal's traits, is it a bird, a mammal, or a fish?",
      whyItMatters:
        "Scientists sort living things into groups by their traits. A model that learns the pattern can sort an animal it has never seen.",
    },
    card: {
      description:
        "52 animals described by three yes-or-no traits: whether each one has feathers, breathes with lungs, or lives in water. Each animal is labeled bird, mammal, or fish.",
      source: "Code.org, from a field guide",
      potentialUses: "Predict whether an animal is a bird, a mammal, or a fish from its traits.",
      potentialMisuses:
        "Three traits are not enough to classify every animal. Whales, penguins, and bats break the easy rules — what other traits would a scientist check?",
    },
  },
  catsanddogs_v2: {
    story: {
      rowNoun: "pet",
      whatIsARow:
        "Each row is one pet and a few measurements about it.",
      source: "Collected from pet owners who described their animals.",
      question: "From the measurements alone, is this pet a cat or a dog?",
    },
    card: {
      description:
        "Pets described by their height, weight, length, fur length, paw size, and ear shape. Each pet is labeled cat or dog.",
      source: "Code.org",
      potentialUses: "Predict whether a pet is a cat or a dog from its measurements.",
      potentialMisuses:
        "A small dog and a large cat can measure about the same. Breeds vary a lot, so a few numbers will not always tell them apart.",
    },
  },
  iris_species: {
    story: {
      rowNoun: "flower",
      whatIsARow:
        "Each row is one iris flower with the length and width of its petals and sepals in centimeters.",
      source:
        "Measured by botanist Edgar Anderson in 1936 — one of the oldest datasets used to teach machine learning.",
      question: "From four measurements, which of three iris species is this flower?",
    },
    card: {
      description:
        "150 iris flowers, 50 from each of three species, with the length and width of their petals and sepals in centimeters.",
      source: "UCI (archive.ics.uci.edu/dataset/53/iris)",
      lastUpdated: "1936",
      potentialUses: "Predict an iris flower's species from its petal and sepal measurements.",
      potentialMisuses:
        "Every flower came from three species in one region. The model cannot recognize any other kind of iris, and the Id column only counts rows.",
    },
  },
};

/**
 * Optional cover art. A PNG named with the dataset slug
 * (`covers/bird_mammal_fish.png`) becomes that dataset's chooser cover.
 */
const coverFiles = import.meta.glob("./covers/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const covers = new Map(
  Object.entries(coverFiles).map(([path, url]) => [
    datasetIdFromPath(path.replace(/\.png$/i, ".csv")),
    url,
  ]),
);

const files = import.meta.glob("./*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const csvDatasets: AiLabDataset[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, csv]) => {
    const id = datasetIdFromPath(path);
    const override = overrides[id];
    const { columnDescriptions, story, card, ...parseOptions } = override ?? {};
    const parsed = parseCsvDataset(csv, { id, ...parseOptions });
    const cover = covers.get(id);
    const dataset: AiLabDataset = {
      ...parsed,
      ...(story ? { story } : {}),
      ...(card ? { card } : {}),
      ...(cover ? { cover } : {}),
    };
    if (!columnDescriptions) return dataset;
    return {
      ...dataset,
      columns: dataset.columns.map((column) => ({
        ...column,
        description: columnDescriptions[column.id] ?? column.description,
      })),
    };
  })
  .filter((dataset) => dataset.columns.length >= 2 && dataset.rows.length > 0);
