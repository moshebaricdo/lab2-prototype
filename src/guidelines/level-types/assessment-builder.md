# Assessment Builder

Canonical in-lab authoring for assessment content. The main surface is a **lab-style workspace** that toggles between **Build** (edit) and **Preview** modes; the Lab2 resource panel holds the granular controls (question bank, question editor, settings).

## Product model

- **One artifact** (`AssessmentArtifact`) models surveys, quizzes, practice exams, and single-question checkpoints.
- A **checkpoint** is an assessment with exactly one `QuestionItem` — not a separate level type.
- The **question bank** stores reusable `QuestionItem` records keyed by `bankId`. Assessments hold live `bankId` references so bank edits propagate everywhere (prototype: `localStorage`).
- **Code interpretation** is an optional `codePanel` attachment on any item type, not a sibling type.

## Routes

| Route | Mode | Description |
|-------|------|-------------|
| `/levels/assessment-builder-new` | `quiz` | Blank assessment — empty outline for authoring from scratch |
| `/levels/assessment-builder-seeded` | `quiz` | Seeded practice quiz with six bank questions (mixed types) |

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
| Multi-question preview flow | `src/components/assessment/builder/views/AssessmentArtifactWorkspace.tsx` |
| One-off question factory + kind labels | `src/lib/assessmentBuilder/blankQuestion.ts` |
| Difficulty labels + filter constants | `src/lib/assessmentBuilder/difficulty.ts` |
| Builder state hook | `src/hooks/useAssessmentBuilderState.ts` |
| Bank hook | `src/hooks/useQuestionBank.ts` |
| Mock bank + drafts | `src/data/assessmentBuilder/` |
| Tag chip primitive (bank domain/difficulty) | `src/components/ui/AppTag.tsx` |

## Canonical schema

### `QuestionItem`

Reusable bank record:

- `bankId`, `courseId`, `title`
- `item`: discriminated union (`multi` | `freeResponse` | `match` | `dragDrop` | `fillInBlank`)
- `reveal`: `{ enabled, explanation? }`
- `tags`: `DomainTag[]`
- `difficulty?`: `beginner` | `intermediate` | `advanced` (bank filter + display; defaults to `intermediate` on new one-offs via `createBlankQuestion`)
- `codePanel?`: optional read-only code context (code interpretation)
- `points?`: point value when scored in a graded assessment (defaults to 1; drives the canvas total + `scoreQuestionResponse` `pointsPossible`)
- `updatedAt`

### `AssessmentArtifact`

Assessment-level config:

- `mode`: `checkpoint` | `survey` | `quiz` | `exam`
- `layout`: `scroll` | `stepped`
- `questionRefs`: live `bank` references or `inline` snapshots
- `poolDrawRules?`: draw N questions from tagged pool at runtime
- `shuffle`: question + option order
- `timing?`, `attempts?`, `tutor`, `intro?`, `surveyMode?`

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

- **`PanelHeader`** (`components/ui/PanelHeader`) tops the center surface with eyebrow label **Outline** and a left-aligned **`SegmentedControl`** toggling **Build** / **Preview** (reused from `ide/weblab2/views/SegmentedControl`).
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
- **`Edit`** expands the card inline with type-specific fields (prompt, answer options, match pairs, drag-drop lines/categories, fill-in-blank answers, reveal, points).
- **Save** (floppy-disk icon) collapses the expanded card by clearing selection.
- **Remove** drops the ref from `questionRefs` and clears selection if that question was active.
- Domain tags, bank provenance chips, and per-card points are **not** shown on cards — totals live in the header stats line.

**Add question zone**

- Dashed drop zone at the bottom (no filled background).
- Copy: *Add a question from the bank or create a new one:* plus a teal **bank link** (*Drop a question from the bank here*) that opens the Bank tab. The zone also accepts bank-item drops (same as opening the bank).
- **Type tile grid** — five one-off entry points (Free Response, Multiple Choice, Matching, Drag & Drop, Fill in the Blank), each with a colored icon tile. One-offs are scaffolded via `createBlankQuestion` (`blankQuestion.ts`), saved to the bank, appended as a live `bank` ref, and expanded inline for editing.

### Resource panel (sidebar) — `AssessmentBuilderPanel`

Three dedicated rail tabs: **Question bank** (`layer-group`) and **Settings** (`sliders`). Question editing lives inline in expanded outline cards (`QuestionItemEditor`). The shared `SidebarTab` union carries these as `builder-bank` / `builder-settings` (see `BUILDER_SIDEBAR_TABS` + `isBuilderTab` in `Sidebar.types.ts`); `showBuilderTab` gates both.

**Card-based layout**

- Editor and bank sections use the same **group card** pattern as other student-facing panels: bordered card, group header, padded body (`groupCard` / `groupHeader` / `groupBody` in `AssessmentBuilderPanel.module.scss`).
- Fields use `size="s"` / `checkboxSize="s"` where applicable.

**Question bank tab**

- Filter row uses **`AppMultiSelectDropdown`** (not tag pills): **Course**, **Domains**, **Difficulty** (`QUESTION_DIFFICULTIES` from `lib/assessmentBuilder/difficulty.ts`). Filters apply across all course banks loaded from `getAllCourseBanks`.
- Bank list items show domain tags and difficulty via **`AppTag`**. Click a question already in the outline to focus/expand it in the canvas.
- Drag a bank question onto the canvas add zone or use add actions to append a live `bank` ref (auto-expands in the outline).

**Settings tab**

- Assessment-level config: title, mode-specific options (timing, shuffle, tutor, intro, pool draw, etc.).

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

## Levelbuilder boundary

See [assessment-builder-levelbuilder-contract.md](./assessment-builder-levelbuilder-contract.md).
