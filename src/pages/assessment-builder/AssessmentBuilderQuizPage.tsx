import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { assessmentBuilderLevelLinks } from "../levelTypeLinks";

export function AssessmentBuilderQuizPage() {
  return (
    <AssessmentBuilderWorkspace
      assessmentId="draft-quiz"
      levelLinks={assessmentBuilderLevelLinks}
      currentLevelPath="/levels/assessment-builder-quiz"
    />
  );
}
