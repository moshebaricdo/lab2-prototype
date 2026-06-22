import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderSeededPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-seeded"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-seeded"
    />
  );
}
