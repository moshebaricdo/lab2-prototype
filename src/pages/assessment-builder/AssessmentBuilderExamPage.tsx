import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderExamPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-exam"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-exam"
    />
  );
}
