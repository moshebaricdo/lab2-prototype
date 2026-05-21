import { describe, expect, it } from "vitest";
import {
  parseAssessmentGoalLabels,
  parseAssessmentGoals,
} from "./validationAssessment";

describe("validation assessment parsing", () => {
  it("keeps full evaluator requirements separate from student-facing labels", () => {
    const markdown = `
# Assessment Checks

## AI Review Requirements

- [Make one intentional style refinement] The student makes at least one intentional refinement beyond the starter styles.
- The page still works after the change.
`;

    expect(parseAssessmentGoals(markdown)).toEqual([
      "The student makes at least one intentional refinement beyond the starter styles.",
      "The page still works after the change.",
    ]);
    expect(parseAssessmentGoalLabels(markdown)).toEqual([
      "Make one intentional style refinement",
      "The page still works after the change.",
    ]);
  });
});
