import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AI_LAB_PLAYTEST_PATH,
  aiLabPlaytestLevelLinks,
  aiLabPlaytestSteps,
  parseAiLabPlaytestStep,
} from "../../data/ailab/playtestProgression";
import { AiLabLevelPage } from "./AiLabLevelPage";

/**
 * Three playtest stages on one route so schools can allowlist a single path.
 * Continue advances in memory; the URL stays `/levels/progression-ailab`.
 *
 * `?step=look|try|build` is read once on load (index bubbles, legacy redirects)
 * then stripped so the address bar stays self-contained.
 */
export function AiLabPlaytestProgressionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(() =>
    parseAiLabPlaytestStep(searchParams.get("step")),
  );

  useEffect(() => {
    if (!searchParams.get("step")) return;
    navigate(AI_LAB_PLAYTEST_PATH, { replace: true });
  }, [navigate, searchParams]);

  const step = aiLabPlaytestSteps[stepIndex];
  const isLast = stepIndex >= aiLabPlaytestSteps.length - 1;

  return (
    <AiLabLevelPage
      key={step.id}
      progressLevelIndex={stepIndex}
      currentLevelPath={AI_LAB_PLAYTEST_PATH}
      title={step.title}
      subtitle={step.subtitle}
      config={step.config}
      continueLabel={step.continueLabel ?? "Continue"}
      continueTo={isLast ? "/levels" : AI_LAB_PLAYTEST_PATH}
      levelLinks={aiLabPlaytestLevelLinks}
      instructionsMarkdown={step.instructionsMarkdown}
      onProgressLevelSelect={setStepIndex}
      resourcePanelWidth={380}
      onContinue={
        isLast
          ? undefined
          : () => setStepIndex((current) => current + 1)
      }
    />
  );
}
