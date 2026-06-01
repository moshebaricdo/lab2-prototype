import { useNavigate } from "react-router-dom";
import {
  validationStarshipLoaderFileStructure,
  validationStarshipLoaderInitialOpenFiles,
  validationStarshipLoaderInstructionsMarkdown,
  validationStarshipLoaderReviewConfig,
} from "../../data/weblab2/projects/validation-starship-loader";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationStarshipLoaderLevelPage() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Fix the Starship Loader"
      currentLevelPath={validationProgressionPaths.starshipLoader}
      completedLevelPaths={[
        validationProgressionPaths.photoCarousel,
        validationProgressionPaths.loopStylePolish,
        validationProgressionPaths.promiseTrace,
      ]}
      instructionsMarkdown={validationStarshipLoaderInstructionsMarkdown}
      fileStructureOverride={validationStarshipLoaderFileStructure}
      validationReviewConfig={validationStarshipLoaderReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.featureRoulette)}
      storageKeySuffix="validation-progression-sandbox-v1"
      initialOpenFiles={validationStarshipLoaderInitialOpenFiles}
    />
  );
}
