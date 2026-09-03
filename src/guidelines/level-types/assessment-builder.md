# Assessment Builder

Canonical in-lab authoring for assessment content. The main surface is a **lab-style workspace** that toggles between **Build** (edit) and **Preview** modes; the Lab2 resource panel holds the granular controls (question bank, question editor, settings).

Living workstream status (P0 decisions, what’s in/out, changelog): [`docs/status.md`](../../../docs/status.md).

## Product model

- **One artifact** (`AssessmentArtifact`) models quizzes, practice exams, and single-question checkpoints (CFUs). Surveys are out of scope for P0.
- A **checkpoint / CFU** is an assessment with typically one `QuestionItem` — not a separate level type. Switch Mode in P0 settings to apply CFU vs exam presets.
- The **question bank** stores reusable `QuestionItem` records keyed by `bankId`. Assessments hold live `bankId` references so bank edits propagate everywhere (prototype: `localStorage`).
- Questions are tagged by **standards** only. Course and unit are **not** tags: they are bank **scope** (filters) and quiz **placement** (where this level sits). Difficulty is dropped.
- **Code interpretation** is an optional `codePanel` attachment on any item type, not a sibling type.
- P0 does **not** shuffle question order or answer options (downstream teacher-dashboard impact).

## Routes

| Route | Mode | Description |
|-------|------|-------------|
| `/levels/assessment-builder-new` | `quiz` | Blank assessment — empty outline for authoring from scratch |
| `/levels/assessment-builder-seeded` | `quiz` | Seeded practice quiz with six bank questions (mixed types) |
| `/levels/assessment-builder-p0` | `exam` | **P0-aligned prototype** — cert exam **attached** to AI Foundations · Unit 3. Checkpoint vs Exam settings; Course / Unit scope + Standard tags. No survey, shuffle, or difficulty. |
| `/levels/assessment-builder-p0-draft` | `checkpoint` | P0 **floating** draft (not in a live unit). Bank course/unit start empty. |

Legacy levelgroup routes remain under Assessment sets / Experiments for comparison only.

## Key files

| Area | Path |
|------|------|
| Canonical types | `src/types/assessmentBuilder.ts` |
| Adapters (canonical → preview payloads) | `src/lib/assessmentBuilder/adapters.ts` |
| Scoring + domain aggregation | `src/lib/assessmentBuilder/scoring.ts` |
| Pool draw + shuffle runtime | `src/lib/assessmentBuilder/examRuntime.ts` |
| Sectioned-outline helpers (invariants, numbering, moves) | `src/lib/assessmentBuilder/outline.ts` |
| Bank persistence | `src/lib/assessmentBuilder/bankStorage.ts` |
| Draft persistence | `src/lib/assessmentBuilder/draftStorage.ts` |
| Builder workspace (Build/Preview shell) | `src/components/assessment/builder/views/AssessmentBuilderWorkspace.tsx` |
| **P0 outline canvas** (overview header, sections, dnd) | `src/components/assessment/builder/views/AssessmentOutlineCanvas.tsx` |
| P0 outline blocks | `OutlineQuestionCard.tsx`, `OutlineSectionBlock.tsx`, `OutlineIntroCard.tsx`, `OutlineAddRow.tsx`, `OutlineAddToolbar.tsx` (same folder) |
| Shared-question save prompt | `src/components/assessment/builder/views/SaveQuestionPrompt.tsx` (CADS `Dialog`) |
| Question kind icon/label metadata | `src/components/assessment/builder/views/questionKindMeta.ts` |
| Legacy build canvas (blank/seeded routes only) | `src/components/assessment/builder/views/AssessmentBuildCanvas.tsx` |
| Inline question editor (type-specific fields) | `src/components/assessment/builder/views/QuestionItemEditor.tsx` |
| Builder panel (bank, settings) | `src/components/assessment/builder/views/AssessmentBuilderPanel.tsx` |
| P0 question bank (filters + results) | `src/components/assessment/builder/views/QuestionBankPanel.tsx`, `QuestionBankFilterMenu.tsx` |
| Multi-question preview flow | `src/components/assessment/builder/views/AssessmentArtifactWorkspace.tsx` |
| One-off question factory + kind labels | `src/lib/assessmentBuilder/blankQuestion.ts` |
| P0 mode presets (CFU vs exam) | `src/lib/assessmentBuilder/p0Mode.ts` |
| Course / unit scope + placement helpers | `src/lib/assessmentBuilder/taxonomy.ts`, `placement.ts` |
| Difficulty labels + filter constants | `src/lib/assessmentBuilder/difficulty.ts` (legacy builder only) |
| Builder state hook | `src/hooks/useAssessmentBuilderState.ts` |
| Bank hook | `src/hooks/useQuestionBank.ts` |
| Mock bank + drafts | `src/data/assessmentBuilder/` |
| Tag chip primitive (bank **standards**, canvas “Recommended”) | CADS `Tag` from `@moshebaricdo/cads-react` |

