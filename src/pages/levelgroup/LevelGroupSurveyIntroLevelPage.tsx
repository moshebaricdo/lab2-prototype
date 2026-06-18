import { mockLevelGroupSurveyWithIntro } from "../../data/assessment";
import { LevelGroupScrollWorkspace } from "../../components/assessment/levelgroup";
import { assessmentSetLevelLinks } from "../levelTypeLinks";

export function LevelGroupSurveyIntroLevelPage() {
  return (
    <LevelGroupScrollWorkspace
      payload={mockLevelGroupSurveyWithIntro}
      levelLinks={assessmentSetLevelLinks}
      currentLevelPath="/levels/levelgroup-survey-intro"
      shellSubtitle="Intro screen like the checkpoint quiz — then every question on one scrollable page (no grading UI)."
    />
  );
}
