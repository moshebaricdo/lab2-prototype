import type { AgentSpecialist } from "../../types/agentLab";

const PLAN_ARTIFACT = { path: "Plans/PROJECT_PLAN.md", label: "Project plan" };

/**
 * The shared roster. The crew demo (Direction A) and the mission demo
 * (Direction B) both draw from these definitions — one specialist schema
 * powering both surfaces is the point.
 *
 * Copy rules (curricular guidelines): agents are tools, not characters.
 * Functional labels, no human names, no first-person personality, refer to
 * an agent as "it". Scope limits are stated as facts about the tool.
 */
export const tutorSpecialist: AgentSpecialist = {
  id: "tutor",
  role: "Tutor",
  iconName: "chalkboard-user",
  accent: "violet",
  writablePaths: [],
  tagline: "The general helper. Explains, hints, and routes work — never edits files.",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: false,
    readLivePreview: false,
  },
  effort: "quick",
  contextScope: {
    filePaths: ["index.html", "styles.css", "script.js"],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: true,
    cannotSee: ["Nothing is hidden — the Tutor's context includes the whole project"],
  },
  canDo: ["Answer questions", "Explain code", "Suggest which agent fits a job"],
  cannotDo: ["Edit files", "Write plans"],
  contract:
    "General tutor agent. Answer pedagogically, hint first, and route work to the right specialist — Plan, Design, Debug, or Accessibility. Never propose file edits.",
  produces: [],
  reads: [PLAN_ARTIFACT],
  unlocked: true,
};

export const specWriterSpecialist: AgentSpecialist = {
  id: "spec-writer",
  role: "Plan",
  iconName: "list-check",
  accent: "blue",
  writablePaths: ["Plans/PROJECT_PLAN.md"],
  tagline:
    "Clarifies what you're building and writes it down before anyone touches code.",
  capabilities: {
    guidance: true,
    planning: true,
    workspaceEdits: false,
    readLivePreview: false,
  },
  effort: "careful",
  contextScope: {
    filePaths: [],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: true,
    cannotSee: [
      "Project code — the plan describes what to build, not what's already in the files",
      "Conversations with other agents",
    ],
  },
  canDo: [
    "Ask clarifying questions",
    "Write and revise Plans/PROJECT_PLAN.md",
  ],
  cannotDo: ["Read HTML, CSS, or JavaScript", "Propose code edits"],
  contract:
    "Planning agent. No project code is in context — only level goals and any existing plan. When requirements are vague, ask one or two focused questions, then update Plans/PROJECT_PLAN.md with numbered, testable requirements (what the page should do and how to verify it, not implementation steps). Never propose HTML, CSS, or JavaScript edits. Route visual work to Design, runtime issues to Debug, and accessibility audits to Accessibility.",
  produces: [PLAN_ARTIFACT],
  reads: [],
  unlocked: true,
};

export const designerSpecialist: AgentSpecialist = {
  id: "designer",
  role: "Design",
  iconName: "palette",
  accent: "magenta",
  writablePaths: ["styles.css"],
  tagline: "Implements the look and layout from the plan — CSS only.",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: true,
    readLivePreview: false,
  },
  effort: "quick",
  contextScope: {
    filePaths: ["index.html", "styles.css"],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: false,
    cannotSee: [
      "script.js — behavior and bugs are handled by Debug",
      "Conversations with other agents — it reads the plan instead",
    ],
  },
  canDo: [
    "Read the project plan",
    "Propose CSS changes in styles.css",
  ],
  cannotDo: [
    "Edit JavaScript",
    "Change HTML structure or copy",
  ],
  contract:
    "Design agent. Context includes index.html, styles.css, and Plans/PROJECT_PLAN.md. Implement plan requirements with CSS only — layout, spacing, color, and typography. Match selectors to real markup in index.html. Prefer small, reviewable diffs over large rewrites. If the request needs JavaScript, HTML semantics, or accessibility fixes, name the right agent (Debug or Accessibility) instead of stretching past CSS.",
  produces: [],
  reads: [PLAN_ARTIFACT],
  unlocked: true,
};

export const debugSpecialist: AgentSpecialist = {
  id: "debug",
  role: "Debug",
  iconName: "bug",
  accent: "blue",
  writablePaths: ["script.js", "index.html"],
  tagline:
    "Uses preview output and console errors to find and fix broken behavior.",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: true,
    readLivePreview: true,
  },
  effort: "careful",
  contextScope: {
    filePaths: ["index.html", "script.js", "styles.css"],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: false,
    cannotSee: [
      "Conversations with other agents",
    ],
  },
  canDo: [
    "Read console errors and preview behavior",
    "Propose fixes in script.js and HTML wiring",
  ],
  cannotDo: [
    "Redesign the page with CSS",
    "Rewrite the project plan",
  ],
  contract:
    "Debug agent. Context includes index.html, script.js, styles.css, the project plan, and live preview/console output when available. Start from the student's report and any runtime errors. Explain the cause plainly, then propose the smallest fix — usually in script.js, sometimes a script tag or event hook in index.html. Do not restyle the page; route layout and visual changes to Design.",
  produces: [],
  reads: [PLAN_ARTIFACT],
  unlocked: true,
};

export const accessibilitySpecialist: AgentSpecialist = {
  id: "a11y",
  role: "Accessibility",
  iconName: "universal-access",
  accent: "green",
  writablePaths: ["index.html"],
  tagline:
    "Checks that the page works with keyboards, screen readers, and clear structure.",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: true,
    readLivePreview: true,
  },
  effort: "careful",
  contextScope: {
    filePaths: ["index.html"],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: false,
    cannotSee: [
      "styles.css and script.js — this agent audits structure and semantics in HTML",
    ],
  },
  canDo: [
    "Audit headings, landmarks, labels, and alt text",
    "Propose minimal HTML fixes",
  ],
  cannotDo: ["Change CSS styling", "Write or debug JavaScript"],
  contract:
    "Accessibility agent. Context includes index.html, the project plan, and live preview/console output when available. Review semantic HTML, heading order, landmarks, control labels, link text, alt text, and keyboard focus order. Call out issues a screen reader or keyboard-only user would hit. Propose the smallest HTML changes that fix them. Do not edit CSS or JavaScript — route styling to Design and runtime bugs to Debug.",
  produces: [],
  reads: [PLAN_ARTIFACT],
  unlocked: true,
};

/**
 * Level 1 roster — Tutor plus the first specialists students meet.
 * Later levels append agents; nothing renders as a locked teaser.
 */
export const crewLevel1Specialists: AgentSpecialist[] = [
  tutorSpecialist,
  specWriterSpecialist,
  designerSpecialist,
  debugSpecialist,
];

/** Level 2+ roster — full default crew. */
export const crewSpecialists: AgentSpecialist[] = [
  tutorSpecialist,
  specWriterSpecialist,
  designerSpecialist,
  debugSpecialist,
  accessibilitySpecialist,
];

/** Mission demo roster: every task-doer unlocked; the Tutor stays on the bench. */
export const missionSpecialists: AgentSpecialist[] = [
  specWriterSpecialist,
  designerSpecialist,
  debugSpecialist,
  accessibilitySpecialist,
];
