import type { FaIconName } from "../icons/faProRegularCodepoints";

/**
 * Shared vocabulary for the agentic AI explorations (see docs/agentic-directions.md).
 *
 * These types are deliberately written so a single `AgentSpecialist` definition can
 * power both demo directions, and so each field maps 1:1 onto an existing harness
 * extension point — promoting a direction means wiring, not redesign:
 *
 * - `capabilities`        → `TutorPolicy.capabilities` (src/pages/weblab2/tutorDevSettings.ts)
 * - `contract`            → `TutorRunnerContracts` addenda (src/lib/tutor/runners/runnerContracts.ts)
 * - `contextScope`        → file filter on `buildProjectContext` (src/lib/tutor/context/contextBuilder.ts)
 *
 * Naming note: per curricular guidelines we avoid humanizing LLMs — agents carry
 * functional labels ("Spec writer"), functional glyphs (not avatars), and no
 * human names or personas anywhere in student-facing copy.
 */

/** What a specialist is allowed to do. Mirrors TutorPolicy.capabilities. */
export interface AgentCapabilities {
  guidance: boolean;
  planning: boolean;
  workspaceEdits: boolean;
  /** When true, runtime context (live preview + console errors) may be packed. */
  readLivePreview: boolean;
}

/** Student-facing abstraction of model depth / reasoning effort. */
export type AgentEffort = "quick" | "careful";

/**
 * Constrained accent palette for the agent row — soft functional color coding
 * (a tint, not a persona). Maps to CSS hooks in the strip stylesheet.
 */
export type AgentAccent = "violet" | "blue" | "magenta" | "green";

/**
 * The slice of the project a specialist can see. This is the teaching surface for
 * context windows: it renders as the "What I can see" card and, on integration,
 * becomes the filter applied when packing TutorProjectContext.
 */
export interface AgentContextScope {
  /** Project file paths in scope (e.g. "styles.css"). */
  filePaths: string[];
  /** Artifact paths in scope (e.g. "Specs/SPEC.md"). Artifacts created by other agents. */
  artifactPaths: string[];
  /** Whether the level instructions markdown is packed into this agent's context. */
  includesInstructions: boolean;
  /** Plain-language list of things deliberately OUT of scope, shown on the context card. */
  cannotSee: string[];
}

/** A work product one agent writes and another reads. Artifacts are the hand-off interface. */
export interface AgentArtifact {
  /** Project-relative path, e.g. "Specs/SPEC.md". */
  path: string;
  /** Short label for chips/cards, e.g. "Project spec". */
  label: string;
}

export interface AgentSpecialist {
  id: string;
  /** Functional label naming the job, e.g. "Spec writer". Never a human name. */
  role: string;
  /** Font Awesome icon name (functional glyph, not an avatar) used in the strip and board. */
  iconName: FaIconName;
  /** Soft accent tint for the agent row chip. */
  accent: AgentAccent;
  /** One-line description of what this agent does, in student language. */
  tagline: string;
  capabilities: AgentCapabilities;
  contextScope: AgentContextScope;
  /**
   * Paths this agent is allowed to write. Live runs clamp proposals to these:
   * changes outside the list are dropped and surfaced to the student — the
   * enforcement IS the lesson ("the style agent can't touch script.js").
   */
  writablePaths: string[];
  /** How much reasoning depth this agent uses. Default: "quick". */
  effort?: AgentEffort;
  /** Hint-first vs direct answers. Unset ⇒ inherits the level's pedagogy. */
  revealPolicy?: "hint-first" | "direct-when-asked";
  /** Things this agent can do, in student language ("Propose CSS changes"). */
  canDo: string[];
  /** Things this agent will refuse, in student language ("Edit JavaScript"). */
  cannotDo: string[];
  /**
   * Runner contract addendum on integration: appended to the system prompt for this
   * agent's runs, the same mechanism as the dev panel's tutor*Contract fields.
   */
  contract: string;
  /** Artifacts this agent produces. */
  produces: AgentArtifact[];
  /** Artifacts this agent expects to read on hand-off. */
  reads: AgentArtifact[];
  /** When false the specialist renders as a locked teaser (progressive introduction). */
  unlocked: boolean;
  /**
   * Tooltip copy for the locked chip, e.g. "Available in Lesson 7". Authored per
   * level on integration; standalone projects ship with everything unlocked.
   */
  lockedHint?: string;
}

