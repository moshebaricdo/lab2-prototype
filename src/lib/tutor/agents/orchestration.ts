import type { ChatMessage, AgentHandOffCardData } from "../../../types/chat";
import type { AgentSpecialist } from "../../../types/agentLab";

/**
 * Orchestrator-assisted dispatch when `agentConfig.tutorRole` is an orchestrator role.
 *
 * The Tutor's runner contracts include `buildOrchestrationContract`: instead of doing
 * specialist work itself, the Tutor names the right specialist, writes a brief,
 * and ends its reply with a single machine-readable DISPATCH line. The line is
 * parsed out of the reply and rendered as an `agentHandOff` card whose Run
 * action switches to the specialist and submits the brief through the same
 * pipeline as any student message.
 */

const DISPATCH_LINE_PATTERN = /^[ \t]*`{0,3}[ \t]*DISPATCH:[ \t]*(\{.*\})[ \t]*`{0,3}[ \t]*$/m;

function describeDispatchTarget(specialist: AgentSpecialist): string {
  const writes = specialist.writablePaths.length
    ? `May only write: ${specialist.writablePaths.join(", ")}.`
    : "Never writes files.";
  return [
    `- id "${specialist.id}" — ${specialist.role}: ${specialist.tagline}`,
    `  Can: ${specialist.canDo.join("; ")}. Cannot: ${specialist.cannotDo.join("; ")}. ${writes}`,
  ].join("\n");
}

/**
 * Runner-contract addendum for the orchestrating Tutor. `specialists` is the
 * dispatchable set — unlocked, non-Tutor, with student customizations applied.
 */
export function buildOrchestrationContract(
  specialists: AgentSpecialist[],
): string {
  return [
    "You coordinate this level's specialist agents. You never write or change project files yourself — the specialists do the work; you route it.",
    "",
    "Specialists you can dispatch:",
    ...specialists.map(describeDispatchTarget),
    "",
    "When the student asks for work that falls in a specialist's scope (writing or revising the plan, changing files), do NOT do it or walk the student through doing it. Instead reply with one or two sentences naming the specialist (by its functional label) and why it fits, then end your reply with exactly one line in this exact format:",
    'DISPATCH: {"agent":"<specialist id>","reason":"<why this specialist, under 10 words>","brief":"<the work request you are sending it>"}',
    "Dispatch rules:",
    "- The JSON must be valid, double-quoted, and on one single line. No code fence.",
    "- The brief is sent to the specialist verbatim as its work request. Write it as a direct, self-contained instruction carrying every concrete detail from the student's request (elements, colors, names, copy). The specialist cannot ask you follow-up questions.",
    "- Use only the ids listed above. At most one DISPATCH line per reply.",
    "- Questions, explanations, hints, and debugging help you answer yourself — no DISPATCH line.",
    "- Refer to agents by functional label only; agents are tools, not characters.",
  ].join("\n");
}

export interface ParsedDispatch {
  /** Reply content with the DISPATCH line stripped. */
  content: string;
  handOff?: AgentHandOffCardData;
}

/**
 * Pull the DISPATCH line out of a Tutor reply. Returns the cleaned content
 * and, when the line names a dispatchable specialist, the hand-off card data.
 * Malformed or unknown dispatches are stripped silently — the reply prose
 * already names the specialist in student language.
 */
export function parseDispatchFromMessage(
  message: string,
  specialists: AgentSpecialist[],
): ParsedDispatch {
  const match = message.match(DISPATCH_LINE_PATTERN);
  if (!match) return { content: message };

  const content = message.replace(match[0], "").trimEnd();
  try {
    const payload = JSON.parse(match[1]) as {
      agent?: unknown;
      reason?: unknown;
      brief?: unknown;
    };
    const specialist = specialists.find((s) => s.id === payload.agent);
    const brief = typeof payload.brief === "string" ? payload.brief.trim() : "";
    if (!specialist || !brief) return { content };
    return {
      content,
      handOff: {
        agentId: specialist.id,
        label: specialist.role,
        iconName: specialist.iconName,
        reason: typeof payload.reason === "string" ? payload.reason : undefined,
        brief,
        status: "pending",
      },
    };
  } catch {
    return { content };
  }
}

/** Attach a parsed dispatch to a Tutor reply message (no-op without a match). */
export function applyDispatchToChatMessage(
  chatMessage: ChatMessage,
  specialists: AgentSpecialist[],
): ChatMessage {
  // Replies that already carry structured work (proposals, cards) never double
  // as dispatches — the orchestrator contract forbids it, this enforces it.
  if (chatMessage.fileChanges?.length || chatMessage.agentHandOff) {
    return chatMessage;
  }
  const { content, handOff } = parseDispatchFromMessage(
    chatMessage.content,
    specialists,
  );
  if (!handOff) return chatMessage;
  return { ...chatMessage, content, agentHandOff: handOff };
}
