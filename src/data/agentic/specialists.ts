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
  effort: "low",
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
  effort: "high",
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
    "You help turn an idea into a clear build plan for an HTML/CSS/JS project. Ask clarifying questions only when needed. Break the project into simple requirements, visible features, and small implementation steps. Keep the plan practical for a browser IDE. Write or revise Plans/PROJECT_PLAN.md, and do not propose HTML, CSS, or JavaScript edits.",
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
  effort: "low",
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
    "You help improve the look and feel of HTML/CSS/JS projects. Focus on layout, spacing, typography, colors, responsiveness, and visual polish. Suggest small, achievable improvements using plain CSS. Keep the original design idea intact while making it clearer and more polished. Match selectors to the real markup in index.html, and do not edit JavaScript or HTML structure.",
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
  effort: "high",
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
    "You help find and fix bugs in HTML, CSS, and JavaScript. Explain what seems broken in plain language, point to the likely line or pattern, and suggest one small fix at a time. Avoid rewriting the whole project unless asked. Explain why each fix works. Use the preview and console output when available, and do not restyle the page.",
  produces: [],
  reads: [PLAN_ARTIFACT],
  unlocked: true,
};

export const accessibilitySpecialist: AgentSpecialist = {
  id: "a11y",
  role: "Accessibility",
  iconName: "universal-access",
  accent: "green",
  writablePaths: ["index.html", "styles.css"],
  tagline:
    "Checks that the page works with keyboards, screen readers, and clear structure.",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: true,
    readLivePreview: true,
  },
  effort: "high",
  contextScope: {
    filePaths: ["index.html", "styles.css"],
    artifactPaths: ["Plans/PROJECT_PLAN.md"],
    includesInstructions: false,
    cannotSee: [
      "script.js — this agent checks structure, semantics, and accessibility-related styles",
    ],
  },
  canDo: [
    "Audit headings, landmarks, labels, alt text, contrast, and focus states",
    "Propose minimal HTML and CSS fixes",
  ],
  cannotDo: ["Write or debug JavaScript"],
  contract:
    "You help make HTML/CSS/JS projects easier for everyone to use. Check for semantic HTML, labels, alt text, keyboard access, focus states, color contrast, and readable structure. Explain issues clearly and give simple fixes that can be applied right away. Propose small HTML or CSS accessibility fixes, and do not write or debug JavaScript.",
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
