# Assessment Builder

Canonical in-lab authoring for quizzes. The main surface is a **lab-style workspace** that toggles between **Build** (edit) and **Preview** (student quiz). The Lab2 resource panel holds the question bank and **Configuration**.

Living workstream status: [`docs/status.md`](../../../docs/status.md). Decision log: [`docs/quiz-authoring-decisions.md`](../../../docs/quiz-authoring-decisions.md).

## Product model

- **One artifact** (`AssessmentArtifact`) models a quiz `Level`. A CFU is typically one question; practice/exam/exam-simulation are the same type with a different `purpose`.
- **`purpose`** (`check_for_understanding` | `practice` | `exam` | `exam_simulation`) seeds student settings and is the reporting tag. Authors may override fields; that does not change purpose.
- The **question bank** stores reusable `QuestionItem` records keyed by `bankId`. Hide rows with `listedInBank: false`.
- Questions are tagged by **standards** only. Course and unit are bank **scope** and quiz **placement**.
- P0 does **not** shuffle question order or answer options.
- P0 question types are **Multiple Choice, Free Response, and Matching**. Fill-in-the-blank and ordering (Parsons) stay in mock data for legacy routes but are not listed in the P0 bank and are not seeded on the exam.

## Routes

| Route | Role |
|-------|------|
| `/levels/assessment-builder-p0` | **Final quiz builder** — seeded Unit 3 exam, attached, live in 2 units |
| `/levels/assessment-builder-p0-cfu` | **Final quiz builder** — seeded Unit 2 CFU, one question, unpublished |
| `/levels/assessment-builder-p0-draft` | **Final quiz builder** — new quiz, no purpose until the chooser |
| `/levels/assessment-builder-new` | Kept exploration — blank legacy outline (Experiments on `/levels`) |
| `/levels/assessment-builder-seeded` | Kept exploration — six-question legacy quiz (Experiments on `/levels`) |
| `/levels/cfu-multi` | Student CFU radio, no retry (S4) |
| `/levels/cfu-multi-retry` | Student CFU radio, retry + require-correct (S5) |
| `/levels/cfu-multi-continue` | Student CFU radio, retry + can continue (S6) |
| `/levels/cfu-multi-reveal` | Student CFU radio, reveal key + explanation after submit |
| `/levels/cfu-multi-capped` | Student CFU radio, must-correct + 3 attempts (S9) |
| `/levels/cfu-multi-checkboxes` | Student CFU two-correct, retry + require-correct (S5) |
| `/levels/cfu-multi-checkboxes-continue` | Student CFU two-correct, retry + can continue (S6) |
| `/levels/cfu-multi-checkboxes-no-retry` | Student CFU two-correct, no retry (S4) |
| `/levels/cfu-multi-checkboxes-reveal` | Student CFU two-correct, reveal after submit |
| `/levels/cfu-multi-checkboxes-capped` | Student CFU two-correct, must-correct + 3 attempts (S9) |
| `/levels/cfu-free-response` | Student CFU FR (no correctness chrome; file upload row) |
| `/levels/cfu-free-response-reveal` | Student CFU FR — submitted state; no explanation card |
| `/levels/cfu-free-response-capped` | Student CFU FR — attempt chip only (no Incorrect + Try again) |
| `/levels/cfu-matching` | Student CFU match, no retry (S4) |
| `/levels/cfu-matching-retry` | Student CFU match, retry + require-correct (S5) |
| `/levels/cfu-matching-reattempt` | Student CFU match, next attempt with correct pairs locked (S7) |
| `/levels/cfu-matching-continue` | Student CFU match, retry + can continue (S6) |
| `/levels/cfu-matching-reveal` | Student CFU match, reveal pairs |
| `/levels/cfu-matching-capped` | Student CFU match, must-correct + 3 attempts (S9) |
| `/levels/cfu-teacher` | Teacher CFU — key + explanation + teacher note; type bubbles |
| `/levels/cfu-teacher-as-student` | Teacher CFU — student flow + “No responses” |
| `/levels/cfu-teacher-response` | Teacher CFU — read-only student response vs key |
| `/levels/quiz-practice` | Student quiz — intro, 3 questions, one page, retries, correctness |
| `/levels/quiz-exam-retries` | Student exam — 3 attempts, correctness on |
| `/levels/quiz-exam-final` | Student exam — 1 attempt, correctness on |
| `/levels/quiz-exam` | Student exam — 1 attempt, correctness off (receipt) |
| `/levels/quiz-exam-resume` | Student exam — in-progress intro; sessionStorage restore |
| `/levels/quiz-teacher` | Teacher quiz — **View questions**, keys, response counts |
| `/levels/quiz-teacher-as-student` | Teacher quiz — student attempt + “No responses” |
| `/levels/quiz-teacher-response` | Teacher quiz — mid-attempt banner; **View results** |
| `/levels/quiz-teacher-response-submitted` | Teacher quiz — submitted results for Maya (70%) |