## Canonical schema

> Product model specs live in the repo root `docs/` folder: [Question Types & Field Requirements](../../../docs/question-types-and-fields.md) and [Assessment Configuration & Modes](../../../docs/assessment-config-and-modes.md). Implementation-oriented field notes for the inline editors also live in [assessment-builder-question-schema.md](./assessment-builder-question-schema.md).

### `QuestionItem`

Reusable bank record:

- `bankId`, `title`
- `courseId` / `unitId?`: prototype **usage stand-in** for bank filters (not author-assigned tags; P0 UI does not show or edit them)
- `item`: discriminated union (`multi` | `freeResponse` | `match` | `dragDrop` | `fillInBlank`)
- `reveal`: `{ enabled, explanation? }`
- `tags`: **standards** (`DomainTag[]` — optional `code` is the compact id on bank chips)
- `difficulty?`: **dropped in P0**; still present on legacy drafts / the blank+seeded builder
- `codePanel?`: optional read-only code context (code interpretation)
- `points?`: point value when scored in a graded assessment (defaults to 1; drives the canvas total + `scoreQuestionResponse` `pointsPossible`)
- `updatedAt`

### `AssessmentArtifact`

Assessment-level config:

- `mode`: `checkpoint` | `quiz` | `exam` (P0 authoring: **checkpoint** and **exam** only; `survey` remains on the type for legacy drafts)
- `placement?`: `floating` | `attached` (course family + optional unit). Levelbuilder-owned in prod; prototype chrome + bank auto-scope.
- `layout`: `scroll` | `stepped`
- `questionRefs`: live `bank` references or `inline` snapshots
- `sections?`: `AssessmentSection[]` (`{ id, title?, description?, questionRefs }`). Structural invariant: absent/empty = flat outline; non-empty = **every** question lives in a section (sections are pages to the learner). When sectioned, `sections` is authoring truth and the flattened `questionRefs` mirror is re-derived on every mutation (`withSections` in `outline.ts`) so adapters/preview/scoring stay section-unaware.
- `poolDrawRules?`: draw N questions from tagged pool at runtime (not authored in P0)
- `shuffle`: question + option order (**off and hidden in P0**)
- `timing?`, `attempts?`, `tutor`, `intro?`, `surveyMode?` (survey mode hidden in P0)

### `QuestionResponse` / `ScoringResult`

Controlled learner state per item and per-item scoring outcome. `aggregateDomainScores` rolls up `ScoringResult` by domain tag for exam reporting.

## Adapter layer

`questionItemToPreviewPayload` and `assessmentToFlowPayloadFromQuestions` generalize the legacy `levelGroup*ToPayload` pattern:

1. Canonical `QuestionItem` → `LevelGroupQuestionBlock`
2. Block → standalone workspace payload via existing adapters in `src/data/assessment/levelGroup.ts`
3. Multi-question flow reuses `LevelGroupEmbeddedBlock` controlled-state pattern from `LevelGroupFlowBlocks.tsx`

