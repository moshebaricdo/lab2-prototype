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
| `/levels/assessment-builder-checkpoint` | `checkpoint` | Single multi-choice question + builder |
| `/levels/assessment-builder-survey` | `survey` | Multi-question scroll survey with intro |
| `/levels/assessment-builder-quiz` | `quiz` | Stepped practice quiz with shuffle |
| `/levels/assessment-builder-exam` | `exam` | Timed exam, pool draw, domain scoring |

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
| Build canvas (draggable outline, edit mode) | `src/components/assessment/builder/views/AssessmentBuildCanvas.tsx` |
| Builder panel (editor, bank, settings) | `src/components/assessment/builder/views/AssessmentBuilderPanel.tsx` |
| Multi-question preview flow | `src/components/assessment/builder/views/AssessmentArtifactWorkspace.tsx` |
| One-off question factory + kind labels | `src/lib/assessmentBuilder/blankQuestion.ts` |
| Builder state hook | `src/hooks/useAssessmentBuilderState.ts` |
| Bank hook | `src/hooks/useQuestionBank.ts` |
| Mock bank + drafts | `src/data/assessmentBuilder/` |

## Canonical schema

### `QuestionItem`

Reusable bank record:

- `bankId`, `courseId`, `title`
- `item`: discriminated union (`multi` | `freeResponse` | `match` | `dragDrop` | `fillInBlank`)
- `reveal`: `{ enabled, explanation? }`
- `tags`: `DomainTag[]`
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

The builder splits responsibilities between a **workspace** (center) and the **resource panel** (sidebar).

### Workspace (center) — `AssessmentBuilderWorkspace` + `AssessmentBuildCanvas`

- A `SegmentedControl` (reused from `ide/weblab2/views/SegmentedControl`) toggles **Build** / **Preview**.
- **Build mode** renders `AssessmentBuildCanvas`: the assessment outline as a list of draggable question cards. Each card shows a drag handle, index, kind badge (`MC · Single`, `Parsons`, …), domain/bank chips, prompt, and (graded modes) points. Cards support **reorder** (native HTML5 drag, writes `questionRefs` order), **remove**, and **edit** (selects the question + opens the Question editor tab in the sidebar).
- The canvas **Add question** section offers **From Question Bank** (opens the Bank tab) and **one-off** type buttons. One-offs are scaffolded via `createBlankQuestion` (`blankQuestion.ts`), saved to the bank, appended as a live `bank` ref, and opened in the editor.
- **Preview mode** renders the embedded `AssessmentArtifactWorkspace` (full assessment flow).

### Resource panel (sidebar) — `AssessmentBuilderPanel`

- Three dedicated rail tabs: **Question bank** (`layer-group`), **Question editor** (`file-pen`), **Settings** (`sliders`). The shared `SidebarTab` union carries these as `builder-bank` / `builder-editor` / `builder-settings` (see `BUILDER_SIDEBAR_TABS` + `isBuilderTab` in `Sidebar.types.ts`); `showBuilderTab` gates all three. The old `builder-outline` tab is gone — the outline now lives in the Build canvas.
- Irrelevant default tabs are hidden (`showAiTutorTab: false`, `showBackpackTab: false`). The Tutor is a *setting* (`tutor.enabled`), not a panel here.
- Panel styling follows resource-panel conventions: `ScrollArea` body, 8px padding, `size="s"` fields, `checkboxSize="s"`, section sub-titles. **Expand** widens the panel for denser authoring.
- Bank edits auto-save to `lab2:assessment-bank`; draft artifacts to `lab2:assessment-drafts`.

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
