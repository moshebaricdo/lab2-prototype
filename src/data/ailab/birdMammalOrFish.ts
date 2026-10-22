import type { AiLabDataset } from "../../types/aiLab";
import { parseCsvDataset } from "../../lib/aiLab/csvDataset";

const birdMammalOrFishCsv = `Animal,Has feathers,Breathes with lungs,Lives in water,Type
Hawk,yes,yes,no,Bird
Eagle,yes,yes,no,Bird
Owl,yes,yes,no,Bird
Sparrow,yes,yes,no,Bird
Robin,yes,yes,no,Bird
Penguin,yes,yes,yes,Bird
Duck,yes,yes,yes,Bird
Swan,yes,yes,yes,Bird
Crow,yes,yes,no,Bird
Pigeon,yes,yes,no,Bird
Parrot,yes,yes,no,Bird
Flamingo,yes,yes,no,Bird
Ostrich,yes,yes,no,Bird
Hummingbird,yes,yes,no,Bird
Pelican,yes,yes,yes,Bird
Goose,yes,yes,yes,Bird
Loon,yes,yes,yes,Bird
Puffin,yes,yes,yes,Bird
Dog,no,yes,no,Mammal
Cat,no,yes,no,Mammal
Bat,no,yes,no,Mammal
Horse,no,yes,no,Mammal
Bear,no,yes,no,Mammal
Cow,no,yes,no,Mammal
Dolphin,no,yes,yes,Mammal
Whale,no,yes,yes,Mammal
Lion,no,yes,no,Mammal
Tiger,no,yes,no,Mammal
Rabbit,no,yes,no,Mammal
Mouse,no,yes,no,Mammal
Deer,no,yes,no,Mammal
Sheep,no,yes,no,Mammal
Pig,no,yes,no,Mammal
Seal,no,yes,yes,Mammal
Otter,no,yes,yes,Mammal
Salmon,no,no,yes,Fish
Shark,no,no,yes,Fish
Tuna,no,no,yes,Fish
Goldfish,no,no,yes,Fish
Cod,no,no,yes,Fish
Trout,no,no,yes,Fish
Eel,no,no,yes,Fish
Clownfish,no,no,yes,Fish
Bass,no,no,yes,Fish
Carp,no,no,yes,Fish
Perch,no,no,yes,Fish
Catfish,no,no,yes,Fish
Halibut,no,no,yes,Fish
Marlin,no,no,yes,Fish
Anchovy,no,no,yes,Fish
Sardine,no,no,yes,Fish
Herring,no,no,yes,Fish
`;

/**
 * Curriculum playtest fixture (52 animals, Bird / Mammal / Fish) used by
 * `/levels/ailab-p0` and `/levels/progression-ailab*`. Kept outside
 * `src/data/ailab/datasets/` so the studio chooser only lists the 18
 * production AI Lab datasets.
 */
export const birdMammalOrFishDataset: AiLabDataset = parseCsvDataset(
  birdMammalOrFishCsv,
  {
    id: "bird_mammal_or_fish",
    name: "Bird, mammal, or fish",
    description:
      "52 animals. Predict Type from yes/no traits. Animal has more than 50 values, so it cannot be a feature.",
    labelColumn: "Type",
    recommendedAlgorithm: "decisionTree",
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
      potentialUses:
        "Predict whether an animal is a bird, a mammal, or a fish from its traits.",
      potentialMisuses:
        "Three traits are not enough to classify every animal. Whales, penguins, and bats break the easy rules — what other traits would a scientist check?",
    },
  },
);