## Builder UX

The builder splits responsibilities between a **workspace** (center outline + inline question editor) and the **resource panel** (question bank + assessment settings). `AssessmentBuilderWorkspace` owns mode toggling, sidebar width, question selection/expansion, and wires hooks into both surfaces.

### Workspace chrome — `AssessmentBuilderWorkspace`

- **`PanelHeader`** tops the center surface with eyebrow label **workspace**, a left-aligned **`SegmentedButton`** toggling **Build** / **Preview**, and (P0) a right **Live in 2 scripts** success Tag when the quiz is attached — or **Draft** when floating.
- P0 global header hides progression bubbles, left-aligns the lesson name + “Saved a few seconds ago”, and shows **Back to Levelbuilder** / **Save** (outlined extraSmall on brand).
- Resource panel width uses the shared `useLayoutState` default (**400px**); drag-resize clamps between 300px and 600px, same as other assessment levels.
- On mount, the active tab defaults to **`builder-bank`**. Irrelevant default tabs are hidden (`showAiTutorTab: false`, `showBackpackTab: false`, `showHistoryTab: false`). The Tutor is a *setting* (`tutor.enabled`), not a panel here.

### P0 build canvas (center) — `AssessmentOutlineCanvas`

Rendered in **Build** mode on the P0 route (`p0Aligned`). Block-based visual outline matching the Lab 2 Frame: heading-xl title, metadata row, connector ticks, and a floating add toolbar.

**Overview header** — uncontainerized: title (`type-heading-h2-semibold`) plus an icon metadata row (question count always; time limit when set; attempts, with "Unlimited attempts" when unset). Placement lives on the workspace header badge, not this row.

**Intro card** (`OutlineIntroCard`) — pinned first block when `artifact.intro` exists (exam mode); never draggable. Collapsed row: `hand-wave` · **Intro Screen** · stem peek · outlined pencil · minus. Expands in place to edit `overviewContent`; time/attempts show read-only (owned by Settings). Removing it clears `intro` and surfaces a ghost **+ Add intro screen** row; stays in sync with the Settings toggle.

**Sections** (`OutlineSectionBlock`) — full-width header (`arrows-to-line` collapse · **Section N** overline · custom title · pencil to rename · overflow menu). Tick connectors (16px between sections / intro, 8px between questions) replace the old left rail. Expanded sections reorder via the overflow menu (Move up / Move down); a **collapsed** section becomes a compact draggable row. Overflow also has **Ungroup section** (questions merge into the neighbor; ungrouping the only section flattens the outline) and **Delete section** (confirm when non-empty; deleting the last section flattens to empty). An **empty section** in a populated outline shows a dashed, unfilled slot (`OutlineEmptySectionSlot`): *This section is empty*, **Add from question bank** (opens the bank rail targeting that section), and **Create new** (the five P0 one-off types). The slot is also the append drop target.

**Question cards** (`OutlineQuestionCard`) — single collapsed row: type icon (drag handle) · internal name · stem peek · outlined extraSmall **pencil** · **minus**. No `page.item` index, no grip-dots, no catalog chips collapsed. Drag with dnd-kit (`@dnd-kit/core`, manual pattern — no sortable dep) within and across sections, with a live outline preview while dragging.

**Edit state** — the card expands in place around `QuestionItemEditor`. Footer: provenance tag (Shared question / This assessment only), **Done** when clean (closes with no save decision), **Discard changes** + **Save** when dirty. Saving a dirty **bank** ref opens `SaveQuestionPrompt`: *Update the shared question* (bank upsert) vs *Save a copy in this assessment only* (converts the ref to inline). Inline/one-off items save directly and offer *Add to question bank*.

