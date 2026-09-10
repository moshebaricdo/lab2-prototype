# Quiz authoring — decision log

Living notes from the studio.code.org / Levelbuilder assessment discussion. Update this file as we decide things; do not treat chat summaries as the source of truth.

Last updated: 2026-09-09

## How to read this

- **Decided** — we are designing/mocking as if this is true.
- **Leaning** — recommended, not locked.
- **Open** — needs a product or schema call.
- **Current studio** — how production works today (legacy Multi / Match / FreeResponse / LevelGroup). New Quiz should not copy this blindly.

---

## Product frame

Quiz is a new lab2 `Level` (`Quiz < Level`), not an extension of LevelGroup. Questions are `QuizQuestion` bank rows (STI: multiple choice, later FR / match / …), placed on a quiz via `QuizQuestionPlacement` (page + position). Students write `QuizAttempt` / `QuizQuestionResponse`. Grading is server-side; the key does not ship to the student client during the attempt.

`purpose` is stored on the quiz. Authoring treats it as a **template** that seeds other fields. **Snapshot / reporting weight stays on purpose.** **AI Tutor** is seeded by purpose but is a real overridable field (`ai_tutor_available` already exists on `Level`).

Purposes (PM):

| purpose | What it is | AI / reporting |
|---|---|---|
| `check_for_understanding` | In-lesson, often one question, informal | Directional only. Not mastery evidence. Not the sole lesson context for AI. |
| `practice` | Deliberate skill-building | Real evidence. Tutor on. Snapshot weighs it. Not a grade. |
| `exam` | Formal graded measure | Highest-confidence evidence. Teacher grades on this. |
| `exam_simulation` | Full-length timed cert prep from a bank | Tutor off. No reveal mid-attempt. |

---

## Quiz model fields (backend as of assessments PoC)

On `Quiz` (`serialized_attrs`):

- `purpose` — one of the four above; may be nil today (do not ship nil)
- `time_limit_minutes` — blank = no limit; if set, integer > 0
- `allow_multiple_attempts`
- `max_attempts` — blank = unlimited **if** retries on; if set, ≥ 2 and retries must be on
- `show_correctness`
- `reveal_answer_explanation` — requires `show_correctness`
- `intro_text` — start-screen copy. Authored as a **workspace card**, not on the config tab. Config only toggles whether the intro screen is shown.

Validations already encode: explanation implies correctness; max_attempts implies retries.

Lesson lock (`lockable`, teacher “Show answers”, autolock 24h) lives on the **lesson**, not the quiz.

---

## Config tab

Author-facing fields (this tab only):

| Field | Control | Maps to | Notes |
|---|---|---|---|
| Purpose | Four cards | `purpose` | Required. Seeds the fields below. Does not lock them. Snapshot/reporting still follow purpose. |
| Time limit | Off, or minutes | `time_limit_minutes` | Blank = none. |
| Allow retries | Toggle | `allow_multiple_attempts` | |
| Max attempts | Unlimited, or integer ≥ 2 | `max_attempts` | Hidden/disabled unless retries on. Blank = unlimited. |
| Require a correct answer to continue | Toggle | TBD (`require_correct_to_continue`) | Hidden unless retries on. Independent of max attempts. On: Next level is withheld until the answer is correct. Off: Try again is secondary and Next level stays the primary. After the last attempt is spent, Next level appears even if this is on, so they are not trapped. The unit outline is never a gate. |
| After submit | Single select, four values | `show_correctness`, `reveal_answer_explanation`, plus a key flag we do not have yet | Nothing; correct / not correct only; key; key + explanation. |
| Show intro screen | Toggle | TBD (`intro_text` present vs a dedicated flag) | Config only enables/disables. Copy is a workspace card next to question items. |
| AI Tutor | Toggle | `ai_tutor_available` | Student help during the sitting. Seeded by purpose; author may deviate. Not Snapshot weight. |

**Open, do not add until decided:** when to reveal (after each item vs after the attempt vs never). Derive from purpose for v1 if we skip the control.

**Groupings** (what the settings *do*, not when the student hits them)

1. **Purpose** — identity. First, full width.
2. **Rules** — show intro, time limit, retries, max attempts, require-correct-to-continue, AI Tutor. Later: shuffle, navigation, pause, draw-n-from-bank. Intro **copy** is still a workspace card. Tutor is a tool allowed during the sitting, same class of knob as retries.
3. **Feedback** — after-submit reveal. Later: reveal-when, score on results, review missed items.

Do not name groups as student stages. Do not add an **AI** group for one toggle. Snapshot weight is not a field; it is a consequence of purpose (shown as helper copy on the purpose cards).

**On the tab**

1. **Purpose**
2. **Rules** — intro on/off; time limit; retries; max attempts; require correct to continue; AI Tutor
3. **Feedback** — reveal policy

**Not on the tab**

- Intro screen **copy** (workspace card, alongside questions)
- Questions, pages, standards
- Lesson lock
- Unsubmit
- Incomplete-submit as a column
- Snapshot / reporting weight (derived from purpose; do not let authors set a second slider that fights purpose)

**Preset vs override**

Picking a purpose fills typical student settings. Editing those fields does **not** change `purpose`. If the author switches purpose and fields are dirty, confirm before replacing. After divergence, a quiet note: settings differ from a typical [Exam]; purpose is still Exam for reporting.

**Seed values (panel fields, on purpose pick)**

| Field | Check for understanding | Practice | Exam | Exam simulation |
|---|---|---|---|---|
| Enable intro screen | off | off | off | on |
| Set time limit | unset | unset | unset | unset (typically timed; author fills minutes) |
| Allow multiple attempts | on | on | off | on |
| Max attempts | unset (unlimited) | unset (unlimited) | hidden | unset (unlimited) |
| Require a correct answer to continue | on | off | hidden | off |
| Show correctness | on | on | off | off |
| Reveal explanation and answer | off | off | hidden | hidden |
| Enable AI Tutor | off | on | off | off |

**Authoring UI (2-step Config in the resource panel)**

- **Create:** four purpose cards. Clicking one writes `purpose`, applies seeds, and reveals the rest of Config. Purpose collapses to a dropdown.
- **Edit (already has a purpose):** skip the chooser; always the dropdown + groups.
- Changing purpose from the dropdown confirms before replacing seeded fields.
- Intro toggle lives in **Rules**, not a one-field **Content** group. AI Tutor may stay its own group only if we need it unmissable; otherwise it is a Rules row.

**Chooser copy (create)**

- Heading: **What is this quiz for?**
- Supporting: **Applies typical settings. You can change those.**
- Card subtitles:
  - Check for understanding: **A quick check during the lesson.**
  - Practice: **For building skill on the content.**
  - Exam: **A formal assessment of learning.**
  - Exam simulation: **Timed exam-style practice.**
- Under the Purpose dropdown (filled Config), not the chooser: dirty helper **These settings differ from a typical Check for understanding. Purpose is unchanged.**

Do not say “Choose a purpose.” After pick, the field label **Purpose** is enough.

