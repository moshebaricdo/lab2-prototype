# Agentic Web Lab 2 — Handoff (June 10, 2026)

For the next model/session picking this up (Cursor or otherwise). Read
`docs/agentic-v4-spec.md` first — it has the full design rationale, resolved
decisions (A–E), and per-phase status. This file is the operational map.

## Where the work lives — IMPORTANT

**The MAIN worktree (`/Users/MosheFrost/Projects/web-lab-prototype`) is the single
source of truth. All agentic work is UNCOMMITTED there**, interleaved with Moshe's
own uncommitted WIP (Backpack, SketchLab, tutor classifiers — do not disturb).

Stale git worktrees that should NOT be used (both abandoned mid-exploration, main
has strictly newer code):
- `.claude/worktrees/admiring-robinson-b5a240` (branch `claude/admiring-robinson-b5a240`)
- `.claude/worktrees/romantic-napier-85afd0` (branch `claude/romantic-napier-85afd0`)

To consolidate (run from main when no Claude session is using them):
```
git worktree remove --force .claude/worktrees/admiring-robinson-b5a240
git worktree remove --force .claude/worktrees/romantic-napier-85afd0
git branch -D claude/admiring-robinson-b5a240 claude/romantic-napier-85afd0
```
Suggested commit hygiene: commit the agentic surface separately from the Backpack/
SketchLab WIP. The agentic footprint is (new) `src/types/agentLab.ts`,
`src/data/agentic/`, `src/components/agentic/`, `src/lib/tutor/agents/`,
`src/pages/progression/Agentic*`, `docs/agentic-*.md`, plus (modified, additive)
`WebLab2LevelPage.tsx`, `webLab2DevPanel.ts`, `Sidebar(.types/PanelContent).tsx`,
`AiTutorPanel/MessageList/ThinkingAnimation`, `types/chat.ts`, `App.tsx`,
`levelTypeLinks.ts`, `LevelsIndexPage.tsx`.

## Current state (all verified in-browser except where noted)

- **Agents are a level capability**: `agentConfig?: AgentLevelConfig` on
  `WebLab2LevelPage`. `useAgentLevelState` (components/agentic/crew) derives the
  active agent's TutorPolicy + runner contracts + file filter, which parameterize
  the page's own `useWebLab2TutorFlow`. No parallel pipeline; no scripted engine.
  No API key ⇒ standard "Add a Tutor API key" fallback.
- **Sample progression** (`agenticProgressionLinks`): 5 levels, all plain
  WebLab2LevelPage instances —
  `/levels/agentic-crew` (meet) → `agentic-inspect` → `agentic-configure` →
  `agentic-orchestrate` → `agentic-standalone` (blank, verified). Mission Control
  stays at `/levels/agentic-mission` as a concept widget.
- **UI**: strip (Tutor ┊ specialists, accents) above composer; lazy switch
  dividers (only when messaged); modal v2 (3 capability toggles → real knobs,
  context category rows, Advanced file checklist); agent thinking = accent dot +
  drip verbs via `ThinkingAnimation` `variant`/`accent` props (bot head untouched
  elsewhere). NOT yet visually confirmed: the thinking dot itself (no-key fallback
  resolves too fast; check in a keyed session).
- **Dev panel** "Agents" group: enable, initial agent, locked ids, customization,
  tutor role (tutor / orchestrator-assisted / orchestrator-auto).
  Enable on any level: dev panel or `?o=` + base64 of `{"agentsEnabled":true}`.
- **Orchestration (Decision C)**: when the Tutor orchestrates, its turns run the
  guidance route with an orchestration contract (roster + `DISPATCH: {json}`
  closing line); the parsed dispatch renders as a Run card carrying the brief.
  Run = card "Sent" → agent switch → brief submitted via the normal flow.
  Assisted on L4; auto (auto-run, card as receipt) on L5.
- **Agent library (Decision D/E)**: save a configured agent from the detail
  modal (identity picker = curated glyph + accent), recall it from the strip's
  trailing `+`. Stored as a first-class `"agent"` backpack item; recalled agents
  join the roster (bookmark marker) but never the file tree. Backpack access for
  the page-level dialogs comes from a hoisted, idempotent `BackpackProvider`.

## Next build items (in order)

