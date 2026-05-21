import { useNavigate } from "react-router-dom";
import {
  validationLoopStylePolishFileStructure,
  validationLoopStylePolishInitialOpenFiles,
  validationLoopStylePolishInstructionsMarkdown,
  validationLoopStylePolishReviewConfig,
} from "../../data/weblab2/projects/validation-loop-style-polish";
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
      instructionsMarkdown={validationLoopStylePolishInstructionsMarkdown}
      fileStructureOverride={validationLoopStylePolishFileStructure}
      validationReviewConfig={validationLoopStylePolishReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.promiseTrace)}
      storageKeySuffix="validation-progression-create-v1"
      initialViewMode="preview"
      initialOpenFiles={validationLoopStylePolishInitialOpenFiles}
    />
  );
}
