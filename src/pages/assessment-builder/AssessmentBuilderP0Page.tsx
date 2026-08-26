import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderP0Page() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-p0"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-p0"
      p0Aligned
    />
  );
}
