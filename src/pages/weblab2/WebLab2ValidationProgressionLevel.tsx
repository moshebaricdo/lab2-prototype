import { useNavigate } from "react-router-dom";
import { WebLab2LevelPage } from "./WebLab2LevelPage";
import { webLab2ValidationProgressionLinks } from "../levelTypeLinks";
import {
  validationTestFileStructure,
  validationTestInstructionsMarkdown,
  validationTestReviewConfig,
} from "../../data/weblab2/projects/validation-test";
import {
  validationOpenEndedFileStructure,
  validationOpenEndedInstructionsMarkdown,
  validationOpenEndedReviewConfig,
} from "../../data/weblab2/projects/validation-open-ended";
import {
  validationHybridFileStructure,
  validationHybridInstructionsMarkdown,
  validationHybridReviewConfig,
} from "../../data/weblab2/projects/validation-hybrid";

const commonProps = {
  useFilePreview: true,
  showOnlyFilesWithContent: true,
  tutorMode: { kind: "functional" as const },
  continueButtonPlacement: "header" as const,
  instructionsDrawerInitialHeightRatio: 0.5,
  enableSidebarCollapse: true,
  initialViewMode: "split" as const,
  levelLinks: webLab2ValidationProgressionLinks,
  totalLevels: webLab2ValidationProgressionLinks.length,
};

export function WebLab2ValidationProgressionFixLevel() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps}
      title="Validation Lab: Fix the Photo Button"
      currentLevelPath="/levels/progression-weblab2-validation-fix"
      completedLevelPaths={[]}
      instructionsMarkdown={validationTestInstructionsMarkdown}
      fileStructureOverride={validationTestFileStructure}
      validationReviewConfig={validationTestReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/progression-weblab2-validation-create")}
      storageKeySuffix="validation-progression-fix-v1"
    />
  );
}

export function WebLab2ValidationProgressionCreateLevel() {
  const navigate = useNavigate();

  return (
    <WebLab2LevelPage
      {...commonProps}
      title="Validation Lab: Create a Spotlight Page"
      currentLevelPath="/levels/progression-weblab2-validation-create"
      completedLevelPaths={["/levels/progression-weblab2-validation-fix"]}
      instructionsMarkdown={validationOpenEndedInstructionsMarkdown}
      fileStructureOverride={validationOpenEndedFileStructure}
      validationReviewConfig={validationOpenEndedReviewConfig}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/progression-weblab2-validation-refine")}
      storageKeySuffix="validation-progression-create-v1"
    />
  );
}

export function WebLab2ValidationProgressionRefineLevel() {
  return (
    <WebLab2LevelPage
      {...commonProps}
      title="Validation Lab: Refine an Event Page"
      currentLevelPath="/levels/progression-weblab2-validation-refine"
      completedLevelPaths={[
        "/levels/progression-weblab2-validation-fix",
        "/levels/progression-weblab2-validation-create",
      ]}
      instructionsMarkdown={validationHybridInstructionsMarkdown}
      fileStructureOverride={validationHybridFileStructure}
      validationReviewConfig={validationHybridReviewConfig}
      continueLabel="Finish"
      storageKeySuffix="validation-progression-refine-v1"
    />
  );
}