/**
 * Student-authored overrides for an agent — the seed of "configure your own
 * agents as you progress". Applied on top of the authored specialist; live
 * runs use the merged result (the contract feeds the real system prompt, the
 * file list feeds the real context filter).
 */
export interface AgentCustomization {
  /** Replaces the agent's contract (its standing instructions). */
  contract?: string;
  /** Replaces the agent's in-scope project files (Advanced — wins over seeProjectCode). */
  filePaths?: string[];
  /** Toggle: may this agent propose file edits? → capabilities.workspaceEdits */
  workspaceEdits?: boolean;
  /** Toggle: may this agent read live preview + console output? */
  readLivePreview?: boolean;
  /** Replaces the agent's write scope (paths it may edit). */
  writablePaths?: string[];
  /** Replaces the agent's reasoning effort level. */
  effort?: AgentEffort;
  /** Toggle: is project code in this agent's context? false ⇒ no code files. */
  seeProjectCode?: boolean;
  /** Toggle: hints first vs direct answers. → pedagogy.revealPolicy */
  revealPolicy?: "hint-first" | "direct-when-asked";
  /** Saved-agent identity overrides (name, glyph, accent, description). */
  role?: string;
  tagline?: string;
  iconName?: FaIconName;
  accent?: AgentAccent;
}

/**
 * Autonomy ladder for the general Tutor (see docs/agentic-v4-spec.md, Decision C).
 * "tutor": student routes manually. "orchestrator-assisted": Tutor proposes
 * dispatches the student approves. "orchestrator-auto": dispatches run without
 * per-step approval (results still land as reviewable proposals).
 */
export type AgentTutorRole = "tutor" | "orchestrator-assisted" | "orchestrator-auto";

/**
 * Per-level agent configuration — a prop on WebLab2LevelPage, same pattern as
 * validationReviewConfig. Absent ⇒ the page behaves exactly as before.
 */
export interface AgentLevelConfig {
  /** Authored roster. Include the Tutor entry; it always anchors the strip. */
  specialists: AgentSpecialist[];
  /** Agent active when the level loads. Default: "tutor". */
  initialAgentId?: string;
  /** Agent ids omitted from the roster until revealed on this level (dev panel). */
  lockedAgentIds?: string[];
  /** When true, the agent modal exposes toggles + standing-instruction editing. */
  allowCustomization?: boolean;
  /** When true, students can save/recall/create agents via the roster + menu. Default: false. */
  allowAgentLibrary?: boolean;
  /** Autonomy ladder for the Tutor. Default: "tutor". */
  tutorRole?: AgentTutorRole;
}

// ---------------------------------------------------------------------------
// Direction B — Mission Control (orchestration levels)
// ---------------------------------------------------------------------------

/** An item the student can pack into an agent's briefcase. */
export interface BriefcaseItem {
  /** Project file or artifact path. */
  path: string;
  label: string;
  kind: "file" | "artifact" | "instructions";
  /** Rough context cost, displayed on the meter. Heuristic in the demo; real token counts on integration. */
  contextTokens: number;
}

export type BriefcaseLoad = "starved" | "focused" | "overloaded";

export interface MissionTask {
  id: string;
  title: string;
  /** What the agent is asked to do — becomes the run's user message on integration. */
  brief: string;
  /** Specialist suggested for this task (student can reassign). */
  suggestedSpecialistId: string;
  /**
   * Paths the agent genuinely needs to succeed. Drives the scripted outcomes in the
   * demo; on integration this disappears — the model's real output quality takes over.
   */
  requiredPaths: string[];
  /** Briefcase meter bounds for this task, in heuristic tokens. */
  contextBudget: { min: number; max: number };
}

export type MissionTaskStatus =
  | "needs-setup"
  | "ready"
  | "queued"
  | "reading"
  | "working"
  | "proposal-ready"
  | "needs-rework"
  | "approved";

export interface MissionConfig {
  id: string;
  title: string;
  /** Markdown mission brief shown on the board. */
  briefMarkdown: string;
  tasks: MissionTask[];
  specialists: AgentSpecialist[];
  /** Everything available to pack, shared across tasks. */
  briefcaseItems: BriefcaseItem[];
}
