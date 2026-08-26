# Assessment Builder

Canonical in-lab authoring for assessment content. The main surface is a **lab-style workspace** that toggles between **Build** (edit) and **Preview** modes; the Lab2 resource panel holds the granular controls (question bank, question editor, settings).

Living workstream status (P0 decisions, what’s in/out, changelog): [`docs/status.md`](../../../docs/status.md).

## Product model

- **One artifact** (`AssessmentArtifact`) models quizzes, practice exams, and single-question checkpoints (CFUs). Surveys are out of scope for P0.
- A **checkpoint / CFU** is an assessment with typically one `QuestionItem` — not a separate level type. Switch Mode in P0 settings to apply CFU vs exam presets.
- The **question bank** stores reusable `QuestionItem` records keyed by `bankId`. Assessments hold live `bankId` references so bank edits propagate everywhere (prototype: `localStorage`).
- Questions are tagged (and filterable) by **course**, **unit**, and **concept** (loose term for domains / standards). Difficulty is dropped.
- **Code interpretation** is an optional `codePanel` attachment on any item type, not a sibling type.
- P0 does **not** shuffle question order or answer options (downstream teacher-dashboard impact).

## Routes

| Route | Mode | Description |
|-------|------|-------------|
| `/levels/assessment-builder-new` | `quiz` | Blank assessment — empty outline for authoring from scratch |
| `/levels/assessment-builder-seeded` | `quiz` | Seeded practice quiz with six bank questions (mixed types) |
| `/levels/assessment-builder-p0` | `exam` | **P0-aligned prototype** — cert exam seed; Checkpoint (CFU) vs Exam settings; course / unit / concept bank filters. No survey, shuffle, or difficulty. |

Legacy levelgroup routes remain under Assessment sets / Experiments for comparison only.

## Key files

| Area | Path |
|------|------|
| Canonical types | `src/types/assessmentBuilder.ts` |
| Adapters (canonical → preview payloads) | `src/lib/assessmentBuilder/adapters.ts` |
| Scoring + domain aggregation | `src/lib/assessmentBuilder/scoring.ts` |
| Pool draw + shuffle runtime | `src/lib/assessmentBuilder/examRuntime.ts` |
| Bank persistence | `src/lib/assessmentBuilder/bankStorage.ts` |
| Draft persistence | `src/lib/assessmentBuilder/draftStorage.ts` |
| Builder workspace (Build/Preview shell) | `src/components/assessment/builder/views/AssessmentBuilderWorkspace.tsx` |
| Build canvas (draggable outline, inline question editor) | `src/components/assessment/builder/views/AssessmentBuildCanvas.tsx` |
| Inline question editor (type-specific fields) | `src/components/assessment/builder/views/QuestionItemEditor.tsx` |
| Builder panel (bank, settings) | `src/components/assessment/builder/views/AssessmentBuilderPanel.tsx` |
| P0 question bank (filters + results) | `src/components/assessment/builder/views/QuestionBankPanel.tsx` |
| Multi-question preview flow | `src/components/assessment/builder/views/AssessmentArtifactWorkspace.tsx` |
| One-off question factory + kind labels | `src/lib/assessmentBuilder/blankQuestion.ts` |
| P0 mode presets (CFU vs exam) | `src/lib/assessmentBuilder/p0Mode.ts` |
| Course / unit / concept taxonomy helpers | `src/lib/assessmentBuilder/taxonomy.ts` |
| Difficulty labels + filter constants | `src/lib/assessmentBuilder/difficulty.ts` (legacy builder only) |
| Builder state hook | `src/hooks/useAssessmentBuilderState.ts` |
| Bank hook | `src/hooks/useQuestionBank.ts` |
| Mock bank + drafts | `src/data/assessmentBuilder/` |
| Tag chip primitive (bank unit/concept, canvas “Recommended”) | CADS `Tag` from `@moshebaricdo/cads-react` |

## Canonical schema

