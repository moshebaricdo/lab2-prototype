import { Navigate, Route, Routes } from "react-router-dom";
import { BubbleChoiceImagesLevelPage } from "./pages/BubbleChoiceImagesLevelPage";
import { BubbleChoiceLevelPage } from "./pages/BubbleChoiceLevelPage";
import { CodeRefFreeResponseLevelPage } from "./pages/CodeRefFreeResponseLevelPage";
import { CodeRefLevelGroupLevelPage } from "./pages/CodeRefLevelGroupLevelPage";
import { CodeRefMultiChoiceLevelPage } from "./pages/CodeRefMultiChoiceLevelPage";
import { FreeResponseLevelPage } from "./pages/FreeResponseLevelPage";
import { FreeResponseMarkdownLevelPage } from "./pages/FreeResponseMarkdownLevelPage";
import { FreeResponseRevealLevelPage } from "./pages/FreeResponseRevealLevelPage";
import { FreeResponseUploadLevelPage } from "./pages/FreeResponseUploadLevelPage";
import { LevelGroupScrollLevelPage } from "./pages/LevelGroupScrollLevelPage";
import { LevelGroupScrollStickyFooterLevelPage } from "./pages/LevelGroupScrollStickyFooterLevelPage";
import { LevelGroupSteppedDotsLevelPage } from "./pages/LevelGroupSteppedDotsLevelPage";
import { LevelGroupSteppedIntroLevelPage } from "./pages/LevelGroupSteppedIntroLevelPage";
import { LevelGroupSurveyIntroLevelPage } from "./pages/LevelGroupSurveyIntroLevelPage";
import { LevelGroupSteppedLevelPage } from "./pages/LevelGroupSteppedLevelPage";
import { LevelsIndexPage } from "./pages/LevelsIndexPage";
import { MatchConnectorCodeLevelPage } from "./pages/MatchConnectorCodeLevelPage";
import { MatchConnectorImageLevelPage } from "./pages/MatchConnectorImageLevelPage";
import { MatchConnectorLevelPage } from "./pages/MatchConnectorLevelPage";
import { MatchDefinitionBankLevelPage } from "./pages/MatchDefinitionBankLevelPage";
import { MultiChoiceAllThatApplyLevelPage } from "./pages/MultiChoiceAllThatApplyLevelPage";
import { MultiChoiceAuthoringArrayListLevelPage } from "./pages/MultiChoiceAuthoringArrayListLevelPage";
import { MultiChoiceAuthoringCodeLevelPage } from "./pages/MultiChoiceAuthoringCodeLevelPage";
import { MultiChoiceAuthoringLevelPage } from "./pages/MultiChoiceAuthoringLevelPage";
import { MultiChoiceAuthoringMediaLevelPage } from "./pages/MultiChoiceAuthoringMediaLevelPage";
import { MultiChoiceLevelPage } from "./pages/MultiChoiceLevelPage";
import { WebLab2DrawerFadeLevelPage } from "./pages/WebLab2DrawerFadeLevelPage";
import { WebLab2DrawerInlineLinkLevelPage } from "./pages/WebLab2DrawerInlineLinkLevelPage";
import { WebLab2FileDropLevelPage } from "./pages/WebLab2FileDropLevelPage";
import { WebLab2LevelPage } from "./pages/WebLab2LevelPage";
import { WebLab2SendAffordanceLevelPage } from "./pages/WebLab2SendAffordanceLevelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/levels" replace />} />
      <Route path="/levels" element={<LevelsIndexPage />} />
      <Route path="/levels/weblab2" element={<WebLab2LevelPage />} />
      <Route
        path="/levels/weblab2-send-affordance"
        element={<WebLab2SendAffordanceLevelPage />}
      />
      <Route
        path="/levels/weblab2-file-drop"
        element={<WebLab2FileDropLevelPage />}
      />
      <Route
        path="/levels/weblab2-drawer-fade"
        element={<WebLab2DrawerFadeLevelPage />}
      />
      <Route
        path="/levels/weblab2-drawer-inline-link"
        element={<WebLab2DrawerInlineLinkLevelPage />}
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
      <Route path="*" element={<Navigate to="/levels" replace />} />
    </Routes>
  );
}