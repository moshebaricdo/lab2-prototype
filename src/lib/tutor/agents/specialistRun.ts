import { tutorClient } from "../tutorClient";
import type { TutorValidatedChange } from "../types";
import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { TutorRequestMode } from "../../../types/tutor";
import type { AgentEffort, AgentSpecialist } from "../../../types/agentLab";
import { normalizeAgentEffort } from "../../../lib/backpack/agentBackpack";

/**
 * Specialist agents on top of the live tutor pipeline.
 *
 * Modular by construction — nothing in the core pipeline changes. A specialist
 * is expressed entirely through existing tutorClient inputs:
 *
 * - context window  → the file tree is PRUNED to `contextScope` before the call
 *   (the packer never sees out-of-scope files, so the model genuinely can't)
 * - behavior        → `contract` rides the runner-contract addendum
 * - capability      → deterministic `requestMode` per agent (edits ⇒ build,
 *   guidance-only ⇒ help) instead of the auto classifier
 * - write scope     → returned changes are clamped to `writablePaths`; blocked
 *   changes are dropped and surfaced — the enforcement is the lesson
 */

const NO_PERSONA_RULE =
  "Style rule: you are a tool, not a character. No name, no persona, no emoji. " +
  "Refer to other agents by their functional label (e.g. \"Plan\" or \"Design\").";

/** Project-relative path of a node inside the (single) root project folder. */
function withRelativePaths(
  items: FileItem[],
  parentPath: string,
): Array<{ item: FileItem; path: string }> {
  return items.map((item) => ({
    item,
    path: parentPath ? `${parentPath}/${item.name}` : item.name,
  }));
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase();
}

function pathMatches(candidate: string, allowed: string) {
  const c = normalizePath(candidate);
  const a = normalizePath(allowed);
  if (c === a) return true;
  // Model output sometimes carries the root folder ("My Portfolio/styles.css")
  // or just a basename — accept suffix matches on segment boundaries.
  return c.endsWith(`/${a}`) || a.endsWith(`/${c}`);
}

function inScope(path: string, scopePaths: string[]) {
  return scopePaths.some((allowed) => pathMatches(path, allowed));
}

/**
 * Prune the project tree to the agent's context window. Folders are kept only
 * while they contain in-scope descendants; the project root is always kept so
 * the packer still sees a valid project shape.
 */
export function filterTreeForAgent(
  tree: FileItem[],
  specialist: AgentSpecialist,
): FileItem[] {
  const scopePaths = [
    ...specialist.contextScope.filePaths,
    ...specialist.contextScope.artifactPaths,
  ];

  const filterLevel = (items: FileItem[], parentPath: string): FileItem[] =>
    withRelativePaths(items, parentPath).flatMap(({ item, path }) => {
      if (item.type === "folder" && item.children) {
        const children = filterLevel(item.children, path);
        return children.length > 0 ? [{ ...item, children }] : [];
      }
      return inScope(path, scopePaths) ? [item] : [];
    });

  // The top level is the project root folder — filter inside it, keep the shell.
  return tree.map((root) =>
    root.type === "folder" && root.children
      ? { ...root, children: filterLevel(root.children, "") }
      : root,
  );
}

/** Paths actually packed for this agent — rendered as the context receipt. */
export function packedContextPaths(
  tree: FileItem[],
  specialist: AgentSpecialist,
): string[] {
  const filtered = filterTreeForAgent(tree, specialist);
  const paths: string[] = [];
  const walk = (items: FileItem[], parentPath: string) => {
    for (const { item, path } of withRelativePaths(items, parentPath)) {
      if (item.type === "folder" && item.children) walk(item.children, path);
      else paths.push(path);
    }
  };
  for (const root of filtered) walk(root.children ?? [], "");
  if (specialist.contextScope.includesInstructions) paths.unshift("instructions");
  return paths;
}

/** Capability → deterministic composer mode for specialist turns. */
export function specialistComposerMode(
  specialist: AgentSpecialist,
): TutorRequestMode {
  if (specialist.capabilities.planning && !specialist.capabilities.workspaceEdits) {
    return "plan";
  }
  if (specialist.capabilities.workspaceEdits) {
    return "build";
  }
  return "help";
}

/** @deprecated Prefer `specialistComposerMode`. */
export function agentRequestMode(specialist: AgentSpecialist): "build" | "help" {
  return specialistComposerMode(specialist) === "build" ? "build" : "help";
}

