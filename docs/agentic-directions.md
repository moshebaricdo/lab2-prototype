# Teaching Agentic AI in Web Lab 2 — Two Product Directions

**Status:** exploration · two demo levels live under "Agentic AI Explorations" on the levels index
**Author:** prototype exploration, June 2026

## The problem

Web Lab 2's Tutor today is one broad, flexible assistant: it answers, plans, and edits. That shape
is great for getting help, but it teaches students almost nothing about *how agentic AI actually
works* — and "one omniscient chat box" is an actively misleading mental model for the systems
they'll meet after school.

The constraint we design around is the same one LLMs live with: **limited context windows** — both
kinds.

- The *student's* context window: a 13-year-old can hold maybe one new concept per level. We can't
  teach delegation, scoping, artifacts, verification, and parallelism in one move.
- The *agent's* context window: real agents don't see everything, don't remember everything, and
  don't share memory with each other. This limitation is not an implementation detail to hide —
  it is **the curriculum**. Scoping is why multi-agent systems exist.

So the design thesis both directions share:

> **Make the context window visible, and make artifacts the interface.**
> An agent is something with (1) a role, (2) a slice of context it can see, (3) a small set of
> things it's allowed to do, and (4) work products it hands to others. Students who internalize
> those four things understand agentic AI — regardless of which UI we ship.

A second shared principle: **the tool carries the concepts; the curriculum chooses the dosage.**
Both directions are expressed as per-level configuration (which specialists exist, what they can
see/do, what the mission is), so curriculum writers can introduce agents progressively — and a
standalone student who never sees a lesson still gets a coherent, self-explaining experience with
the full roster unlocked.

---

## Direction A — "The Studio Crew" (conservative)

**One chat surface, many specialists.** The Tutor stops being one generalist and becomes a small
crew of named specialists the student talks to one at a time: the Coach (the generalist they
already know), the Spec Writer, the Designer, the Accessibility Expert. Same panel, same composer,
same proposal-review flow — the interaction model students already learned does not change.

What's new is what surfaces around the conversation:

- **Context card.** Every specialist shows "What I can see" (files + artifacts in scope, with a
  context meter) and "What I can do / can't do" (capability chips). The Spec Writer *deliberately
  can't see the code* — specs describe intent, not implementation. The Designer can see
  `styles.css` and `SPEC.md` but can't touch `script.js`. Constraints are presented as the point,
  not as missing features.
- **Fresh-context hand-offs.** Switching specialists inserts a divider: *"Riley starts fresh —
  they can't see your chat with Sam. They read `Specs/SPEC.md` instead."* Agents communicate
  through artifacts, not shared memory. The artifact lands in the real file manager, so the
  hand-off is inspectable.
- **Progressive unlock.** Levels declare which specialists exist (`unlocked: false` renders a
  teaser card). A curriculum can introduce one specialist per lesson; standalone mode unlocks all.

**Why conservative:** zero change to the core loop. A specialist is *configuration over the
existing tutor pipeline*, not new machinery.

**Harness integration path** (all extension points already exist):

| Specialist field (`src/types/agentLab.ts`) | Existing harness surface |
| --- | --- |
| `capabilities` | `TutorPolicy.capabilities` (`tutorDevSettings.ts`) |
| `contract` | `TutorRunnerContracts` addenda (`runnerContracts.ts`, dev panel keys exist) |
| `contextScope.filePaths` | filter in `buildProjectContext` (`contextBuilder.ts`) — one new parameter |
| `persona` / `handOffNote` | system-prompt addendum (`promptBuilder.ts`) |
| roster + unlocks | new page prop on `WebLab2LevelPage`, same pattern as `validationReviewConfig` |

The only genuinely new UI is the roster rail + context card in the Tutor panel header, plus the
fresh-context divider in the message list.

**Risks / open questions:** Does persona-flavoring dilute the lesson (kids befriend the characters
and miss the scoping)? Do we need a "wrong door" recovery when a student asks the Designer for JS
(the demo scripts this: the specialist declines and routes, which is itself teachable)?

