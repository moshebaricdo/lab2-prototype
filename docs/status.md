# Modernizing Assessments — Status

Living snapshot of **product decisions** and **prototype state** for this workstream. Specs and implementation details live in the linked docs; this file is the turn-by-turn source of truth for what is in, out, and still open.

**Last updated:** 2026-10-29

**How to maintain:** update this file in the same turn as substantive product or architecture changes (scope, modes, tagging, schema, routes, builder UX model). Skip for visual polish, copy nits, and bugfixes that do not change the model.

---

## Current prototype

| Route | Role |
|-------|------|
| [`/levels/assessment-builder-p0-draft`](/levels/assessment-builder-p0-draft) | **Final quiz builder.** Blank quiz. No title, lesson name, level id, purpose, or questions. First header bubble. |
| [`/levels/assessment-builder-p0`](/levels/assessment-builder-p0) | **Final quiz builder.** Pre-populated demo quiz: Unit 3 Assessment: AI in Society (12 questions, 4 pages), attached, Live in 2 units. Second header bubble. |
| [`/levels/quiz-demo/multi`](/levels/quiz-demo/multi) · [`multi-select`](/levels/quiz-demo/multi-select) · [`free-response`](/levels/quiz-demo/free-response) · [`matching`](/levels/quiz-demo/matching) | Editable student quizzes. One question each, check-for-understanding settings. Header **Edit** opens that quiz in the builder. The account button switches Student, Teacher, Student submission, and Submission in progress. A completed submission with retries lists each try in Attempt history (Attempt N, newest first, with the time beside the name). Submits made while viewing as Student replace that sample and show up in the panel as they happen. |
| [`/levels/quiz-demo/blank`](/levels/quiz-demo/blank/edit) | Blank quiz. Index opens the builder; **Save** / **Back to quiz** opens the student quiz at [`/levels/quiz-demo/blank`](/levels/quiz-demo/blank). |
| [`/levels/cfu-multi`](/levels/cfu-multi) · [`-retry`](/levels/cfu-multi-retry) · [`-continue`](/levels/cfu-multi-continue) · [`-reveal`](/levels/cfu-multi-reveal) · [`-capped`](/levels/cfu-multi-capped) | Student CFU radio: no-retry (S4), must-correct (S5), can-continue (S6), reveal after submit, capped attempts (S9). |
| [`/levels/cfu-multi-checkboxes`](/levels/cfu-multi-checkboxes) · [`-continue`](/levels/cfu-multi-checkboxes-continue) · [`-no-retry`](/levels/cfu-multi-checkboxes-no-retry) · [`-reveal`](/levels/cfu-multi-checkboxes-reveal) · [`-capped`](/levels/cfu-multi-checkboxes-capped) | Student CFU two-correct: must-correct, can-continue, no-retry, reveal, capped attempts (S9). |
| [`/levels/cfu-free-response`](/levels/cfu-free-response) · [`-reveal`](/levels/cfu-free-response-reveal) · [`-capped`](/levels/cfu-free-response-capped) | Student CFU FR. File upload row; no correctness chrome. Reveal does not add an explanation card (teacher views show the exemplar only). Capped shows the attempt chip only. |
| [`/levels/cfu-matching`](/levels/cfu-matching) · [`-retry`](/levels/cfu-matching-retry) · [`-reattempt`](/levels/cfu-matching-reattempt) · [`-continue`](/levels/cfu-matching-continue) · [`-reveal`](/levels/cfu-matching-reveal) · [`-capped`](/levels/cfu-matching-capped) | Student CFU match: no-retry, must-correct, next attempt with correct pairs locked, can-continue, reveal pairs, capped attempts (S9). |
| [`/levels/cfu-teacher`](/levels/cfu-teacher) · [`-as-student`](/levels/cfu-teacher-as-student) · [`-response`](/levels/cfu-teacher-response) | Teacher CFU viewpoints. `/levels` lists every viewpoint × question type; header bubbles stay per-viewpoint. |
| [`/levels/quiz-practice`](/levels/quiz-practice) | Student quiz. Intro, 3 questions, one page, retries, correctness. |
| [`/levels/quiz-exam-retries`](/levels/quiz-exam-retries) | Student exam. 12q / 4 pages, 3 attempts, correctness on. |
| [`/levels/quiz-exam-final`](/levels/quiz-exam-final) | Student exam. 1 attempt, correctness on (last-attempt confirm). |
| [`/levels/quiz-exam`](/levels/quiz-exam) | Student exam. 1 attempt, correctness off → submitted results with the student’s answers (no score). |
| [`/levels/quiz-exam-resume`](/levels/quiz-exam-resume) | Student exam. In-progress intro; `sessionStorage` restore; **Resume** lands on the last page. |
| [`/levels/quiz-teacher`](/levels/quiz-teacher) · [`-as-student`](/levels/quiz-teacher-as-student) · [`-response`](/levels/quiz-teacher-response) · [`-response-submitted`](/levels/quiz-teacher-response-submitted) | Teacher quiz viewpoints on the 12-question exam, including an in-progress response and a completed submission. |
| [`/levels/assessment-builder-new`](/levels/assessment-builder-new) | Kept exploration — blank legacy outline. Listed under Experiments on `/levels`. |
| [`/levels/assessment-builder-seeded`](/levels/assessment-builder-seeded) | Kept exploration — six-question legacy quiz. Listed under Experiments on `/levels`. |

