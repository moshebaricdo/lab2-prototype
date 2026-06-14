import { WebLab2LevelPage } from "../weblab2/WebLab2LevelPage";
import { crewLevel1Specialists } from "../../data/agentic";
import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import {
  agenticProgressionCommonProps,
  agenticProgressionPaths,
} from "./agenticProgressionCommon";

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
 * Sample level: specialist agents on the real Web Lab 2 harness via `agentConfig`.
 * Live Tutor runs only; without an API key the panel uses the standard fallback.
 */
export function AgenticCrewLevelPage() {
  const navigate = useShareAwareNavigate();

  return (
    <WebLab2LevelPage
      {...agenticProgressionCommonProps(agenticProgressionPaths.crew, 1)}
      title="Web Lab 2: Meet the Agents"
      instructionsMarkdown={instructionsMarkdown}
      agentConfig={{
        specialists: crewLevel1Specialists,
        allowCustomization: false,
        allowAgentLibrary: false,
      }}
      continueLabel="Continue"
      onContinue={() => navigate(agenticProgressionPaths.inspect)}
    />
  );
}
