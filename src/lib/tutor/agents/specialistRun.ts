import { tutorClient } from "../tutorClient";
import type { TutorValidatedChange } from "../types";
import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { AgentSpecialist } from "../../../types/agentLab";

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
  "Refer to other agents by their functional label (e.g. \"the Spec writer\").";

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

/** Capability → deterministic composer mode. The agent's capability IS its mode. */
export function agentRequestMode(specialist: AgentSpecialist): "build" | "help" {
  return specialist.capabilities.workspaceEdits || specialist.produces.length > 0
    ? "build"
    : "help";
}

export function buildAgentSystemPrompt(specialist: AgentSpecialist): string {
  const writable = specialist.writablePaths.length
    ? `You may only create or modify these files: ${specialist.writablePaths.join(", ")}. ` +
      "If the request needs other files changed, say which agent handles that instead."
    : "You must not propose any file changes.";
  return [
    `You are the "${specialist.role}" agent. ${specialist.contract}`,
    writable,
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
    requestMode: agentRequestMode(specialist),
    supportContext: "curriculum-level",
    runnerContracts: { build: contract, plan: contract, help: contract },
    levelInstructionsMarkdown: specialist.contextScope.includesInstructions
      ? levelInstructionsMarkdown
      : "",
  });

  const { allowed, blocked } = clampSpecialistChanges(result.changes, specialist);
  const blockedNote = blocked.length
    ? `\n\n*${blocked.map((c) => `\`${c.fileName}\``).join(", ")} ${
        blocked.length === 1 ? "is" : "are"
      } outside this agent's write scope — that change was not applied.*`
    : "";

  const chatMessage: ChatMessage = {
    role: "assistant",
    content: `${result.message}${blockedNote}`,
    agentContextReceipt: packedContextPaths(files, specialist),
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
