import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { usePageTitle } from "./hooks/usePageTitle";

function lazyPage<TModule, TName extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TName,
) {
  return lazy(async () => ({
    default: (await loader())[exportName] as unknown as ComponentType,
  }));
}


const BubbleChoiceImagesLevelPage = lazyPage(
  () => import("./pages/bubble-choice/BubbleChoiceImagesLevelPage"),
  "BubbleChoiceImagesLevelPage",
);
const AiChatLabPages = () => import("./pages/aichatlab/AiChatLabLevelPage");
const AiChatLabLevelPage = lazyPage(
  AiChatLabPages,
  "AiChatLabLevelPage",
);
const AiChatLabSetupLevelPage = lazyPage(
  AiChatLabPages,
  "AiChatLabSetupLevelPage",
);
const AiChatLabModelCardLevelPage = lazyPage(
  AiChatLabPages,
  "AiChatLabModelCardLevelPage",
);
const AiLabPages = () => import("./pages/ailab/AiLabLevelPage");
const AiLabLevelPage = lazyPage(AiLabPages, "AiLabLevelPage");
const AiLabPretrainedLevelPage = lazyPage(
  AiLabPages,
  "AiLabPretrainedLevelPage",
);
const AiLabGuidedLevelPage = lazyPage(AiLabPages, "AiLabGuidedLevelPage");
const SketchLabPages = () => import("./pages/sketchlab/SketchLabLevelPage");
const SketchLabLevelPage = lazyPage(SketchLabPages, "SketchLabLevelPage");
const SketchLabBlankProjectLevelPage = lazyPage(
  SketchLabPages,
  "SketchLabBlankProjectLevelPage",
);
const BubbleChoiceLevelPage = lazyPage(
  () => import("./pages/bubble-choice/BubbleChoiceLevelPage"),
  "BubbleChoiceLevelPage",
);
const CodeRefEditableLevelPage = lazyPage(
  () => import("./pages/multi-choice/CodeRefEditableLevelPage"),
  "CodeRefEditableLevelPage",
);
const CodeRefFreeResponseLevelPage = lazyPage(
  () => import("./pages/free-response/CodeRefFreeResponseLevelPage"),
  "CodeRefFreeResponseLevelPage",
);
const CodeRefLevelGroupLevelPage = lazyPage(
  () => import("./pages/levelgroup/CodeRefLevelGroupLevelPage"),
  "CodeRefLevelGroupLevelPage",
);
const CodeRefMultiChoiceLevelPage = lazyPage(
  () => import("./pages/multi-choice/CodeRefMultiChoiceLevelPage"),
  "CodeRefMultiChoiceLevelPage",
);
const CodeRefMultiFileLevelPage = lazyPage(
  () => import("./pages/multi-choice/CodeRefMultiFileLevelPage"),
  "CodeRefMultiFileLevelPage",
);
const FreeResponseLevelPage = lazyPage(
  () => import("./pages/free-response/FreeResponseLevelPage"),
  "FreeResponseLevelPage",
);
const FreeResponseMarkdownLevelPage = lazyPage(
  () => import("./pages/free-response/FreeResponseMarkdownLevelPage"),
  "FreeResponseMarkdownLevelPage",
);
const FreeResponseRevealLevelPage = lazyPage(
  () => import("./pages/free-response/FreeResponseRevealLevelPage"),
  "FreeResponseRevealLevelPage",
);
const FreeResponseUploadLevelPage = lazyPage(
  () => import("./pages/free-response/FreeResponseUploadLevelPage"),
  "FreeResponseUploadLevelPage",
);
const LevelGroupScrollLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupScrollLevelPage"),
  "LevelGroupScrollLevelPage",
);
const LevelGroupScrollStickyFooterLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupScrollStickyFooterLevelPage"),
  "LevelGroupScrollStickyFooterLevelPage",
);
const LevelGroupSteppedDotsLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupSteppedDotsLevelPage"),
  "LevelGroupSteppedDotsLevelPage",
);
const LevelGroupSteppedIntroLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupSteppedIntroLevelPage"),
  "LevelGroupSteppedIntroLevelPage",
);
const DemoQuizLevelGroupLevelPage = lazyPage(
  () => import("./pages/levelgroup/DemoQuizLevelGroupLevelPage"),
  "DemoQuizLevelGroupLevelPage",
);
const LevelGroupSteppedLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupSteppedLevelPage"),
  "LevelGroupSteppedLevelPage",
);
const LevelGroupSurveyIntroLevelPage = lazyPage(
  () => import("./pages/levelgroup/LevelGroupSurveyIntroLevelPage"),
  "LevelGroupSurveyIntroLevelPage",
);
const LevelsIndexPage = lazyPage(
  () => import("./pages/LevelsIndexPage"),
  "LevelsIndexPage",
);
const ColorSandboxPage = lazyPage(
  () => import("./pages/design-system/ColorSandboxPage"),
  "ColorSandboxPage",
);
const TypographySandboxPage = lazyPage(
  () => import("./pages/design-system/TypographySandboxPage"),
  "TypographySandboxPage",
);
const CadsParityPage = lazyPage(
  () => import("./pages/design-system/CadsParityPage"),
  "default",
);
const AssessmentBuilderNewPage = lazyPage(
  () => import("./pages/assessment-builder/AssessmentBuilderNewPage"),
  "AssessmentBuilderNewPage",
);
const AssessmentBuilderSeededPage = lazyPage(
  () => import("./pages/assessment-builder/AssessmentBuilderSeededPage"),
  "AssessmentBuilderSeededPage",
);
const AssessmentBuilderP0Page = lazyPage(
  () => import("./pages/assessment-builder/AssessmentBuilderP0Page"),
  "AssessmentBuilderP0Page",
);
const AssessmentBuilderP0DraftPage = lazyPage(
  () => import("./pages/assessment-builder/AssessmentBuilderP0DraftPage"),
  "AssessmentBuilderP0DraftPage",
);
const AssessmentBuilderP0CfuPage = lazyPage(
  () => import("./pages/assessment-builder/AssessmentBuilderP0CfuPage"),
  "AssessmentBuilderP0CfuPage",
);
const CfuPages = () => import("./pages/cfu/CfuPages");
const CfuMultiPage = lazyPage(CfuPages, "CfuMultiPage");
const CfuMultiRetryPage = lazyPage(CfuPages, "CfuMultiRetryPage");
const CfuMultiContinuePage = lazyPage(CfuPages, "CfuMultiContinuePage");
const CfuMultiRevealPage = lazyPage(CfuPages, "CfuMultiRevealPage");
const CfuMultiCappedPage = lazyPage(CfuPages, "CfuMultiCappedPage");
const CfuMultiCheckboxesPage = lazyPage(CfuPages, "CfuMultiCheckboxesPage");
const CfuMultiCheckboxesContinuePage = lazyPage(
  CfuPages,
  "CfuMultiCheckboxesContinuePage",
);
const CfuMultiCheckboxesNoRetryPage = lazyPage(
  CfuPages,
  "CfuMultiCheckboxesNoRetryPage",
);
const CfuMultiCheckboxesRevealPage = lazyPage(
  CfuPages,
  "CfuMultiCheckboxesRevealPage",
);
const CfuMultiCheckboxesCappedPage = lazyPage(
  CfuPages,
  "CfuMultiCheckboxesCappedPage",
);
const CfuFreeResponsePage = lazyPage(CfuPages, "CfuFreeResponsePage");
const CfuFreeResponseRevealPage = lazyPage(
  CfuPages,
  "CfuFreeResponseRevealPage",
);
const CfuFreeResponseCappedPage = lazyPage(
  CfuPages,
  "CfuFreeResponseCappedPage",
);
const CfuMatchingPage = lazyPage(CfuPages, "CfuMatchingPage");
const CfuMatchingRetryPage = lazyPage(CfuPages, "CfuMatchingRetryPage");
const CfuMatchingReattemptPage = lazyPage(CfuPages, "CfuMatchingReattemptPage");
const CfuMatchingContinuePage = lazyPage(CfuPages, "CfuMatchingContinuePage");
const CfuMatchingRevealPage = lazyPage(CfuPages, "CfuMatchingRevealPage");
const CfuMatchingCappedPage = lazyPage(CfuPages, "CfuMatchingCappedPage");
const CfuTeacherPage = lazyPage(CfuPages, "CfuTeacherPage");
const CfuTeacherCheckboxesPage = lazyPage(CfuPages, "CfuTeacherCheckboxesPage");
const CfuTeacherFreeResponsePage = lazyPage(
  CfuPages,
  "CfuTeacherFreeResponsePage",
);
const CfuTeacherMatchingPage = lazyPage(CfuPages, "CfuTeacherMatchingPage");
const CfuTeacherAsStudentPage = lazyPage(CfuPages, "CfuTeacherAsStudentPage");
const CfuTeacherAsStudentCheckboxesPage = lazyPage(
  CfuPages,
  "CfuTeacherAsStudentCheckboxesPage",
);
const CfuTeacherAsStudentFreeResponsePage = lazyPage(
  CfuPages,
  "CfuTeacherAsStudentFreeResponsePage",
);
const CfuTeacherAsStudentMatchingPage = lazyPage(
  CfuPages,
  "CfuTeacherAsStudentMatchingPage",
);
const CfuTeacherResponsePage = lazyPage(CfuPages, "CfuTeacherResponsePage");
const CfuTeacherResponseCheckboxesPage = lazyPage(
  CfuPages,
  "CfuTeacherResponseCheckboxesPage",
);
const CfuTeacherResponseFreeResponsePage = lazyPage(
  CfuPages,
  "CfuTeacherResponseFreeResponsePage",
);
const CfuTeacherResponseMatchingPage = lazyPage(
  CfuPages,
  "CfuTeacherResponseMatchingPage",
);
const QuizPages = () => import("./pages/quiz/QuizPages");
const QuizPracticePage = lazyPage(QuizPages, "QuizPracticePage");
const QuizExamRetriesPage = lazyPage(QuizPages, "QuizExamRetriesPage");
const QuizExamFinalPage = lazyPage(QuizPages, "QuizExamFinalPage");
const QuizExamPage = lazyPage(QuizPages, "QuizExamPage");
const QuizExamResumePage = lazyPage(QuizPages, "QuizExamResumePage");
const QuizTeacherPage = lazyPage(QuizPages, "QuizTeacherPage");
const QuizTeacherAsStudentPage = lazyPage(QuizPages, "QuizTeacherAsStudentPage");
const QuizTeacherResponsePage = lazyPage(QuizPages, "QuizTeacherResponsePage");
const QuizTeacherResponseSubmittedPage = lazyPage(
  QuizPages,
  "QuizTeacherResponseSubmittedPage",
);
const MatchConnectorCodeLevelPage = lazyPage(
  () => import("./pages/match/MatchConnectorCodeLevelPage"),
  "MatchConnectorCodeLevelPage",
);
const MatchConnectorImageLevelPage = lazyPage(
  () => import("./pages/match/MatchConnectorImageLevelPage"),
  "MatchConnectorImageLevelPage",
);
const MatchConnectorLevelPage = lazyPage(
  () => import("./pages/match/MatchConnectorLevelPage"),
  "MatchConnectorLevelPage",
);
const MatchDefinitionBankLevelPage = lazyPage(
  () => import("./pages/match/MatchDefinitionBankLevelPage"),
  "MatchDefinitionBankLevelPage",
);
const MatchSwipeCodeLevelPage = lazyPage(
  () => import("./pages/match/MatchSwipeCodeLevelPage"),
  "MatchSwipeCodeLevelPage",
);
const MatchSwipeLevelPage = lazyPage(
  () => import("./pages/match/MatchSwipeLevelPage"),
  "MatchSwipeLevelPage",
);
const DragDropParsonsLevelPage = lazyPage(
  () => import("./pages/drag-drop/DragDropParsonsLevelPage"),
  "DragDropParsonsLevelPage",
);
const DragDropCategorizationLevelPage = lazyPage(
  () => import("./pages/drag-drop/DragDropCategorizationLevelPage"),
  "DragDropCategorizationLevelPage",
);
const DragDropCategorizationLongTextLevelPage = lazyPage(
  () => import("./pages/drag-drop/DragDropCategorizationLongTextLevelPage"),
  "DragDropCategorizationLongTextLevelPage",
);
const DragDropParsonsCodeRefLevelPage = lazyPage(
  () => import("./pages/drag-drop/DragDropParsonsCodeRefLevelPage"),
  "DragDropParsonsCodeRefLevelPage",
);
const FillInBlankLevelPage = lazyPage(
  () => import("./pages/fill-in-blank/FillInBlankLevelPage"),
  "FillInBlankLevelPage",
);
const FillInBlankMultiLevelPage = lazyPage(
  () => import("./pages/fill-in-blank/FillInBlankMultiLevelPage"),
  "FillInBlankMultiLevelPage",
);
const FillInBlankCodeRefLevelPage = lazyPage(
  () => import("./pages/fill-in-blank/FillInBlankCodeRefLevelPage"),
  "FillInBlankCodeRefLevelPage",
);
const MultiChoiceAllThatApplyLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceAllThatApplyLevelPage"),
  "MultiChoiceAllThatApplyLevelPage",
);
const MultiChoiceAuthoringArrayListLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceAuthoringArrayListLevelPage"),
  "MultiChoiceAuthoringArrayListLevelPage",
);
const MultiChoiceAuthoringCodeLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceAuthoringCodeLevelPage"),
  "MultiChoiceAuthoringCodeLevelPage",
);
const MultiChoiceAuthoringLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceAuthoringLevelPage"),
  "MultiChoiceAuthoringLevelPage",
);
const MultiChoiceAuthoringMediaLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceAuthoringMediaLevelPage"),
  "MultiChoiceAuthoringMediaLevelPage",
);
const MultiChoiceLevelPage = lazyPage(
  () => import("./pages/multi-choice/MultiChoiceLevelPage"),
  "MultiChoiceLevelPage",
);
const AgenticCrewLevelPage = lazyPage(
  () => import("./pages/progression/AgenticCrewLevelPage"),
  "AgenticCrewLevelPage",
);
const AgenticProgressionPages = () =>
  import("./pages/progression/AgenticProgressionPages");
