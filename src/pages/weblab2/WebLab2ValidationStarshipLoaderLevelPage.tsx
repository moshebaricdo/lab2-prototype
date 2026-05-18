import {
  validationSandboxFileStructure,
  validationSandboxInstructionsMarkdown,
  validationSandboxReviewConfig,
} from "../../data/weblab2/projects/validation-sandbox";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationStarshipLoaderLevelPage() {
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
      instructionsMarkdown={validationSandboxInstructionsMarkdown}
      fileStructureOverride={validationSandboxFileStructure}
      validationReviewConfig={validationSandboxReviewConfig}
      continueLabel="Finish"
      storageKeySuffix="validation-progression-sandbox-v1"
    />
  );
}