Legacy multi / FR / match / levelgroup routes remain under Assessment for comparison.

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
| P0 outline blocks | `OutlineQuestionCard.tsx`, `OutlineSectionBlock.tsx`, `OutlineIntroCard.tsx`, `OutlineAddRow.tsx` (same folder) |
| Quiz configuration | `QuizConfigPanel.tsx` (`purpose` chooser + Content / Rules / Feedback / AI Tutor) |
| Quiz preview empty state | `QuizPreviewEmptyState.tsx` (Figma `600:7186`) |
| Quiz status tag | `QuizStatusTag.tsx` |
| Question usage | `QuestionUsagePanel.tsx` |
| Bank preview modal | `QuestionBankPreviewModal.tsx` |
| Shared-question save prompt | `SaveQuestionPrompt.tsx` (unpublished copy vs published new version) |
| Section delete confirm | `SectionDeleteDialog.tsx` (CADS Dialog, default 800px) |
| Student CFU | `src/components/assessment/cfu/CfuQuestionWorkspace.tsx` |
| Student quiz | `src/components/assessment/quiz/QuizAttemptWorkspace.tsx` |
| Teacher viewpoint chrome | `src/components/assessment/shared/ViewpointChrome.tsx` |
| Note-card visibility (FR exemplar vs match/multi explanation) | `src/lib/assessmentBuilder/answerNotes.ts` |
| In-progress attempt snapshot | `src/lib/assessmentBuilder/attemptStorage.ts` |
| Purpose seeds | `src/lib/assessmentBuilder/quizPurpose.ts` |
| Single-question incorrect footer + attempt chip / last-page labels | `src/lib/assessmentBuilder/studentFooter.ts` |
| Shared question-card action row | `src/components/assessment/shared/StudentQuestionCardFooter.tsx` |
| Sitting-count chip | `src/components/assessment/shared/QuizAttemptChip.tsx` |
| Quiz status | `src/lib/assessmentBuilder/quizStatus.ts` |
| Question kind icon/label metadata | `src/components/assessment/builder/views/questionKindMeta.ts` |
| Legacy build canvas (blank/seeded routes only) | `src/components/assessment/builder/views/AssessmentBuildCanvas.tsx` |
| Inline question editor (type-specific fields) | `src/components/assessment/builder/views/QuestionItemEditor.tsx` |
| Builder panel (bank, settings) | `src/components/assessment/builder/views/AssessmentBuilderPanel.tsx` |
| P0 question bank (filters + results) | `src/components/assessment/builder/views/QuestionBankPanel.tsx`, `QuestionBankFilterMenu.tsx` |
| P0 standards typeahead (bank + Question tab) | `src/components/assessment/builder/views/StandardsTypeahead.tsx` |
| Multi-question preview flow | `src/components/assessment/builder/views/AssessmentArtifactWorkspace.tsx` |
| One-off question factory + kind labels | `src/lib/assessmentBuilder/blankQuestion.ts` |
| P0 mode presets (CFU vs exam) | `src/lib/assessmentBuilder/p0Mode.ts` |
| Course / unit scope + placement helpers | `src/lib/assessmentBuilder/taxonomy.ts`, `placement.ts` |
| Difficulty labels + filter constants | `src/lib/assessmentBuilder/difficulty.ts` (legacy builder only) |
| Builder state hook | `src/hooks/useAssessmentBuilderState.ts` |
| Bank hook | `src/hooks/useQuestionBank.ts` |
| Mock bank + drafts | `src/data/assessmentBuilder/` |
| Tag chip primitive (bank **standards**, canvas “Recommended”) | CADS `Tag` from `@moshebari/cads-react` |

## Canonical schema

> Product model specs live in the repo root `docs/` folder: [Question Types & Field Requirements](../../../docs/question-types-and-fields.md) and [Assessment Configuration & Modes](../../../docs/assessment-config-and-modes.md). Implementation-oriented field notes for the inline editors also live in [assessment-builder-question-schema.md](./assessment-builder-question-schema.md).