**Purpose stays uncarded.** It is the tag, not a settings cluster. A card titled Purpose around a Purpose dropdown is a tautology. Helper for dirty state sits under the dropdown: *These settings differ from a typical Check for understanding.* Optional inline **Reset**. Not a warning icon, not an alert that inserts a banner.

**Feedback (v1, match schema)**

Two cascading toggles only:

- Show correctness
- Reveal answers and explanations (requires correctness; helper: includes the correct choice and any explanation on the question)

Conditional children (this, max attempts): hide when the parent is off. When shown, wrap in a floating gray box (same pattern for toggles and text fields). Keep control size **small**, same as parents. Do not drop nested fields to extraSmall: TextField has no `xs`, and the box already shows the dependency.

Drops the “key, no explanation” grain until the backend has it. Do not label the second control “explanations” only if it also shows the key.

---

## Reveal policy

Student-facing grains we are designing for:

1. Nothing (lockable exam)
2. Correct / not correct only (current CFU default)
3. Key, no explanation
4. Key + explanation

**Schema gap:** only (2) and “explanation” exist (`show_correctness`, `reveal_answer_explanation`). Cannot express (3) vs (2) cleanly.

**When to reveal (open):** after each item vs after the whole attempt vs never. CFU = after the item. Exam simulation = never *during* the attempt; “View results” is after the attempt. Not a column today — derive from purpose for v1 or add a field.

CFU in-context tags (replace the modal), 3–4 words:

- **Correct**
- **Not correct**

If the tag sits on their choice: **That’s correct** / **That’s not correct**. No “try again” on no-retry CFU. No “Wrong.”

FR has no correct/incorrect chrome. Teacher-facing suggested answer in legacy FR is `encrypted_solution`, rendered through the generic “For Teachers Only” box. Exemplar is a Lab2 coding-lab concept; FR does not use it.

**Partial credit:** none at the question level.

- Multi (including two-correct `multi2`): all-or-nothing. One right + one wrong = not correct. Too few selected is a client gate, not “incorrect.”
- Match: question is all-or-nothing. Wrong pairs get an X (standalone). Teacher API stores per-pair status and a count; the question is only “correct” if every pair is. **Do not** add a student **Partially correct** tag. Put truth on the pairs. Save that label for if we actually score partial.

---

## Attempts vs Unsubmit

**Decided:** no student Unsubmit on the new quiz.

Legacy Unsubmit is an unseal (`submitted: false`), not an attempt. Answers stay; submitted-at resets. Student and teacher can both do it until the lesson is locked. It conflicts with a counted attempt model.

Retry **is** “take it again,” and it decrements. Teacher “return for revision” (unseal, does not spend an attempt) is optional later; not a student control.

Retries and “must get it right” are two knobs. Retries (`allow_multiple_attempts`) mean they can take the question again. Require-correct (`require_correct_to_continue`) means Next level is withheld until the answer is correct. They are not the same, and “Continue anyways” is not a third mode.

| Attempts | Require correct | After an incorrect submit |
|---|---|---|
| Off | n/a (hidden) | Incorrect tag left. Next level primary. One shot, they can leave wrong. |
| On | On | Incorrect tag left. Try again is the only action, primary, on the right. Legacy CfU. |
| On | Off | Try again secondary on the left. Next level stays the primary. Same pattern as exam results. |

After the last attempt is spent, Next level appears even if require-correct is on, so they are not trapped. The unit outline is never a gate; they can still leave via bubbles.

`questionContainerBase` has `retryAllowed` (shows the Try again control) and `canProceedIfIncorrect` (moves Try again to the left as secondary and keeps Next level as primary). Require-correct on is `retryAllowed` + `canProceedIfIncorrect` off.

Do not put Try again in the left slot when it is the only action. That is what made the old S5 footer feel backwards.

---

## Incomplete submit

**Leaning:** do not add `optional` to the new model. Legacy `optional` is FreeResponse-only and almost entirely surveys, not EOU exams.

**Decided (2026-09-07): allow, with a confirm.** Finish stays enabled. When any question is blank, pressing Finish opens one dialog in place of the scenario's normal confirm:

**N questions unanswered**  
Unanswered questions are marked not correct. [You still have time left, and] you can’t change your answers after you submit.

- Keep working (primary)
- Submit now (secondary)

The bracketed clause appears only when timed. No per-question `Not answered` tag on the cards; the page tabs in the bottom bar carry a small dot on any page that still has a blank, so Keep working has a target. Timeout never needs an incomplete scold; the clock is the reason.

Rejected: disabling Finish until every item is answered. It hides the way out, and a student who wants to skip a question they cannot do would be stuck behind a disabled button with no explanation.

---

## Copy casing

Sentence case everywhere a student or author reads a control or a title. No Title Case on buttons. No trailing period on column-label blurbs.

| Surface | Form | Examples |
|---|---|---|
| Buttons | Sentence case, no `?` | Keep working, Submit now, Submit this attempt, Try again, Next level, View results, Finish, Submit, Begin, Resume |

A CfU is a quiz. The card footer uses the same words as the quiz bar: **Submit**, not Submit answer. **Try again** has no start icon in either place. **Next level** / **Finish** / **Next** keep the end `arrow-right` because they navigate.
| Dialog titles | Sentence case; `?` only when it is a question | Submit now?, Submit this attempt?, Submit assessment?, Time’s up, 2 questions unanswered |
| Timer chip | `m:ss remaining` | `1:00 remaining` |
| Intro eyebrows | lowercase | `before you begin`, `in progress`, `submitted` |
| Confirming a submit | **Submit now** | Never Submit anyways, Submit anyway, or Submit as the dialog button |

Dialogs that warn before a voluntary submit: **Keep working** is the primary (contained, right). **Submit now** is the secondary (outlined, left). The safe action is the filled one.

---

## Submit warning dialogs (voluntary submit)

Not timeout. Incomplete does not add more dialog types if we follow A or the “extra sentence” version of B.

Last-page bar label: **Finish** when more attempts remain and results will show. **Submit** when it is the final attempt, or when the quiz does not reveal (row 4). Final attempt + not timed: no dialog, go straight to the after-submit screen. Final attempt + time left: still confirm (**Submit now?**).

**No retry, not timed**

**Submit assessment?**  
You can’t change your answers after you submit.

- Keep working (primary)
- Submit now (secondary)

**No retry / final attempt, timed, time left**

**Submit now?**  
You still have time left. You can’t change your answers after you submit.

- Keep working (primary)
- Submit now (secondary)

**Attempts remaining, timed, time left**

**Submit this attempt?**  
You still have time left. You can use another attempt after this.

- Keep working (primary)
- Submit now (secondary)

**Attempts remaining, not timed**

**Submit this attempt?**  
You can use another attempt after this.

- Keep working (primary)
- Submit now (secondary)

**No modal:** final attempt + not timed → go straight to the after-submit screen.

**From results, Submit this attempt** (attempts remain)

