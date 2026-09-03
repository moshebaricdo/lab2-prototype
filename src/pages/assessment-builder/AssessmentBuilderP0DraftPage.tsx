import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderP0DraftPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-p0-floating"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-p0-draft"
      p0Aligned
    />
  );
}