### `QuestionItem`

Reusable bank record:

- `bankId`, `title` (internal name — never shown to learners)
- `item.content.prompt` / `description`: student **Question title** and optional markdown **stem**. Seeded bank rows mix both patterns: title-as-question (prompt only) and short title + stem (description does the work, sometimes with a fenced code block). Student chrome and bank preview render description as markdown.
- `numericId` / `questionKey`: Levelbuilder integer id + family UUID. Seeded bank rows always have both (plus version index/count, last-edited, used-in, and versions). New in-quiz questions mint them on first Save.
- `courseId` / `unitId?`: prototype **usage stand-in** for bank filters (not author-assigned tags; P0 UI does not show or edit them)
- `item`: discriminated union (`multi` | `freeResponse` | `match` | `dragDrop` | `fillInBlank`)
- `reveal`: `{ enabled, explanation? }`
- `tags`: **standards** (`DomainTag[]` — optional `code` is the compact id on bank chips)
- `difficulty?`: **dropped in P0**; still present on legacy drafts / the blank+seeded builder
- `codePanel?`: optional read-only code context (legacy only — P0 authors put snippets in the stem markdown)
- `points?`: point value when scored in a graded assessment (defaults to 1; drives the canvas total + `scoreQuestionResponse` `pointsPossible`)
- `updatedAt`

### `AssessmentArtifact`

Assessment-level config:

- `purpose?`: one of four quiz purposes. Missing until the create chooser.
- `showIntroScreen?`, `feedback?` (`showCorrectness`, `revealAnswerExplanation`), `allowMultipleAttempts?`, `requireCorrectAnswerToContinue?` (nested under attempts; hidden when attempts are off; independent of max attempts)
- `intro?`: `{ title?, overviewContent, timeMinutes, attempts? }`. Optional `title` is the student intro heading; unset falls back to the quiz level name.
- `unitPlacements?`: prototype stand-in for script_levels (drives the status tag)
- `title`: Level name. Always set on the in-lab builder — authors name the Level when they create it in Levelbuilder. The draft seed is **AI Foundations Certification Exam** (Figma empty quiz), not “New quiz” / blank. Not edited here.
- `levelId`: Levelbuilder numeric level id. Always set on the in-lab builder (the Level exists before this screen). Shown in the status popover; never a blank / N/A. Optional only on pre-P0 / student-route mocks.
- `mode`: still present for adapters/legacy; derived from purpose on the final builder
- `placement?`: `floating` | `attached` (course family + optional unit). Levelbuilder-owned in prod; prototype chrome + bank auto-scope.
- `layout`: `scroll` | `stepped`
- `questionRefs`: live `bank` references or `inline` snapshots
- `sections?`: `AssessmentSection[]` (`{ id, title?, description?, questionRefs }`). Structural invariant: absent/empty = flat outline; non-empty = **every** question lives in a section (sections are pages to the learner). When sectioned, `sections` is authoring truth and the flattened `questionRefs` mirror is re-derived on every mutation (`withSections` in `outline.ts`) so adapters/preview/scoring stay section-unaware.
- `poolDrawRules?`: draw N questions from tagged pool at runtime (not authored in P0)
- `shuffle`: question + option order (**off and hidden in P0**)
- `timing?`, `attempts?`, `tutor`, `surveyMode?` (survey mode hidden in P0)

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