const AGENT_EFFORT_PROMPTS: Record<AgentEffort, string> = {
  low: "Be concise and direct. Prefer fast, actionable answers.",
  medium: "Balance clarity with enough detail to be useful.",
  high: "Think step-by-step before answering. Prefer thorough analysis over speed.",
  "extra-high":
    "Take maximum reasoning depth. Explore edge cases and explain your reasoning clearly.",
};

export function buildAgentSystemPrompt(specialist: AgentSpecialist): string {
  const writable = specialist.capabilities.workspaceEdits
    ? specialist.writablePaths.length
      ? `You may only create or modify these files: ${specialist.writablePaths.join(", ")}. ` +
        "If the request needs other files changed, say which agent handles that instead."
      : "You may propose file edits, but no write paths are configured yet — describe changes instead of proposing them."
    : "You must not propose any file changes.";

  const runtime = specialist.capabilities.readLivePreview
    ? "When live preview or console output is available in context, use it to diagnose rendering and runtime issues."
    : "You do not receive live preview or console output — rely on project files and the student's description.";

  const effort =
    AGENT_EFFORT_PROMPTS[normalizeAgentEffort(specialist.effort)];

  return [
    `You are the "${specialist.role}" agent. ${specialist.contract}`,
    writable,
    runtime,
    effort,
    NO_PERSONA_RULE,
  ].join("\n\n");
}

export interface SpecialistClampResult {
  allowed: TutorValidatedChange[];
  blocked: TutorValidatedChange[];
}

/** Enforce the agent's write scope on returned changes. */
export function clampSpecialistChanges(
  changes: TutorValidatedChange[],
  specialist: AgentSpecialist,
): SpecialistClampResult {
  const allowed: TutorValidatedChange[] = [];
  const blocked: TutorValidatedChange[] = [];
  for (const change of changes) {
    (inScope(change.fileName, specialist.writablePaths) ? allowed : blocked)
      .push(change);
  }
  return { allowed, blocked };
}

/**
 * Student-facing note explaining which proposed changes fell outside the
 * agent's write scope and were dropped. Empty when nothing was blocked.
 */
export function formatBlockedScopeNote(blocked: TutorValidatedChange[]): string {
  if (blocked.length === 0) return "";
  const names = blocked.map((change) => `\`${change.fileName}\``).join(", ");
  return `\n\n*${names} ${
    blocked.length === 1 ? "is" : "are"
  } outside this agent's write scope — that change was not applied.*`;
}

export interface SpecialistTurnOptions {
  specialist: AgentSpecialist;
  message: string;
  conversation: ChatMessage[];
  /** Full project tree — pruning happens here, inside the run. */
  files: FileItem[];
  levelInstructionsMarkdown?: string;
}

export interface SpecialistTurnResult {
  chatMessage: ChatMessage;
  /** Clamped changes to stage as a proposal (empty for guidance turns). */
  proposalChanges: TutorValidatedChange[];
}

/**
 * One live turn with the active specialist. The conversation passed through is
 * only this agent's slice — fresh context on switch is the caller's concern.
 */
export async function runSpecialistTurn({
  specialist,
  message,
  conversation,
  files,
  levelInstructionsMarkdown = "",
}: SpecialistTurnOptions): Promise<SpecialistTurnResult> {
  const scopedTree = filterTreeForAgent(files, specialist);
  const contract = buildAgentSystemPrompt(specialist);
  const result = await tutorClient({
    message,
    conversation,
    files: scopedTree,
    requestMode: specialistComposerMode(specialist),
    supportContext: "curriculum-level",
    runnerContracts: { build: contract, plan: contract, help: contract },
    levelInstructionsMarkdown: specialist.contextScope.includesInstructions
      ? levelInstructionsMarkdown
      : "",
  });

  const { allowed, blocked } = clampSpecialistChanges(result.changes, specialist);
  const blockedNote = formatBlockedScopeNote(blocked);

  const chatMessage: ChatMessage = {
    role: "assistant",
    content: `${result.message}${blockedNote}`,
    ...(allowed.length > 0
      ? {
          fileChanges: allowed.map((change) => ({
            fileName: change.fileName,
            status: change.status,
            linesAdded: change.linesAdded,
            linesRemoved: change.linesRemoved,
          })),
          codeChangeStatus: "pending" as const,
          aiSaveTitle: result.saveTitle,
        }
      : {}),
  };

  return { chatMessage, proposalChanges: allowed };
}
