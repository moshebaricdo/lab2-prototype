import type { LevelProgressLink } from "../components/ui/header/LevelProgressBubbles";

export const webLab2LevelLinks: LevelProgressLink[] = [
  {
    name: "Web Lab 2 Level",
    path: "/levels/weblab2-level",
  },
  {
    name: "Standalone Project (Demo)",
    path: "/levels/weblab2-demo-project",
  },
  {
    name: "Standalone Project (Blank)",
    path: "/levels/weblab2-demo-project-blank",
  },
];

export const webLab2ExperimentLinks: LevelProgressLink[] = [
  {
    name: "Tutor action card (F2)",
    path: "/levels/weblab2-tutor-action-card",
  },
  {
    name: "Validation test",
    path: "/levels/weblab2-validation-test",
  },
];

export const drawerImprovementsExperimentLinks: LevelProgressLink[] = [
  {
    name: "Close + Pulse",
    path: "/levels/weblab2-drawer-improvements",
  },
  {
    name: "Instructions tab",
    path: "/levels/weblab2-drawer-instructions-tab",
  },
  {
    name: "Notification halo",
    path: "/levels/weblab2-drawer-notification-halo",
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
  { name: "Python Lab Level", path: "/levels/pythonlab" },
  { name: "Standalone Project (Blank)", path: "/levels/pythonlab-blank" },
];

export const aiChatLabLevelLinks: LevelProgressLink[] = [
  { name: "Chat Only Level", path: "/levels/aichatlab" },
  { name: "Setup Only Level", path: "/levels/aichatlab-setup" },
  { name: "Full Model Config Level", path: "/levels/aichatlab-model-card" },
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
  {
    name: "Feature Roulette (AIF)",
    path: "/levels/progression-weblab2-validation-feature-roulette",
  },
];

export const uploadMechanismsProgressionLinks: LevelProgressLink[] = [
  {
    name: "Staged uploads",
    path: "/levels/progression-upload-mechanisms-staged",
  },
  {
    name: "Add-files message",
    path: "/levels/progression-upload-mechanisms-action-card",
  },
  {
    name: "Plus-button chips",
    path: "/levels/progression-upload-mechanisms-file-chip",
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