- **`PanelHeader`** tops the center surface with eyebrow **workspace**, **Build / Preview**, and a **`QuizStatusTag`** (medium CADS Tag: Not in a unit / Unpublished / Live in N units / Sunsetting / Deprecated). Hover (or click) opens a 500px custom Popover anchored to the tag: four identity stats (Level ID / Level name / Purpose / Last edited — ID, Purpose, and Last edited hug; Level name takes the leftover), a framed **Placed in** table, and a footnote when non-live placements are listed: “Pilot, beta, and in-development statuses are not counted as live units.” Blank / N/A values (**No purpose**, empty table cells, `—` in the placement table) use `text-neutral-placeholder`. Level ID and Level name are always real (the Level exists and was named before this screen).
- Open items use tabs **Question / Answers / Usage** (`Tabs type="primary" size="extraSmall"`, 32px, hug labels, 14px gap, full-width baseline on the card). Collapsed rows show type icon · name · stem · outlined **pencil** (expands). When the draft is dirty, a medium 24×24 unsaved warning Tag (icon-only `triangle-exclamation`, tooltip “Unsaved changes” above) sits between the hover **trash** and the pencil. Hover reveals a text **trash** (tooltip **Remove from quiz** above); collapsing blurs the toggle and ignores row hover until the pointer leaves so trash does not stay visible. Expanded rows use **chevron-up**. Collapse never prompts. Clicking a collapsed row does not expand it — only the pencil does.
- New unsaved questions: **Discard** + **Save**; Usage disabled until first save.
- **Save** (including after a shared/published prompt) collapses the card and shows a CADS Toast (`topCenter`, success, “Question saved”). Close without changes does not toast.
- Leave-page dialog if any question is dirty. Not on collapse or switching items. Builder dialogs (save prompt, leave page, purpose change, section delete) use the CADS Dialog default **800px** max width.
- Resource panel tabs: **Question bank**, **Configuration** (`builder-settings`), and **Dev** (reset stored quiz drafts / question bank / session storage, then reload).
- P0 global header keeps the centered level-progress bubbles, hides the lesson name / save subtitle, and shows **Back to Levelbuilder** / **Save** (outlined extraSmall on brand) beside the logo.
- Resource panel width uses the shared `useLayoutState` default (**400px**); drag-resize clamps between 300px and 600px, same as other assessment levels.
- On mount, the active tab defaults to **`builder-bank`**. Irrelevant default tabs are hidden (`showAiTutorTab: false`, `showBackpackTab: false`, `showHistoryTab: false`). The Tutor is a *setting* (`tutor.enabled`), not a panel here.

### P0 build canvas (center) — `AssessmentOutlineCanvas`

Rendered in **Build** mode on the final builder (`p0Aligned`). Block-based outline: heading title, metadata row, connector ticks. The column is **800px** (`max-width`, centered) with **64px** top and bottom padding. **32px** left/right padding keeps a gutter when the workspace is too narrow for the full 800px; when there is room, the content column still reaches 800px. No floating add toolbar.

**Intro card** — shown when Configuration enables **Show intro screen**. Collapsed: outlined **pencil** (same as questions). Expanded: **chevron-up**. Optional **Intro screen title** (unset → quiz level name) and markdown **Content** are edited here, not in Config. No tabs. **Remove from quiz** turns the intro off.

**Sections** — **SECTION N** (overline) · 2px dot · **N questions** (body-4). No author-facing section names. Hovering the collapse icon, **SECTION N**, or the count fills the collapse control (same pattern as ADD SECTION filling the plus). Clicking any of those toggles collapse. Icon is `arrows-to-line` when expanded and `arrows-from-line` when collapsed. Tooltip **Collapse** / **Expand** sits to the **left**. Kebab: Add above/below (`arrow-up-to-line` / `arrow-down-to-line`) · Move (`arrow-up` / `arrow-down`) · Delete (not Rename). Sections are not draggable; reorder via the kebab. Empty sections delete immediately. A populated section opens a CADS Dialog (default 800px) confirming that removing the section also removes its questions: outlined **Cancel**, error primary **Remove section and questions**. After any delete, a top-center CADS toast (“Section removed”) offers **Undo** for 5s and puts the section (and its questions) back at the same index. Ghost **ADD SECTION** at the end of the outline when the quiz is not fully empty.

**Question cards** — type icon · internal name · stem · outlined pencil (replaces the collapsed chevron). Hover: text-error trash (tooltip **Remove from quiz** above). Dirty collapsed rows put a medium 24×24 unsaved warning Tag between trash and pencil. Shadow only while dragging (overlay), not on hover. Collapsed rows are draggable within and between sections (6px activation); the pencil is the only expand control. Expanding scrolls the card to the top of the outline with a **64px** offset. Open item: extraSmall primary tabs Question / Answers / Usage on `background-neutral-secondary` with a full-width baseline; editor fields on white. Footer extraSmall: **Remove from quiz** (outlined error) · Discard changes / Save (dirty) or Close. Save collapses the card.

**Empty quiz** — when there are no sections and no questions: dashed illustration (“This quiz is empty”) with **Create question** (create types only) and **New Section**. No ADD SECTION ghost.

**Empty section** — dashed slot: “This section is empty”, helper, **Create question** (create types only). Bank adds stay on the rail.

**Create question** — dashed **+ Create question ⌄** (`border-neutral-primary`) at the end of every populated section (create types only). Bank adds stay on the rail. No row hover fill.

