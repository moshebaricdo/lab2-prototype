import { useNavigate } from "react-router-dom";
import {
  validationHybridFileStructure,
  validationHybridInstructionsMarkdown,
  validationHybridReviewConfig,
} from "../../data/weblab2/projects/validation-hybrid";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationPromiseTraceLevelPage() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Trace a Promise"
      currentLevelPath={validationProgressionPaths.promiseTrace}
      completedLevelPaths={[
        validationProgressionPaths.photoCarousel,
        validationProgressionPaths.loopStylePolish,
      ]}
      instructionsMarkdown={validationHybridInstructionsMarkdown}
      fileStructureOverride={validationHybridFileStructure}
      validationReviewConfig={validationHybridReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.starshipLoader)}
      storageKeySuffix="validation-progression-refine-v1"
    />
  );
}
