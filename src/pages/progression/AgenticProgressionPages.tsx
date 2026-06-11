import { useMemo } from "react";
import { WebLab2LevelPage } from "../weblab2/WebLab2LevelPage";
import { buildAgenticStarterTree, crewSpecialists } from "../../data/agentic";
import { useShareAwareNavigate } from "../../hooks/useLevelShareMode";
import { agenticProgressionLinks } from "../levelTypeLinks";
import type { FileItem } from "../../types/file";

/**
 * Levels 2–5 of the agentic sample progression (V4 spec, Track 3).
 * The arc: discover → inspect → configure → orchestrate → own.
 * Every level is a plain WebLab2LevelPage + agentConfig — that's the point.
 * (Level 1 lives in AgenticCrewLevelPage.tsx.)
 */

const level2Instructions = `# Look inside an agent

Every agent runs with a **context window** — the slice of your project it can
actually see — and a fixed set of capabilities.

**Accessibility** just joined your crew on this level.

1. Open the agent details (ⓘ next to the agent bar) for each agent.
2. Compare what's *in context right now* for the Tutor vs **Plan**.
3. Ask each agent about \`script.js\` — notice who can actually answer, and why.
4. Ask **Design** to change the page's behavior. Watch how it declines.
`;

const level3Instructions = `# Tune your crew

This level unlocks **agent configuration**: the toggles and standing
instructions in the agent details (ⓘ) are now editable — and they're real.
The instructions feed the agent's system prompt; the context toggles change
what gets packed into its window.

1. **Design** proposes loud, saturated styles by default here. Open its
   details and rewrite its **core prompt** to match your taste.
2. Turn **Hints first** off on the Tutor and compare its answers.
3. Scope **project code out** of the Tutor and ask it about your gallery —
   see what an agent without context is worth.
`;

const level4Instructions = `# Let the Tutor route

You've routed every request yourself. The Tutor can now **orchestrate**:
describe what you want, and it names the right specialist, writes the brief,
and proposes a dispatch — you approve every run.

1. Tell the Tutor your goal for this page.
2. Review the dispatch it proposes before pressing Run.
3. Every result still lands as a proposal you accept or reject.
`;

const blankFileStructure: FileItem[] = [];

export function AgenticLevel2Page() {
  const navigate = useShareAwareNavigate();
  const starterTree = useMemo(() => buildAgenticStarterTree(), []);
  return (
    <WebLab2LevelPage
      title="Web Lab 2: Look Inside an Agent"
      currentLevelPath="/levels/agentic-inspect"
      levelLinks={agenticProgressionLinks}
      currentLevel={2}
      totalLevels={5}
      tutorMode={{ kind: "functional" }}
      useFilePreview
      initialViewMode="split"
      fileStructureOverride={starterTree}
      instructionsMarkdown={level2Instructions}
      storageKeySuffix="agentic-l2"
      agentConfig={{
        specialists: crewSpecialists,
        allowCustomization: false,
        allowAgentLibrary: false,
      }}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/agentic-configure")}
    />
  );
}

export function AgenticLevel3Page() {
  const navigate = useShareAwareNavigate();
  const starterTree = useMemo(() => buildAgenticStarterTree(), []);
  return (
    <WebLab2LevelPage
      title="Web Lab 2: Tune Your Crew"
      currentLevelPath="/levels/agentic-configure"
      levelLinks={agenticProgressionLinks}
      currentLevel={3}
      totalLevels={5}
      tutorMode={{ kind: "functional" }}
      useFilePreview
      initialViewMode="split"
      fileStructureOverride={starterTree}
      instructionsMarkdown={level3Instructions}
      storageKeySuffix="agentic-l3"
      agentConfig={{
        specialists: crewSpecialists,
        allowCustomization: true,
        allowAgentLibrary: true,
      }}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/agentic-orchestrate")}
    />
  );
}

export function AgenticLevel4Page() {
  const navigate = useShareAwareNavigate();
  const starterTree = useMemo(() => buildAgenticStarterTree(), []);
  return (
    <WebLab2LevelPage
      title="Web Lab 2: Let the Tutor Route"
      currentLevelPath="/levels/agentic-orchestrate"
      levelLinks={agenticProgressionLinks}
      currentLevel={4}
      totalLevels={5}
      tutorMode={{ kind: "functional" }}
      useFilePreview
      initialViewMode="split"
      fileStructureOverride={starterTree}
      instructionsMarkdown={level4Instructions}
      storageKeySuffix="agentic-l4"
      agentConfig={{
        specialists: crewSpecialists,
        allowCustomization: true,
        allowAgentLibrary: true,
        // The Tutor proposes dispatches as Run cards; the student approves
        // every run (docs/agentic-v4-spec.md, Decision C).
        tutorRole: "orchestrator-assisted",
      }}
      continueLabel="Continue"
      onContinue={() => navigate("/levels/agentic-standalone")}
    />
  );
}

/**
 * Level 5 — the acid test: a blank standalone project with agents enabled.
 * No instructions, no seeds, no curriculum framing. If this needs anything
 * beyond config, the architecture isn't done.
 */
export function AgenticLevel5Page() {
  return (
    <WebLab2LevelPage
      title="Web Lab 2: New Project"
      currentLevelPath="/levels/agentic-standalone"
      levelLinks={agenticProgressionLinks}
      currentLevel={5}
      totalLevels={5}
      tutorMode={{ kind: "functional" }}
      tutorSupportContext="standalone-project"
      useFilePreview
      showOnlyFilesWithContent
      showInstructionsDrawer={false}
      fileStructureOverride={blankFileStructure}
      storageKeySuffix="agentic-l5"
      agentConfig={{
        specialists: crewSpecialists,
        allowCustomization: true,
        allowAgentLibrary: true,
        // Earned autonomy: dispatches run without per-step approval; results
        // still land as reviewable proposals (Decision C, top rung).
        tutorRole: "orchestrator-auto",
      }}
    />
  );
}
