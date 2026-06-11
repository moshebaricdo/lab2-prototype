# Agentic Web Lab 2 — V4 Spec

*Synthesized from design review of V3 (June 10, 2026). Organizes the brain dump into one
architectural headline, three supporting tracks, decisions with recommendations, open
questions, and a build sequence. No code yet — this is the thing to react to.*

---

## The headline

Every V3 critique points at the same root cause: **agents are still a custom page, not a
level capability.** The scripted fallback, the curriculum-flavored openings, the missing dev
panel, the missing no-key message — all symptoms of `AgenticCrewLevelPage` living beside the
harness instead of inside it.

**V4's defining move: agents become a config on `WebLab2LevelPage`** — same pattern as
`validationReviewConfig`:

```ts
interface WebLab2LevelPageProps {
  // ...
  agentConfig?: AgentLevelConfig;
}

interface AgentLevelConfig {
  specialists: AgentSpecialist[];      // authored roster (Tutor always present)
  initialAgentId?: string;             // default: tutor
  lockedAgentIds?: string[];           // progressive introduction
  allowCustomization?: boolean;        // modal becomes editable
  /** Autonomy ladder — see Decisions/C. */
  tutorRole?: "tutor" | "orchestrator-assisted" | "orchestrator-auto";
}
```

When `agentConfig` is absent, the page is byte-for-byte today's Web Lab 2. When present, the
strip mounts, submits route through the specialist adapter, and everything else — proposals,
validation, version history, instructions delivery, dev panel, share modes — is inherited
because we're *in* the page, not imitating it. This is also what makes the 5-level
progression cheap: five `WebLab2LevelPage` instances, five configs.

Corollary: **the scripted engine dies.** Agent turns always run the live pipeline. With no
API key, every message returns the same "add an API key in Lab Settings" fallback the rest of
the app uses (`tutorClient` already does this — we just stop intercepting it). `crewScript.ts`
is deleted; any guided beats become authored seed messages on curriculum levels.

---

## Track 1 — Pipeline & harness alignment

### 1a. Spec writer rides planning mode
The harness already has everything the spec flow faked: the planning runner writes
`Plans/PROJECT_PLAN.md` with enforced single-file edits, plan files get special file-manager
treatment, the Workspace has a plan action bar, and **"Build from plan" already exists** —
which is literally the spec→style-agent hand-off, already built.

- The spec-writer agent's live runs use the **planning intent** (not generic build).
- Its artifact is the plan file. Recommendation: keep `Plans/PROJECT_PLAN.md` in Phase 1
  (zero harness change; copy calls it "the plan"); parameterize `planningFileName` later if
  curriculum wants SPEC.md naming. **(Open question A.)**
- "Build from plan" becomes agent-aware: building delegates to the edit-capable specialist,
  with the run attributed to it (strip flashes, thinking state names it).

### 1b. What stays from the V3 adapter
`specialistRun.ts` is already honest plumbing — pruned-tree context, contract addendum,
deterministic request mode, write-scope clamping, per-agent threads. It stays, minus the
scripted branch around it. Receipts (`packedContextPaths`) keep being computed — they feed
the modal's context view (Track 2) even though the in-bubble node goes away.

### 1c. Dev panel
Standard treatment, new "Agents" section in `webLab2DevPanel`:

| Field | Type |
| --- | --- |
| `agentsEnabled` | toggle (mounts/unmounts the whole capability) |
| `agentRoster` | preset select (full / no-a11y / tutor-only / custom) |
| `agentInitialId` | select |
| `agentLockedIds` | text (comma ids) |
| `agentAllowCustomization` | toggle |
| `agentOrchestratorTutor` | toggle |
| `agentContracts` | textarea (per-agent overrides, `id: contract` lines) |

Plus the existing tutor fields keep working — agent contracts compose with, not replace,
the tutor contract plumbing.

---

## Track 2 — Interaction & UI refinements

### 2a. Stream hygiene: lazy dividers
A switch emits **nothing**. The divider renders only when a message is actually sent to the
newly active agent — emitted just before the user bubble. Browse the roster freely; the
transcript only records real conversations. (Unlock dividers stay immediate — they're real
events.) Agent opening messages are deleted as a concept; curriculum levels that want a
greeting author a seed message.

