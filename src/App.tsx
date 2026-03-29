import { Navigate, Route, Routes } from "react-router-dom";
import { BubbleChoiceLevelPage } from "./pages/BubbleChoiceLevelPage";
import { FreeResponseLevelPage } from "./pages/FreeResponseLevelPage";
import { FreeResponseMarkdownLevelPage } from "./pages/FreeResponseMarkdownLevelPage";
import { FreeResponseRevealLevelPage } from "./pages/FreeResponseRevealLevelPage";
import { FreeResponseUploadLevelPage } from "./pages/FreeResponseUploadLevelPage";
import { LevelGroupLevelPage } from "./pages/LevelGroupLevelPage";
import { LevelsIndexPage } from "./pages/LevelsIndexPage";
import { MatchLevelPage } from "./pages/MatchLevelPage";
import { MatchDefinitionBankLevelPage } from "./pages/MatchDefinitionBankLevelPage";
import { MultiChoiceAllThatApplyLevelPage } from "./pages/MultiChoiceAllThatApplyLevelPage";
import { MultiChoiceAuthoringArrayListLevelPage } from "./pages/MultiChoiceAuthoringArrayListLevelPage";
import { MultiChoiceAuthoringCodeLevelPage } from "./pages/MultiChoiceAuthoringCodeLevelPage";
import { MultiChoiceAuthoringLevelPage } from "./pages/MultiChoiceAuthoringLevelPage";
import { MultiChoiceAuthoringMediaLevelPage } from "./pages/MultiChoiceAuthoringMediaLevelPage";
import { MultiChoiceLevelPage } from "./pages/MultiChoiceLevelPage";
import { WebLab2LevelPage } from "./pages/WebLab2LevelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/levels" replace />} />
      <Route path="/levels" element={<LevelsIndexPage />} />
      <Route path="/levels/weblab2" element={<WebLab2LevelPage />} />
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
      <Route path="/levels/match" element={<MatchLevelPage />} />
      <Route
        path="/levels/match-definition-bank"
        element={<MatchDefinitionBankLevelPage />}
      />
      <Route path="/levels/levelgroup" element={<LevelGroupLevelPage />} />
      <Route path="/levels/bubble-choice" element={<BubbleChoiceLevelPage />} />
      <Route path="*" element={<Navigate to="/levels" replace />} />
    </Routes>
  );
}