const AgenticLevel2Page = lazyPage(AgenticProgressionPages, "AgenticLevel2Page");
const AgenticLevel3Page = lazyPage(AgenticProgressionPages, "AgenticLevel3Page");
const AgenticLevel4Page = lazyPage(AgenticProgressionPages, "AgenticLevel4Page");
const AgenticLevel5Page = lazyPage(AgenticProgressionPages, "AgenticLevel5Page");
const AgenticMissionLevelPage = lazyPage(
  () => import("./pages/progression/AgenticMissionLevelPage"),
  "AgenticMissionLevelPage",
);
const ProgressionBranchWebLabPage = () =>
  import("./pages/progression/ProgressionBranchWebLabPage");
const ProgressionBranchColorPage = lazyPage(
  ProgressionBranchWebLabPage,
  "ProgressionBranchColorPage",
);
const ProgressionBranchLayoutPage = lazyPage(
  ProgressionBranchWebLabPage,
  "ProgressionBranchLayoutPage",
);
const ProgressionBranchMediaPage = lazyPage(
  ProgressionBranchWebLabPage,
  "ProgressionBranchMediaPage",
);
const ProgressionBubbleChoicePage = lazyPage(
  () => import("./pages/progression/ProgressionBubbleChoicePage"),
  "ProgressionBubbleChoicePage",
);
const ProgressionFreeResponsePage = lazyPage(
  () => import("./pages/progression/ProgressionFreeResponsePage"),
  "ProgressionFreeResponsePage",
);
const ProgressionLevelGroupPage = lazyPage(
  () => import("./pages/progression/ProgressionLevelGroupPage"),
  "ProgressionLevelGroupPage",
);
const ProgressionWebLabPage = lazyPage(
  () => import("./pages/progression/ProgressionWebLabPage"),
  "ProgressionWebLabPage",
);
const PythonLabBlankProjectLevelPage = lazyPage(
  () => import("./pages/pythonlab/PythonLabBlankProjectLevelPage"),
  "PythonLabBlankProjectLevelPage",
);
const PythonLabLevelPage = lazyPage(
  () => import("./pages/pythonlab/PythonLabLevelPage"),
  "PythonLabLevelPage",
);
const WebLab2BlankDemoProjectLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2BlankDemoProjectLevelPage"),
  "WebLab2BlankDemoProjectLevelPage",
);
const WebLab2GenericLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2GenericLevelPage"),
  "WebLab2GenericLevelPage",
);
const WebLab2DemoProjectLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2DemoProjectLevelPage"),
  "WebLab2DemoProjectLevelPage",
);
const WebLab2TutorActionCardLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2TutorActionCardLevelPage"),
  "WebLab2TutorActionCardLevelPage",
);
const WebLab2FileChipTabsLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2FileChipTabsLevelPage"),
  "WebLab2FileChipTabsLevelPage",
);
const WebLab2DrawerImprovementsLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2DrawerImprovementsLevelPage"),
  "WebLab2DrawerImprovementsLevelPage",
);
const WebLab2DrawerInstructionsTabLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2DrawerInstructionsTabLevelPage"),
  "WebLab2DrawerInstructionsTabLevelPage",
);
const WebLab2DrawerNotificationHaloLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2DrawerNotificationHaloLevelPage"),
  "WebLab2DrawerNotificationHaloLevelPage",
);
const WebLab2UploadMechanismsPages = () =>
  import("./pages/weblab2/WebLab2UploadMechanismsLevelPage");