**Add actions** — floating **`OutlineAddToolbar`** docked at the bottom of the workspace: **New section** (wraps a flat outline into Section 1, otherwise appends empty), then Multiple Choice / Free Response / Matching, with **More** for Fill in the blank, Drag & drop, and Question bank. Empty-section slots and tick connectors at populated section / flat ends are append drop targets for question drags. Ghost **+ Add intro screen** remains when exam mode has no intro.

### Legacy build canvas — `AssessmentBuildCanvas`

Rendered in **Build** mode on the blank/seeded legacy routes. The canvas is the assessment **outline** (the old `builder-outline` sidebar tab is gone).

**Header**

- Large assessment **title** (`artifact.title`).
- Combined **stats** line: question count and, in graded modes, total points (e.g. `3 Questions • 100 Points`).

**Question cards**

- Vertical cards with shadow; each row shows: **drag handle**, **index**, **prompt**, **type pill** (icon + label such as `Multiple Choice`, `Drag & Drop`), and action buttons.
- **Reorder** via native HTML5 drag on the card header (writes `questionRefs` order).
- **`Edit`** expands the card inline with type-specific fields (question stem, answer options, match pairs, drag-drop lines/categories, fill-in-blank answers, points). Per-item **reveal** is assessment-level config (Settings tab / exam mode), not edited on the question card.
- **Save** (floppy-disk menu) offers **Save for this assessment** (inline snapshot; does not update the shared bank) or **Save to question bank** (upserts bank record + live ref). Edits are held in a local draft until save.
- **Remove** drops the ref from `questionRefs`; if the expanded card has unsaved edits, a browser confirm dialog appears first.
- Domain tags, bank provenance chips, and per-card points are **not** shown on cards — totals live in the header stats line.

**Add question zone**

- Dashed drop zone at the bottom (no filled background). The zone accepts bank-item drops (same as opening the bank).
- **Empty outline** — teal **question bank callout** (*Add from question bank*, tagged *Recommended*, *Browse question bank* CTA) above an **OR** divider, then *Create a new question:* with the type tile grid below.
- **Non-empty outline** — copy *Add a question from the bank or create a new one:* plus the type tile grid.
- **Type tile grid** — five one-off entry points (Free Response, Multiple Choice, Matching, Drag & Drop, Fill in the Blank), each with a colored icon tile. One-offs are scaffolded via `createBlankQuestion` (`blankQuestion.ts`), appended as an **inline** ref (assessment-only until saved to the bank), and expanded inline for editing.

### Inline question editor (`QuestionItemEditor`)

Expanded outline cards use **`QuestionItemEditor`** for type-specific fields plus shared chrome:

- **Bank label** + compact **Points** (numeric, same row when graded) — label is the internal bank listing name, not the student-facing question.
- **Question** (plain heading) + **Body (markdown)** (optional supplemental stem rendered below the heading in preview).
- Type-specific fields (e.g. free response **Placeholder** + **Min characters** on one row).
- **Question bank metadata** — P0: **Standards** only (course/unit are not tags). Legacy: course, difficulty, domains. Used for bank save / filtering.
- No per-question **reveal** controls (owned by assessment config).
- P0 hides the multiple-choice **Survey mode** checkbox.

### Resource panel (sidebar) — `AssessmentBuilderPanel`

Three dedicated rail tabs: **Question bank** (`clipboard-question`) and **Settings** (`sliders`). Question editing lives inline in expanded outline cards (`QuestionItemEditor`). The shared `SidebarTab` union carries these as `builder-bank` / `builder-settings` (see `BUILDER_SIDEBAR_TABS` + `isBuilderTab` in `Sidebar.types.ts`); `showBuilderTab` gates both.

**Card-based layout**

- Editor and bank sections use the same **group card** pattern as other student-facing panels: bordered card, group header, padded body (`groupCard` / `groupHeader` / `groupBody` in `AssessmentBuilderPanel.module.scss`).
- Fields use `size="s"` / `checkboxSize="s"` where applicable.

**Question bank tab**