**Add section ghost** — plus + **ADD SECTION** overline at the end of a non-empty outline. The whole row is clickable; hovering anywhere on the row (or the plus) fills the nested 24px plus. The row itself has no hover fill.

**Save** — unpublished shared questions: Update everywhere vs Save a copy for this quiz. Published: Cancel vs Save for this quiz (new version). Authors never see “fork.” After a successful save the card collapses and a top-center CADS toast confirms.

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

- **Bank label** + compact **Points** (numeric, same row when graded) — label is the internal bank listing name, not the student-facing question. P0 Question tab: **Internal name**, **Question title**, **Description**, **Standard(s):** (same typeahead as the bank filter, CADS size **small** / 32px, chevron-right, placeholder “Select standards”; no helpers, 8px stack). The open menu is locked to the field width; the typeahead panel fills that menu (bank filter stays 325px because its popover is that wide).
- P0 Answers tab: MC **Selection type:** (`Single (radio)` / `Multiple (checkbox)`, hug-width SegmentedButton) + **Options** as 50px cards (grip · text · selected check mark · trash; grip reorders via pointer, not nested outline dnd) with a dashed ghost **Add option** (nested extraSmall text CADS button, same as Create question); matching **Options** as term/definition pair cards (grip reorders) + the same ghost **Add pair**; FR **Placeholder (optional)**, **Minimum submission length (optional)**, and file-upload checkbox. Shared **Answer explanation (optional)** (FR: **Exemplar response (teachers only)**).
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

- **P0** (`QuestionBankPanel`, matches Figma Question Bank Panel `326:42657` / list item `326:42249`):
  - Flat padded column (`10px`) — no group cards. Top row: full-width **search** field (“Search for a question”) + compact outlined **filter button** (`bars-filter`, 32px). The button is icon-only; when any course/unit/standard/type filter is selected, or hide-added is on, it uses the **selected** fill (not brand). Search query and sort are not part of that active state.
  - Filter popover (Figma `326:42328`, no Filter overline, no chips under fields), field order matching Figma: **Sort by:** (A–Z, Z–A, Newest First, Oldest First, Question Type). **Question type(s):** inline checklist (chevron-down; not a drill-in) for Multiple Choice / Free Response / Matching; the portaled menu is locked to the trigger width. **Standard(s):** drills into a typeahead grouped by framework (code + description on one row). **Used in course(s) or unit(s):** drills into a combined typeahead (back + **COURSES AND UNITS**, hierarchical course rows with nested units, Clear all + Done). ExtraSmall **Hide added items from results** checkbox under the course field (6px extra top padding). When on, questions already on this quiz leave the list instead of showing the disabled added check. Default for every filter field is **All** (nothing selected); hide-added is off. Course parent is empty / **indeterminate** (dash) when some but not all units are selected / selected when the whole course is checked (all nested units also show selected). Indeterminate on an unselected row uses standalone Checkbox chrome (navy fill, green dash); a selected row keeps the inverted checklist checkbox (green fill, navy icon). Selecting the whole course fills the course block and matches every question in that family. Units are OR across courses. Closed fields show `All` or a summary (`circle-check` + overflow `+N` for standards). Footer **Clear filters** is disabled when nothing is selected (including hide-added) and does **not** clear the search query. AND across layers (course/unit union × standards × type × hide-added).
  - Uppercase **"N results"** Overline 3 (`text-neutral-quaternary`) below the search row; hidden when the list is empty.
- Each result is a `shape-lg` bordered card (`10/10/12/12` padding): Body 3 semibold internal title, hover **eye** (CADS Close Icon Button chrome, 18px, tooltip “Preview”, placement top — same as add) opens a read-only modal (**Preview / Details / Usage**). Closing the modal remounts that result so the eye does not stay in a stuck hover. Adding remounts every already-in-quiz result so plus / “Already in this assessment” tooltips do not linger. The already-added tooltip waits 500ms (`enterDelay` / `enterNextDelay`) so it does not appear on the plus click. One-line stem (Body 4, `text-neutral-tertiary`), **info** type Tag (Title Case, with icon) then up to **two** pink standard chips that **do not wrap** — leftover chips collapse into a `+N` overflow as soon as the row runs out of width — plus / disabled contained-primary **check** to add. When the quiz has **multiple sections**, plus (and modal **Add to quiz**) opens the B1.6 extraSmall menu (`bottomLeft`, left edge of the plus): each section, separator, **+ New section**. The plus tooltip (“Add to assessment”) dismisses while that menu is open so it cannot sit over a flipped (top) menu.
  - `listedInBank: false` and survey items stay hidden. Fill-in-the-blank and drag-and-drop (ordering) records stay in mock data for legacy routes but are **not listed** in the P0 bank and are **not on the seeded exam** (P0 types are Multiple Choice, Free Response, Matching).
  - Empty list: vertically centered 48px `empty-set` glyph on `background-neutral-septenary`, **No results** (Body 2 semibold), “Your search produced no results…” (Body 4, `text-neutral-secondary`), outlined **Clear filters** (clears search and all filter fields back to All).
  - Survey items stay hidden. Adds append to the chosen section, or to the targeted section (default: last). **New section** appends an empty section then places the question there.