const UploadMechanismsStagedLevelPage = lazyPage(
  WebLab2UploadMechanismsPages,
  "UploadMechanismsStagedLevelPage",
);
const UploadMechanismsActionCardLevelPage = lazyPage(
  WebLab2UploadMechanismsPages,
  "UploadMechanismsActionCardLevelPage",
);
const UploadMechanismsFileChipLevelPage = lazyPage(
  WebLab2UploadMechanismsPages,
  "UploadMechanismsFileChipLevelPage",
);
const WebLab2BackpackFilteringPages = () =>
  import("./pages/weblab2/WebLab2BackpackFilteringLevelPage");
const BackpackFilterSectionsLevelPage = lazyPage(
  WebLab2BackpackFilteringPages,
  "BackpackFilterSectionsLevelPage",
);
const BackpackFilterPillsLevelPage = lazyPage(
  WebLab2BackpackFilteringPages,
  "BackpackFilterPillsLevelPage",
);
const BackpackFilterToggleLevelPage = lazyPage(
  WebLab2BackpackFilteringPages,
  "BackpackFilterToggleLevelPage",
);
const BackpackFilterDropdownLevelPage = lazyPage(
  WebLab2BackpackFilteringPages,
  "BackpackFilterDropdownLevelPage",
);
const BackpackFilterTypeAvailabilityLevelPage = lazyPage(
  WebLab2BackpackFilteringPages,
  "BackpackFilterTypeAvailabilityLevelPage",
);
const BackpackCrossLabPages = () =>
  import("./pages/progression/BackpackCrossLabProgressionPages");
