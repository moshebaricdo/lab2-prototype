import type { LevelProgressLink } from "../components/ui/header/LevelProgressBubbles";

export const webLab2LevelLinks: LevelProgressLink[] = [
  { name: "Default workspace", path: "/levels/weblab2" },
];

export const multiChoiceLevelLinks: LevelProgressLink[] = [
  { name: "Question-only variant", path: "/levels/multi" },
  {
    name: "Fish movement prompt",
    path: "/levels/multi-authoring",
  },
  {
    name: "Animation image options",
    path: "/levels/multi-authoring-code",
  },
  {
    name: "Survey responses cleanup",
    path: "/levels/multi-authoring-media",
  },
  {
    name: "ArrayList code segment",
    path: "/levels/multi-authoring-arraylist",
  },
  {
    name: "Select all that apply (reflection)",
    path: "/levels/multi-all-that-apply",
  },
];

export const freeResponseLevelLinks: LevelProgressLink[] = [
  { name: "Simple text prompt", path: "/levels/free-response" },
  { name: "With reveal answer", path: "/levels/free-response-reveal" },
  {
    name: "Markdown description only",
    path: "/levels/free-response-markdown",
  },
  { name: "File upload option", path: "/levels/free-response-upload" },
];

export const matchLevelLinks: LevelProgressLink[] = [
  { name: "Vocabulary match challenge", path: "/levels/match" },
  { name: "Card-slot definition bank", path: "/levels/match-definition-bank" },
];

export const levelGroupLevelLinks: LevelProgressLink[] = [
  { name: "Mixed assessment checkpoint", path: "/levels/levelgroup" },
];

export const bubbleChoiceLevelLinks: LevelProgressLink[] = [
  { name: "Choose-your-path selector", path: "/levels/bubble-choice" },
];
