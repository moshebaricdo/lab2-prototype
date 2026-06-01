import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

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

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/levels" replace />} />
        <Route path="/levels" element={<LevelsIndexPage />} />
        <Route path="/levels/aichatlab" element={<AiChatLabLevelPage />} />
        <Route
          path="/levels/aichatlab-setup"
          element={<AiChatLabSetupLevelPage />}
        />
        <Route
          path="/levels/aichatlab-model-card"
          element={<AiChatLabModelCardLevelPage />}
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
        <Route path="*" element={<Navigate to="/levels" replace />} />
      </Routes>
    </Suspense>
  );
}