> Product model specs live in the repo root `docs/` folder: [Question Types & Field Requirements](../../../docs/question-types-and-fields.md) and [Assessment Configuration & Modes](../../../docs/assessment-config-and-modes.md). Implementation-oriented field notes for the inline editors also live in [assessment-builder-question-schema.md](./assessment-builder-question-schema.md).

### `QuestionItem`

Reusable bank record:

- `bankId`, `courseId`, `title`
- `unitId?`: curriculum unit within the course bank
- `item`: discriminated union (`multi` | `freeResponse` | `match` | `dragDrop` | `fillInBlank`)
- `reveal`: `{ enabled, explanation? }`
- `tags`: concept tags (`DomainTag[]` — P0 UI labels these **Concepts**)
- `difficulty?`: **dropped in P0**; still present on legacy drafts / the blank+seeded builder
- `codePanel?`: optional read-only code context (code interpretation)
- `points?`: point value when scored in a graded assessment (defaults to 1; drives the canvas total + `scoreQuestionResponse` `pointsPossible`)
- `updatedAt`

### `AssessmentArtifact`

Assessment-level config:

- `mode`: `checkpoint` | `quiz` | `exam` (P0 authoring: **checkpoint** and **exam** only; `survey` remains on the type for legacy drafts)
- `layout`: `scroll` | `stepped`
- `questionRefs`: live `bank` references or `inline` snapshots
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

- **`PanelHeader`** (`components/ui/PanelHeader`) tops the center surface with eyebrow label **Outline** and a left-aligned **`SegmentedControl`** toggling **Build** / **Preview** (from `components/ui/SegmentedControl`).
- Resource panel width uses the shared `useLayoutState` default (**400px**); drag-resize clamps between 300px and 600px, same as other assessment levels.
- On mount, the active tab defaults to **`builder-bank`**. Irrelevant default tabs are hidden (`showAiTutorTab: false`, `showBackpackTab: false`, `showHistoryTab: false`). The Tutor is a *setting* (`tutor.enabled`), not a panel here.

### Build canvas (center) — `AssessmentBuildCanvas`

Rendered in **Build** mode. The canvas is the assessment **outline** (the old `builder-outline` sidebar tab is gone).

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
- **Question bank metadata** — P0: course, unit, concepts. Legacy: course, difficulty, domains. Used for bank save / filtering.
- No per-question **reveal** controls (owned by assessment config).
- P0 hides the multiple-choice **Survey mode** checkbox.

### Resource panel (sidebar) — `AssessmentBuilderPanel`

Three dedicated rail tabs: **Question bank** (`clipboard-question`) and **Settings** (`sliders`). Question editing lives inline in expanded outline cards (`QuestionItemEditor`). The shared `SidebarTab` union carries these as `builder-bank` / `builder-settings` (see `BUILDER_SIDEBAR_TABS` + `isBuilderTab` in `Sidebar.types.ts`); `showBuilderTab` gates both.

**Card-based layout**

- Editor and bank sections use the same **group card** pattern as other student-facing panels: bordered card, group header, padded body (`groupCard` / `groupHeader` / `groupBody` in `AssessmentBuilderPanel.module.scss`).
- Fields use `size="s"` / `checkboxSize="s"` where applicable.

**Question bank tab**

- **P0** (`QuestionBankPanel`, CADS-aligned to the finalized Figma sidebar):
  - **Filters** card: search field, icon-only **A–Z / Recent** sort, combined **Course or unit** checklist with dismissible info chips, **Standard** checklist with dismissible pink chips (codes when present). Reset in the card header.
  - **Questions** card: count tag, divider list rows. Each row shows type icon + internal title, one-line stem preview, unit (info) + first standard (pink) with `+N` overflow, and an icon-only Add / Added control.
  - Survey items stay hidden. Course-or-unit matching is a union (selected courses or selected units).
- **Legacy** blank/seeded: **Course**, **Domains**, **Difficulty** (`QUESTION_DIFFICULTIES` from `lib/assessmentBuilder/difficulty.ts`).
- Course menu width matches the select (`menuWidth="trigger"`, with a checklist hug workaround). Filters apply across all course banks loaded from `getAllCourseBanks`.
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
