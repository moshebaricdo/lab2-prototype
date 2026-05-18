import { useNavigate } from "react-router-dom";
import {
  validationTestFileStructure,
  validationTestInstructionsMarkdown,
  validationTestReviewConfig,
} from "../../data/weblab2/projects/validation-test";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import {
  validationProgressionCommonProps,
  validationProgressionPaths,
} from "./webLab2ValidationProgressionCommon";

export function WebLab2ValidationPhotoCarouselLevelPage() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...validationProgressionCommonProps}
      title="Validation Lab: Fix the Photo Carousel"
      currentLevelPath={validationProgressionPaths.photoCarousel}
      completedLevelPaths={[]}
      instructionsMarkdown={validationTestInstructionsMarkdown}
      fileStructureOverride={validationTestFileStructure}
      validationReviewConfig={validationTestReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate(validationProgressionPaths.loopStylePolish)}
      storageKeySuffix="validation-progression-fix-v1"
    />
  );
}