**Submit this attempt?**  
You still have X attempts remaining. Are you sure you want to submit this attempt?

- Try again (primary)
- Submit now (secondary)

---

## Time’s up (auto-submit whatever they had)

**No retry, no reveal**

**Time’s up**  
Your assessment was submitted with the answers you had. You can’t change them.

- Next level (only)

Do not advertise View results. Do not say “saved.”

**Retries left**

**Time’s up**  
This attempt was submitted with the answers you had.

- View results (primary)
- Try again (secondary)

If View results shows the key, Try again is a peek. Either results here are own answers with no correctness, or View results ends remaining attempts.

**Reveal, no attempts left**

**Time’s up**  
This attempt was submitted with the answers you had.

- View results (only)

Next level lives on the results / receipt screen.

**Mocking:** two dialog mocks on the Quiz Experience page (Submit now?, timed, final attempt — footer already reads Submit; and N questions unanswered) plus a six-column table (Scenario / When / Title / Body / Primary / Secondary) with every case above and the Incomplete answers row. Engineers read the look from the mocks and the copy from the table. Dialog confirm is `Submit now`, never `Submit anyways`. Primary column is the safe action.

---

## Page indicator (multi-page quizzes)

The bottom bar is the `stickyFooter` component (Sitting group on the Quiz page): `hasBackButton`, `hasPagination`, `isTimed`, `hasAttempts`. Left: Back. Centre: CADS `Pagination`, one numbered tab per page, current page active. Right: `quizAttemptChip` when `max_attempts` is set, `quizTimer` when timed (urgency low / medium / high), and the primary button (Next, Finish, Submit, View results). The two chips are independent: timed + capped shows both; untimed + capped shows only the attempt chip; timed + unlimited shows only the timer. Every quiz page mock, student and teacher, uses the bar; the earlier hand-built `actionRow` bars and the segment-style `quizPageIndicator` are retired (the component is still on the page for reference). Single-page quizzes set `hasPagination` off. Numbered tabs were kept over segments because they are clickable (jump to a page) and give the unanswered-page dot something to attach to.

---

## Sitting attempt chip

Attempts are a sitting constraint. Show a count only when `max_attempts` is set. Unlimited stays quiet — no “unlimited” chip. That is still the CfU seed, so rows S1–S8 do not show one.

Do not force the intro on to host the number. Do not add a config field for “show attempt count.” The cap being set is the signal. Do not put the count on the Incorrect tag. Do not rename Try again to “Last try.”

| Shape | Bar | Chip |
|---|---|---|
| One question, no sticky footer | Card footer, left of Submit / Try again | `Attempt 2 of 3` / `Final attempt` |
| Two or more questions | `stickyFooter`, same cluster as the timer | Same copy |

Once a sticky footer exists, keep the chip off the question cards. Repeating `Attempt 2 of 3` above every stem implies per-question tries. It is not. `max_attempts` is on the quiz: one sitting, one spend, the whole outline.

| When | Chip |
|---|---|
| During the sitting | `Attempt N of M` |
| Last sitting | `Final attempt` (same neutral chip; copy carries the fact) |
| After the last is spent | chip goes away; Next level is already the reveal that they are done |

`Attempt N of M` matches the intro. `Final attempt` already exists on the exam intro. Do not switch to “1 left” mid-sitting.

Teacher viewing as teacher: hide it (they are not in a sitting). Viewing as a student: show it, same as the student.

`quizAttemptChip` (`state=sitting` / `state=final`) lives in the Sitting group on the Quiz page. `stickyFooter.hasAttempts` defaults off. `questionContainerBase.hasAttempts` defaults off so existing one-question mocks stay unlimited.

Mocks: exam rows 2 and 3 and the matching dialogs / teacher-as-student page (chip on the bar). Row 4 is one shot (`1 attempt` on the intro, retries off) so the bar stays quiet. Question Types S9 is one capped example per type (`Attempt 2 of 3`). Radio, checkbox, and matching use the must-correct footer; free response has no incorrect mock yet, so it uses answered-not-submitted. Final attempt is not a second CfU row — it is the same chip on the exam bar.

---

## After-submit actions (not warnings)

- Attempts left, on results: Try again (primary) + Submit this attempt (secondary)
- Practice results (unlimited, leaving the level): Try again (secondary) + Next level (primary)
- Reveal, no attempts left: Next level only
- No reveal: receipt card, Next level only

---

## Quiz page: what a question card shows

Inside a quiz, the question card is content only. Submission, navigation, timer and page indicator belong to the quiz-level bottom bar; the card's own footer is hidden (`showActionRow` off on `questionContainerBase`; added 2026-09-07, default on so single-question mocks are unchanged). Without it an all-hidden footer still rendered as a bordered 32 px band.

| Slice | Card footer | Explanation row | Options |
|---|---|---|---|
| Intro | metadata + Begin | off | none (body slot hidden) |
| Quiz page, student | off | off | selected only, no status |
| Results, student | off | on only when the reveal setting includes the key; never the for-teachers box | selected marked correct / not correct; key marked when revealed |
| Any page, teacher | on: View student responses + count; no Submit | on: explanation + for-teachers note | key always marked |

Results actions: Try again (primary) / Submit this attempt (secondary) when attempts remain. Next level only on the last attempt. Row 4 (no reveal) uses Submit on the last page and a receipt instead of results.

The `multiAnswerOption` component only has status variants for `selected=yes, answerRevealed=yes, state=disabled`, so a revealed key the student did not pick is drawn as selected + correct. Fine for mocks; note for eng that "key, not chosen" needs its own visual if the component is built as-is.

Demo quiz: Unit 3 Assessment: AI in Society, Lesson 12. Practice row is 3 questions on one page; exam rows are 12 questions over 4 pages, 3 per page (page 1 = Q1 to 3, page 4 = Q10 to 12). Copy set continues the U3 Bias / Accountability / Training data items and adds Facial recognition / Tradeoff / Human in the loop for the last page.

---

## Teacher quiz views

Same three viewpoints as the single-question teacher mocks, applied to the exam configuration. Grid: Intro / Quiz page / Results by column, viewpoint by row.

| Viewpoint | Intro | Quiz page | Results |
|---|---|---|---|
| Viewing as teacher | Student card; button reads **View questions** (attempts and timer do not apply) | Key, explanation, teacher note on every card; response count; no timer | N/A (no attempt) |
| Viewing as a student | As student | As student, plus the teacher row reading **No responses** | Their own results; not recorded |
| Viewing a student's response | N/A (lands on pages) | Read-only banner names the student; their answers against the key; Finish becomes **View results**; no timer | Card titled **[Student]'s results**; Try again / Submit hidden |

Per-question View student responses stays on the card in a quiz. It would be worth checking with eng whether that should collapse to one quiz-level entry point when a quiz has many questions.

---

## Reviewing a multi-page attempt

**Decided:** review is one scrolling page. Pages pace the attempt (how many questions a student faces at once, where the timer can auto-submit from); they are not a unit for reading results. Paging a review would make a student click Next four times to find the one item they missed, and would leave "Results" as an awkward fifth page after the last quiz page.

