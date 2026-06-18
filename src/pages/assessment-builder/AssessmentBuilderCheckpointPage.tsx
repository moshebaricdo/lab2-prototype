import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderCheckpointPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-single-multi"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-checkpoint"
    />
  );
}
