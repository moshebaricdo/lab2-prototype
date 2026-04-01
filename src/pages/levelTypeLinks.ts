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
  { name: "Card-slot definition bank", path: "/levels/match-definition-bank" },
  { name: "Connector lines", path: "/levels/match-connector" },
  { name: "Connector — image cards", path: "/levels/match-connector-images" },
  { name: "Connector — code & output", path: "/levels/match-connector-code" },
];

export const levelGroupLevelLinks: LevelProgressLink[] = [
  {
    name: "Survey-style: all questions on one page",
    path: "/levels/levelgroup-scroll",
  },
  {
    name: "Survey-style: sticky footer (scroll inside card)",
    path: "/levels/levelgroup-scroll-sticky-footer",
  },
  {
    name: "Quiz-style: step through with in-level progress",
    path: "/levels/levelgroup-stepped",
  },
  {
    name: "Quiz-style: dots in footer, no top bar",
    path: "/levels/levelgroup-stepped-dots",
  },
  {
    name: "Quiz-style: intro screen, then stepped progress",
    path: "/levels/levelgroup-stepped-intro",
  },
  {
    name: "Survey-style: intro, then all questions on one page",
    path: "/levels/levelgroup-survey-intro",
  },
];

export const bubbleChoiceLevelLinks: LevelProgressLink[] = [
  { name: "With image cards", path: "/levels/bubble-choice-images" },
  { name: "Choose-your-path selector", path: "/levels/bubble-choice" },
];