Applies to the student results screen and to a teacher viewing a student's attempt (the read-only view of one student). Both:

- Summary card on top (Results, or `[Student]'s results`).
- Every question in placement order below it.
- A `pageDivider` before each page group: the 12 px uppercase eyebrow style (`Page 1 of 4 · Questions 1–3`) plus a hairline. Same text style as the card's "question N of M" label so it reads as structure, not content.
- No Back / Next and no page indicator. Try again / Submit stay on the summary card.

In the mocks: student grid, Results column, rows 2 and 3; teacher grid, Results column, rows 2 and 3.

---

## Slices added after the first grids (now folded into them)

Student grid:

| Slice | Where | What it shows |
|---|---|---|
| Submitted receipt (no attempts left, no reveal) | Results / row 4 (was N/A) | Intro card as a receipt: eyebrow **submitted**, body says answers are locked and results come from the teacher, meta = submitted at / time elapsed / no attempts remaining. No button. Continue is the lesson bubble. |
| Resume an attempt in progress | Intro / row 6 | Eyebrow **in progress**, body says answers are saved and the clock keeps running, meta = answered count / time remaining / attempt N of M, button **Resume**. Resume lands on the last page they were on. |
| N questions unanswered | Dialogs row, second mock | Finish pressed with blanks. See Incomplete submit. |

