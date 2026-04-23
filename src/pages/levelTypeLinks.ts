import type { LevelProgressLink } from "../components/ui/header/LevelProgressBubbles";

export const webLab2LevelLinks: LevelProgressLink[] = [
  { name: "Default workspace", path: "/levels/weblab2" },
  {
    name: "Clarified chat send affordance",
    path: "/levels/weblab2-send-affordance",
  },
  {
    name: "File drag-drop into tutor",
    path: "/levels/weblab2-file-drop",
  },
  { name: "Rubric panel", path: "/levels/weblab2-rubric" },
  { name: "50% drawer + fade cue", path: "/levels/weblab2-drawer-fade" },
  {
    name: "50% drawer + inline read more",
    path: "/levels/weblab2-drawer-inline-link",
  },
  {
    name: "File chip + add to project",
    path: "/levels/weblab2-file-chip-action",
  },
  {
    name: "Tutor action card (F2)",
    path: "/levels/weblab2-tutor-action-card",
  },
  {
    name: "Demo project (Coastal Brew)",
    path: "/levels/weblab2-demo-project",
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
];

export const sampleProgressionLinks: LevelProgressLink[] = [
  { name: "Build Your Portfolio", path: "/levels/progression-weblab" },
  { name: "Design Reflection", path: "/levels/progression-free-response" },
  { name: "Choose Your Path", path: "/levels/progression-bubble-choice" },
  { name: "Practice Project", path: "/levels/progression-branch-color" },
  { name: "HTML & CSS Checkpoint", path: "/levels/progression-levelgroup" },
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
