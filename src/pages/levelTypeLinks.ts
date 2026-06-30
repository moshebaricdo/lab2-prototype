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

export const fileChipTabsExperimentLinks: LevelProgressLink[] = [
  {
    name: "Cursor-style edge tabs",
    path: "/levels/weblab2-file-chip-tabs",
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
  {
    name: "Backpack filtering",
    path: "/levels/progression-backpack-filter-sections",
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
  { name: "Single-select: radio options", path: "/levels/multi" },
  {
    name: "Multi-select: select all that apply",
    path: "/levels/multi-all-that-apply",
  },
  {
    name: "Code reference: trace code",
    path: "/levels/multi-code-ref",
  },
];

export const multiChoiceExperimentLinks: LevelProgressLink[] = [
  {
    name: "Multi-choice experiment: authored prompt",
    path: "/levels/multi-authoring",
  },
  {
    name: "Multi-choice experiment: image options",
    path: "/levels/multi-authoring-code",
  },
  {
    name: "Multi-choice experiment: media prompt",
    path: "/levels/multi-authoring-media",
  },
  {
    name: "Multi-choice experiment: ArrayList prompt",
    path: "/levels/multi-authoring-arraylist",
  },
  {
    name: "Multi-choice experiment: multi-file code reference",
    path: "/levels/multi-code-ref-multifile",
  },
  {
    name: "Multi-choice experiment: editable code reference",
    path: "/levels/multi-code-ref-editable",
  },
];

export const freeResponseLevelLinks: LevelProgressLink[] = [
  {
    name: "Reveal answer: exemplar and rubric",
    path: "/levels/free-response-reveal",
  },
  { name: "File upload: response attachment", path: "/levels/free-response-upload" },
  {
    name: "Code reference: written response",
    path: "/levels/free-response-code-ref",
  },
];

export const freeResponseExperimentLinks: LevelProgressLink[] = [
  { name: "Free response experiment: simple text prompt", path: "/levels/free-response" },
  {
    name: "Free response experiment: markdown prompt",
    path: "/levels/free-response-markdown",
  },
];

export const matchLevelLinks: LevelProgressLink[] = [
  { name: "Connector: text pairs", path: "/levels/match-connector" },
  { name: "Connector: code and output", path: "/levels/match-connector-code" },
];

export const matchExperimentLinks: LevelProgressLink[] = [
  { name: "Match experiment: definition bank", path: "/levels/match-definition-bank" },
  { name: "Match experiment: image cards", path: "/levels/match-connector-images" },
  { name: "Match experiment: swipe cards", path: "/levels/match-swipe-cards" },
  { name: "Match experiment: swipe code and output", path: "/levels/match-swipe-code" },
];

export const assessmentSetLevelLinks: LevelProgressLink[] = [
  {
    name: "Survey: all questions with intro",
    path: "/levels/levelgroup-survey-intro",
  },
  {
    name: "Practice quiz: stepped questions",
    path: "/levels/levelgroup-stepped",
  },
  {
    name: "Exam: multi-question checkpoint",
    path: "/levels/levelgroup-demo-quiz",
  },
];

export const assessmentBuilderLevelLinks: LevelProgressLink[] = [
  {
    name: "New assessment (blank)",
    path: "/levels/assessment-builder-new",
  },
  {
    name: "Seeded assessment (6 questions)",
    path: "/levels/assessment-builder-seeded",
  },
];

export const levelGroupLevelLinks: LevelProgressLink[] = assessmentSetLevelLinks;

export const levelGroupExperimentLinks: LevelProgressLink[] = [
  {
    name: "Legacy levelgroup: scroll survey",
    path: "/levels/levelgroup-scroll",
  },
  {
    name: "Legacy levelgroup: sticky footer survey",
    path: "/levels/levelgroup-scroll-sticky-footer",
  },
  {
    name: "Legacy levelgroup: intro then stepped quiz",
    path: "/levels/levelgroup-stepped-intro",
  },
  {
    name: "Legacy levelgroup: footer dots",
    path: "/levels/levelgroup-stepped-dots",
  },
  {
    name: "Legacy levelgroup: code reference quiz",
    path: "/levels/levelgroup-code-ref",
  },
];

export const bubbleChoiceLevelLinks: LevelProgressLink[] = [
  { name: "With image cards", path: "/levels/bubble-choice-images" },
  { name: "Choose-your-path selector", path: "/levels/bubble-choice" },
];

export const dragDropLevelLinks: LevelProgressLink[] = [
  { name: "Parsons: order code blocks", path: "/levels/drag-drop-parsons" },
  {
    name: "Categorization: sort into buckets",
    path: "/levels/drag-drop-categorization",
  },
  {
    name: "Categorization: long labels (temp)",
    path: "/levels/drag-drop-categorization-long-text",
  },
  {
    name: "Code reference: Parsons problem",
    path: "/levels/drag-drop-parsons-code-ref",
  },
];

export const fillInBlankLevelLinks: LevelProgressLink[] = [
  { name: "Single blank: short answer", path: "/levels/fill-in-blank" },
  { name: "Multi-blank: passage", path: "/levels/fill-in-blank-multi" },
  {
    name: "Code reference: fill in blanks",
    path: "/levels/fill-in-blank-code-ref",
  },
];

export const assessmentExperimentLinks: LevelProgressLink[] = [
  ...multiChoiceExperimentLinks,
  ...freeResponseExperimentLinks,
  ...matchExperimentLinks,
  ...levelGroupExperimentLinks,
];

export const teacherDashboardExperimentLinks: LevelProgressLink[] = [
  {
    name: "Teacher dashboard (class sections)",
    path: "/levels/teacher-dashboard",
  },
];

export const pythonLabLevelLinks: LevelProgressLink[] = [
  { name: "Python Lab Level", path: "/levels/pythonlab" },
  { name: "Standalone Project (Blank)", path: "/levels/pythonlab-blank" },
];

export const sketchLabLevelLinks: LevelProgressLink[] = [
  { name: "Sketch Lab Level", path: "/levels/sketchlab" },
  { name: "Standalone Project (Blank)", path: "/levels/sketchlab-blank" },
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

export const agenticProgressionLinks: LevelProgressLink[] = [
  { name: "1 · Meet the agents", path: "/levels/agentic-crew" },
  { name: "2 · Look inside an agent", path: "/levels/agentic-inspect" },
  { name: "3 · Tune your crew", path: "/levels/agentic-configure" },
  { name: "4 · Let the Tutor route", path: "/levels/agentic-orchestrate" },
  { name: "5 · Blank project + agents", path: "/levels/agentic-standalone" },
  { name: "Mission Control (concept widget)", path: "/levels/agentic-mission" },
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

export const backpackFilterProgressionLinks: LevelProgressLink[] = [
  {
    name: "Source sections",
    path: "/levels/progression-backpack-filter-sections",
  },
  {
    name: "Filter pills",
    path: "/levels/progression-backpack-filter-pills",
  },
  {
    name: "Supported toggle",
    path: "/levels/progression-backpack-filter-toggle",
  },
  {
    name: "Filter dropdown",
    path: "/levels/progression-backpack-filter-dropdown",
  },
  {
    name: "Type + availability (default)",
    path: "/levels/progression-backpack-filter-type-availability",
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
