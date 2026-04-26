import type { RubricData } from "../../../../components/lab2/resource-panel/views/RubricPanel";

const evidenceLevels = [
  {
    id: "extensive",
    label: "Extensive Evidence",
    description:
      "All stated requirements are fully met; layout and styling are intentional, consistent, and accessible. Code is organized and easy to follow.",
  },
  {
    id: "convincing",
    label: "Convincing Evidence",
    description:
      "Most requirements are met with minor gaps; design is mostly consistent. Small issues don't block understanding.",
  },
  {
    id: "limited",
    label: "Limited Evidence",
    description:
      "Some requirements are partially addressed; several gaps remain or the page is hard to use on common screen sizes.",
  },
  {
    id: "none",
    label: "No Evidence",
    description:
      "The submission does not show meaningful progress toward the stated requirements.",
  },
] as const;

export const demoRubrics: RubricData[] = [
  {
    name: "HTML Structure & Content",
    feedback:
      "Really impressive, Aaliyah. Using CSS Grid template areas to build a full app layout with a sidebar, viewport, and detail panel goes well beyond the project requirements. Your HTML is clean and semantic — the nav, main, aside, and header elements are all used correctly. The facts page with the data table is well-structured too. Add alt text to your images folder assets for accessibility and this category is airtight.",
    submissionStatus: "complete",
    categories: [...evidenceLevels],
    selectedCategoryId: "extensive",
  },
];
