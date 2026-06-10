import type { AgentSpecialist } from "../../../types/agentLab";

/**
 * Human-readable summary of what's inside an agent's context window,
 * e.g. "the level instructions + Specs/SPEC.md" or
 * "Specs/SPEC.md + index.html + styles.css".
 */
export function describeAgentContext(specialist: AgentSpecialist): string {
  const parts: string[] = [];
  if (specialist.contextScope.includesInstructions) {
    parts.push("the level instructions");
  }
  parts.push(...specialist.contextScope.artifactPaths);
  parts.push(...specialist.contextScope.filePaths);
  if (parts.length === 0) return "almost nothing";
  return parts.join(" + ");
}

/** Compact variant for the strip's one-line context summary. */
export function describeAgentContextShort(specialist: AgentSpecialist): string {
  const parts: string[] = [];
  if (specialist.contextScope.includesInstructions) parts.push("instructions");
  parts.push(
    ...specialist.contextScope.artifactPaths.map((path) =>
      path.split("/").pop() ?? path,
    ),
  );
  parts.push(...specialist.contextScope.filePaths);
  if (parts.length === 0) return "almost nothing";
  return parts.join(" · ");
}