Legacy multi / FR / match / levelgroup routes remain as rendering references.

Decision log: [`docs/quiz-authoring-decisions.md`](./quiz-authoring-decisions.md). Figma: [Quiz Builder](https://www.figma.com/design/M7xfogAObPmbyZ1vTz0258/Modernizing-Assessments?node-id=326-38004), [Quiz Experience](https://www.figma.com/design/M7xfogAObPmbyZ1vTz0258/Modernizing-Assessments?node-id=326-48567) (one-question + several-questions + chrome + teacher; former Question Types page). The old Quiz Experience node (`326:58252`) is a pointer.

---

## Locked model (final builder)

Quiz is a lab2 `Level`. Four **purposes** seed settings but do not lock them:

| purpose | Seeds (v1) |
|---|---|
| `check_for_understanding` | intro off, no timer, retries on (unlimited), require-correct on, correctness on, reveal off, tutor off |
| `practice` | intro off, retries on (unlimited), require-correct off, correctness on, reveal off, tutor on, layout scroll |
| `exam` | intro off, retries off (require-correct hidden), correctness off, reveal hidden, tutor off |
| `exam_simulation` | intro on, retries on (unlimited), require-correct off, correctness off, tutor off |

Create = four purpose cards. Edit = Purpose dropdown. Dirty helper: *These settings differ from a typical [Purpose]. Purpose is unchanged.*

Scoring: multi (including two-correct) and match are all-or-nothing. No student Unsubmit. Incomplete submit is allowed with a confirm. Status tags: Not in a unit / Unpublished / Live in N units / Sunsetting / Deprecated.

---

## What the P0 builder has today

- Lab2 workspace: **Build** outline + **Preview** via `QuizAttemptWorkspace` (empty Preview when there are no questions and intro is off). One-question preview uses the same sticky attempt bar as a multi-question quiz (**Submit**, then **Try again** / **Next level**).
- Outline: intro as a workspace card (optional title + content; config toggles show/hide), pages as header cards (full-width bar in both states, tinted well when open, deck under a closed page that has questions; no page names). Intro and page cards use `shape-lg`. Question rows use `shape-sm` inside a page and `shape-lg` at the root (questions never sit outside a page once a page exists). Dashed Create question (create-only), ghost ADD PAGE, kebab Add above/below / Move / Delete. Deleting a page shows a top-center toast with Undo. Expanding a question scrolls it to the top of the outline (64px offset). Empty quiz uses the dashed illustration state. Collapsed-page experiments stay on `/experiments/quiz-page-collapse`.
- Create question lists **Multiple choice** and **Multiple select** separately. Both open the same answers editor; **Selection type** starts on the entry that was chosen. Correct options are marked with a radio or checkbox joined to the option field (`list-radio` / `list-check`). The bank type filter still treats both as one Multiple Choice bucket.
- Open item tabs Question / Answers / Usage. Unsaved-changes tag on collapse. Leave-page dialog for dirty questions.
- Save: silent for new; unpublished shared vs published-unit dialogs (no “fork” vocabulary). Save collapses the card and shows a top-center CADS toast (“Question saved”).
- Bank: hover eye (Close Icon Button chrome, “preview” tooltip) opens Preview / Details / Usage. Filters default to **All**. Filter popover includes **Hide added items from results** (drops questions already on this quiz). Multi-page quizzes use an add-to-page menu. Adds stay collapsed. After add (or closing preview), the result remounts so eye / plus / already-added tooltips do not stick. `listedInBank: false` hidden.
- Configuration: purpose chooser or dropdown; Content / Rules / Feedback / AI Tutor. Rules nest **Require a correct answer to continue** under Allow multiple attempts (same wrap as Max attempts). When settings differ from the purpose defaults, a **Reset to defaults** control sits beside Purpose.

---

## Explicitly out of scope (this pass)

- Frozen deep-links per Figma cell (S1.1 … S6.4).
- Student Unsubmit.
- Surveys / shuffle / difficulty.
- Levelbuilder integration.

---

## Spec & implementation pointers

| Need | Doc |
|------|-----|
| Builder UX, routes, known gaps | [`src/guidelines/level-types/assessment-builder.md`](../src/guidelines/level-types/assessment-builder.md) |
| Decision log | [`docs/quiz-authoring-decisions.md`](./quiz-authoring-decisions.md) |
| Question field / catalog schema | [`src/guidelines/level-types/assessment-builder-question-schema.md`](../src/guidelines/level-types/assessment-builder-question-schema.md) |
| Levelbuilder vs in-lab boundary | [`src/guidelines/level-types/assessment-builder-levelbuilder-contract.md`](../src/guidelines/level-types/assessment-builder-levelbuilder-contract.md) |

## Changelog

Newest first. Log **decisions and model changes**, not polish.

### 2026-10-29

- Attempt history on an editable quiz records each submit made while viewing as Student (`sessionStorage`, per quiz). The panel opens on that view and fills a row per submit. Student submission shows those rows; the three-row sample stays only until the first real submit. Editing the quiz clears the log.
- Attempt history marks the highest-scoring submission with an award icon and a **Best attempt** tooltip, in the same slot as an autosave or AI save. A tie across every attempt, or a quiz with nothing graded, shows no badge.
- Attempt history rows are all **Attempt N** (Attempt 3, Attempt 2, Attempt 1), newest first. The read-only banner uses that same name.
- The submission review keeps a single blue read-only banner. It names the attempt on screen. Switching attempts is done from the list.
- Attempt history copy: the rail tooltip and panel title say **Attempt history**. Each row is **Attempt N**, newest first. The submission time is secondary text on the same row (`Oct 28, 3:05:18PM`). Web Lab version history is unchanged.
- A teacher reviewing one student’s completed editable quiz (`view=submission` on `/levels/quiz-demo/*`) uses that panel when the quiz allows more than one attempt. Each submission is a row. No autosaves, and no save or restore. One attempt, and a submission still in progress, do not open the panel. The seeded list stops at three submissions so it stays readable. Dedicated quiz-teacher routes are unchanged.
- Quiz builder authoring calls outline groups **pages** (PAGE N, Add page, New page, Page removed). The stored field is still `sections`.
- Editable quizzes (`/levels/quiz-demo/*`) switch viewpoint from the header account button: **Student** (default), **Teacher** (keys and response counts), **Student submission** (read-only results), and **Submission in progress** (saved answers, not submitted). Stored as `view=teacher`, `view=submission`, or `view=in-progress`.
- Quiz builder demos are two bubbles: **Blank quiz** (`/levels/assessment-builder-p0-draft`, no title, lesson name, level id, purpose, or questions) and **Demo quiz** (`/levels/assessment-builder-p0`, the pre-populated Unit 3 exam). The CFU builder seed is gone. An unset quiz title shows the level name. Double-click the outline title to set it.
- Student question actions use the sticky bottom bar even when the quiz has one question (a CFU). **Submit**, **Try again**, and **Next level** no longer sit on the question card. Teacher **View student responses** stays on the card.
- Question cards no longer show **Great job!** / **Incorrect** in the action bar. After submit or on results, a small error tag in the card’s top-right is **Skipped** for a blank graded question (counts as incorrect) or **Incorrect** when the answer is not fully correct, including when Show correctness is on. Marks still show which picks were right or wrong; the tag keeps a mixed result from reading as partial credit. A correct answer has no tag. Free response shows a neutral **Ungraded** tag with no icon, because it is not graded.
- Editable quizzes (`/levels/quiz-demo/*`) do not disable answers from the previous try. **Try again** leaves every option and pair editable. Dedicated CFU routes and standalone multi levels still lock a wrong option (✕) and keep a correct pick disabled.
- An untimed quiz results card is score and attempt only. **Time elapsed** appears when the quiz has a time limit. Two stats lay the number beside its label, aligned to the left of each column. Three stats stack the number above the label.
- A quiz with **Show correctness** off still opens the results view after submit. The summary is a submitted card (attempt number, submitted time, **Try again** when another attempt remains, **Finish level**) and every question shows the student’s answers, with no score and no correct or incorrect marks.
- Every quiz results footer puts the submitted time on the left. **Try again**, when another attempt remains, sits beside **Next level**, **Finish level**, or **Submit this attempt** on the right.
- When **Show correctness** is on and the key is hidden, single-answer multiple choice still marks that one pick. Multiple select and matching do not mark individual options or pairs, because that reveals the rest of the answer. A fully correct answer still uses success styling. Reveal and teacher views still show the key.

### 2026-10-28

- Student quizzes honor **Show correctness**. Off locks the submitted answer ungraded (the pick stays selected; no correct or incorrect marks, no key). On with reveal off marks only the student's own pick. Matches the production quiz attempt: `correct: null` and a nulled answer key when the quiz does not show correctness.
- Editable quizzes under Modernizing assessments (that group now sits above the legacy Assessment group on `/levels`): multiple choice, multiple select, free response, matching, and a blank quiz. Each one is a real builder artifact. **Edit** in the student header opens the quiz builder; **Save** returns to the student quiz. State is session storage for the tab and the encoded `o` query param, so the address bar is a share link for the questions and config. Multiple select keeps its selection mode on the student attempt (checkboxes, every checked answer scored).

### 2026-09-09

- Student action labels follow the 2026-09-09 copy pass: last-page **Finish** when results are next and the sitting is not terminal; **Submit** (no arrow) on the last attempt or when reveal is off. One-question cards use **Submit**. Dialog confirm is **Submit now**. Results: practice Try again + Next level; attempts left Try again + Submit this attempt; last attempt / receipt **Next level** only. Time’s up with no reveal is **Next level**. When `max_attempts` is set, an **Attempt N of M** / **Final attempt** chip sits left of the primary. Demos: `/levels/cfu-*-capped`, `/levels/quiz-exam-retries`, `/levels/quiz-exam-final`.
- Matching Try again keeps correct pairs locked (success styling, no hover/press) and clears the rest. `/levels/cfu-matching-reattempt` opens that next-attempt state (must-correct).
- Retries and require-correct are two knobs. CfU seeds attempts on + require-correct on (legacy CfU); Practice / exam sim seed require-correct off; Exam hides the wrap. After an incorrect single-question submit: S4 tag + Next level; S5 tag left / Try again primary right; S6 Try again secondary + tag left / Next level right. No “Continue anyways.” Last spent attempt still shows Next level. FR has no Incorrect + Try again footer. Quiz results footer is unchanged.
- Matching reveal (CFU / quiz / standalone after submit) keeps the student’s matches and adds a **Correct Answer** set underneath when any pair is wrong. Fully correct attempts and teacher peek (no attempt) stay a single board.
- One-question quiz attempts (builder Preview and student chrome) put **Submit** in the question card footer and hide the sticky attempt bar. Multi-question quizzes keep Back / pagination / Next, then **Finish** or **Submit** on the last page.
- Quiz builder adds `/levels/assessment-builder-p0-cfu` — a one-question check-for-understanding seed (Unit 2 CFU · Accountability) next to the 12-question exam and empty draft.
- Teacher viewing a student’s work shows a disabled **Submit** (CFU). Quiz teacher viewpoints add `/levels/quiz-teacher-response-submitted` — a completed exam results review next to the in-progress response demo.
- Free-response note cards follow the Question Types mocks: teacher / student-response views show the teacher exemplar only. Matching (and multi) still show the answer explanation, and teacher views add the teacher-only note beside it. Student FR reveal no longer surfaces `reveal.explanation`.
- Quiz results and submit dialogs follow the copy pass: **Keep working** primary, **Submit now** secondary. Results: practice Try again + Next level; exam-with-retries Try again + Submit this attempt; last attempt and receipt Next level. Try again returns to the intro. Time’s-up actions are View results / Next level / Try again.
- Figma-grid demo levels: one playable student route per CFU type+settings row and per quiz attempt row; three teacher viewpoints each for CFU and quiz. Resume persists `{ page, secondsRemaining, attemptNumber, responses, startedAt }` in `sessionStorage`. Index splits Check for understanding / teacher and Quiz taking / teacher. Teacher viewpoints are in scope.
- Student chrome follows Figma: **Next level**, **Great job!** / **Incorrect** tags, CADS Alert teacher banners, 50/50 matching columns, FR file-upload row. P0 questions no longer use a code panel (code lives in the stem markdown). About 70% of bank questions now have markdown descriptions. CFU adds `/levels/cfu-free-response-reveal`.

### 2026-09-08

- P0 exam seed (builder + `/levels/quiz-exam`) is Multiple Choice / Free Response / Matching only. Fill-in-the-blank and ordering stay in the mock bank, unlisted, for legacy routes.
- Optional intro `title` on `AssessmentIntro`. Unset, students see the quiz level name. Workspace empty quiz / empty section / Create question are create-only (bank adds stay on the rail).
- Question bank filters default to **All** (nothing selected) on open and on **Clear filters**. They no longer restore quiz placement (attached course/unit).
- Plus on a bank card (and modal **Add to quiz**) opens the add-to-section menu when the quiz has multiple sections, including **New section**.
- Translated the Modernizing Assessments Figma handoff into the prototype as the **final** builder, CFU, and quiz-taking experience. Kept `/levels/assessment-builder-new` and `assessment-builder-seeded`.
- Quiz `purpose` seeds Configuration. Status tag + bank preview modal. Student CFU and quiz-taking routes. Seeded exam is 12 questions / 4 pages (Unit 3 Assessment: AI in Society).

### 2026-08-28

- Empty section in a populated outline is a dashed, unfilled slot with two actions: **Add from question bank** (opens the rail, scoped to that section) and **Create new** (five P0 one-off types). Not copy-only.

### 2026-08-27

- Question bank filter matches the labeled CADS spec: combined **Used in course(s) or unit(s)** typeahead (hierarchical course + units, parent/partial/full states, Clear all + Done); **Standard(s)** typeahead grouped by framework; **Question type(s)** inline checklist (Select all / Clear all); five sort options. Closed fields show All vs a summary (no chips under fields). Empty bank list is a **No results** state. Search query is not part of “filters active.” Combined typeahead supersedes the earlier split Course / Unit fields.

### 2026-08-26

- P0 UI brought to Lab 2 Frame parity: workspace label + live/draft badge, header Back/Save without progression bubbles, bank type Tags, outline rows without `page.item`/grips, section overlines, tick connectors, floating add toolbar. Catalog/placement model unchanged.
- **Casing:** standards are the only question tags. Course/unit are bank **scope** (split Course + Unit filters, AND of layers) and quiz **placement** (Levelbuilder-owned), not chips on bank cards or editor fields. Reopened the earlier “tag by course, unit, concept” lock.
- Placement chrome: attached P0 exam defaults the bank to AI Foundations · Unit 3; new `/levels/assessment-builder-p0-draft` is a floating checkpoint (empty course/unit scope).
- P0 Build canvas rebuilt as the block-based outline (`AssessmentOutlineCanvas`): overview header, pinned intro card, sections-as-pages with the wrap/flatten invariant, dnd-kit cross-section drag, ghost add rows. Legacy routes keep `AssessmentBuildCanvas`.
- Schema: `AssessmentSection` + optional `sections` on `AssessmentArtifact`; optional `placement` (`floating` | `attached`). Flattened `questionRefs` kept in sync so adapters/preview/scoring are untouched. P0 seed now sectioned (3 sections + intro).
- Single-save model shipped on P0: Done-when-clean, Save-when-dirty, shared-question prompt (*Update the shared question* vs *Save a copy in this assessment only* → inline conversion). Two-destination save menu removed from the P0 editor.
- Question bank panel: search + filter button (badge counts deviations from placement scope), result-count overline, bordered result cards with **standard** tags only.

### 2026-08-25

- Write policy: deployed script = live. Draft (including duplicates) prompts on a shared question. Live exam warns once, then copies the question without asking.
- Builder outline/inspect/in-place edit locked in Paper; React prototype still uses the older two-destination save menu.

### 2026-08-24

- P0 question bank panel matches the finalized CADS Figma sidebar: search + sort, combined **Course or unit** (union match), **Standard** filter with optional `DomainTag.code` chips, stem preview, type icons, and icon-only add.

### 2026-08-18

- Added this living status file. Agents should update it on substantive assessment-modernization turns (not design nits).

### 2026-08-14

- P0-aligned builder level: `/levels/assessment-builder-p0`.
- Scope: CFU + exam only; surveys hidden; shuffle hidden/off; difficulty dropped.
- Question bank taxonomy: course, unit, concept. Hydrate existing `localStorage` banks with units and new mock questions.
- Seeded 8-question AI Foundations Certification Exam; Settings mode switch applies CFU vs exam presets.
- Legacy blank + seeded routes kept as the prior exploration (still show shuffle / difficulty / survey).
