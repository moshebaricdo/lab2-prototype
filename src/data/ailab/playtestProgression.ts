import type { LevelProgressLink } from "../../components/ui/header/LevelProgressBubbles";
import type { AiLabLevelConfig } from "../../types/aiLab";
import {
  aiLabPlaytestBuildConfig,
  aiLabPlaytestBuildInstructions,
  aiLabPlaytestLookConfig,
  aiLabPlaytestLookInstructions,
  aiLabPlaytestTryConfig,
  aiLabPlaytestTryInstructions,
} from "./index";

/** Single allowlist-friendly entry for the Bird / mammal / fish playtest. */
export const AI_LAB_PLAYTEST_PATH = "/levels/progression-ailab";

export interface AiLabPlaytestStep {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  config: AiLabLevelConfig;
  instructionsMarkdown: string;
  continueLabel?: string;
}

export const aiLabPlaytestSteps: AiLabPlaytestStep[] = [
  {
    id: "look",
    name: "Look at the animals",
    title: "Look at the animals",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestLookConfig,
    instructionsMarkdown: aiLabPlaytestLookInstructions,
  },
  {
    id: "try",
    name: "Try a model that already exists",
    title: "Try a model that already exists",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestTryConfig,
    instructionsMarkdown: aiLabPlaytestTryInstructions,
  },
  {
    id: "build",
    name: "Build your own, then bounce",
    title: "Build your own, then bounce",
    subtitle: "Bird, mammal, or fish",
    config: aiLabPlaytestBuildConfig,
    instructionsMarkdown: aiLabPlaytestBuildInstructions,
    continueLabel: "Finish",
  },
];

export const aiLabPlaytestLevelLinks: LevelProgressLink[] = aiLabPlaytestSteps.map(
  (step) => ({
    name: step.name,
    path: AI_LAB_PLAYTEST_PATH,
  }),
);

export function parseAiLabPlaytestStep(
  raw: string | null | undefined,
): number {
  if (!raw) return 0;
  const index = aiLabPlaytestSteps.findIndex((step) => step.id === raw);
  return index >= 0 ? index : 0;
}
