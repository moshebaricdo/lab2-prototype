import { Navigate, Route, Routes } from "react-router-dom";
import { BubbleChoiceLevelPage } from "./pages/BubbleChoiceLevelPage";
import { FreeResponseLevelPage } from "./pages/FreeResponseLevelPage";
import { LevelGroupLevelPage } from "./pages/LevelGroupLevelPage";
import { LevelsIndexPage } from "./pages/LevelsIndexPage";
import { MatchLevelPage } from "./pages/MatchLevelPage";
import { MultiChoiceLevelPage } from "./pages/MultiChoiceLevelPage";
import { WebLab2LevelPage } from "./pages/WebLab2LevelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/levels" replace />} />
      <Route path="/levels" element={<LevelsIndexPage />} />
      <Route path="/levels/weblab2" element={<WebLab2LevelPage />} />
      <Route path="/levels/multi" element={<MultiChoiceLevelPage />} />
      <Route path="/levels/free-response" element={<FreeResponseLevelPage />} />
      <Route path="/levels/match" element={<MatchLevelPage />} />
      <Route path="/levels/levelgroup" element={<LevelGroupLevelPage />} />
      <Route path="/levels/bubble-choice" element={<BubbleChoiceLevelPage />} />
      <Route path="*" element={<Navigate to="/levels" replace />} />
    </Routes>
  );
}