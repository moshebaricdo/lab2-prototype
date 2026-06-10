import type { MissionConfig } from "../../types/agentLab";
import { missionSpecialists } from "./specialists";

/** Pseudo-path for the level instructions briefcase item. */
export const INSTRUCTIONS_ITEM_PATH = "level-instructions";

export const galleryMission: MissionConfig = {
  id: "ship-the-gallery",
  title: "Mission: Ship the Gallery Update",
  briefMarkdown: `Maya's portfolio launches **Friday**. Three jobs are left, and you're running the crew.

For each task: pick the right specialist, then **pack their briefcase** — choose exactly what goes into their context window. Too little and they'll guess. Too much and they'll get slow and distracted. Then launch the run and review what comes back. Nothing ships until you approve it.`,
  specialists: missionSpecialists,
  briefcaseItems: [
    {
      path: INSTRUCTIONS_ITEM_PATH,
      label: "Level instructions",
      kind: "instructions",
      contextTokens: 350,
    },
    { path: "index.html", label: "index.html", kind: "file", contextTokens: 800 },
    { path: "styles.css", label: "styles.css", kind: "file", contextTokens: 550 },
    { path: "script.js", label: "script.js", kind: "file", contextTokens: 450 },
    {
      path: "Specs/SPEC.md",
      label: "Specs/SPEC.md",
      kind: "artifact",
      contextTokens: 300,
    },
  ],
  tasks: [
    {
      id: "build-gallery",
      title: "Build the gallery layout",
      brief: "Implement the five requirements in Specs/SPEC.md as CSS changes.",
      suggestedSpecialistId: "designer",
      requiredPaths: ["Specs/SPEC.md", "styles.css", "index.html"],
      contextBudget: { min: 1200, max: 2200 },
    },
    {
      id: "a11y-pass",
      title: "Run the accessibility pass",
      brief: "Audit the page structure: headings, landmarks, link text, alt text.",
      suggestedSpecialistId: "a11y",
      requiredPaths: ["index.html"],
      contextBudget: { min: 700, max: 1500 },
    },
    {
      id: "launch-checklist",
      title: "Write the launch checklist",
      brief: "Turn the spec and level goals into a pre-launch checklist artifact.",
      suggestedSpecialistId: "spec-writer",
      requiredPaths: [INSTRUCTIONS_ITEM_PATH, "Specs/SPEC.md"],
      contextBudget: { min: 500, max: 1200 },
    },
  ],
};

export interface MissionTaskOutcomeScript {
  headline: string;
  /** `{missing}` is replaced with the missing briefcase items. */
  summary: string;
  bullets: string[];
}

export interface MissionTaskScript {
  taskId: string;
  /** Scripted base duration for the "working" phase. */
  workMs: number;
  /** Extra time added when the briefcase is overloaded. */
  overloadedExtraMs: number;
  success: MissionTaskOutcomeScript;
  starved: MissionTaskOutcomeScript;
  overloaded: MissionTaskOutcomeScript;
}

/**
 * Deterministic outcomes driven by the student's actual briefcase choices.
 * INTEGRATION: on promotion this table disappears — each task becomes a real
 * editSessionRunner call with the briefcase as the context filter, and output
 * quality follows from the packing for real.
 */
export const missionTaskScripts: MissionTaskScript[] = [
  {
    taskId: "build-gallery",
    workMs: 4200,
    overloadedExtraMs: 3500,
    success: {
      headline: "Gallery styles ready for review",
      summary:
        "Implemented all five spec requirements in styles.css. Cross-checked class names against index.html so every selector matches real markup.",
      bullets: [
        "2-column grid, single column under 640px",
        "Card treatment: white, rounded, soft shadow, hover lift",
        "Purple headings matching the site accent",
      ],
    },
    starved: {
      headline: "Proposal ready — built on guesses",
      summary:
        "The briefcase was missing {missing}, so this run worked from assumptions: a 3-column grid and gray headings. The spec actually says 2 columns and purple. Plausible isn't the same as right.",
      bullets: [
        "Built a 3-column grid (spec requirement #1 says 2)",
        "Used default heading colors (spec requirement #4 says purple)",
        "Fix the briefcase and re-run the task",
      ],
    },
    overloaded: {
      headline: "Done, but the briefcase slowed the run",
      summary:
        "The styles are in, but the briefcase included files this task never needed — the agent read irrelevant context before getting to work. Notice the run took longer than the others.",
      bullets: [
        "All five spec requirements implemented",
        "script.js and the instructions were never used",
        "A focused briefcase makes a faster run",
      ],
    },
  },
  {
    taskId: "a11y-pass",
    workMs: 3400,
    overloadedExtraMs: 3000,
    success: {
      headline: "Accessibility audit complete",
      summary:
        "Audited index.html structure. Two fixes proposed and one thing you already did right.",
      bullets: [
        "Add a skip-to-content link before the header",
        "Project cards need their headings linked when they become clickable",
        "Good: heading levels are already in order (h1 → h2 → h3)",
      ],
    },
    starved: {
      headline: "Audit blocked — nothing to audit",
      summary:
        "The briefcase was missing {missing}. An agent can't audit a page that isn't in its context, so this report is empty. Pack the page markup and re-run the task.",
      bullets: ["No findings — index.html was not in the agent's context"],
    },
    overloaded: {
      headline: "Audit complete, with detours",
      summary:
        "Findings are in, but the run spent time reading files that don't affect an accessibility audit of the markup. The extra context made it noticeably slower.",
      bullets: [
        "Add a skip-to-content link before the header",
        "Heading levels are already in order",
        "styles.css and script.js didn't change any finding",
      ],
    },
  },
  {
    taskId: "launch-checklist",
    workMs: 2800,
    overloadedExtraMs: 2600,
    success: {
      headline: "Launch checklist drafted",
      summary:
        "Turned the spec and the level goals into Specs/LAUNCH.md — six checks, each tied to a spec requirement or level goal.",
      bullets: [
        "Verify the grid collapses on a phone-sized screen",
        "Hover every card once",
        "Read the page with images disabled",
      ],
    },
    starved: {
      headline: "Checklist drafted — from thin air",
      summary:
        "The briefcase was missing {missing}, so this checklist is generic web advice, not *your* launch plan. It doesn't mention the gallery once. Re-pack and re-run for a real one.",
      bullets: [
        '"Check the website works" — see the problem?',
        "Nothing references the spec requirements",
      ],
    },
    overloaded: {
      headline: "Checklist drafted, eventually",
      summary:
        "The briefcase held the whole codebase, but this task reads goals, not code. The checklist is fine — the extra files just made the run slower.",
      bullets: [
        "Six checks tied to spec requirements",
        "index.html was never opened during this run",
      ],
    },
  },
];
