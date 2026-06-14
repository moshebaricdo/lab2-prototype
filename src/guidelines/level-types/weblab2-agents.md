# Web Lab 2 — Specialist Agents

Optional capability on `WebLab2LevelPage`. When `agentConfig` is absent, the page behaves like any other Web Lab 2 level. When present, a specialist roster mounts above the Tutor composer and turns route through the active agent on the **same** functional Tutor pipeline (no parallel chat engine).

## Routes (sample progression)

Listed under **Agentic AI** on `/levels`:

| Route | Purpose |
| --- | --- |
| `/levels/agentic-crew` | Meet specialists (L1 roster) |
| `/levels/agentic-inspect` | Compare context windows |
| `/levels/agentic-configure` | Editable agent settings |
| `/levels/agentic-orchestrate` | Tutor proposes dispatches |
| `/levels/agentic-standalone` | Blank project + full roster |
| `/levels/agentic-mission` | Mission Control concept widget (Direction B UI only) |

Progression links: `agenticProgressionLinks` in `src/pages/levelTypeLinks.ts`.

## Key files

| Area | Path |
| --- | --- |
| Page prop + wiring | `src/pages/weblab2/WebLab2LevelPage.tsx` (`agentConfig?: AgentLevelConfig`) |
| Roster + modal UI | `src/components/agentic/crew/` (`AgentRosterStrip`, `AgentDetailModal`, `AgentLevelModals`, `useAgentLevelState`) |
| Types | `src/types/agentLab.ts` |
| Default roster data | `src/data/agentic/specialists.ts`, `src/data/agentic/index.ts` |
| Progression starter project | `src/data/weblab2/projects/agentic-portfolio/` (`agenticPortfolioFileStructure`; shared via `agenticProgressionCommon.ts`) |
| Specialist adapter | `src/lib/tutor/agents/specialistRun.ts` |
| Orchestrator dispatch | `src/lib/tutor/agents/orchestration.ts` |
| Saved agents (backpack) | `src/lib/backpack/agentBackpack.ts` |
| Sample level pages | `src/pages/progression/AgenticCrewLevelPage.tsx`, `AgenticProgressionPages.tsx`, `AgenticMissionLevelPage.tsx` |
| Dev panel | `src/pages/weblab2/webLab2DevPanel.ts` (Agents group) |
| Chat hand-off card | `src/components/lab2/resource-panel/views/ai-tutor/AgentHandOffCard.tsx` |

## Configuration

```ts
interface AgentLevelConfig {
  specialists: AgentSpecialist[];
  initialAgentId?: string;       // default "tutor"
  lockedAgentIds?: string[];       // hidden from roster (dev / progression)
  allowCustomization?: boolean;  // editable modal
  allowAgentLibrary?: boolean;   // save/recall via backpack + strip +
  tutorRole?: AgentTutorRole;    // see below
}
```

Each `AgentSpecialist` maps onto existing harness surfaces:

- `capabilities` → per-agent `TutorPolicy` (`useAgentLevelState.policyForSpecialist`)
- `contract` + effort/tools → `TutorRunnerContracts` addendum (`buildAgentSystemPrompt`)
- `contextScope` → pruned file tree passed to `tutorClient` (`filterTreeForAgent`)
- `writablePaths` → proposal clamp (`clampSpecialistChanges` in `useWebLab2TutorFlow`)
- Plan-producing agents → `planningFileName` from `produces` / `writablePaths` under `Plans/*.md`

## Runtime behavior

`useAgentLevelState` derives three values from the active specialist and swaps them into the page's normal `useWebLab2TutorFlow` inputs:

1. **TutorPolicy** — capability gates for the active agent
2. **Runner contracts** — agent system prompt addendum
3. **File tree filter** — only in-scope paths reach context packing

`wrapTutorSubmit` (when agents enabled):

- Inserts a slim **agent switch divider** (pill with icon + label) before the student's next message after a switch
- Forces **composer mode** per specialist: Plan → `plan`, edit agents → `build`, else → `help` (`specialistComposerMode`)
- When the Tutor **orchestrates**, parses a trailing `DISPATCH: {"agent","reason","brief"}` line into an `agentHandOff` card; **Run** switches agent and submits the brief

### Tutor roles (`tutorRole`)

| Value | Behavior |
| --- | --- |
| `tutor` | Student picks agents manually |
| `orchestrator-assisted` | Tutor may emit dispatch cards; student approves Run |
| `orchestrator-auto` | Pending dispatch cards auto-run (L5 standalone) |

Orchestration uses the guidance route with `buildOrchestrationContract` appended to runner contracts.

## Curricular copy rules

Agents are **tools**, not characters: functional labels (Plan, Design, Debug), no human names or personas, refer to an agent as "it". Scope limits are stated as facts about the tool.

## Dev panel

**Agents** group (`webLab2DevPanel.ts`): enable strip, initial agent, locked ids (comma-separated), allow customization, allow library, tutor role. Can also enable on any level via URL override `?o=` + base64 JSON including `"agentsEnabled": true`.

## Known gaps

- Workspace banner still says "AI Tutor made changes" for all proposing agents (does not name the active specialist).
- "Build from plan" uses the unwrapped submit path (no switch divider / orchestration wrapper).
- Mission Control (`AgenticMissionLevelPage`) is a separate orchestration UI prototype; crew levels use the strip + chat hand-offs only.
