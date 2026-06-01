import {
  addLevelShareModeSearchParam,
  type ActiveLevelShareMode,
} from "../hooks/useLevelShareMode";
import { drawerImprovementsExperimentLinks } from "../pages/levelTypeLinks";

export const PROGRESSION_LEVEL_PATH_PREFIX = "/levels/progression-";

/** Multi-level routes that do not use the `progression-` prefix but still support share navigation. */
const EXPLICIT_PROGRESSION_NAVIGATION_PATHS = new Set(
  drawerImprovementsExperimentLinks.map((link) => link.path),
);

export interface LevelShareLink {
  name: string;
  path: string;
}

export function getPathnameFromLevelPath(path: string): string {
  return path.split("?")[0] ?? path;
}

export function levelPathsMatch(left: string, right: string): boolean {
  return getPathnameFromLevelPath(left) === getPathnameFromLevelPath(right);
}

export function includesLevelPath(
  paths: string[] | undefined,
  path: string,
): boolean {
  if (!paths) return false;
  const pathname = getPathnameFromLevelPath(path);
  return paths.some(
    (candidate) => getPathnameFromLevelPath(candidate) === pathname,
  );
}

export function findLevelLinkIndex(
  levelLinks: LevelShareLink[],
  currentLevelPath: string | undefined,
): number {
  if (!currentLevelPath) return -1;
  return levelLinks.findIndex((link) =>
    levelPathsMatch(link.path, currentLevelPath),
  );
}

export function isProgressionLevelPath(path: string): boolean {
  const pathname = getPathnameFromLevelPath(path);
  return (
    pathname.startsWith(PROGRESSION_LEVEL_PATH_PREFIX) ||
    EXPLICIT_PROGRESSION_NAVIGATION_PATHS.has(pathname)
  );
}

export function isProgressionLevelLinks(
  levelLinks: LevelShareLink[] | undefined,
): boolean {
  if (!levelLinks || levelLinks.length <= 1) return false;
  return levelLinks.every((link) => isProgressionLevelPath(link.path));
}

export function withLevelShareModePath(
  path: string,
  mode: ActiveLevelShareMode,
): string {
  const [pathname, existingSearch = ""] = path.split("?");
  const searchParams = addLevelShareModeSearchParam(
    new URLSearchParams(existingSearch),
    mode,
  );
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function mapLevelLinksWithShareMode(
  levelLinks: LevelShareLink[],
  mode: ActiveLevelShareMode,
): LevelShareLink[] {
  return levelLinks.map((link) => ({
    ...link,
    path: withLevelShareModePath(link.path, mode),
  }));
}

export function resolveShareAwareNavigationPath(
  path: string,
  shareMode: ActiveLevelShareMode | "off",
): string {
  if (shareMode === "off") return path;
  if (!isProgressionLevelPath(path)) return path;
  if (shareMode === "locked-level") {
    return withLevelShareModePath(path, "locked-level");
  }
  if (shareMode === "locked-progression" || shareMode === "locked") {
    return withLevelShareModePath(
      path,
      shareMode === "locked" ? "locked" : "locked-progression",
    );
  }
  return withLevelShareModePath(path, shareMode);
}
