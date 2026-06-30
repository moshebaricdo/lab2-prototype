import type { FaBrandIconName } from "../icons/faBrandsCodepoints";
import type { FaIconName } from "../icons/faProRegularCodepoints";
import { getPathnameFromLevelPath } from "./levelShareLinks";

export type LevelTypeIconConfig =
  | { family: "solid"; name: FaIconName }
  | { family: "brands"; name: FaBrandIconName };

const ASSESSMENT_PATH_PREFIXES = [
  "/levels/multi",
  "/levels/free-response",
  "/levels/match",
  "/levels/drag-drop",
  "/levels/fill-in-blank",
  "/levels/levelgroup",
  "/levels/assessment-builder",
  "/levels/bubble-choice",
  "/levels/progression-free-response",
  "/levels/progression-bubble-choice",
  "/levels/progression-levelgroup",
];

const WEB_LAB_PATH_PREFIXES = [
  "/levels/weblab2",
  "/levels/progression-weblab",
  "/levels/progression-branch-",
  "/levels/progression-upload-mechanisms",
  "/levels/progression-backpack-filter",
  "/levels/progression-weblab2-validation",
];

const PYTHON_LAB_PATH_PREFIXES = ["/levels/pythonlab"];

const SKETCH_LAB_PATH_PREFIXES = ["/levels/sketchlab"];

const AI_CHAT_LAB_PATH_PREFIXES = ["/levels/aichatlab"];

const TEACHER_DASHBOARD_PATH_PREFIXES = ["/levels/teacher-dashboard"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}-`) || pathname.startsWith(prefix);
}

export function getLevelTypeIconConfig(path: string): LevelTypeIconConfig {
  const pathname = getPathnameFromLevelPath(path);

  if (AI_CHAT_LAB_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { family: "solid", name: "messages" };
  }

  if (TEACHER_DASHBOARD_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { family: "solid", name: "chalkboard-user" };
  }

  if (PYTHON_LAB_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { family: "brands", name: "python" };
  }

  if (SKETCH_LAB_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { family: "solid", name: "diagram-project" };
  }

  if (WEB_LAB_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { family: "solid", name: "display-code" };
  }

  if (ASSESSMENT_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { family: "solid", name: "rectangle-list" };
  }

  return { family: "solid", name: "rectangle-list" };
}
