import type { AgentCustomization, AgentSpecialist } from "../../../types/agentLab";
import type { FileItem } from "../../../types/file";

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase();
}

/** Path equality with optional project-root or basename suffix matching. */
export function pathsMatch(candidate: string, allowed: string) {
  const c = normalizePath(candidate);
  const a = normalizePath(allowed);
  if (c === a) return true;
  return c.endsWith(`/${a}`) || a.endsWith(`/${c}`);
}

export function samePathSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((path) => b.some((other) => pathsMatch(path, other)));
}

/** Agents authored to pack project code (Spec writer and similar stay excluded). */
export function agentPacksProjectCode(baseSpecialist: AgentSpecialist): boolean {
  return baseSpecialist.contextScope.filePaths.length > 0;
}

/** Default project-code scope: every scopable file in this project. */
export function defaultContextFilePaths(
  baseSpecialist: AgentSpecialist,
  scopableFiles: string[],
): string[] {
  return agentPacksProjectCode(baseSpecialist) ? [...scopableFiles] : [];
}

export function isScopedToAllProjectFiles(
  selected: string[],
  scopableFiles: string[],
): boolean {
  if (scopableFiles.length === 0) {
    return selected.length === 0;
  }
  return samePathSets(selected, scopableFiles);
}

export function formatWriteScopeNote(
  paths: string[],
  allProjectFiles: string[],
): string {
  if (paths.length === 0) return "No files selected";
  if (isScopedToAllProjectFiles(paths, allProjectFiles)) {
    return allProjectFiles.length === 1
      ? "All project files (1 file)"
      : `All project files (${allProjectFiles.length} files)`;
  }
  if (paths.length <= 3) return paths.join(", ");
  return `${paths.length} of ${allProjectFiles.length} project files`;
}

/**
 * Resolve which project files land in context for this project. Authored
 * agents that pack code default to *all* scopable files here; students scope
 * down via an explicit `filePaths` customization.
 */
export function resolveContextFilePaths(
  baseSpecialist: AgentSpecialist,
  scopableFiles: string[],
  customization?: AgentCustomization,
): string[] {
  if (!agentPacksProjectCode(baseSpecialist)) {
    return [];
  }
  if (customization?.seeProjectCode === false) {
    return [];
  }
  if (customization?.filePaths !== undefined) {
    return customization.filePaths.filter((path) =>
      scopableFiles.some((candidate) => pathsMatch(path, candidate)),
    );
  }
  return [...scopableFiles];
}

/** First plan file present in the project tree (e.g. "Plans/PROJECT_PLAN.md"). */
export function findPlanPath(tree: FileItem[]): string | undefined {
  for (const root of tree) {
    const plans = root.children?.find(
      (item) => item.type === "folder" && item.name === "Plans",
    );
    const planFile = plans?.children?.find((item) =>
      item.name.toLowerCase().endsWith(".md"),
    );
    if (planFile) return `Plans/${planFile.name}`;
  }
  return undefined;
}

/** Project files a student can scope into an agent (plan artifacts stay fixed). */
export function collectScopableFiles(tree: FileItem[]): string[] {
  const paths: string[] = [];
  const walk = (items: FileItem[], parentPath: string) => {
    for (const item of items) {
      const path = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.type === "folder" && item.children) {
        if (item.name !== "Plans" && item.name !== "Specs") {
          walk(item.children, path);
        }
      } else {
        paths.push(path);
      }
    }
  };
  for (const root of tree) walk(root.children ?? [], "");
  return paths;
}

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