Teacher grid, row 3 (viewing a student's response), one state per column:

| Column | What it shows |
|---|---|
| Intro: not started | Read-only banner; intro card as empty state (eyebrow **no attempt yet**, `0 of 12 answered`, `Not started`, `0 of 4 attempts used`). No button. |
| Quiz page: still working | Warning banner: still working, showing answers saved so far, nothing graded until submit. Page 4 with key + explanation + note; View results hidden. |
| Results: submitted | Read-only banner; `[Student]'s results` summary, then every page as one scrolling review. |

Returning **with** attempts left and reveal on is not a new slice: it lands on the Results screen (Try again / Submit).

Still not mocked, noted for later: the AI Tutor affordance during a sitting (`ai_tutor_available` on). It is the existing Lab2 tutor panel, so a slice is mostly about placement next to the bottom bar.

---

## Authoring: adding a section

Today a section can only be added from the empty-quiz state. **Decided:** two entry points, no floating action button, and each add affordance is drawn at the level of the thing it creates.

1. **Ghost section header.** The outline ends in a row at section indent that looks like the next section header before it exists: plus icon in the drag-handle slot, `ADD SECTION` in the section-title style, gray. No box. It is always in the same place, scrolls with the list, and reads the same for a one-section quiz and a twenty-section one. Adding appends a section and opens its title for rename.
2. **Section menu.** The kebab on every section header: Rename section · Add section above · Add section below · Move section up · Move section down · Delete section (error style). Above / below is what makes inserting into the middle of a long quiz possible without dragging.

A first cut drew Add section as a dashed card-shaped row at item width. It read as "add a question" because it had the shape of a question row. That shape is now used for exactly that (below).

## Authoring: adding a question to a section

**Decided:** the `Add question` button leaves the section header. It only appeared on hover, competed with the menu, and duplicated the button inside an empty section's empty state.

- A populated section ends in a dashed ghost row at item indent and item width: `+ Add question ⌄` (text button, secondary; the chevron opens the same type / bank menu as the empty state's New question). One per section, always after the last item.
- An empty section keeps its inline empty state; its `New question` button is the same action drawn larger. No second row.
- Section headers carry the drag handle, title, count, and the menu. Nothing appears on hover.

In the mocks: every workspace state with a populated section (4 to 8) shows the dashed Add question row; every state with a section (3 to 8) ends in the ghost section header; state 7 shows the section menu open.

---

## Authoring: unsaved changes on a question item

**Decided:** collapsing never asks.

- The chevron is navigation, not a destructive action. A "save first?" prompt on collapse would also stack a second modal on top of the shared-draft / published-unit save dialogs, and the author would see two dialogs for one click.
- The item keeps its draft in memory. The collapsed row shows a warning `Unsaved changes` tag (pen icon) after the stem preview. Expanding restores the same draft with Save / Cancel. The row does not get a Save action of its own; saving is done in the open item, where the save dialogs can run.
- This is the one row-level status we allow. Usage and lineage still stay off rows (see Open item tabs above); dirty state is transient and about this session, not metadata about the question.
- The only prompt is on leaving the page (route change, close tab): **Leave without saving?** / *N questions have unsaved changes. If you leave this page now, those changes are lost.* / **Keep editing** (primary) · **Leave and discard**. One dialog for the whole quiz, not one per item. Not shown on collapse, on switching tabs inside an item, or on opening another item.

Component: `questionOutlineItemCopy` has an `isDirty` boolean (default off) that shows the tag in `topRow` on all four variants. In the mocks: workspace state 8 (two dirty rows) and the third dialog in the Save dialogs group.

---

## Authoring: new question, not yet saved

A question created directly in the quiz has no bank row and no placement until the first Save.

- Footer is **Discard** (error, outlined) + **Save**. `Remove from quiz` would be a lie (nothing is placed yet) and `Cancel` would do exactly what Discard does, so it is dropped.
- Discard closes and drops the item with no dialog. Nothing exists yet to lose beyond what is on screen.
- Header shows the type as a placeholder name (`New multiple choice question`) and `Not saved yet` where the stem preview goes.
- **Usage** tab is disabled until first save: there is no ID, key, version or placement to show.
- After the first Save the footer flips to Remove from quiz / Cancel / Save and Usage enables. If the new item is collapsed before saving, the `Unsaved changes` tag rule above applies.

In the mocks: fourth row of the Tabs x Types grid, multiple-choice column.

---

## Student mock list (latest)

Locked is **not** a quiz mock; it is an unclickable outline bubble.

**Single question**

- Nothing selected (Submit disabled)
- In progress
- Blocked submit (invalid, e.g. multi-select needs two)
- Submitted: no correctness / no retry (confirm); correctness only, no key, no retry; correctness only, no key, retry; key, no explanation; key + explanation
- FR: no correctness chrome
- Post-submit readonly (own answer)

**Quiz**

- Intro (timed, has attempts)
- Attempts exhausted
- Time expired (three dialogs above)
- Retake (n of m; clear vs keep last — **open**)
- Single page and multi-page: nothing selected; in progress (mixed types); some unanswered (Submit disabled if we block); submitted variants as above; post-submit readonly; teacher “Show answers” later (readonly + key) — lesson-level
- Multi-page: page dots / last attempt restored; Next allowed with blanks; only **final** Submit gated; timeout can submit partial from any page

---

## Curriculum context (legacy, still true)

- Course ≈ `UnitGroup` (`family_name` + `version_year`). Unit ≈ `Unit` / old “script.” Units can float; levels can float.
- PoC course/unit **filter** on the question bank is usage-derived (where the question is placed), not tags on `QuizQuestion`. Family grain (CSP, Unit 3) beats year-specific slugs for reuse.
- Standards: `shortcode` + `description` + `framework`. Identity is `(framework.shortcode, shortcode)`. Typeahead: prefix on shortcode, then description fulltext. Group results by framework.

---

## Question save, forking, and lineage

Backend as of merged quiz-building PRs (`QuizQuestionsController#update`, `QuizQuestion#used_in_published_unit?`). Authors never see “fork.”

**Objects**

| Author-facing | Model | Notes |
|---|---|---|
| This question (this wording) | `quiz_questions.id` | Integer. Placements and student responses point here. Copyable. |
| Lineage / family | `quiz_questions.key` | UUID. Spec: stable across revisions. **Code today mints a new UUID on fork.** Index is not unique, so sharing is still possible. Treat spec as the design: forks keep the parent’s key. |
| Prior version | `fork_parent_id` | Immediate parent row. No FK; deleting the parent leaves a dangling id. |
| Used on this quiz | `quiz_question_placements` | One placement per (quiz, question). Page + position. |
| One-off | not in schema | Still a `QuizQuestion` row. Hide from bank search. Needs a flag (`listed_in_bank` or similar). Autocomplete currently returns every MC question. |

Year-cloned quizzes (`Quiz#clone_with_suffix`) copy placements onto the **same** question rows. Two year versions of an exam share questions until someone edits. That is the common “also used elsewhere” case.

**When Save is silent vs a dialog**

Server rule: in-place update unless `used_in_published_unit?` **or** the client sends `editMode: 'fork'`. Published here means the question sits on a quiz in a unit whose state is **preview, stable, or sunsetting**. `in_development`, `pilot`, and `beta` do not force a fork.

| Situation | Save UI | Request |
|---|---|---|
| New question | No dialog. Toggle **Show in question bank** on the form (default on). Off = one-off. | `POST .../placements` (always a bank row + placement) |
| Attach from bank | No save. | `POST .../attach` |
| Edit, only this quiz, no published unit | Silent Save. | `PUT` no `editMode` |
| Edit, also on other **unpublished** quizzes | Dialog. Two actions. | Update everywhere: no `editMode`. This quiz only: `editMode: 'fork'` |
| Edit, on any **published** unit (this quiz or another) | Confirm only. No “update everywhere.” Placement on **this** quiz is repointed at the new row. Other quizzes keep the old id. Student responses stay on the old id. | Server forks anyway. Still send `editMode: 'fork'` so the client is explicit. |

Do not offer a third mode. Do not ask on create. Do not ask when the question is only on this unpublished quiz.

**Copy (edit, shared unpublished)**

**This question is used in other quizzes**  
Updating it will change those quizzes too.

- **Update everywhere** (primary)
- **Save a copy for this quiz** (secondary)
- Cancel via dismiss

Default primary is Update everywhere: unpublished curriculum is usually one question being edited in several drafts (including a year clone). Copy is the escape. List the other quizzes in the body when we have names; until then “other quizzes” is enough.

**Copy (edit, published)**

**Save a new version for this quiz?**  
This question is on a published unit. Saving creates a new version here so existing student work stays on the previous wording. Other quizzes are unchanged.

- **Save for this quiz**
- Cancel via dismiss

If this quiz is the only placement, drop the last sentence. Do not imply the live quiz stays on the old wording: this quiz’s placement moves to the new row.

**One-offs**

Not a save-dialog choice. Toggle on the question editor: **Show in question bank**, default on. Off means the row exists, is on this quiz, and is omitted from the in-quiz bank panel (and, later, from default central-bank browse). Flipping it later does not fork. A copy-for-this-quiz of a banked question is listed by default (inherit listed, not the one-off flag, unless we decide otherwise).

**P1: where this question has been**

Same affordance in three places: question editor, item preview, later the central bank. Clickable meta, not a permanent sidebar.

Preview/editor chrome (one line):

`ID 1842 · Used in 2 quizzes`

Opens a popover / details sheet:

1. **ID** — integer `id`, copyable. This version.
2. **Key** — UUID, copyable, visually secondary. The family. Hide until eng returns it on the JSON (not in `quiz_question_json` today).
3. **Used in** — quizzes this **version** is placed on. Name, course/unit if attached, draft vs published. This quiz marked.
4. **Other versions** — other rows with the same key (or, until key is shared, the `fork_parent` chain). Each: id, relative label (“Previous version”), used-in count or first quiz name. Do not say “instance.”
5. Created / updated.

Do not show `fork_parent_id` as a number. Do not draw a graph in v1.

JSON today only has `id`, `attachedToOtherQuizzes`, `usedInPublishedUnit`. Usage list, `key`, and parent/children are API gaps. Mock the UI anyway.

Author words: **version**, **used in**, **copy**. Not fork, instance, keyed, lineage.

**Open item tabs (Figma, "Workspace (Agent Copy)", grid at the bottom)**

Collapsed rows carry no status. Usage is metadata; it lives in the open item, not on the row. Rows already have hover actions and should not get busier.

The open item gets a tab strip between the header and the form (`hasTabs` boolean on `questionOutlineItemCopy`, off by default so old mocks are unchanged). Three tabs, same order for every type:

| Tab | Holds | Notes |
|---|---|---|
| Question | Internal name, Question title (stem), Description, Standards | Everything that says what the question is. Standards are a claim about the question (what it assesses), authored with the stem, and travel with it into every quiz and every version. First tab on open. |
| Answers | Type-specific fields, then the rich-text explanation | MC: selection type, options, key. Matching: pairs. FR: placeholder, min length, uploads. The explanation is `quiz_questions.explanation`; for FR it is labeled **Exemplar response (teachers only)** (the old `encrypted_solution` role). It sits here, not under Question, because it is revealed with the answer. |
| Usage | `Show in question bank` toggle, identity strip, two tables | The question outside this quiz. The toggle is the one control that changes that relationship, so it sits at the top of the tab that shows it. Default on; one-offs are the minority and flipping later does not fork. |

There is no Settings tab. A two-item Settings tab (standards + toggle) grouped things by “misc”, not by meaning, and would have become the junk drawer.

Intro screen has no tabs: title and content only. It is not a bank item.

**Usage tab layout**

0. `Show in question bank` toggle + helper. On: “Other quizzes can find and reuse this question. Turning this off does not remove it from quizzes already using it.” Off: “Only on this quiz. Turn on to let other quizzes find and reuse it.” Divider below.
1. Identity strip, four stats: Question ID (copy), Key (copy, truncated), Version `2 of 2`, Last edited.
2. Table **Used in (N quizzes)**: Quiz · Course / Unit · Status · open-in-new. The current quiz gets a `This quiz` tag inline after its name and no open link. Status is `Draft` or `Live`.
3. Table **Versions**: Version · ID · Used in · Last edited · open-in-new. Current row is labeled `Version 2 (this one)`. Empty state text: “No other versions. A new version is created when you edit this question while it is on a published unit.”

Tables are hand-built (CADS has no Table): 12 px semibold gray header on a light gray band, 14 px rows, 1 px dividers, 6 px radius. Footer Save/Cancel still shows on the Usage tab because it belongs to the item, not the tab; acceptable, but the tab has nothing to save.

Still true from the earlier pass: Save dialogs only in the two cases above (shared draft, published). No dialog on create or for a question only on this draft.

---

## Quiz status tag (workspace header)

The tag is about the quiz **level**, not its questions. A level has no published state of its own. The tag is derived from `published_state` on every unit the level is placed in, one row per `script_level`, using the same test the server uses to decide whether a question edit forks (`Unit#launched?` or `sunsetting`).

| Tag | Color / icon | When | Effect on question edits |
|---|---|---|---|
| Not in a unit | neutral, `circle-dashed` | No `script_levels`. | In place. |
| Unpublished | neutral, `file-half-dashed` | Placed, but every unit is `in_development`, `pilot` or `beta`. | In place. |
| Live in N units | success, `circle-check` | Any unit is `preview` or `stable`. N counts live units only (pilot etc. are not counted). | Fork. |
| Sunsetting | warning, `hourglass-half` | Live only in `sunsetting` units. Still published. | Fork. |
| Deprecated | neutral, `box-archive` | Placed only in `deprecated` units. | In place. |

Precedence when mixed: Live > Sunsetting > Unpublished > Deprecated > Not in a unit. The popover shows every placement so nothing is hidden by the roll-up.

These five tags are the only way quiz status or placement is shown anywhere: the workspace header, the Status column of every "Used in" table (workspace Usage tab, bank preview modal), and the usage popover. "Draft" is not a state and does not appear. In a table row the tag reads "Live" rather than "Live in N units" because the Course / Unit column already names the unit. When a quiz is not placed, the Course / Unit cell reads a muted "None" so the tag carries the state once instead of the row saying it twice.

**Hover popover** (read-only; CADS `Popover`, `content=custom`, caret `topRight`, no action row, stepper or close button; the component caps width at 500): title repeats the tag; one sentence on what it means for edits; a meta strip (Level ID, Level name, Purpose, Last edited); a “Placed in (N units)” table with Unit / Course / Lesson / Unit state, the state as a small tag; a footnote when non-live placements are listed but not counted; and an “Open level in Levelbuilder” link. Empty table copy: “Not placed in any unit. Add this level to a lesson in the unit editor to publish it.”

Three popover mocks: live (stable + sunsetting + pilot rows, tag says 2), unpublished (one in_development row), not in a unit (empty table).

---

## Bank preview modal (read-only)

Opened from the question bank panel. Everything the workspace edit state shows must be visible here, read-only, but the preview reorganizes it: the stem and answers are shown the way a student sees them, so the workspace's Question / Answers split does not carry over.

Three tabs, kept rather than collapsed to two: **Preview / Details / Usage**.

| Tab | Contents | Why its own tab |
|---|---|---|
| Preview | Internal title is the modal title. Student-facing stem, then answers with the correct choice (or matched pairs) marked. Free response shows the empty response box. | Answers the first question an author has: does this fit my quiz. Nothing author-only is mixed in, so it stays short. |
| Details | Question type. Answer explanation (MC, Match) or Exemplar response (FR), each with a one-line note on who sees it. Standards as tags. | These are author-only fields the workspace keeps under Question and Answers. Folding them into Preview would push the answers below the fold and mix student and teacher copy. |
| Usage | Same block as the workspace Usage tab minus the bank toggle: ID / Key / Version / Last edited strip, Used in table, Versions table. | Mirrors the workspace tab one to one so authors learn one vocabulary. |

Dropped from the modal: the "Show in question bank" toggle. A question reached through the bank is listed by definition; the field is redundant and, read-only, would only invite the question of why it cannot be changed here.

Renamed from the earlier draft: "Info" to "Details", "Instances" to "Usage". "Instances" never appears elsewhere in the design; the workspace and popover say "Used in".

Mocks: 3 x 3 grid (MC / FR / Match by column, tab by row) at the bottom of the Question Bank Panel section, each cell captioned. Sample copy is the U3 Bias / U3 Accountability / U3 Vocab set. The MC preview marks B as correct; the matching preview uses four pairs whose drawn lines connect the correct term to its definition.

---

## Open

- Reveal enum (four values) and reveal **when** (item vs attempt vs never).
- Retake: clear vs keep last attempt.
- Teacher “return for revision” without spending an attempt.
- Whether exam_simulation shows results after the attempt or never to the student.
- Whether purpose may stay nil in the editor before first save.
- Fork should copy `key` from the parent (spec) vs mint a new UUID (current `update`). Design assumes copy.
- One-off flag name and whether central bank can still find them with a filter.
- Whether `pilot` / `beta` units should also force a fork (today they do not).
- In-place edit of a question that already has responses on an unpublished quiz (server allows it).
- `update` forks on any save of a question in a published unit, even when nothing changed. It should compare against the stored row and fork only when versioned content (name, stem, choices, correct choice, explanation, standards) differs. Bank visibility and placement page are not versioned content: they write in place and never trigger the "Save a new version" dialog. Design assumes this.

---

## How the handoff pages are laid out

Piloted on Quiz Experience, then applied to Question Types and Quiz Builder. All three handoff pages now share it.

- **Everything uses CADS.** Text styles (Overline 2, H2 Bold, H3 Bold, Body 1 Semi Bold, Body 2, Body 3, Body 4) and semantic color variables (`text/brand/primary`, `text/neutral/*`, `background/brand/light`, `border/neutral/primary`, the `accent/pink` set). No raw hex. The variables live in the CADS library, not the file, so scripts fetch them with `teamLibrary.getVariablesInLibraryCollectionAsync` then `importVariableByKeyAsync`.
- **Contents card** at the top of the page. Overline, H2 title, one paragraph, a rule, then one entry per area: numbered badge (`background/brand/light`), title in brand as a node link, one line, and a row of skip links. Skip links are CADS `Tag` instances (medium, brand) with the hyperlink on the label. Link targets must be frames or sections; text nodes cannot be targets. A "Helpful tips" block closes the card.
- **Area header** on every section: same badge, H2 title, Body 2 sentence, then `↑ Table of contents` and `Next: …` links in Body 3 Semi Bold brand. Replaces the old title and description text blocks.
- **Mock IDs.** A small pink `Tag` above every mock with the screen name beside it: `S2.3` is student, row 2, column 3; `T` is teacher. Meant for review comments.
- **Row and column labels** are one line each. Anything longer moved into a callout.
- **Callouts** use the `accent/pink` tokens so they cannot be mistaken for UI. A 10px dot on the element, a 1px leader to the gray margin beside the panel, and a Body 4 Semi Bold label there. Footer targets use an elbow so the label sits above the bar, not on the buttons. Each mock's callouts live in a sibling frame named `notes: <mock name>`, never inside the mock, so the base slices stay untouched and the notes can be hidden or deleted in one move.
- **Page structure (as cleaned up on Quiz Experience).** Four sections stacked top to bottom, all filled `background/neutral/tertiary` with a `border/neutral/secondary` stroke: Directory (the ToC card), Components, Student, Teacher. Each section holds one white card (`background/neutral/primary`, radius 12) at (100, 100) with the area header at (50, 60), `columnLabel` frames at y 247, `rowLabel` frames at x 122, mocks on a 1502 by 1094 grid starting at (375, 350), and a pink ID tag 28px above each mock. Empty grid cells get a `blankCell` (`background/neutral/secondary`, "N/A" in H2 Semi Bold quaternary). The pink callouts were dropped from the student grid in this pass.
- **Quiz Builder variant.** Five sections side by side, top aligned at 200px gaps, in the order of the builder's own panels: Directory, Components, Question Bank Panel, Workspace Panel, Configuration Panel. Rows in a panel area have different column counts, so there are no `columnLabel` frames; the ID chip's one-line name carries the column. ID prefixes are `B`, `W`, `C`. Where a component set is the mock (`bankPanel`, `configPanel`) the set stays as is, its fill is cleared, and the chips sit above each variant. The `Tabs x Types` frame was kept as a container with its row frames set to free layout so its instances did not have to be reparented.
- **Annotations are native.** Behavior notes are Figma annotations (`Content` and `Interaction` categories) set on the layer they describe, so the base slices stay untouched and the notes read in Dev Mode. The pink callout frames from the Quiz Experience pilot are retired.
- **Annotate the first time**, not every time. A behavior gets a note on the mock where it first appears and is silent on repeats.
- **Font caveat.** The plugin runtime cannot load Space Grotesk SemiBold, so scripts write titles in `Heading/H2/Bold`. The finished pages use `Heading/H1/Semi Bold` after a manual swap; do the same on Quiz Builder (Directory title, four area header titles, six `N/A` cells).
- **Voice.** Plain sentences. Say what the thing does, not why it is great. No em dashes.

## Changelog

- 2026-09-02 — Initial log from the assessment / quiz config discussion.
- 2026-09-02 — Intro: config is show on/off; copy is a workspace card. Dropped “Before they start” as a config group; toggle lives under During the attempt.
- 2026-09-02 — Config groups are functional: Purpose, Rules, Feedback. Not student-stage names.
- 2026-09-02 — Surface AI Tutor (`ai_tutor_available`) on Config, seeded by purpose, overridable. Snapshot stays derived from purpose.
- 2026-09-05 — Question save / one-offs / P1 used-in: three save cases, no fork vocabulary, listed-in-bank toggle, lineage popover.
- 2026-09-05 — Mocked in Figma (agent copy, new bottom row): usage tags on collapsed rows, two open edit states (banked+shared, one-off), both save dialogs, View usage popover. Tags also added to two rows of the existing Populated Quiz mock.
- 2026-09-06 — Reversed row tags (rows stay clean). Open item gets tabs: Question / Answers / Settings / Usage. Standards folded into Settings with the bank toggle; explanation/exemplar under Answers. Usage is two tables, not a popover. Grid of every tab for every type mocked; `hasTabs` added to `questionOutlineItemCopy`.
- 2026-09-06 — Dropped Settings. Standards moved to Question; bank toggle moved to the top of Usage. Three tabs: Question / Answers / Usage.
- 2026-09-06 — Workspace mocks: all rows are `questionOutlineItemCopy` instances; copy rewritten so counts, sections and header agree. Section reorganized into titled groups with per-mock captions. New group: quiz status tag states and hover popovers.
- 2026-09-06 — Quiz Experience page: annotated grid (4 configurations x 4 screens), on-theme copy throughout, seven dialog mocks collapsed to one plus a copy table, `quizPageIndicator` component added to the bottom bar of multi-page mocks.
- 2026-09-07 — Bank preview modal: kept three tabs, renamed to Preview / Details / Usage. Details holds type, explanation or exemplar, standards. Usage is the workspace block without the bank toggle. Details and Usage rows populated for all three question types; preview copy corrected (MC correct answer, matching pairs).
- 2026-09-07 — Status tags normalized: every "Used in" Status cell and every header tag uses the five quiz status tags. "Draft" removed. Unplaced rows show "None" under Course / Unit and a "Not in a unit" tag. Header "Live in N units" tags corrected to the `circle-check` icon.
- 2026-09-07 — Quiz status popovers rebuilt on the CADS `Popover` component (custom content slot, top-right caret). Width drops from 560 to the component's 500 max; "Placed in" table columns resized to fit.
- 2026-09-07 — Question Types page: all 36 single-question mocks populated with the U3 content set.
- 2026-09-07 — Quiz Experience page: `questionContainerBase` gains `showActionRow`; every quiz mock's card booleans reset per slice; demo content throughout (exam rows now 12 questions / 4 pages); "First page / 2" bottom bar normalized from CADS Pagination to `quizPageIndicator`; dialog mock moved to page 4 where Finish fires. New section "Teacher Facing — Quiz Experience" (3 viewpoints x 3 screens).
- 2026-09-07 — Quiz Experience page, new section "Open items: quiz experience". Multi-page review is one scrolling page with `pageDivider` rows (student results, teacher viewing a student). Five new slices: returning after submit, resume in progress, Finish blocked by blanks, student has not started, student still working.
- 2026-09-07 — Quiz Builder page, new section "Open items: authoring". Add section: end-of-outline ghost row plus section kebab menu (Rename / Add above / Add below / Move / Delete). Unsaved changes: collapse never prompts, row shows a warning tag, single leave-page dialog. New unsaved question: footer is Discard + Save, Usage tab disabled. Space Grotesk SemiBold swapped to Bold on the Populated Quiz title and the shared-draft dialog title so they can be cloned (font not installed).
- 2026-09-07 — Every quiz-page bottom bar (student, teacher, open items) is now a `stickyFooter` instance: first pages tab 1 active / no Back / Next; last pages tab 4 active / Back / Finish (Submit on the no-reveal row, View results for a teacher); single-page practice has no pagination; timer hidden on teacher views. Hand-built `actionRow` bars and `quizPageIndicator` retired. `questionOutlineItemCopy` gains `isDirty`; the unsaved-changes mock rows are re-attached instances.
- 2026-09-07 — Incomplete submit decided: allow, with a "N questions unanswered" confirm; no per-card tag, dot on page tabs with blanks. Both "Open items" sections folded into the main grids and deleted. Quiz Experience: consolidated review replaces Results rows 2 and 3 (student) and teacher row 3; receipt fills Results row 4; resume intro is student row 6; unanswered dialog is the second Dialogs mock. Quiz Builder: ghost Add section row on states 3 to 6, section menu and unsaved rows are states 7 and 8, leave-page dialog joins the Save dialogs group, new-unsaved item is a fourth grid row.
- 2026-09-07 — Add affordances redrawn at the level they create. The dashed item-width ghost row is now `+ Add question ⌄` at the end of every populated section; Add section is a ghost section header (plus icon, `ADD SECTION` in section-title style) at the end of the outline. `Add question` removed from section headers (was hover-only and duplicated the empty-state button). Section menu gains its missing Rename item. Applied to workspace states 3 to 8.
- 2026-09-07 — Quiz Experience page reorganized as the pilot for the handoff layout: Contents card with node links, numbered area headers with back links, mock ID chips, one-line row and column labels, 25 pink in-context callouts in sibling `notes:` frames. Components section moved to the bottom.
- 2026-09-08 — Question Types page rebuilt to match the cleaned-up Quiz Experience layout: Directory (ToC card with Tag skip links to every component set and grid row), Components as a stacked list with a header per component set (12 sets), Student (4 by 6) and Teacher (4 by 3) grids inside white cards with area headers, column and row label frames, and pink ID tags S1.1 to S6.4 and T1.1 to T3.4. Free response row 3 frame renamed from a copy-paste "4. Submitted, incorrect, no retry" to "3. Submitted".
- 2026-09-08 — Quiz Experience teacher section finished in the same layout: white card at (100, 100), grid on (375, 350), column and row labels wrapped in `columnLabel` / `rowLabel` frames, ID tags realigned with row 3 labels naming the state, six leftover `notes:` callout frames removed to match the student grid. Section sits 200px right of the student section, top aligned.
- 2026-09-08 — Quiz Builder page rebuilt in the handoff layout. Directory card with links to the four areas and 23 Tag skip links. Components consolidated from all three panels into one stacked list (7 sets: item type icon, outline item, bank list item, type chip, add-to-section menu, option card, config group card). Question Bank Panel: 9 rows, B1.1 to B9.3 (panel states, filter popover, sort, two typeaheads, type dropdown, preview modal x 3 tabs); rows 3 and 6 pushed down to clear the open dropdown menus. Workspace Panel: 9 rows, W1.1 to W9.3 (eight states wrapped to two rows of four, dialogs, the four open-item tab rows with N/A cells where the intro screen has no tab, status tag states, popovers). Configuration Panel: 2 rows, C1.1 to C2.5, with an N/A cell for the chooser step after an edit. All 60-odd old `cap:` / `sub:` / `title:` text blocks removed; 28 native annotations added in their place. `configPanel` set fill cleared so the chips beneath it show.
- 2026-09-08 — Question Types page annotated: 25 native annotations (Content / Interaction) across the student and teacher grids, pinned to the layer they describe (submit footer, option rows, free response field and upload row, matching list, result tag, Try again strip, per-pair marks, inline matching message, explanation block, the two free response N/A cells, teacher strip, exemplar block, read-only banner, student pick vs key). The S3.3 N/A frame, which still carried the copy-paste "4. Submitted, incorrect, no retry" name, renamed to "3. Submitted, correct".
- 2026-09-08 — Quiz Builder workspace rows 4 to 6 reseeded with coherent demo content. The three Question tabs had all inherited one set of fields ("Internet Citizenship (1)", the phishing-link title, 3A-CS-03/04/05) regardless of the question in the header; each now carries its own internal name, title (matching the collapsed stem) and standards. MC Answers: four responsible-AI options with A and B keyed and Multiple (checkbox) active. FR Answers: on-theme placeholder prompt. Matching Answers: three filled pairs (image classifier, LLM, recommender). Description, answer explanation and exemplar editors had empty bodies; each now has one line of copy. Usage tab headers realigned to the same stems. W7 (new unsaved question) keeps its placeholders on purpose.
- 2026-09-08 — Two workspace slices added. W1.5 "Preview tab, empty quiz": Preview segment active, header keeps title and zero counts, empty-state block reads "Nothing to preview yet" with a single outlined Back to Build action. W3.4 "Delete section with questions": dialog raised from the section menu's Delete section when the section is not empty; body names the section and its question count and says the questions stay in the bank; actions are Cancel (outlined) and Remove with questions (contained, error). Empty sections skip the dialog. Workspace card widened to 6200 for the fifth column; four annotations added.
- 2026-09-09 — Retries and must-answer-correctly split. Config gains `Require a correct answer to continue` under Allow multiple attempts. CFU seed is now attempts on + require-correct on (legacy CfU: no Next until they get it right). Practice and exam sim seed it off. Student grid: S5 is must-correct (Incorrect tag left, Try again primary right); new S6 is can-continue (Try again secondary left, Next level primary). Old next-attempt and reveal rows renumbered S7 / S8. `questionContainerBase` gains `canProceedIfIncorrect`. Dropped “Continue anyways.”
- 2026-09-09 — Single-question footers match the quiz bar: Submit answer → Submit; Try again drops the start icon. `questionContainerBase` default follows. Five leftover Submit answer labels on Quiz Experience cards renamed too.
- 2026-09-09 — Quiz Experience copy pass. Dialog confirm is Submit now (never Submit anyways); Keep working is the primary. Last page is Submit on final attempt and on no-reveal, Finish when attempts remain. Results with attempts left: Try again primary, Submit this attempt secondary. Receipt and last-attempt results: Next level. Timer chips are `m:ss remaining`. Dialog chips S6.1–S6.3 renamed. Casing rules written down so this does not drift again.
- 2026-09-09 — Sitting attempt chip. `quizAttemptChip` (sitting / final) sits with the timer. Both states use the same neutral chip; copy carries Final attempt. `stickyFooter` and `questionContainerBase` gain `hasAttempts` (default off). Show only when `max_attempts` is set. Exam rows 2–3 and teacher-as-student get the bar chip; Question Types S9 is one capped example per type. Unlimited CfUs stay quiet.
- 2026-09-09 — Folded Question Types and Quiz Experience into one `↪ Quiz` page. Components is Question types (MC, matching, FR, upload) then Quiz chrome (card shell, tags, explanation, footer, timer, attempt chip). Directory has five areas: Components, question-type student, question-type teacher, quiz sitting student, quiz sitting teacher. Old Quiz Experience page is a pointer.
- 2026-09-09 — Handoff polish on `↪ Quiz`. Directory title is Quiz. Areas 2–5 and the four grid headers are titled Question types / Quiz sitting with Student or Teacher. Group headers in Components are unnumbered (1 lives on the Directory). Types skip tags are type bodies only, including Match Lines; chrome Back and both sitting back-arrows point at the combined ToC. `userUpload` sits under its header in Question types. S6 and S9 Directory chips hit their rowLabels. Leftover Quiz Experience ToC retargets Components and uses the new sitting names. Handoff chips: Quiz → Directory, Quiz sitting → student sitting.
- 2026-09-09 — ToC reorg on `↪ Quiz`. Six areas, left to right: (1) Components: quiz chrome, (2) Components: question types, (3–4) One question Student-facing / Teacher-facing, (5–6) Several questions Student-facing / Teacher-facing. Skip tags split by area. Headers and section names match. Handoff chips: Quiz Experience → Directory, Several questions → student sitting. Leftover page titles follow.
