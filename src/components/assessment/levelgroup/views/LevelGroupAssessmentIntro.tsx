import type { LevelGroupAssessmentIntro as IntroPayload } from "../../../../data/assessment/levelGroup";
import styles from "./LevelGroupWorkspace.module.scss";

interface LevelGroupAssessmentIntroProps {
  intro: IntroPayload;
  assessmentTitle: string;
}

export function LevelGroupAssessmentIntro({
  intro,
  assessmentTitle,
}: LevelGroupAssessmentIntroProps) {
  const paragraphs = intro.overviewContent
    .trim()
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={styles.introScreen}>
      <div className={styles.introHeaderBand}>
        <p className={styles.introEyebrow}>Before you begin</p>
        <h1 className={styles.introTitle}>{assessmentTitle}</h1>
      </div>
      <div className={styles.introBody}>
        {paragraphs.map((text, index) => (
          <p key={index} className={styles.introBodyParagraph}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