---

## Direction B — "Mission Control" (bold)

**The student stops chatting and starts orchestrating.** For designated levels, the center stage
is not the editor — it's a delegation board. The student receives a mission brief, splits it into
task cards, assigns each to a specialist, and — the heart of the level — **packs each agent's
briefcase**: choosing which files and artifacts go into that agent's context, with a live meter
showing starved / focused / overloaded. Then they launch the run, watch agents work in parallel,
and triage the results in a review queue: approve, or send back with a better briefcase.

The teachable moments are mechanical, not narrated:

- **Packing is consequential.** Forget to give the Designer the spec → its proposal comes back
  plausible-but-wrong ("I guessed three columns; the spec said four"). Overstuff the briefcase →
  the agent is slower and "distracted" (flags irrelevant context in its result). The *system*
  teaches context economy; no paragraph of instructions could.
- **Agent output is a draft.** Nothing lands in the project until the student reviews and
  approves. Verification is a first-class step on the board, not an afterthought.
- **Parallelism and isolation.** Agents visibly run simultaneously and never reference each
  other's chat — only artifacts that exist when their run starts.

**Why bold:** it changes the student's role from *requester* to *manager of agents*, which is the
actual skill shift agentic AI introduces. It also creates a new level archetype (orchestration
level) rather than reconfiguring an existing one.

**Harness integration path** (heavier than A, but bounded):

- One task run = one call through the existing `editSessionRunner` with a **scoped**
  `TutorProjectContext` (the briefcase is literally the file filter on `buildProjectContext`) and
  the specialist's contract as the runner addendum. The runner pipeline needs no changes.
- Parallel runs = N independent runner calls; results are already shaped as proposal `changes`,
  which plug into the existing accept/reject `FileChange` flow for the review queue.
- The board itself is a new workspace view (sibling of `Workspace`), mounted by a new page —
  the shell, header, progression, and share-mode chrome are reused as-is.
- The context meter can start as a character-count heuristic (the demo's approach) and later use
  real token counts from the provider.

**Risks / open questions:** Is the board too much surface for one level? (Mitigation in the demo:
the flow is staged — pack → launch → review — and only one decision is live at a time.) Does
removing the editor for a level break students' sense of place? (The artifact viewer keeps code
visible read-only.)

---

## How they sequence (not either/or)

The directions are compatible and likely *sequential*: the Crew teaches "agents are scoped
specialists" inside the familiar chat; Mission Control then asks students to *use* that model as
orchestrators. A plausible unit arc: generalist Tutor → meet one specialist → full crew with
hand-offs → first mission with pre-packed briefcases → missions where packing is on the student.
The shared types in `src/types/agentLab.ts` are written so one `AgentSpecialist` definition powers
both surfaces.

## What the demo levels are (and aren't)

Two routes under **Agentic AI Explorations** on the levels index:

1. `/levels/agentic-crew` — Direction A, fully interactive with scripted specialist behavior.
   Real file tree, real preview; the Spec Writer genuinely writes `Specs/SPEC.md` into the
   project and the Designer genuinely edits `styles.css`.
2. `/levels/agentic-mission` — Direction B, fully interactive with deterministic scripted
   outcomes driven by the student's actual briefcase choices.

Both are **additive**: new pages, components (`src/components/agentic/`), data
(`src/data/agentic/`), and types — no core harness files were modified. Scripted responses sit
exactly where live runner calls would go (marked `// INTEGRATION:` in the code), so promoting
either direction means swapping the script for `tutorClient` calls and adding one context-filter
parameter to `buildProjectContext`.

---

## Revision 2 — Direction A reimagined inside the real harness

Design-review feedback (June 2026) reshaped Direction A in three ways:

### 1. The crew lives in the AI Tutor panel, not beside it

