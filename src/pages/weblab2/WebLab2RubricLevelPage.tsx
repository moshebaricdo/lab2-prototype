import { WebLab2LevelPage } from "./WebLab2LevelPage";
import type { RubricData } from "../../components/lab2/resource-panel/views/RubricPanel";

const evidenceLevels = [
  {
    id: "extensive",
    label: "Extensive Evidence",
    description:
      "All stated requirements are fully met; layout and styling are intentional, consistent, and accessible (e.g. contrast, alt text, focus). Code is organized and easy to follow.",
  },
  {
    id: "convincing",
    label: "Convincing Evidence",
    description:
      "Most requirements are met with minor gaps; design is mostly consistent. Small issues (e.g. one missing alt, a rough edge in responsive layout) don’t block understanding.",
  },
  {
    id: "limited",
    label: "Limited Evidence",
    description:
      "Some requirements are partially addressed; several gaps remain or the page is hard to use on common screen sizes. Needs another revision pass before it reflects the brief.",
  },
  {
    id: "none",
    label: "No Evidence",
    description:
      "The submission does not show meaningful progress toward the stated requirements, or the work could not be reviewed (e.g. broken links, empty files).",
  },
] as const;

const portfolioRubric: RubricData = {
  name: "Personal Portfolio Page",
  feedback:
    "Your page structure is clear and you met the checklist for headings, images, and an external stylesheet. Nice use of semantic HTML on the about section. Next time, double-check that every interactive element (like your nav links) has a visible focus state so keyboard users get the same clarity you gave the layout.",
  submissionStatus: "needs-revisions",
  categories: [...evidenceLevels],
  selectedCategoryId: "convincing",
};

const cssLayoutRubric: RubricData = {
  name: "CSS layout & responsiveness",
  feedback:
    "Breakpoints behave well at desktop and tablet widths. On very narrow screens the hero image overflows slightly — try max-width: 100% on images inside flex rows.",
  submissionStatus: "complete",
  categories: [...evidenceLevels],
  selectedCategoryId: "extensive",
};

const jsInteractivityRubric: RubricData = {
  name: "JavaScript interactivity",
  feedback: null,
  categories: [...evidenceLevels],
  selectedCategoryId: null,
};

/** Demo: three rubrics (max four per level) with prev/next in the panel header. */
const exampleRubrics: RubricData[] = [
  portfolioRubric,
  cssLayoutRubric,
  jsInteractivityRubric,
];

export function WebLab2RubricLevelPage() {
  return (
    <WebLab2LevelPage
      currentLevelPath="/levels/weblab2-rubric"
      showRubricTab
      rubricData={exampleRubrics}
    />
  );
}