const BackpackCrossLabSketchLevelPage = lazyPage(
  BackpackCrossLabPages,
  "BackpackCrossLabSketchLevelPage",
);
const BackpackCrossLabWebLevelPage = lazyPage(
  BackpackCrossLabPages,
  "BackpackCrossLabWebLevelPage",
);
const BackpackCrossLabAiChatLevelPage = lazyPage(
  BackpackCrossLabPages,
  "BackpackCrossLabAiChatLevelPage",
);
const BackpackCrossLabPythonLevelPage = lazyPage(
  BackpackCrossLabPages,
  "BackpackCrossLabPythonLevelPage",
);
const WebLab2ValidationLevel = lazyPage(
  () => import("./pages/weblab2/WebLab2ValidationLevel"),
  "WebLab2ValidationLevel",
);
const WebLab2ValidationPhotoCarouselLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2ValidationPhotoCarouselLevelPage"),
  "WebLab2ValidationPhotoCarouselLevelPage",
);
const WebLab2ValidationLoopStylePolishLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2ValidationLoopStylePolishLevelPage"),
  "WebLab2ValidationLoopStylePolishLevelPage",
);
const WebLab2ValidationPromiseTraceLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2ValidationPromiseTraceLevelPage"),
  "WebLab2ValidationPromiseTraceLevelPage",
);
const WebLab2ValidationStarshipLoaderLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2ValidationStarshipLoaderLevelPage"),
  "WebLab2ValidationStarshipLoaderLevelPage",
);
const WebLab2FeatureRouletteLevelPage = lazyPage(
  () => import("./pages/weblab2/WebLab2FeatureRouletteLevelPage"),
  "WebLab2FeatureRouletteLevelPage",
);
const TeacherDashboardPage = lazyPage(
  () => import("./pages/teacher-dashboard/TeacherDashboardPage"),
  "default",
);
const TeacherProgressPage = lazyPage(
  () => import("./pages/teacher-dashboard/progress/TeacherProgressPage"),
  "default",
);

