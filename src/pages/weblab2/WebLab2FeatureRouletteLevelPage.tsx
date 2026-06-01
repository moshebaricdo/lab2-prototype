import {
  featureRouletteFileStructure,
  featureRouletteInitialOpenFiles,
  featureRouletteInstructionsMarkdown,
  featureRouletteReviewConfig,
} from "../../data/weblab2/projects/feature-roulette";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2FeatureRouletteLevelPage() {
  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Feature Roulette (AIF)"
      currentLevelPath={validationProgressionPaths.featureRoulette}
      completedLevelPaths={[
        validationProgressionPaths.photoCarousel,
        validationProgressionPaths.loopStylePolish,
        validationProgressionPaths.promiseTrace,
        validationProgressionPaths.starshipLoader,
      ]}
      instructionsMarkdown={featureRouletteInstructionsMarkdown}
      fileStructureOverride={featureRouletteFileStructure}
      validationReviewConfig={featureRouletteReviewConfig}
      initialViewMode="preview"
      initialOpenFiles={featureRouletteInitialOpenFiles}
      continueLabel="Finish"
      storageKeySuffix="validation-progression-feature-roulette-v1"
    />
  );
}