The original demo replaced the resource panel with a custom surface — a prototyping shortcut
that read as a paradigm shift. Lab2's chrome anchors every lab, so the rebuilt demo renders
**inside the real `Sidebar` → `AiTutorPanel`**: same rail, tabs, instructions panel, version
history, composer, message bubbles, proposal cards, and accept/reject flow.

The only harness change is one additive slot, threaded `Sidebar.types.ts` → `Sidebar` →
`SidebarPanelContent` → `AiTutorPanel`:

- `aiTutorHeaderSlot?: ReactNode` — content pinned above the conversation. Absent ⇒ today's
  panel, byte-for-byte.

Everything agent-specific (`AgentRosterStrip`, `useCrewMockTutor`) stays in
`src/components/agentic/crew/`. The scripted engine drives the panel through the existing
`MockTutorConfig.response` seam — proposals use the panel's standard `fileChanges` +
`codeChangeStatus` cards, switch notes use the standard alert variant. On integration the
engine dissolves into `tutorClient` calls (specialist contract + context filter).

### 2. No anthropomorphism (curricular guideline)

Per curriculum guidelines we avoid humanizing LLMs: **no human names, no avatars, no
personas**. Agents carry functional labels (`Tutor`, `Spec writer`, `Style agent`,
`Accessibility checker`), functional glyphs, and are referred to as "it". Scope limits are
stated as facts about the tool ("script.js isn't in this agent's context"), and run reports in
the mission demo are written as neutral findings rather than first-person confessions.
`AgentSpecialist` lost its `name`/`accentColor` fields; the doc comments now encode the rule.

### 3. Unlocking, made concrete

The locked Accessibility checker demonstrates the real mechanics end-to-end:

- **Authored state**: `unlocked: false` + `lockedHint` on the roster entry (per-level property
  on integration; standalone ships all-unlocked).
- **Visible-but-locked**: dimmed chip with a lock glyph and tooltip — students see the team's
  full shape before they can use it.