- **P0** (`QuestionBankPanel`, matches Figma `243:26201` / panel `234:17848`):
  - Flat padded column — no group cards. Top row: full-width **search** field (“Search for a question”) + compact outlined **filter button** (`bars-filter`). The button is icon-only; when filters deviate from the **placement** default it uses the **selected** fill (not brand). Search query is not part of that active state.
  - Filter popover (no Filter overline, no chips under fields): **Sort by:** (A–Z, Z–A, Newest First, Oldest First, Question Type). **Used in course(s) or unit(s):** drills into a combined typeahead (back + **COURSES AND UNITS**, hierarchical course rows with nested units, Clear all + Done). Course parent can be empty / indeterminate / all; selecting the whole course fills the course block and matches every question in that family. Units are OR across courses. **Standard(s):** drills into a typeahead grouped by framework (code + description on one row). **Question type(s):** inline checklist (not a drill-in) with Select all / Clear all — prototype lists all five P0 kinds so bank items stay findable. Closed fields show `All` or a summary (check + overflow `+N` for standards). Footer **Clear filters** is disabled when the popover matches placement defaults (attached → that family + unit, parent indeterminate; floating → empty). AND across layers (course/unit union × standards × type).
  - Uppercase **"N results"** overline below the search row; hidden when the list is empty.
  - Each result is a bordered card: semibold internal title, hover **eye** (visual affordance only), one-line tertiary stem preview, a gray **type** Tag then **standard** chips (`+N` overflow), and a right-aligned icon-only action — brand contained **plus** to add, disabled outlined **check** once added (clicking an added row focuses it in the outline).
  - Empty list: centered **No results** + “Your search produced no results…” + outlined **Clear filters** (clears search and restores placement defaults).
  - Survey items stay hidden. Adds append to the targeted section (default: last).
- **Legacy** blank/seeded: **Course**, **Domains**, **Difficulty** (`QUESTION_DIFFICULTIES` from `lib/assessmentBuilder/difficulty.ts`).
- Course / unit / standard / type filters apply across all course banks loaded from `getAllCourseBanks`.
- Click a question already in the outline to focus/expand it in the canvas.
- Drag a bank question onto the canvas add zone or use add actions to append a live `bank` ref (auto-expands in the outline).

**Settings tab**

- Assessment-level config: title, plus mode-specific options.
- **P0** exposes **Mode** (`Checkpoint (CFU)` vs `Exam`) and applies presets from `applyP0ModePreset` (no shuffle, no survey). Exam settings include time limit, attempts, and intro. Shuffle controls are hidden.
- **Legacy** still shows shuffle, tutor, and exam timing/pool-draw hints.

**Persistence**

- Bank edits auto-save to `lab2:assessment-bank`; draft artifacts to `lab2:assessment-drafts`.

### Preview mode

Renders embedded **`AssessmentArtifactWorkspace`** (full assessment flow via adapters).

## Exam behavior (prototype)

- Timer countdown from `timing.timeLimitMinutes`, rendered with the shared levelgroup timer pattern (`steppedTimedTimer` + `tabularFigures` from `LevelGroupWorkspace.module.scss`)
- Mid-attempt reveal suppressed when `mode === "exam"`
- Tutor defaults off for exams (`tutor.enabled` in settings)
- Pool draw rules resolve additional questions client-side per attempt seed
- Domain score summary shown after submit

## Known gaps

- No Levelbuilder integration (see [Levelbuilder contract](./assessment-builder-levelbuilder-contract.md))
- Scoring authority left open; client-side demo scoring only
- Publish-time question pinning deferred
- Drag-drop scoring marked `ungraded` in prototype scorer
- Free-response AI/rubric scoring is affordance-only
- P0 does not shuffle questions/options or author surveys; those remain on the schema for later phases
- Difficulty is omitted from P0 UI; legacy builder levels still show it

## Levelbuilder boundary

See [assessment-builder-levelbuilder-contract.md](./assessment-builder-levelbuilder-contract.md).
