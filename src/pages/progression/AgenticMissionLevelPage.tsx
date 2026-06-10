import { useState } from "react";
import { Lab2Shell } from "../../components/lab2/Lab2Shell";
import { MissionControlBoard } from "../../components/agentic/mission/MissionControlBoard";
import { galleryMission, missionTaskScripts } from "../../data/agentic";
import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import { agenticProgressionLinks } from "../levelTypeLinks";

export function AgenticMissionLevelPage() {
  const navigate = useShareAwareNavigate();
  const [isComplete, setIsComplete] = useState(false);

  return (
    <Lab2Shell
      hideResourcePanel
      topNavigationProps={{
        title: "Agentic AI: Mission Control",
        subtitle: "Direction B demo — you run the agents",
        currentLevel: 2,
        totalLevels: 2,
        completedLevels: isComplete ? [1, 2] : [1],
        levelLinks: agenticProgressionLinks,
        currentLevelPath: "/levels/agentic-mission",
        showContinueButton: true,
        continueLabel: isComplete ? "Finish" : "Finish (mission incomplete)",
        onContinue: () => navigate("/levels"),
      }}
    >
      <MissionControlBoard
        mission={galleryMission}
        scripts={missionTaskScripts}
        onMissionComplete={() => setIsComplete(true)}
      />
    </Lab2Shell>
  );
}
