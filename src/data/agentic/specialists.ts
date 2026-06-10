import type { AgentSpecialist } from "../../types/agentLab";

const SPEC_ARTIFACT = { path: "Specs/SPEC.md", label: "Project spec" };

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
  capabilities: { guidance: true, planning: false, workspaceEdits: false },
  contextScope: {
    filePaths: ["index.html", "styles.css", "script.js"],
    artifactPaths: ["Specs/SPEC.md"],
    includesInstructions: true,
    cannotSee: ["Nothing is hidden — the Tutor's context includes the whole project"],
  },
  canDo: ["Answer questions", "Explain code", "Suggest which agent fits a job"],
  cannotDo: ["Edit files", "Write specs"],
  contract:
    "General tutor agent. Answer pedagogically, hint first, and route work to the right specialist agent. Never propose file edits.",
  produces: [],
  reads: [SPEC_ARTIFACT],
  unlocked: true,
};

export const specWriterSpecialist: AgentSpecialist = {
  id: "spec-writer",
  role: "Spec writer",
  iconName: "list-check",
  accent: "blue",
  writablePaths: ["Specs/SPEC.md"],
  tagline: "Turns your goal into a written plan other agents can follow.",
  capabilities: { guidance: true, planning: true, workspaceEdits: false },
  contextScope: {
    filePaths: [],
    artifactPaths: ["Specs/SPEC.md"],
    includesInstructions: true,
    cannotSee: [
      "Your code — by design. A spec describes what to build, not how it's built today.",
      "Conversations with other agents",
    ],
  },
  canDo: ["Ask clarifying questions", "Write and revise Specs/SPEC.md"],
  cannotDo: ["Read code", "Edit HTML, CSS, or JavaScript"],
  contract:
    "Spec-writing agent. Project files are not in context. Interview the student about their goal, then write or revise Specs/SPEC.md with numbered, testable requirements. Never propose code edits.",
  produces: [SPEC_ARTIFACT],
  reads: [],
  unlocked: true,
};

export const designerSpecialist: AgentSpecialist = {
  id: "designer",
  role: "Style agent",
  iconName: "palette",
  accent: "magenta",
  writablePaths: ["styles.css"],
  tagline: "Reads the spec and proposes CSS changes. Styling only.",
  capabilities: { guidance: true, planning: false, workspaceEdits: true },
  contextScope: {
    filePaths: ["index.html", "styles.css"],
    artifactPaths: ["Specs/SPEC.md"],
    includesInstructions: false,
    cannotSee: [
      "script.js — behavior is outside this agent's job",
      "Conversations with other agents — it reads the spec instead",
    ],
  },
  canDo: ["Read Specs/SPEC.md", "Propose changes to styles.css"],
  cannotDo: ["Touch script.js", "Change what the page says"],
  contract:
    "Styling agent. Context contains only index.html, styles.css, and Specs/SPEC.md. Implement spec requirements with CSS-only edits. If asked for behavior changes, decline and name the right specialist agent.",
  produces: [],
  reads: [SPEC_ARTIFACT],
  unlocked: true,
};

export const accessibilitySpecialist: AgentSpecialist = {
  id: "a11y",
  role: "Accessibility checker",
  iconName: "universal-access",
  accent: "green",
  writablePaths: ["index.html"],
  tagline: "Reviews the page so everyone can use it — keyboards, screen readers, all of it.",
  capabilities: { guidance: true, planning: false, workspaceEdits: true },
  contextScope: {
    filePaths: ["index.html"],
    artifactPaths: ["Specs/SPEC.md"],
    includesInstructions: false,
    cannotSee: ["styles.css and script.js — this agent audits structure and semantics"],
  },
  canDo: ["Audit headings, landmarks, and alt text", "Propose HTML fixes"],
  cannotDo: ["Restyle the page", "Write JavaScript"],
  contract:
    "Accessibility audit agent. Context contains only index.html and the spec. Audit semantics, landmarks, contrast flags, and alt text; propose minimal HTML edits.",
  produces: [],
  reads: [SPEC_ARTIFACT],
  unlocked: true,
};

/**
 * Crew demo roster: the accessibility checker starts locked to demonstrate
 * progressive introduction; it unlocks after the first accepted proposal.
 */
export const crewSpecialists: AgentSpecialist[] = [
  tutorSpecialist,
  specWriterSpecialist,
  designerSpecialist,
  {
    ...accessibilitySpecialist,
    unlocked: false,
    lockedHint: "Unlocks after your first accepted change",
  },
];

/** Mission demo roster: every task-doer unlocked; the Tutor stays on the bench. */
export const missionSpecialists: AgentSpecialist[] = [
  specWriterSpecialist,
  designerSpecialist,
  accessibilitySpecialist,
];
