import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderExperimentLinks } from "../levelTypeLinks";

export function AssessmentBuilderSeededPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-seeded"
      levelLinks={assessmentBuilderExperimentLinks}
      currentLevelPath="/levels/assessment-builder-seeded"
    />
  );
}