- **The unlock moment**: accepting the first proposal posts an info alert ("New agent
  available…") and enables the chip — earned capability, in-flow.

The fresh-context lesson also sharpened: the visible transcript persists for the *student*
while each agent's context starts clean — the switch alert states exactly what the new agent
sees, and the context popover ("Sees:" line) makes the window inspectable at any time. That
distinction — what you see vs. what the model sees — is the core concept this level teaches.

### Open question carried forward

Cursor-style **primary agent + sub-agent delegation** is the likely Stage 2: the Tutor gains a
"bring in a specialist" capability and delegation cards render in-chat. The switchboard (this
demo) stays the Stage 1 teaching device — students learn routing by doing it before they watch
an orchestrator do it. Mission Control (Direction B) is reframed as a **widget** — a contained
concept lesson — rather than a lab mode; its mechanics (briefing, context packing, review)
re-enter the lab through delegation cards and composer file chips.

---

## Revision 3 — Wired into the live harness

Direction A is now the committed direction. This revision moves it from "scripted demo in the
real chrome" to "real pipeline with a scripted fallback," and lands the chat-stream and strip
refinements from design review.

### The live pipeline (modular, zero core rewrites)

`src/lib/tutor/agents/specialistRun.ts` expresses a specialist entirely through existing
`tutorClient` inputs:

| Specialist concept | Pipeline mechanism |
| --- | --- |
| Context window | The file tree is **pruned** to `contextScope` before the call — the packer never sees out-of-scope files, so the model genuinely can't |
| Behavior | `contract` rides the runner-contract addendum (same seam as the dev panel's contract fields) |
| Capability | Deterministic `requestMode` per agent (edits ⇒ build, guidance-only ⇒ help) — the agent's capability IS its mode |
| Write scope | Returned changes are **clamped** to `writablePaths`; blocked changes are dropped and surfaced — the enforcement is the lesson |
| Memory isolation | Each agent keeps its own conversation slice (`useAgentCrewChat`); a live run never sees another agent's thread |

With a tutor API key configured, the level runs live; without one it falls back to the
scripted engine. Both backends stage proposals through `beginAiProposal` on the real file
tree, so file-manager badges, the proposed-state preview, the workspace change banner, and
accept/reject are all the harness's own machinery.

### Chat stream as a teaching surface

Two additive `ChatMessage` fields, rendered by `AiTutorMessageList` alongside the existing
card vocabulary:

- **Context receipt** (`agentContextReceipt`) — a quiet "Read: …" line under each agent reply
  showing what was *actually packed* for that turn (not the static scope: before the spec
  exists, it's honestly absent from the Tutor's receipt). Per-turn transparency replaces the
  always-on "Sees:" bar.
- **Hand-off card** (`agentHandOff`) — routing becomes a chat object: label, reason, and a
  Switch action. This is also the embryo of Stage 2 delegation — the same card later renders
  what an orchestrating Tutor *did* rather than what it suggests.
- **Everything is a proposal** — the spec writer's draft now lands as a pending `fileChanges`
  proposal like any code change ("a spec is a proposal too"). One review ritual for every
  agent output.

### The strip, round two

Moved from the panel header to a slim row **docked above the composer** — the zone real
agentic tools use for agent/model pickers. This clears the entire top zone for the
instructions drawer and the future tutor-delivered pinned step (verified coexisting). Active
agent shows as an accent-tinted pill (constrained 4-tint palette — functional color coding,
not personas); inactive agents are icon-only; the context card collapsed to a small ⓘ popover
with scope chips and a single "won't" line.

### Known follow-ups

- The workspace banner says "Tutor made changes" — should name the proposing agent.
- Live-mode polish pass pending real-key testing (latency feel, receipt accuracy on multi-file
  proposals, spec-writer prompt tuning for SPEC.md format).
- `tutorClient.test.ts` has 11 pre-existing failures from the routing-hardening WIP (tests
  still call auto mode without a resolvedAction) — unrelated to the agentic work.

---

## Revision 4 — Chat-native polish pass

Four design-review notes, each pulling the agentic machinery further into the chat stream
instead of layering it on top:

- **Agent transitions → slim dividers.** Switch/unlock events were full-width info alerts;
  they're now a one-line divider (hairline + accent pill + muted suffix, full explanation on
  hover via `title`). ~24px instead of a multi-line block, and they add rhythm/variety to the
  stream. New additive `ChatMessage.agentDivider`.
- **Context receipt → collapsible node.** The "Read: chip chip chip" line became a
  Claude-style **"Read N items"** disclosure at the top of the reply — collapsed by default,
  expands to the file list. This is the natural home for streamed read/write activity steps
  later. (`AgentReceiptNode` in `AiTutorMessageList`.)
- **Popover → agent modal with real configuration.** The ⓘ now opens `AgentDetailModal`: info
  for locked/early levels, and — gated by `allowCustomization` — a working config surface where
  students edit the agent's **standing instructions** (feeds the live system prompt) and
  **toggle which files are in its context window** (feeds the live context filter). Customized
  agents flow through `applyCustomization` in `useAgentCrewChat`, so a student-built agent runs
  for real. This is the on-ramp to "configure your own agents as you progress."
- **Agent-aware thinking state.** `ThinkingAnimation` gained a `labelPrefix` that prepends the
  active agent's role to the cycling verb ("Style agent · Reading Code…") without stopping the
  animation. (Implementation note: a static `label` halts the cycle and, in scripted mode,
  would block auto-completion — the prefix path keeps cycling, so both backends complete.)

### Type surface added this revision
`ChatMessage.agentDivider` (`AgentDividerData`); `AgentCustomization` (contract + filePaths);
`ThinkingAnimation.labelPrefix` + `AiTutorMessageList.thinkingLabelPrefix` +
`AiTutorPanel.thinkingLabelOverride` (threaded as `aiTutorThinkingLabel` through the sidebar).
All additive; the panel with no agentic props renders exactly as before.
