import { useNavigate } from "react-router-dom";
import {
  validationOpenEndedFileStructure,
  validationOpenEndedInstructionsMarkdown,
  validationOpenEndedReviewConfig,
} from "../../data/weblab2/projects/validation-open-ended";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationLoopStylePolishLevelPage() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Polish Loop's Styles"
      currentLevelPath={validationProgressionPaths.loopStylePolish}
      completedLevelPaths={[validationProgressionPaths.photoCarousel]}
      instructionsMarkdown={validationOpenEndedInstructionsMarkdown}
      fileStructureOverride={validationOpenEndedFileStructure}
      validationReviewConfig={validationOpenEndedReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.promiseTrace)}
      storageKeySuffix="validation-progression-create-v1"
      initialViewMode="preview"
    />
  );
}
