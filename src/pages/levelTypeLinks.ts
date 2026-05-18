import type { LevelProgressLink } from "../components/ui/header/LevelProgressBubbles";

export const webLab2LevelLinks: LevelProgressLink[] = [
  {
    name: "Demo Project (Stellar Atlas)",
    path: "/levels/weblab2-demo-project",
  },
  {
    name: "Demo Project (No Starter Code)",
    path: "/levels/weblab2-demo-project-blank",
  },
  {
    name: "Tutor action card (F2)",
    path: "/levels/weblab2-tutor-action-card",
  },
  {
    name: "Validation test",
    path: "/levels/weblab2-validation-test",
  },
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
  {
    name: "Code reference panel (AP CS trace)",
    path: "/levels/multi-code-ref",
  },
  {
    name: "Code ref — multi-file (HTML/CSS/JS)",
    path: "/levels/multi-code-ref-multifile",
  },
  {
    name: "Code ref — editable (predict output)",
    path: "/levels/multi-code-ref-editable",
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
  {
    name: "Code reference panel (AP CS trace)",
    path: "/levels/free-response-code-ref",
  },
];

export const matchLevelLinks: LevelProgressLink[] = [
  { name: "Card-slot definition bank", path: "/levels/match-definition-bank" },
  { name: "Connector lines", path: "/levels/match-connector" },
  { name: "Connector — image cards", path: "/levels/match-connector-images" },
  { name: "Connector — code & output", path: "/levels/match-connector-code" },
  { name: "Swipe cards (small-screen demo)", path: "/levels/match-swipe-cards" },
  { name: "Swipe cards — code ↔ output", path: "/levels/match-swipe-code" },
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
  {
    name: "Code reference panel (AP CS quiz)",
    path: "/levels/levelgroup-code-ref",
  },
];

export const bubbleChoiceLevelLinks: LevelProgressLink[] = [
  { name: "With image cards", path: "/levels/bubble-choice-images" },
  { name: "Choose-your-path selector", path: "/levels/bubble-choice" },
];

export const pythonLabLevelLinks: LevelProgressLink[] = [
  { name: "Default workspace", path: "/levels/pythonlab" },
  { name: "Blank standalone project", path: "/levels/pythonlab-blank" },
];

export const aiChatLabLevelLinks: LevelProgressLink[] = [
  { name: "Prompting practice", path: "/levels/aichatlab" },
  { name: "Setup controls", path: "/levels/aichatlab-setup" },
  { name: "Full model card", path: "/levels/aichatlab-model-card" },
];

export const sampleProgressionLinks: LevelProgressLink[] = [
  { name: "Build Your Portfolio", path: "/levels/progression-weblab" },
  { name: "Design Reflection", path: "/levels/progression-free-response" },
  { name: "Choose Your Path", path: "/levels/progression-bubble-choice" },
  { name: "Practice Project", path: "/levels/progression-branch-color" },
  { name: "HTML & CSS Checkpoint", path: "/levels/progression-levelgroup" },
];

export const webLab2ValidationProgressionLinks: LevelProgressLink[] = [
  {
    name: "Fix the photo carousel",
    path: "/levels/progression-weblab2-validation-fix",
  },
  {
    name: "Polish Loop styles",
    path: "/levels/progression-weblab2-validation-create",
  },
  {
    name: "Trace a Promise",
    path: "/levels/progression-weblab2-validation-refine",
  },
  {
    name: "Fix the Starship loader",
    path: "/levels/progression-weblab2-validation-sandbox",
  },
];

/**
 * All valid branch paths — the bubble choice level can land on any of these,
 * and the header treats whichever one the student is on as "level 4".
 */
export const PROGRESSION_BRANCH_PATHS = [
  "/levels/progression-branch-color",
  "/levels/progression-branch-layout",
  "/levels/progression-branch-media",
];