export default function App() {
  usePageTitle();

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/levels" replace />} />
        <Route path="/levels" element={<LevelsIndexPage />} />
        <Route path="/design-system/colors" element={<ColorSandboxPage />} />
        <Route
          path="/design-system/typography"
          element={<TypographySandboxPage />}
        />
        <Route path="/design-system/cads" element={<CadsParityPage />} />
        <Route path="/levels/aichatlab" element={<AiChatLabLevelPage />} />
        <Route
          path="/levels/aichatlab-setup"
          element={<AiChatLabSetupLevelPage />}
        />
        <Route
          path="/levels/aichatlab-model-card"
          element={<AiChatLabModelCardLevelPage />}
        />
        <Route path="/levels/ailab" element={<AiLabLevelPage />} />
        <Route
          path="/levels/ailab-pretrained"
          element={<AiLabPretrainedLevelPage />}
        />
        <Route
          path="/levels/ailab-guided"
          element={<AiLabGuidedLevelPage />}
        />
        <Route path="/levels/sketchlab" element={<SketchLabLevelPage />} />
        <Route
          path="/levels/sketchlab-blank"
          element={<SketchLabBlankProjectLevelPage />}
        />
        <Route path="/levels/pythonlab" element={<PythonLabLevelPage />} />
        <Route
          path="/levels/pythonlab-blank"
          element={<PythonLabBlankProjectLevelPage />}
        />
        <Route
          path="/levels/weblab2-tutor-action-card"
          element={<WebLab2TutorActionCardLevelPage />}
        />
        <Route
          path="/levels/weblab2-file-chip-tabs"
          element={<WebLab2FileChipTabsLevelPage />}
        />
        <Route
          path="/levels/weblab2-drawer-improvements"
          element={<WebLab2DrawerImprovementsLevelPage />}
        />
        <Route
          path="/levels/weblab2-drawer-instructions-tab"
          element={<WebLab2DrawerInstructionsTabLevelPage />}
        />
        <Route
          path="/levels/weblab2-drawer-notification-halo"
          element={<WebLab2DrawerNotificationHaloLevelPage />}
        />
        <Route
          path="/levels/weblab2-level"
          element={<WebLab2GenericLevelPage />}
        />
        <Route
          path="/levels/weblab2-demo-project"
          element={<WebLab2DemoProjectLevelPage />}
        />
        <Route
          path="/levels/weblab2-demo-project-blank"
          element={<WebLab2BlankDemoProjectLevelPage />}
        />
        <Route
          path="/levels/weblab2-validation-test"
          element={<WebLab2ValidationLevel />}
        />
        <Route
          path="/levels/progression-upload-mechanisms-staged"
          element={<UploadMechanismsStagedLevelPage />}
        />
        <Route
          path="/levels/progression-upload-mechanisms-action-card"
          element={<UploadMechanismsActionCardLevelPage />}
        />
        <Route
          path="/levels/progression-upload-mechanisms-file-chip"
          element={<UploadMechanismsFileChipLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter-sections"
          element={<BackpackFilterSectionsLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter-pills"
          element={<BackpackFilterPillsLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter-toggle"
          element={<BackpackFilterToggleLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter-dropdown"
          element={<BackpackFilterDropdownLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter-type-availability"
          element={<BackpackFilterTypeAvailabilityLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-filter"
          element={
            <Navigate
              to="/levels/progression-backpack-filter-sections"
              replace
            />
          }
        />
        <Route
          path="/levels/progression-backpack-labs-sketch"
          element={<BackpackCrossLabSketchLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-labs-web"
          element={<BackpackCrossLabWebLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-labs-aichat"
          element={<BackpackCrossLabAiChatLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-labs-python"
          element={<BackpackCrossLabPythonLevelPage />}
        />
        <Route
          path="/levels/progression-backpack-labs"
          element={
            <Navigate
              to="/levels/progression-backpack-labs-web"
              replace
            />
          }
        />
        <Route
          path="/levels/progression-weblab2-validation-fix"
          element={<WebLab2ValidationPhotoCarouselLevelPage />}
        />
        <Route
          path="/levels/progression-weblab2-validation-create"
          element={<WebLab2ValidationLoopStylePolishLevelPage />}
        />
        <Route
          path="/levels/progression-weblab2-validation-refine"
          element={<WebLab2ValidationPromiseTraceLevelPage />}
        />
        <Route
          path="/levels/progression-weblab2-validation-sandbox"
          element={<WebLab2ValidationStarshipLoaderLevelPage />}
        />
        <Route
          path="/levels/progression-weblab2-validation-feature-roulette"
          element={<WebLab2FeatureRouletteLevelPage />}
        />
        <Route
          path="/levels/progression-feature-roulette"
          element={
            <Navigate
              to="/levels/progression-weblab2-validation-feature-roulette"
              replace
            />
          }
        />
        <Route path="/levels/multi" element={<MultiChoiceLevelPage />} />
        <Route
          path="/levels/multi-authoring"
          element={<MultiChoiceAuthoringLevelPage />}
        />
        <Route
          path="/levels/multi-authoring-code"
          element={<MultiChoiceAuthoringCodeLevelPage />}
        />
        <Route
          path="/levels/multi-authoring-media"
          element={<MultiChoiceAuthoringMediaLevelPage />}
        />
        <Route
          path="/levels/multi-authoring-arraylist"
          element={<MultiChoiceAuthoringArrayListLevelPage />}
        />
        <Route
          path="/levels/multi-all-that-apply"
          element={<MultiChoiceAllThatApplyLevelPage />}
        />
        <Route path="/levels/free-response" element={<FreeResponseLevelPage />} />
        <Route
          path="/levels/free-response-reveal"
          element={<FreeResponseRevealLevelPage />}
        />
        <Route
          path="/levels/free-response-markdown"
          element={<FreeResponseMarkdownLevelPage />}
        />
        <Route
          path="/levels/free-response-upload"
          element={<FreeResponseUploadLevelPage />}
        />
        <Route
          path="/levels/match-definition-bank"
          element={<MatchDefinitionBankLevelPage />}
        />
        <Route
          path="/levels/match-connector"
          element={<MatchConnectorLevelPage />}
        />
        <Route
          path="/levels/match-connector-images"
          element={<MatchConnectorImageLevelPage />}
        />
        <Route
          path="/levels/match-connector-code"
          element={<MatchConnectorCodeLevelPage />}
        />
        <Route
          path="/levels/match-swipe-cards"
          element={<MatchSwipeLevelPage />}
        />
        <Route
          path="/levels/match-swipe-code"
          element={<MatchSwipeCodeLevelPage />}
        />
        <Route
          path="/levels/drag-drop-parsons"
          element={<DragDropParsonsLevelPage />}
        />
        <Route
          path="/levels/drag-drop-categorization"
          element={<DragDropCategorizationLevelPage />}
        />
        <Route
          path="/levels/drag-drop-categorization-long-text"
          element={<DragDropCategorizationLongTextLevelPage />}
        />
        <Route
          path="/levels/drag-drop-parsons-code-ref"
          element={<DragDropParsonsCodeRefLevelPage />}
        />
        <Route path="/levels/fill-in-blank" element={<FillInBlankLevelPage />} />
        <Route
          path="/levels/fill-in-blank-multi"
          element={<FillInBlankMultiLevelPage />}
        />
        <Route
          path="/levels/fill-in-blank-code-ref"
          element={<FillInBlankCodeRefLevelPage />}
        />
        <Route
          path="/levels/assessment-builder-new"
          element={<AssessmentBuilderNewPage />}
        />
        <Route
          path="/levels/assessment-builder-seeded"
          element={<AssessmentBuilderSeededPage />}
        />
        <Route
          path="/levels/assessment-builder-p0"
          element={<AssessmentBuilderP0Page />}
        />
        <Route
          path="/levels/assessment-builder-p0-draft"
          element={<AssessmentBuilderP0DraftPage />}
        />
        <Route
          path="/levels/assessment-builder-p0-cfu"
          element={<AssessmentBuilderP0CfuPage />}
        />
        <Route path="/levels/cfu-multi" element={<CfuMultiPage />} />
        <Route path="/levels/cfu-multi-retry" element={<CfuMultiRetryPage />} />
        <Route
          path="/levels/cfu-multi-continue"
          element={<CfuMultiContinuePage />}
        />
        <Route path="/levels/cfu-multi-reveal" element={<CfuMultiRevealPage />} />
        <Route path="/levels/cfu-multi-capped" element={<CfuMultiCappedPage />} />
        <Route
          path="/levels/cfu-multi-checkboxes"
          element={<CfuMultiCheckboxesPage />}
        />
        <Route
          path="/levels/cfu-multi-checkboxes-continue"
          element={<CfuMultiCheckboxesContinuePage />}
        />
        <Route
          path="/levels/cfu-multi-checkboxes-no-retry"
          element={<CfuMultiCheckboxesNoRetryPage />}
        />
        <Route
          path="/levels/cfu-multi-checkboxes-reveal"
          element={<CfuMultiCheckboxesRevealPage />}
        />
        <Route
          path="/levels/cfu-multi-checkboxes-capped"
          element={<CfuMultiCheckboxesCappedPage />}
        />
        <Route
          path="/levels/cfu-free-response"
          element={<CfuFreeResponsePage />}
        />
        <Route
          path="/levels/cfu-free-response-reveal"
          element={<CfuFreeResponseRevealPage />}
        />
        <Route
          path="/levels/cfu-free-response-capped"
          element={<CfuFreeResponseCappedPage />}
        />
        <Route path="/levels/cfu-matching" element={<CfuMatchingPage />} />
        <Route
          path="/levels/cfu-matching-retry"
          element={<CfuMatchingRetryPage />}
        />
        <Route
          path="/levels/cfu-matching-reattempt"
          element={<CfuMatchingReattemptPage />}
        />
        <Route
          path="/levels/cfu-matching-continue"
          element={<CfuMatchingContinuePage />}
        />
        <Route
          path="/levels/cfu-matching-reveal"
          element={<CfuMatchingRevealPage />}
        />
        <Route
          path="/levels/cfu-matching-capped"
          element={<CfuMatchingCappedPage />}
        />
        <Route path="/levels/cfu-teacher" element={<CfuTeacherPage />} />
        <Route
          path="/levels/cfu-teacher-checkboxes"
          element={<CfuTeacherCheckboxesPage />}
        />
        <Route
          path="/levels/cfu-teacher-free-response"
          element={<CfuTeacherFreeResponsePage />}
        />
        <Route
          path="/levels/cfu-teacher-matching"
          element={<CfuTeacherMatchingPage />}
        />
        <Route
          path="/levels/cfu-teacher-as-student"
          element={<CfuTeacherAsStudentPage />}
        />
        <Route
          path="/levels/cfu-teacher-as-student-checkboxes"
          element={<CfuTeacherAsStudentCheckboxesPage />}
        />
        <Route
          path="/levels/cfu-teacher-as-student-free-response"
          element={<CfuTeacherAsStudentFreeResponsePage />}
        />
        <Route
          path="/levels/cfu-teacher-as-student-matching"
          element={<CfuTeacherAsStudentMatchingPage />}
        />
        <Route
          path="/levels/cfu-teacher-response"
          element={<CfuTeacherResponsePage />}
        />
        <Route
          path="/levels/cfu-teacher-response-checkboxes"
          element={<CfuTeacherResponseCheckboxesPage />}
        />
        <Route
          path="/levels/cfu-teacher-response-free-response"
          element={<CfuTeacherResponseFreeResponsePage />}
        />
        <Route
          path="/levels/cfu-teacher-response-matching"
          element={<CfuTeacherResponseMatchingPage />}
        />
        <Route path="/levels/quiz-practice" element={<QuizPracticePage />} />
        <Route
          path="/levels/quiz-exam-retries"
          element={<QuizExamRetriesPage />}
        />
        <Route path="/levels/quiz-exam-final" element={<QuizExamFinalPage />} />
        <Route path="/levels/quiz-exam" element={<QuizExamPage />} />
        <Route
          path="/levels/quiz-exam-resume"
          element={<QuizExamResumePage />}
        />
        <Route path="/levels/quiz-teacher" element={<QuizTeacherPage />} />
        <Route
          path="/levels/quiz-teacher-as-student"
          element={<QuizTeacherAsStudentPage />}
        />
        <Route
          path="/levels/quiz-teacher-response"
          element={<QuizTeacherResponsePage />}
        />
        <Route
          path="/levels/quiz-teacher-response-submitted"
          element={<QuizTeacherResponseSubmittedPage />}
        />
        <Route
          path="/levels/levelgroup-scroll"
          element={<LevelGroupScrollLevelPage />}
        />
        <Route
          path="/levels/levelgroup-scroll-sticky-footer"
          element={<LevelGroupScrollStickyFooterLevelPage />}
        />
        <Route
          path="/levels/levelgroup-stepped"
          element={<LevelGroupSteppedLevelPage />}
        />
        <Route
          path="/levels/levelgroup-stepped-dots"
          element={<LevelGroupSteppedDotsLevelPage />}
        />
        <Route
          path="/levels/levelgroup-stepped-intro"
          element={<LevelGroupSteppedIntroLevelPage />}
        />
        <Route
          path="/levels/levelgroup-demo-quiz"
          element={<DemoQuizLevelGroupLevelPage />}
        />
        <Route
          path="/levels/levelgroup-survey-intro"
          element={<LevelGroupSurveyIntroLevelPage />}
        />
        <Route
          path="/levels/multi-code-ref"
          element={<CodeRefMultiChoiceLevelPage />}
        />
        <Route
          path="/levels/multi-code-ref-multifile"
          element={<CodeRefMultiFileLevelPage />}
        />
        <Route
          path="/levels/multi-code-ref-editable"
          element={<CodeRefEditableLevelPage />}
        />
        <Route
          path="/levels/free-response-code-ref"
          element={<CodeRefFreeResponseLevelPage />}
        />
        <Route
          path="/levels/levelgroup-code-ref"
          element={<CodeRefLevelGroupLevelPage />}
        />
        <Route path="/levels/bubble-choice" element={<BubbleChoiceLevelPage />} />
        <Route
          path="/levels/bubble-choice-images"
          element={<BubbleChoiceImagesLevelPage />}
        />
        <Route
          path="/levels/progression-weblab"
          element={<ProgressionWebLabPage />}
        />
        <Route
          path="/levels/progression-free-response"
          element={<ProgressionFreeResponsePage />}
        />
        <Route
          path="/levels/progression-bubble-choice"
          element={<ProgressionBubbleChoicePage />}
        />
        <Route
          path="/levels/progression-branch-color"
          element={<ProgressionBranchColorPage />}
        />
        <Route
          path="/levels/progression-branch-layout"
          element={<ProgressionBranchLayoutPage />}
        />
        <Route
          path="/levels/progression-branch-media"
          element={<ProgressionBranchMediaPage />}
        />
        <Route
          path="/levels/progression-levelgroup"
          element={<ProgressionLevelGroupPage />}
        />
        <Route path="/levels/agentic-crew" element={<AgenticCrewLevelPage />} />
        <Route path="/levels/agentic-inspect" element={<AgenticLevel2Page />} />
        <Route
          path="/levels/agentic-configure"
          element={<AgenticLevel3Page />}
        />
        <Route
          path="/levels/agentic-orchestrate"
          element={<AgenticLevel4Page />}
        />
        <Route
          path="/levels/agentic-standalone"
          element={<AgenticLevel5Page />}
        />
        <Route
          path="/levels/agentic-mission"
          element={<AgenticMissionLevelPage />}
        />
        <Route
          path="/levels/teacher-dashboard"
          element={<TeacherDashboardPage />}
        />
        <Route
          path="/levels/teacher-dashboard/progress"
          element={<TeacherProgressPage />}
        />
        <Route path="*" element={<Navigate to="/levels" replace />} />
      </Routes>
    </Suspense>
  );
}