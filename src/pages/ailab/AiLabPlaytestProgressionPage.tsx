import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  aiLabPlaytestProgression,
  aiLabPlaytestV2Progression,
  parseAiLabPlaytestStep,
  type AiLabProgression,
} from "../../data/ailab/playtestProgression";
import { AiLabLevelPage } from "./AiLabLevelPage";

/**
 * Several playtest stages on one route so schools can allowlist a single
 * path. Continue advances in memory; the URL stays on `progression.path`.
 *
 * `?step=<id>` is read once on load (index bubbles, legacy redirects) then
 * stripped so the address bar stays self-contained.
 */
export function AiLabProgressionPage({
  progression,
}: {
  progression: AiLabProgression;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(() =>
    parseAiLabPlaytestStep(searchParams.get("step"), progression.steps),
  );

  useEffect(() => {
    if (!searchParams.get("step")) return;
    navigate(progression.path, { replace: true });
  }, [navigate, progression.path, searchParams]);

  const step = progression.steps[stepIndex];
  const isLast = stepIndex >= progression.steps.length - 1;

  return (
    <AiLabLevelPage
      key={step.id}
      progressLevelIndex={stepIndex}
      currentLevelPath={progression.path}
      title={step.title}
      subtitle={step.subtitle}
      config={step.config}
      continueLabel={step.continueLabel ?? "Continue"}
      continueTo={isLast ? "/levels" : progression.path}
      levelLinks={progression.levelLinks}
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

export function AiLabPlaytestProgressionPage() {
  return <AiLabProgressionPage progression={aiLabPlaytestProgression} />;
}

export function AiLabPlaytestV2ProgressionPage() {
  return <AiLabProgressionPage progression={aiLabPlaytestV2Progression} />;
}
