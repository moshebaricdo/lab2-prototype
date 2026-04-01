import { useNavigate } from "react-router-dom";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  mockBubbleChoiceLevel,
  type BubbleChoiceLevelPayload,
} from "../../../../data/assessment";
import type { BubbleChoiceOptionLabelStyle } from "../../../../data/assessment/bubbleChoice";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import styles from "./BubbleChoiceWorkspace.module.scss";

function labelForOptionIndex(
  index: number,
  style: BubbleChoiceOptionLabelStyle | undefined,
): string {
  const resolved = style ?? "letter";
  if (resolved === "number") return String(index + 1);
  return String.fromCharCode(65 + index);
}

interface BubbleChoiceWorkspaceProps {
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  completedLevelPaths?: string[];
  /** Defaults to the text-only mock level. */
  payload?: BubbleChoiceLevelPayload;
}

export function BubbleChoiceWorkspace({
  levelLinks,
  currentLevelPath,
  completedLevelPaths,
  payload = mockBubbleChoiceLevel,
}: BubbleChoiceWorkspaceProps = {}) {
  const navigate = useNavigate();

  const { level } = payload;
  const optionLabelStyle = level.optionLabelStyle;

  return (
    <Lab2Shell
      hideResourcePanel
      topNavigationProps={{
        title: `${level.metadata.lessonName} - ${level.name}`,
        subtitle: "Draft bubble choice level on Lab2 shell",
        currentLevel: level.metadata.levelPosition,
        totalLevels: level.metadata.totalLevelsInScript,
        completedLevels: [1, 2, 3, 4, 5, 6],
        levelLinks,
        currentLevelPath,
        completedLevelPaths,
      }}
    >
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <h1 className={styles.title}>{level.name}</h1>
            <p className={styles.prompt}>{level.prompt}</p>
          </header>

          <div className={styles.cardsRegion}>
            <ul className={styles.optionsGrid}>
              {level.options.map((option, index) => (
                <li key={option.id} className={styles.optionItem}>
                  <button
                    type="button"
                    className={styles.optionCard}
                    aria-label={
                      option.image
                        ? `${labelForOptionIndex(index, optionLabelStyle)}. ${option.title}. ${option.description}`
                        : `${labelForOptionIndex(index, optionLabelStyle)}. ${option.title}`
                    }
                    onClick={() => navigate(option.levelPath)}
                  >
                    {option.image ? (
                      <div className={styles.optionImageWrap}>
                        <img
                          src={option.image.src}
                          alt=""
                          className={styles.optionImage}
                          loading="lazy"
                          decoding="async"
                          title={option.image.alt}
                        />
                      </div>
                    ) : null}
                    <span className={styles.optionLabel} aria-hidden>
                      {labelForOptionIndex(index, optionLabelStyle)}
                    </span>
                    <div className={styles.optionCardBody}>
                      <p className={styles.optionTitle}>{option.title}</p>
                      <p className={styles.optionDescription}>
                        {option.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </Lab2Shell>
  );
}
