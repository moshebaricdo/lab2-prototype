import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderP0CfuPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-p0-cfu"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-p0-cfu"
      p0Aligned
    />
  );
}
