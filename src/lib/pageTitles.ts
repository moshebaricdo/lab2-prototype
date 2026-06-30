import type { LevelProgressLink } from "../components/ui/header/LevelProgressBubbles";
import {
  agenticProgressionLinks,
  assessmentExperimentLinks,
  assessmentSetLevelLinks,
  assessmentBuilderLevelLinks,
  aiChatLabLevelLinks,
  backpackFilterProgressionLinks,
  bubbleChoiceLevelLinks,
  dragDropLevelLinks,
  drawerImprovementsExperimentLinks,
  fileChipTabsExperimentLinks,
  fillInBlankLevelLinks,
  freeResponseLevelLinks,
  matchLevelLinks,
  multiChoiceLevelLinks,
  pythonLabLevelLinks,
  sampleProgressionLinks,
  sketchLabLevelLinks,
  uploadMechanismsProgressionLinks,
  webLab2ExperimentLinks,
  teacherDashboardExperimentLinks,
  webLab2LevelLinks,
  webLab2ValidationProgressionLinks,
} from "../pages/levelTypeLinks";

type LevelPageGroup = {
  levelType: string;
  pages: LevelProgressLink[];
};

/** Group labels mirror the Levels index cards and level-type sections. */
const LEVEL_PAGE_GROUPS: LevelPageGroup[] = [
  { levelType: "AI Chat Lab", pages: aiChatLabLevelLinks },
  { levelType: "Web Lab 2", pages: webLab2LevelLinks },
  { levelType: "Python Lab", pages: pythonLabLevelLinks },
  { levelType: "Sketch Lab", pages: sketchLabLevelLinks },
  { levelType: "Multi-choice", pages: multiChoiceLevelLinks },
  { levelType: "Free response", pages: freeResponseLevelLinks },
  { levelType: "Match", pages: matchLevelLinks },
  { levelType: "Drag and drop", pages: dragDropLevelLinks },
  { levelType: "Fill in the blank", pages: fillInBlankLevelLinks },
  { levelType: "Assessment sets", pages: assessmentSetLevelLinks },
  { levelType: "Assessment builder", pages: assessmentBuilderLevelLinks },
  { levelType: "Bubble choice", pages: bubbleChoiceLevelLinks },
  { levelType: "Intro to HTML & CSS", pages: sampleProgressionLinks },
  {
    levelType: "Tutor Instructions and Validation",
    pages: webLab2ValidationProgressionLinks,
  },
  { levelType: "Upload Mechanisms", pages: uploadMechanismsProgressionLinks },
  { levelType: "Backpack Filtering", pages: backpackFilterProgressionLinks },
  { levelType: "Agentic AI Explorations", pages: agenticProgressionLinks },
  { levelType: "Drawer Improvements", pages: drawerImprovementsExperimentLinks },
  { levelType: "File Chip Tabs", pages: fileChipTabsExperimentLinks },
  { levelType: "Web Lab 2 Experiments", pages: webLab2ExperimentLinks },
  { levelType: "Teacher Dashboard", pages: teacherDashboardExperimentLinks },
  { levelType: "Assessment Experiments", pages: assessmentExperimentLinks },
];

/** Branch paths reachable from bubble choice but not listed in link arrays. */
const EXTRA_LEVEL_PAGES: Array<{
  levelType: string;
  name: string;
  path: string;
}> = [
  {
    levelType: "Intro to HTML & CSS",
    name: "Layout & Flexbox",
    path: "/levels/progression-branch-layout",
  },
  {
    levelType: "Intro to HTML & CSS",
    name: "Images & Accessibility",
    path: "/levels/progression-branch-media",
  },
];

export const DEFAULT_PAGE_TITLE = "Lab2 Prototype";
export const INDEX_PAGE_TITLE = `${DEFAULT_PAGE_TITLE} | Level index`;

export function formatPageTitle(levelType: string, levelName: string): string {
  return `${levelType} | ${levelName}`;
}

const PAGE_TITLE_BY_PATH = buildPageTitleMap();

function buildPageTitleMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const { levelType, pages } of LEVEL_PAGE_GROUPS) {
    for (const page of pages) {
      map.set(page.path, formatPageTitle(levelType, page.name));
    }
  }

  for (const page of EXTRA_LEVEL_PAGES) {
    map.set(page.path, formatPageTitle(page.levelType, page.name));
  }

  return map;
}

export function getPageTitleForPath(pathname: string): string {
  if (pathname === "/" || pathname === "/levels") {
    return INDEX_PAGE_TITLE;
  }

  return PAGE_TITLE_BY_PATH.get(pathname) ?? DEFAULT_PAGE_TITLE;
}
