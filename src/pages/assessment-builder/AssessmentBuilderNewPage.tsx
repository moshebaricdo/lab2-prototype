import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderExperimentLinks } from "../levelTypeLinks";

export function AssessmentBuilderNewPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-new"
      levelLinks={assessmentBuilderExperimentLinks}
      currentLevelPath="/levels/assessment-builder-new"
    />
  );
}
