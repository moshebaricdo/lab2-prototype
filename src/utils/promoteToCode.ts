import type { SavedVariant } from "../hooks/useSavedVariants";

interface WorkspaceMapping {
  component: string;
  importPath: string;
  linksVar: string;
  pageDirectory: string;
}

const PATH_TO_WORKSPACE: Record<string, WorkspaceMapping> = {
  "/levels/multi": {
    component: "MultiChoiceWorkspace",
    importPath: "../../components/assessment/multi",
    linksVar: "multiChoiceLevelLinks",
    pageDirectory: "multi-choice",
  },
  "/levels/free-response": {
    component: "FreeResponseWorkspace",
    importPath: "../../components/assessment/free-response",
    linksVar: "freeResponseLevelLinks",
    pageDirectory: "free-response",
  },
  "/levels/match-definition-bank": {
    component: "MatchDefinitionBankWorkspace",
    importPath: "../../components/assessment/match",
    linksVar: "matchLevelLinks",
    pageDirectory: "match",
  },
  "/levels/match-connector": {
    component: "MatchConnectorWorkspace",
    importPath: "../../components/assessment/match",
    linksVar: "matchLevelLinks",
    pageDirectory: "match",
  },
  "/levels/drag-drop-parsons": {
    component: "DragDropWorkspace",
    importPath: "../../components/assessment/drag-drop",
    linksVar: "dragDropLevelLinks",
    pageDirectory: "drag-drop",
  },
  "/levels/fill-in-blank": {
    component: "FillInBlankWorkspace",
    importPath: "../../components/assessment/fill-in-blank",
    linksVar: "fillInBlankLevelLinks",
    pageDirectory: "fill-in-blank",
  },
  "/levels/match-swipe-cards": {
    component: "MatchSwipeWorkspace",
    importPath: "../../components/assessment/match",
    linksVar: "matchLevelLinks",
    pageDirectory: "match",
  },
  "/levels/weblab2": {
    component: "Workspace",
    importPath: "../../components/ide/weblab2",
    linksVar: "webLab2LevelLinks",
    pageDirectory: "weblab2",
  },
  "/levels/levelgroup-scroll": {
    component: "LevelGroupScrollWorkspace",
    importPath: "../../components/assessment/levelgroup",
    linksVar: "levelGroupLevelLinks",
    pageDirectory: "levelgroup",
  },
  "/levels/bubble-choice": {
    component: "BubbleChoiceWorkspace",
    importPath: "../../components/assessment/bubble-choice",
    linksVar: "bubbleChoiceLevelLinks",
    pageDirectory: "bubble-choice",
  },
};

function findMapping(basePath: string): WorkspaceMapping | null {
  if (PATH_TO_WORKSPACE[basePath]) return PATH_TO_WORKSPACE[basePath];
  for (const [prefix, mapping] of Object.entries(PATH_TO_WORKSPACE)) {
    if (basePath.startsWith(prefix)) return mapping;
  }
  return null;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toPascalCase(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function stringifyOverrides(overrides: Record<string, unknown>, indent = 2): string {
  return JSON.stringify(overrides, null, indent);
}

export interface PromotedCode {
  pageName: string;
  pageFileName: string;
  pageFilePath: string;
  pageCode: string;
  routeEntry: string;
  linkEntry: string;
  routePath: string;
}

export function generatePromotedCode(variant: SavedVariant): PromotedCode | null {
  const mapping = findMapping(variant.basePath);
  if (!mapping) return null;

  const slug = toSlug(variant.name);
  const routePath = `/levels/${slug}`;
  const pageName = `${toPascalCase(slug)}LevelPage`;
  const pageFileName = `${pageName}.tsx`;
  const pageFilePath = `${mapping.pageDirectory}/${pageFileName}`;

  const overridesStr = stringifyOverrides(variant.overrides, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join("\n");

  const pageCode = `import { ${mapping.component} } from "${mapping.importPath}";
import { ${mapping.linksVar} } from "../levelTypeLinks";

const overrides = ${overridesStr};

export function ${pageName}() {
  return (
    <${mapping.component}
      payload={overrides as any}
      levelLinks={${mapping.linksVar}}
      currentLevelPath="${routePath}"
    />
  );
}
`;

  const routeEntry = `<Route path="${routePath}" element={<${pageName} />} />`;

  const linkEntry = `{ name: "${variant.name}", path: "${routePath}" },`;

  return {
    pageName,
    pageFileName,
    pageFilePath,
    pageCode,
    routeEntry,
    linkEntry,
    routePath,
  };
}