- Bank preview modal (`QuestionBankPreviewModal`, Figma `326:42610` / Details `326:42615` / Usage `326:42620`): CADS Modal maxWidth 800, title = internal name, header close only. Tab bar on `background-neutral-secondary`. Body height is locked to the tallest of Preview / Details / Usage so switching tabs does not resize the modal. Footer: outlined **+ Add to quiz** (section menu when needed; places the question and closes) + contained **Back to all results**. Preview tab is **not** the student lab chrome — nothing is clickable; answers are always revealed (MC: success row + trailing check; FR: heading + stem only, no textarea; Matching: success term/definition chips already paired). Stem `description` is markdown (fenced code included). Details: explanation/exemplar, then small (24px) type Tag + wrapping standard Tags. Usage: identity row with copy on ID/Key, Used in / Versions tables framed with `border-neutral-primary` and `shape-sm` (header band, last row unlined), **8px** apart. An empty Versions table keeps the header and shows “No other versions…” as a Body 3 row inside the frame.
- **Legacy** blank/seeded: **Course**, **Domains**, **Difficulty** (`QUESTION_DIFFICULTIES` from `lib/assessmentBuilder/difficulty.ts`).
- Course / unit / standard / type filters apply across all course banks loaded from `getAllCourseBanks`.
- Click a question already in the outline to focus/expand it in the canvas.
- Drag a bank question onto the canvas add zone or use add actions to append a live `bank` ref. P0 adds stay **collapsed** in the outline (pencil to edit). Clicking an already-added title still focuses/expands it.

**Configuration tab** (`QuizConfigPanel`, Figma `configPanel` `326:43788`)

- Panel content pad **10px**. Chooser stack gap **10px**; edit stack gap **8px**. Group cards use `shape-md`, 32px header, Overline 3.
- **Create** (`326:43789`): “What is this quiz for?” + “Applies typical settings (you can change these).” Four option cards (`326:43748`): default fill `background-neutral-secondary` + `border-neutral-primary`; **hover** keeps the fill and uses `border-neutral-secondary`; **press** is `background-neutral-tertiary` + secondary border; **focus** is the CADS double ring (not outline-offset).
- **Edit:** Purpose dropdown (CADS Field Wrapper label) + groups **Content** (Show intro), **Rules** (time, retries, max attempts, require-correct), **Feedback** (Show correctness; nested Reveal), **AI Tutor**. Time limit and max attempts are number fields (arrow keys step by 1; empty = unset). Time limit is left-aligned with a trailing **minutes** unit (Figma’s right-aligned placeholder was a mistake). When any setting differs from the purpose defaults (`326:44145`): outlined 32px `arrow-rotate-left` beside the dropdown (tooltip **Reset to defaults**) reapplies typical settings and keeps purpose; helper: “You've made changes to the default settings. Quiz will remain tagged as your selected purpose.”
- Conditional nests (max attempts + **Require a correct answer to continue**, Reveal) live **inside** the parent card row (`gap: 8px`, row `padding: 8px`). The nest is a full-width `shape-sm` box (`padding: 6px 8px`, secondary fill, primary border) — not a sibling row with extra side margin. Require-correct is hidden when attempts are off and is independent of max attempts.
- Intro **copy** is a workspace card. Config only toggles show/hide.
- Changing purpose confirms before replacing seeded fields if settings are dirty.

### Preview mode

