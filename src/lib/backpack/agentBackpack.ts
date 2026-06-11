import type { FaIconName } from "../../icons/faProRegularCodepoints";
import type { AgentAccent, AgentEffort, AgentSpecialist } from "../../types/agentLab";
import type { BackpackItem } from "../../types/backpack";

/**
 * Custom agents are first-class backpack residents, not generic JSON
 * (spec V4 Decision D). They carry the `"agent"` file kind so the panel and
 * the recall sheet can render them with a distinct glyph + treatment, and
 * their payload is a self-contained `AgentSpecialist` snapshot — the student's
 * effective config (edited contract, toggles, scope) at save time.
 */
export const AGENT_BACKPACK_FILE_KIND = "agent" as const;

const AGENT_BACKPACK_SCHEMA = "lab2.agent";
const AGENT_BACKPACK_VERSION = 1;

/**
 * Curated icons the student picks when saving an agent (Decision E).
 * Functional, tool-like marks — never avatars.
 */
export const CURATED_AGENT_ICON_OPTIONS: ReadonlyArray<{
  icon: FaIconName;
  label: string;
}> = [
  { icon: "robot", label: "Robot" },
  { icon: "wand-magic-sparkles", label: "Magic wand" },
  { icon: "palette", label: "Palette" },
  { icon: "list-check", label: "Checklist" },
  { icon: "code", label: "Code" },
  { icon: "compass", label: "Compass" },
  { icon: "lightbulb", label: "Lightbulb" },
  { icon: "feather", label: "Feather" },
  { icon: "magnifying-glass", label: "Search" },
  { icon: "pen-ruler", label: "Design" },
  { icon: "gauge", label: "Gauge" },
  { icon: "shield", label: "Shield" },
];

/** @deprecated Prefer `CURATED_AGENT_ICON_OPTIONS`. */
export const CURATED_AGENT_GLYPHS: FaIconName[] =
  CURATED_AGENT_ICON_OPTIONS.map((option) => option.icon);

/** Accent tints offered in the agent identity picker. */
export const AGENT_ACCENT_OPTIONS: AgentAccent[] = [
  "violet",
  "blue",
  "magenta",
  "green",
];

export const AGENT_ACCENT_LABELS: Record<AgentAccent, string> = {
  violet: "Purple",
  blue: "Blue",
  magenta: "Pink",
  green: "Green",
};

export const AGENT_EFFORT_LABELS: Record<AgentEffort, string> = {
  quick: "Quick",
  careful: "Careful",
};

export const AGENT_EFFORT_DESCRIPTIONS: Record<AgentEffort, string> = {
  quick: "Fast, direct answers.",
  careful: "Thinks longer before responding.",
};

interface SavedAgentEnvelope {
  schema: typeof AGENT_BACKPACK_SCHEMA;
  version: number;
  specialist: AgentSpecialist;
}

export function isAgentBackpackItem(item: BackpackItem): boolean {
  return item.fileKind === AGENT_BACKPACK_FILE_KIND;
}

export function serializeAgentSpecialist(specialist: AgentSpecialist): string {
  const envelope: SavedAgentEnvelope = {
    schema: AGENT_BACKPACK_SCHEMA,
    version: AGENT_BACKPACK_VERSION,
    specialist,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Build a backpack item from an effective agent specialist. The display name is
 * the agent's role; the payload is the serialized snapshot.
 */
/** Starter template for the “Create new agent” flow. */
export function createBlankAgentSpecialist(): AgentSpecialist {
  const id = `custom-agent-${Date.now()}`;
  return {
    id,
    role: "New agent",
    iconName: "robot",
    accent: "violet",
    tagline: "",
    capabilities: {
      guidance: true,
      planning: false,
      workspaceEdits: false,
      readLivePreview: false,
    },
    effort: "quick",
    contextScope: {
      // Non-empty marker ⇒ this agent may pack project code (defaults to all
      // scopable files in the live project via resolveContextFilePaths).
      filePaths: ["index.html"],
      artifactPaths: [],
      includesInstructions: true,
      cannotSee: [],
    },
    writablePaths: [],
    canDo: ["Answer questions about your project"],
    cannotDo: ["Edit project files"],
    contract:
      "You help the student with their web project. Be concise, practical, and stay within your capabilities.",
    produces: [],
    reads: [],
    unlocked: true,
  };
}

export function createAgentBackpackItem(
  specialist: AgentSpecialist,
): BackpackItem {
  const savedAt = new Date().toISOString();
  return {
    id: `backpack-agent-${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
    name: specialist.role,
    savedAt,
    content: serializeAgentSpecialist(specialist),
    fileKind: AGENT_BACKPACK_FILE_KIND,
    sourceLab: "weblab2",
  };
}

/** Refresh a saved agent item after the student edits identity or config. */
export function mergeAgentBackpackItem(
  item: BackpackItem,
  specialist: AgentSpecialist,
): BackpackItem {
  return {
    ...item,
    name: specialist.role,
    content: serializeAgentSpecialist(specialist),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isAgentSpecialist(value: unknown): value is AgentSpecialist {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<AgentSpecialist>;
  return (
    typeof s.id === "string" &&
    typeof s.role === "string" &&
    typeof s.iconName === "string" &&
    typeof s.accent === "string" &&
    typeof s.contract === "string" &&
    Boolean(s.capabilities) &&
    typeof s.capabilities === "object" &&
    Boolean(s.contextScope) &&
    typeof s.contextScope === "object" &&
    isStringArray(s.writablePaths) &&
    isStringArray(s.canDo) &&
    isStringArray(s.cannotDo)
  );
}

/**
 * Recover an `AgentSpecialist` from a saved backpack item. Returns null when the
 * item isn't an agent or its payload is malformed (corrupt localStorage, an old
 * schema) — callers skip those rather than crashing the recall sheet.
 */
export function deserializeAgentBackpackItem(
  item: BackpackItem,
): AgentSpecialist | null {
  if (!isAgentBackpackItem(item)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(item.content);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const envelope = parsed as Partial<SavedAgentEnvelope>;
  if (envelope.schema !== AGENT_BACKPACK_SCHEMA) return null;
  if (!isAgentSpecialist(envelope.specialist)) return null;
  // Recalled agents always land unlocked and ready to use.
  return { ...envelope.specialist, unlocked: true };
}
