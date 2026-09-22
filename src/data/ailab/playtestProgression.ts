import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import type { AiLabLevelConfig } from "../../types/aiLab";
import {
  aiLabPlaytestBuildConfig,
  aiLabPlaytestBuildInstructions,
  aiLabPlaytestLookConfig,
  aiLabPlaytestLookInstructions,
  aiLabPlaytestTryConfig,
  aiLabPlaytestTryInstructions,
  aiLabPlaytestV2BuildConfig,
  aiLabPlaytestV2BuildInstructions,
  aiLabPlaytestV2LookConfig,
  aiLabPlaytestV2LookInstructions,
  aiLabPlaytestV2TryConfig,
  aiLabPlaytestV2TryInstructions,
} from "./index";

/** Single allowlist-friendly entry for the Bird / mammal / fish playtest. */
export const AI_LAB_PLAYTEST_PATH = "/levels/progression-ailab";
/** Same shape with the post-playtest work turned on (`docs/ailab-playtest-v2.md`). */
export const AI_LAB_PLAYTEST_V2_PATH = "/levels/progression-ailab-v2";

export interface AiLabPlaytestStep {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  config: AiLabLevelConfig;
  instructionsMarkdown: string;
  continueLabel?: string;
}

/** A multi-stage AI Lab progression on one route. */
export interface AiLabProgression {
  path: string;
  /** Index card title. */
  name: string;
  steps: AiLabPlaytestStep[];
  levelLinks: LevelProgressLink[];
  /** Index bubbles: optional `?step=` jump read once, then stripped on load. */
  indexLinks: LevelProgressLink[];
}

function progression(
  path: string,
  name: string,
  steps: AiLabPlaytestStep[],
): AiLabProgression {
  return {
    path,
    name,
    steps,
    levelLinks: steps.map((step) => ({ name: step.name, path })),
    indexLinks: steps.map((step) => ({
      name: step.name,
      path: `${path}?step=${step.id}`,
    })),
  };
}

export const aiLabPlaytestSteps: AiLabPlaytestStep[] = [
  {
    id: "look",
    name: "Explore the Dataset",
    title: "Explore the Dataset",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestLookConfig,
    instructionsMarkdown: aiLabPlaytestLookInstructions,
  },
  {
    id: "try",
    name: "Try a Prediction Model",
    title: "Try a Prediction Model",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestTryConfig,
    instructionsMarkdown: aiLabPlaytestTryInstructions,
  },
  {
    id: "build",
    name: "Train and Test a Model",
    title: "Train and Test a Model",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestBuildConfig,
    instructionsMarkdown: aiLabPlaytestBuildInstructions,
    continueLabel: "Finish",
  },
];

export const aiLabPlaytestV2Steps: AiLabPlaytestStep[] = [
  {
    id: "look",
    name: "Meet the Data",
    title: "Meet the Data",
    subtitle: "Bird, mammal, or fish · v2",
    config: aiLabPlaytestV2LookConfig,
    instructionsMarkdown: aiLabPlaytestV2LookInstructions,
  },
  {
    id: "try",
    name: "Try a Prediction Model",
    title: "Try a Prediction Model",
    subtitle: "Bird, mammal, or fish · v2",
    config: aiLabPlaytestV2TryConfig,
    instructionsMarkdown: aiLabPlaytestV2TryInstructions,
  },
  {
    id: "build",
    name: "Train and Test a Model",
    title: "Train and Test a Model",
    subtitle: "Bird, mammal, or fish · v2",
    config: aiLabPlaytestV2BuildConfig,
    instructionsMarkdown: aiLabPlaytestV2BuildInstructions,
    continueLabel: "Finish",
  },
];

export const aiLabPlaytestProgression = progression(
  AI_LAB_PLAYTEST_PATH,
  "Bird, mammal, or fish (3-step)",
  aiLabPlaytestSteps,
);

export const aiLabPlaytestV2Progression = progression(
  AI_LAB_PLAYTEST_V2_PATH,
  "Bird, mammal, or fish (3-step, v2)",
  aiLabPlaytestV2Steps,
);

export const aiLabPlaytestLevelLinks = aiLabPlaytestProgression.levelLinks;

export function parseAiLabPlaytestStep(
  raw: string | null | undefined,
  steps: AiLabPlaytestStep[] = aiLabPlaytestSteps,
): number {
  if (!raw) return 0;
  const index = steps.findIndex((step) => step.id === raw);
  return index >= 0 ? index : 0;
}