Renders embedded **`QuizAttemptWorkspace`** (same student chrome as `/levels/quiz-*`). Intro and results/receipt have **no** sticky footer. A **single-question** attempt (typical CFU) also has no sticky bar: **Submit** sits in the question card footer, matching `/levels/cfu-*`. Multi-question attempts use `stickyFooter`: outlined **Back**, CADS Pagination (numbered tabs only — no first/last/prev/next, no unanswered dots), a 32px **Attempt N of M** / **Final attempt** chip when `max_attempts` is set, a 32px **m:ss remaining** pill when timed (`tabular-nums` so the pill does not shift as digits change), and **Next / Finish / Submit**. **Next** / **Finish** / **View results** / **Next level** keep `arrow-right`; **Submit** does not. **Finish** only when a results screen is next and this sitting is not terminal; last attempt or no-reveal last pages use **Submit**. **Submit / Finish** is disabled in builder Preview so an author cannot lock an attempt. Results are one scrolling page with hairline `pageDivider` rows (`Page N of M · Questions A–B`) when the attempt had more than one page. Submit / incomplete / time’s-up dialogs follow the Figma table: **Keep working** primary, **Submit now** secondary. Legacy routes still use `AssessmentArtifactWorkspace`.

**Empty preview** (Figma `600:7186`) — when there are no questions and the intro is off: same illustration as the Build empty quiz, **Nothing to preview yet**, “Preview shows the quiz the way students will see it. As you add questions the preview will populate here.”, outlined **Back to Build** (returns to the Build segment). Workspace header and status tag stay. Preview still runs if the intro is on or any question exists.

## Student CFU and quiz taking

Dedicated routes (not builder Preview): `/levels/cfu-*`, `/levels/quiz-*`. Workspace pad **64px**, cards **800px** / `shape-lg` / `border-neutral-primary`. Quiz and CFU cards use `height: fit-content` in a block scroll area (not a shrinking/stretching flex column) so they hug the question and never clip matching or extra options. Question stems use `studentQuestionChrome` (Figma `questionContainerBase`: 24px pad, Overline 2 `question N of M` with `tabular-nums` — hidden when the quiz has one question — H4 title, Body 2 stem, 46px option rows). Shared Multi / FR / Match workspaces stay embedded; do not rewrite standalone levels.

**CFU** (`CfuQuestionWorkspace`) — hides Tutor, Backpack, and History, so the rail expand control stays disabled. Question card owns the action row (`StudentQuestionCardFooter`: left `optionWrap`, right `submitWrap`) and hugs content (`height: fit-content`; the page does not stretch the card to the viewport). Submit is **Submit** (disabled until valid). After submit, Figma `responseTag` labels are **Great job!** / **Incorrect**. FR has no correctness chrome and no Incorrect + Try again footer; `/levels/cfu-free-response-reveal` does **not** show an answer-explanation card (Figma student-reveal cell is N/A), and FR examples can show the dashed **Upload a file** / **Record audio** row. After an incorrect submit the footer follows two knobs — retries and require-correct. There is no third continue label. Attempts off (S4): Incorrect tag left, **Next level** primary right. Attempts on + require-correct (S5, legacy CfU): Incorrect tag left, **Try again** primary right (no start icon); no Next level. Attempts on + can continue (S6): outlined **Try again** then Incorrect tag on the left, **Next level** primary right. Do not put Try again in the left slot when it is the only action. When the last attempt is spent, show Next level even if require-correct is on. When `max_attempts` is set, `quizAttemptChip` sits in `submitWrap` (**Attempt N of M** / **Final attempt**) left of Submit / Try again; hide it after the last spend, on a correct submit, and on FR after submit. S9 demos: `/levels/cfu-multi-capped`, `/levels/cfu-multi-checkboxes-capped`, `/levels/cfu-free-response-capped`, `/levels/cfu-matching-capped`. Matching keeps per-pair marks; the footer still follows that table. On Try again, correct pairs stay matched and locked (green + check, no hover/press); incorrect pairs clear. `/levels/cfu-matching-reattempt` opens that next-attempt state. Reveal variants mark the key alongside the pick on multi. On matching, an incorrect or partial attempt keeps the student’s matches and adds a **Correct Answer** set underneath (Figma `326:48947`); a fully correct attempt does not add the second set. Multi and matching also show the Figma `answerExplanation` card (green header) inside the 24px question stack. Teacher view adds a side-by-side **For teachers only** card (info) — FR uses that card for the teacher exemplar and never pairs it with an explanation; matching shows both — plus an action-row **View student responses** + Figma `responseCount` (`n/n` · Students answered, brand `users` icon; empty: No responses). Teacher banners are a full-bleed CADS `Alert` (`extraSmall`, info or warning) pinned under the header — not a card-width bar in the 64px pad. Figma `356:24536`. `/levels` groups those demos by question type; header bubbles walk the same flat list.

