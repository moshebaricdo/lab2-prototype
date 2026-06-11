import { useMemo } from "react";
import { WebLab2LevelPage } from "../weblab2/WebLab2LevelPage";
import { buildAgenticStarterTree, crewLevel1Specialists } from "../../data/agentic";
import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import { agenticProgressionLinks } from "../levelTypeLinks";

const instructionsMarkdown = `# Working with specialist agents

Your portfolio's **project gallery** needs styling — the cards currently stack
in a plain column.

This level adds **specialist agents** to the AI panel. Each agent has one job
and a small, visible **context window**: switch agents in the bar above the
composer, and use ⓘ to inspect what the active one can and can't see.

1. Ask the **Tutor** what's wrong with the gallery.
2. Have **Plan** draft a project plan — notice it can't see your code.
3. Hand off to **Design** — it builds from the plan, not your chat.
4. Review each proposed change, then accept or reject it. You decide what ships.
`;

/**
 * Direction A on the real harness: a standard WebLab2LevelPage with
 * `agentConfig` — no custom page machinery (V4 spec, Track 1). Live tutor
 * runs only; without an API key the panel returns the standard
 * "add an API key" fallback.
 */
export function AgenticCrewLevelPage() {
  const navigate = useShareAwareNavigate();
  const starterTree = useMemo(() => buildAgenticStarterTree(), []);

  return (
    <WebLab2LevelPage
      title="Web Lab 2: Meet the Agents"
      currentLevelPath="/levels/agentic-crew"
      levelLinks={agenticProgressionLinks}
      currentLevel={1}
      totalLevels={5}
      tutorMode={{ kind: "functional" }}
      useFilePreview
      initialViewMode="split"
      fileStructureOverride={starterTree}
      instructionsMarkdown={instructionsMarkdown}
      storageKeySuffix="agentic-crew-v4"
      agentConfig={{
        specialists: crewLevel1Specialists,
        allowCustomization: false,
        allowAgentLibrary: false,
      }}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/agentic-inspect")}
    />
  );
}
