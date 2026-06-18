import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderSurveyPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-survey"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-survey"
    />
  );
}