1. ~~**Orchestrator-assisted dispatch (L4 behavior).**~~ **DONE June 10** — full
   Decision C ladder. `lib/tutor/agents/orchestration.ts` (contract +
   `DISPATCH: {json}` parser, unit-tested), `useAgentLevelState` (forces help
   route + parses the card when Tutor orchestrates), page-level Run effect
   (mark card "Sent" → selectAgent → submit brief one render later so the
   specialist's policy/context apply). `agentHandOff` now carries
   `brief`/`status`; card renders the brief + Run (Switch for brief-less
   cards). `orchestrator-auto` auto-runs pending cards (L5). Dev panel gained
   a "Tutor role" select. NOT browser-verified with a live key yet — check
   DISPATCH emission quality in a keyed session (`/#/levels/agentic-orchestrate`).
2. ~~**Named plan files** (Decision A).~~ **DONE June 10** —
   `runTutorPlanning({ planningFileName })` parameterized (default
   `Plans/PROJECT_PLAN.md` unchanged), threaded through
   `TutorRequest.planningFileName` → `tutorClient` → `useWebLab2TutorFlow`.
   `useAgentLevelState` derives the active specialist's plan file from its
   produced/writable `Plans/*.md` artifact, so a spec-writer authored with
   `produces: [{path: "Plans/gallery-spec.md"}]` writes there. Plan-only
   detection (`isPlanOnlyTutorChange`) + plan-open basename now generalized to
   any `Plans/*.md`. Unit-tested in `planningRunner.test.ts`. Default crew data
   still uses PROJECT_PLAN.md (capability is live; not yet exercised by a demo).
3. ~~**Agent library** (Phase 5, Decisions D/E).~~ **DONE June 10** — saved
   agents are a first-class `"agent"` backpack kind (`BackpackItem.fileKind`
   widened to `FileKind | "agent"`, so the kind never leaks into the project
   file tree). `lib/backpack/agentBackpack.ts` serializes the *effective*
   specialist (authored + the student's edits) into the item's JSON payload,
   round-trip unit-tested in `agentBackpack.test.ts`. **Save** lives in the
   detail modal overflow ("Save to backpack" persists the effective specialist
   directly). **Create** opens the same detail modal in create mode — identity
   (name, description, glyph, accent) in a card at the top plus full config
   (prompt, permissions, context) before saving to backpack. **Recall** is the
   trailing `+` on the strip → `AgentLibraryMenu` → adds to the live roster
   via `useAgentLevelState.addRecalledAgent`. Saved agents can edit identity
   from the detail modal. Backpack I/O lives in `AgentLevelModals` (owns
   `useBackpack`); the page hosts it under a hoisted, idempotent `BackpackProvider` (Lab2Shell's inner provider became
   a passthrough so both share one store). In the Backpack panel agents flow
   through the normal list as an "Agents" entry in the type-availability
   dropdown (agent glyph, "AGENT" label, no add-to-project); they're treated as
   supported-here so they never sink under "Not supported in this lab". Gated on
   `allowAgentLibrary` (live on L3–L5; L1–L2 hide the roster +). NOT browser-verified with a live key.
4. ~~**Write-scope clamp in the live flow**.~~ **DONE June 10** —
   `useWebLab2TutorFlow` takes an optional `clampProposalChanges` callback,
   applied to `result.changes` before `beginAiProposal`: out-of-scope changes
   are dropped, the proposal carries only allowed files, and a student-facing
   note (`formatBlockedScopeNote`) is appended to the reply. `useAgentLevelState`
   builds the callback from the active specialist via `clampSpecialistChanges`
   (no-op for the Tutor / unscoped agents). Unit-tested in `specialistClamp.test.ts`.
- Also pending: workspace banner says "Tutor made changes" — should name the
  proposing agent. Unlock-on-event mechanics (locks are static config now).
  "Build from plan" runs unwrapped (`handleTutorSubmit`, not the agent-aware
  wrapper) — no divider/attribution; fold in when making it agent-aware. Note
  the clamp DOES apply on build-from-plan if a scoped agent is active (defensible
  but a wrinkle to remember).

## Gotchas the hard way taught us

- **Curricular rule**: never humanize agents — no names/avatars/personas; "it".
- `AiTutorPanel` appends its own alert synchronously AFTER `onAcceptAiChanges` —
  defer any follow-up message appends (setTimeout) or they get overwritten.
- `ThinkingAnimation`: a static `label` HALTS the cycle (and mock auto-complete);
  use `labelPrefix` to keep cycling.
- Lazy dividers are inserted by `wrapTutorSubmit` via functional setChatMessages
  (splice before last user bubble) because the panel appends the user message
  before calling onTutorSubmit.
- Divider messages carry their text in `content` (renders from `agentDivider`,
  not content) so the model sees the agent switch in conversation context.
- `tutorClient.test.ts` has 11 PRE-EXISTING failures from Moshe's
  routing-hardening WIP (tests call auto mode without resolvedAction). Not ours.
- Dev override URL format: `?o=<base64 JSON>` inside the hash route.
- specialists' artifact is `Plans/PROJECT_PLAN.md` (rides planning runner +
  Build-from-plan). `Specs/` only survives in the legacy mission-widget data.

## Verify in 2 minutes

`npm run dev` (port 3000) → `/#/levels/agentic-crew`: strip above composer,
empty chat, send anything → no-key fallback (or set a key in Lab Settings for
live runs). Switch agents silently → no dividers; message one → divider above
your bubble. ⓘ → modal toggles. `/#/levels/agentic-standalone`: blank project,
full roster, no curriculum chrome. Keyed: `/#/levels/agentic-orchestrate`, ask
the Tutor for styling work → reply ends in a Run card with the brief; Run →
"Sent", divider, specialist proposal. Write-scope: ask the Style agent to edit
`script.js` → if it proposes one, the change is dropped with an italic note.
Agent library (L3–L5): ⓘ → "Save to backpack" → pick a glyph/accent → Save;
the strip's `+` opens the sheet → Add recalls it (bookmark chip, fresh-context
divider); the Backpack tab lists it (filter to the "Agents" type in the dropdown).
`npx tsc --noEmit`, `npm run build`, and `npx vitest run src/lib/tutor/agents
src/lib/tutor/runners/planningRunner.test.ts src/lib/backpack/agentBackpack.test.ts`
clean (tutorClient.test.ts keeps its 11 pre-existing routing-WIP failures — not ours).