### 2b. "Read N items" node: removed
Gone from messages entirely. Context transparency lives in two places that earned it:
the **agent modal** (live view of what's in context right now) and the **thinking state**
(which names the agent while it works). The receipt concept returns later as streamed
activity steps when we do streaming — the data stays plumbed. **(Open question B.)**

### 2c. Thinking state v3
Ditch the bot head for agent runs. One slim line, Cursor-flavored:

> `● Style agent — working…` — accent-tinted pulsing dot, role in medium weight, and the
> verb slot *drips* through the existing spinner vocabulary (Reading… Shaping… Tuning…)
> with a subtle text shimmer. No gif, no card chrome.

Implementation shape: a `variant: "agent"` on `ThinkingAnimation` (keeps the cycle/auto-
complete machinery; swaps the visual). Generic enough to A/B against the bot head elsewhere.

### 2d. The strip: Tutor ┊ specialists
Visual division between the general Tutor and the specialist set: Tutor chip pinned left,
hairline separator, specialists after. This is the orchestrator seed — when
`orchestratorTutor` flips on, the division reads as "the one who routes ┊ the ones who do."
Trailing slot reserved for the library entry (`+`, Track 4).

### 2e. Agent modal v2
The file checklist was the wrong customization surface — most levels have 3 files, and
context is mostly *not* files. Restructure:

1. **Header** — glyph, role, tagline (unchanged).
2. **What it can do** — simple toggles (the customization the student understands):
   - *Can edit files* → `workspaceEdits` + write clamp on/off
   - *Can see project code* → context filter coarse switch (all project files ⇄ none)
   - *Hints first* → `pedagogy.revealPolicy` (hint-first ⇄ direct-when-asked)
   Each toggle maps 1:1 to a real policy/pipeline knob — nothing cosmetic.
3. **In its context right now** — read-only category rows with live ✓/—:
   Level instructions · The plan (`Plans/…`) · Project code (all/none) · This conversation.
   This answers "how do we surface non-project-file context" — categories, not file paths.
   The per-file checklist demotes to a collapsed "Advanced" disclosure (kept because the
   write-scope lesson needs it eventually; hidden because it's noise on small projects).
4. **Standing instructions** — the textarea stays; it's the heart of agent authoring.
5. Footer: Reset / Save (unchanged), live-mode note removed (everything is live now).

---

## Track 3 — The sample progression (5 levels, one page)

All five are `WebLab2LevelPage` + `agentConfig` + standard authored props. The arc:
**discover → inspect → configure → orchestrate → own**.

| # | Level | agentConfig gist | What it teaches |
| --- | --- | --- | --- |
| 1 | **Meet the agents** | Tutor + Spec writer + Style agent; a11y locked; no customization | Agents are scoped tools; switching; the plan hand-off |
| 2 | **Look inside** | Same roster; modal read-only → toggles enabled mid-level via instructions | Context windows; capability ⇄ behavior |
| 3 | **Tune your crew** | `allowCustomization: true`; task requires editing standing instructions to succeed | Prompting as authoring; write scopes |
| 4 | **Let the Tutor route** | `tutorRole: "orchestrator-assisted"` | Delegation; reviewing work you didn't watch happen |
| 5 | **Blank project** | Blank starter, full roster, customization on, `orchestrator-auto` available, **no instructions, no seed messages, no Continue framing** | Agents as standalone tooling — the "real world" proof |

Level 4 orchestration, scoped deliberately small: the Tutor's contract directs it to
*propose* delegation; its reply carries a structured hand-off (existing `agentHandOff` card,
upgraded with a **Run** action that fires the specialist's turn with a Tutor-authored brief).
Assisted delegation — student approves every dispatch. Full auto multi-step stays out of V4.
**(Open question C.)**

Level 5 is the acid test for "flex on any level": if it needs anything beyond
`agentConfig` + a blank starter, Track 1 isn't done.

---

## Track 4 — Persistent agents (design direction, build last)

Backpack is the established cross-level persistence metaphor, and `BackpackItem` is
file-shaped (`name/content/fileKind/sourceLab`) — a custom agent serializes cleanly as a
JSON content item (`fileKind: "text"`, agent payload = AgentSpecialist + customization).
Direction:

- **Save**: from the modal — "Save to backpack" on a customized agent.
- **Recall**: trailing `+` in the strip opens a small library sheet (backpack-filtered to
  agent items) → adds to the project's roster.
- **Identity**: saved agents get a distinct chip treatment (dashed ring or bookmark glyph)
  so authored vs student-made reads at a glance — still no names/avatars.
- **`/` commands**: parked. The composer addressing an agent inline (`/style make it pop`)
  is a lovely V5; it depends on the library existing first.

Integration detail (item schema/discriminator) lands with your backpack WIP — flagged, not
specced. **(Open question D.)**

---

## Decisions (resolved June 10 design review)

- **A. Plan naming** — `Plans/PROJECT_PLAN.md` is fine *for now*, but the harness already
  supports multiple plan files per project (`handleCreatePlan`, `selectedPlanPath`,
  `builtPlanPaths`), so **named plans are worth doing**: parameterize the planning runner's
  target filename so the spec-writer can author e.g. `Plans/gallery-spec.md`. PROJECT_PLAN
  stays the default; naming lands when the spec-writer wiring does.
- **B. Receipts** — parked in-chat until streaming exists. The **modal is the context
  surface** (including file scoping); no receipt line anywhere else.
- **C. Orchestration is a ladder, not a toggle.** Autonomy is the y-axis of the whole
  progression — never abstracted away early, never capped late:
  `tutorRole: "tutor" | "orchestrator-assisted" | "orchestrator-auto"`.
  - *tutor* (L1–3): student routes manually via the strip.
  - *orchestrator-assisted* (L4): the Tutor reads the request, names the right specialist,
    writes the brief, and renders a dispatch card — **the student presses Run** on every
    dispatch.
  - *orchestrator-auto* (L5 standalone, earned): dispatches run without per-step approval;
    results still land as reviewable proposals.
- **D. Agent file type.** Custom agents get a first-class `"agent"` file kind (JSON schema
  under the hood) — distinct icon and treatment so they never read as generic JSON in the
  file manager or the backpack. `BackpackItem.fileKind: "agent"`.
- **E. Custom-agent identity.** Students pick a **glyph from a curated icon set and a tint
  from the accent palette** when saving an agent. Functional identity, still no human
  names/avatars (label stays a role description).

## Build sequence

1. **Phase 1 — The spine.** `AgentLevelConfig` into `WebLab2LevelPage`; delete scripted
   engine; no-key fallback; dev panel section; spec-writer → planning intent. *(Everything
   else hangs off this.)*
2. **Phase 2 — Stream & state.** Lazy dividers; receipt removal; thinking v3; strip
   division.
3. **Phase 3 — Modal v2.** Toggles, context categories, advanced disclosure.
4. **Phase 4 — Progression.** Levels 1–3 and 5; then 4 (orchestrator card + Run).
5. ~~**Phase 5 — Library.** Backpack save/recall, custom chip treatment.~~ Landed June 10.

Phases 1–2 make it *real*; 3–4 make it *teachable*; 5 makes it *theirs*.

---

## Status

**Phase 1 (the spine) — landed and browser-verified June 10.**

- `agentConfig?: AgentLevelConfig` on `WebLab2LevelPage`; `useAgentLevelState` derives the
  per-agent TutorPolicy, runner contracts, and file filter that parameterize the page's own
  `useWebLab2TutorFlow` call — no parallel pipeline. Specialists inherit routing, denial
  explanations, edit clarification, planning (spec writer runs the real planning intent →
  `Plans/PROJECT_PLAN.md`), proposals, validation, history.
- Scripted engine deleted (`crewScript.ts`, `useAgentCrewChat.ts`). No key ⇒ the standard
  "Add a Tutor API key in Lab Settings" fallback, verified.
- Lazy dividers (Track 2a) shipped with the spine: silent switches emit nothing; the divider
  flushes just before the first user message to the new agent; consecutive silent switches
  collapse to the last one. Verified.
- In-bubble receipts no longer emitted (Track 2b) — render support stays for streaming.
- Dev panel "Agents" group: enable toggle, initial agent, locked ids, customization toggle.
  Enabling agents on a stock level via dev override verified (default crew roster).
- `/levels/agentic-crew` is now a plain `WebLab2LevelPage` instance.

**Phases 2–3 — landed June 10.**

- Thinking v3: `variant`/`accent` props ON TOP of the existing `ThinkingAnimation` — the bot
  head stays the default for every pre-agentic level; agent runs get an accent pulse dot with
  the existing shimmer + drip verbs ("Style agent · Reading…"). Visual confirmed except the
  dot itself, which resolves too fast to catch without a real API key (no-key fallback is
  near-instant) — verify in a keyed session.
- Strip: Tutor pinned left ┊ hairline ┊ specialists (the orchestrator seed).
- Modal v2: three capability switches (edit files / see project code / hints first) mapping
  to workspaceEdits, the context filter, and revealPolicy; "in its context right now"
  category rows with live states ("Project plan — not written yet", "Project code — 3 of 3
  files", "This conversation"); per-file checklist demoted to a collapsed Advanced
  disclosure. Round-trip verified: toggling "see project code" off → saved → re-opened shows
  "no code files", and the live context filter genuinely empties.

**Phase 4 (orchestrator dispatch) — landed June 10.**

- Decision C's full ladder is live, all in `lib/tutor/agents/orchestration.ts` +
  `useAgentLevelState` + a page-level run effect:
  - When `tutorRole` is an orchestrator role and the Tutor is active, its turns are forced
    onto the guidance route (the Tutor routes, specialists do) and its runner contracts gain
    an orchestration addendum: the roster (ids, labels, can/cannot, write scopes) and a
    structured `DISPATCH: {json}` closing-line format.
  - The DISPATCH line is parsed out of the reply (unknown ids / malformed JSON stripped
    silently; unit-tested in `orchestration.test.ts`) into the `agentHandOff` card, now
    carrying the Tutor-authored `brief` + a `status`. The card shows the brief and a **Run**
    button ("Switch" remains for brief-less cards).
  - Run marks the card "Sent", switches the active agent, and submits the brief through the
    page's normal wrapped submit — one render later, so the run executes with the
    specialist's policy/contract/context filter. Lazy divider, proposal staging, thinking
    attribution all inherited.
  - `orchestrator-auto` (L5): a pending dispatch card auto-runs on arrival — the card stays
    as the receipt, results still land as reviewable proposals.
- Dev panel "Agents" group gained a **Tutor role** select (tutor / assisted / auto), so
  orchestration is testable on any level.
- L4 (`/levels/agentic-orchestrate`) runs assisted; L5 standalone runs auto.
- NOT yet browser-verified with a live key (built against the no-key fallback +
  unit tests); verify the DISPATCH emission quality in a keyed session.

**Named plans (Decision A) + write-scope clamp — landed June 10.**

- `runTutorPlanning` takes a `planningFileName` (default `Plans/PROJECT_PLAN.md`), threaded
  through `TutorRequest.planningFileName` → `tutorClient` → `useWebLab2TutorFlow`. The system
  prompt, edit validation, path normalization, and student-facing path-stripping all follow
  the chosen name. `useAgentLevelState` derives it from the active specialist's produced /
  writable `Plans/*.md` artifact, so a spec-writer can author e.g. `Plans/gallery-spec.md`.
  Plan-only detection and the plan-open basename are generalized to any `Plans/*.md`.
  `planningRunner.test.ts` covers default + named + wrong-file rejection. Default crew data
  still uses PROJECT_PLAN.md (capability live, no demo exercises a custom name yet).
- Write-scope clamp (item 4) is applied in the live flow: `useWebLab2TutorFlow` accepts a
  `clampProposalChanges` callback built by `useAgentLevelState` from the active specialist
  (`clampSpecialistChanges` + `formatBlockedScopeNote`). Out-of-scope changes are dropped from
  the proposal and explained in the reply — the enforcement is the lesson. No-op for the
  Tutor and unscoped agents. `specialistClamp.test.ts` covers the split + note copy.

**Phase 5 — agent library (Decisions D + E) — landed June 10.**

- Saved agents are a first-class `"agent"` backpack kind. `BackpackItem.fileKind` is widened to
  `FileKind | "agent"` (scoped to the backpack domain — the kind never enters the project
  `FileItem` tree; `importBackpackItemToTree` refuses it). `lib/backpack/agentBackpack.ts` owns
  serialization (a schema/versioned envelope wrapping the effective `AgentSpecialist`), the
  curated glyph set, and the accent palette; `agentBackpack.test.ts` covers round-trip + corrupt
  payload handling.
- **Save** (Decision E identity): the detail modal's "Save to backpack" persists
  the effective specialist directly (name, glyph, accent, and config snapshot).
- **Create**: the strip's `+` → "Create new agent" opens the same detail modal
  in create mode — identity card at the top plus full configuration before the
  agent is saved to backpack and added to the roster.
- **Recall** (Decision E): the strip's trailing `+` opens `AgentLibraryMenu`
  (Lab Agents + My Agents). "Add" calls `useAgentLevelState.addRecalledAgent`,
  which de-dupes the id against the roster, lands the agent unlocked + active,
  and queues the usual fresh-context divider.
- **Plumbing**: backpack I/O is isolated in `AgentLevelModals` (it owns
  `useBackpack`). Because
  the agent modal + strip live above `Lab2Shell`'s `BackpackProvider`, the page hoists its own
  `BackpackProvider`; the provider is now idempotent (reuses an ancestor store), so Lab2Shell's
  inner one becomes a passthrough and both share the single `lab2:backpack` store. In the Backpack
  panel agents flow through the normal list as an "Agents" entry in the type-availability dropdown
  (`backpackItemTypeId` keys off `fileKind`; agent glyph, "AGENT" label, no add-to-project) and are
  treated as supported-here in the availability partition so they don't sink under "not supported
  in this lab". Gated on `allowAgentLibrary` (live on L3–L5).

**Next:** name the proposing agent on the workspace proposal banner; unlock-on-event mechanics;
make "Build from plan" agent-aware (it currently runs the unwrapped submit).