**Quiz** (`QuizAttemptWorkspace`) — hides Backpack and History (Backpack never appears on quiz or other assessment levels); Tutor appears only when `artifact.tutor.enabled`. When the rail has no tabs, expand stays disabled. Multi-question cards are content only (`showActionRow` off) with actions on the sticky footer. A one-question quiz uses the CFU card footer (**Submit**) instead of that bar, and stays on the card after submit (S4 / S5 / S6). Multi-question **Next / Finish / Submit** is not gated on every item being correct. Last-page **Finish** vs **Submit** follows `primaryQuizPageLabel` (Finish = results next and another attempt possible; Submit has no arrow). Intro: overline **before you begin**, meta (`circle-question` / `clock` / `bullseye-arrow`) + **Begin** on the card. Resume demo (`/levels/quiz-exam-resume`) is a third intro: overline **in progress**, answered count / time remaining / attempt N of M, **Resume** (lands on the saved page; `sessionStorage` keyed by artifact id). Attempt footer: numbered pagination only (no first/last/prev/next, no unanswered dots); attempt chip when max is set; timer is `m:ss remaining`. Results card is header / full-width stats band / footer: heading-xl brand values, centered columns. Practice: outlined **Try again** left (returns to intro, no start icon) + contained **Next level** right. Exam with attempts left: outlined **Submit this attempt** left + contained **Try again** right (confirm: Try again / Submit now). Last attempt and receipt: contained **Next level** only. Dialogs are CADS `iconTop` (`circle-exclamation`, default 800px): **Keep working** / **Submit now** on voluntary submit; time’s up uses **View results** / **Next level** / **Try again**. Builder Preview disables **Finish / Submit**.

## Teacher viewpoints

Figma Teacher Facing rows. Shared chrome: `ViewpointBanner`, `AnswerNotesBlock`, `StudentResponsesRow` in `components/assessment/shared/ViewpointChrome.tsx`. Reuses `groupTeacherReveal` / `revealKeyAlongsideSelection` on Multi / FR / Match.

**CFU teacher** — the `/levels` card lists every viewpoint × question-type route. Header bubbles stay per-viewpoint (`/levels/cfu-teacher`, `-checkboxes`, `-free-response`, `-matching`, and the same suffixes on `-as-student` / `-response`).

- **Viewing as teacher:** key always on. Multi and matching also show the explanation plus the teacher note. Free response shows only the teacher exemplar (no explanation card). No Submit.
- **Viewing as a student:** full student CFU flow plus **View student responses** and **No responses**.
- **Viewing a student’s response:** read-only banner, mock student name, answers vs key. **Submit** is visible and disabled. No Try again.

**Quiz teacher** — 12-question exam artifact.

- **Viewing as teacher:** intro **View questions** (no timer / attempts). Every card shows the key + **View student responses**. Multi and matching also show the explanation and teacher note; free response shows only the teacher exemplar. No results column.
- **Viewing as a student:** student attempt flow plus **View student responses** and the empty response-count row.
- **Viewing a student’s response (in progress):** warning banner; primary **View results**; unanswered items stay blank.
- **Viewing a completed submission:** info banner; lands on **[Student]’s results** (score, time elapsed, submitted) plus every question. Try again / Submit hidden.

## Exam behavior (prototype)

- Timer countdown from `timing.timeLimitMinutes`, shown on the quiz sticky footer as **m:ss remaining** (urgency low / medium / high)
- Mid-attempt reveal suppressed when `mode === "exam"`
- Tutor defaults off for exams (`tutor.enabled` in settings)
- Pool draw rules resolve additional questions client-side per attempt seed
- Results score excludes free response (“Not including free response”)

## Known gaps

- No Levelbuilder integration (see [Levelbuilder contract](./assessment-builder-levelbuilder-contract.md))
- Scoring authority left open; client-side demo scoring only
- Publish-time question pinning deferred
- Drag-drop scoring marked `ungraded` in prototype scorer
- Free-response AI/rubric scoring is affordance-only
- P0 does not shuffle questions/options or author surveys; those remain on the schema for later phases
- No student Unsubmit
- Reveal-when (after item vs after attempt) is derived from purpose
- Drag-drop scoring marked `ungraded` in prototype scorer
- Free-response has no student correctness chrome; exemplar is teacher-only

## Levelbuilder boundary

See [assessment-builder-levelbuilder-contract.md](./assessment-builder-levelbuilder-contract.md).
