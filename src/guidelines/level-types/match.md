# Match

## Purpose

Prototype of a matching assessment level on the Lab2 shell: learners map terms to definition rows using drag-and-drop (with click-to-assign fallback), submit feedback, sounds, teacher reveal, and Continue navigation consistent with multi-choice and free-response demos.

## Route

- `/levels/match`

Bubble navigation for this demo is defined in `src/pages/levelTypeLinks.ts` (`matchLevelLinks`).

## Key Files

- `src/components/assessment/shared/AssessmentStemSection.tsx` — eyebrow, optional `stem.question`, optional markdown `stem.description`, then task UI
- `src/components/assessment/shared/AssessmentBottomRow.tsx` — footer row (Reveal answer left; Submit / Try again / Continue + feedback right)
- `src/pages/MatchLevelPage.tsx`
- `src/components/assessment/match/views/MatchWorkspace.tsx`
- `src/components/assessment/match/views/MatchWorkspace.module.scss`
- `src/data/assessment/match.ts` — payload types and demo fixture
- `src/assets/audio/success-sound.mp3` / `error-sound.mp3` — played on submit (all correct / any incorrect)
- `src/components/ui/AppButton.tsx` — `iconName` for Reveal / Hide answer (FA7 Pro Solid via `FaIcon`)

## Stem model

The `stem` object replaces a single flat `prompt` string. `title` is not used.

### `stem.question` (optional, string)

Plain text. **Recommended** for simple, single-sentence questions. Renders as the card heading.

### `stem.description` (optional, markdown)

Markdown-enabled. Use when the question needs rich formatting, inline code, lists, or when the full prompt is description-only (omit `stem.question`).

Rendering rules match multi-choice and free-response (`see multi-choice.md` stem table).

## Student UX (interaction)

- **Drag-and-drop:** Terms are draggable chips; each definition row has a drop zone. **One term per row**; assigning a term to a row removes it from any other row.
- **Click fallback:** Click a term to select it, then click a row’s drop zone to assign (same one-term-per-row rules).
- **Clear all:** Secondary control in the task toolbar clears all assignments (only when not submitted and not in teacher reveal).
- **Submit:** Enabled when every row has a term and **Reveal answer** is not active. **Submit** is disabled while the teacher key is visible.

## Student UX (submit and feedback)

- **Sounds:** `success-sound.mp3` when all matches are correct; `error-sound.mp3` when any are wrong.
- **All correct**
  - Rows show success styling on drop zones; **Correct** in the status column.
  - Bottom bar: **“Nice work!”** and a primary **Continue** button (next route in `matchLevelLinks` or `/levels` after the last demo).
- **Any incorrect**
  - Wrong rows show error styling on the assigned term in the drop zone; **Incorrect** in the status column.
  - Bottom bar: short copy **“X of Y matches are correct.”** and **Try again** (clears assignments and attempt state).
  - **Continue** is not shown until all rows are correct.
- **Teacher tools:** **Reveal answer** / **Hide answer** fills each row with the correct term and success styling (terms pool empty). Submit is disabled while revealed. Same pattern as multi-choice reveal.

## Teacher answer key

- **Reveal** is integrated into the student UI (no separate collapsible card below the workspace).
- The **body** is the live rows: each definition shows the correct **term** in the drop zone with success styling. See `teacher-answer-key.md` for the shared pattern.

## Data shape

`MatchLevelPayload` (`src/data/assessment/match.ts`):

- `level.stem.question` — optional plain-text heading.
- `level.stem.description` — optional markdown.
- `level.question.terms[]` — `{ id, text }`.
- `level.question.prompts[]` — `{ id, text, correctTermId }` (definition rows).
- `level.metadata` — lesson name, level position, totals (for shell title and nav).

## Known gaps

- No timed mode, hints, or adaptive remediations.
- No persistence of intermediate match state.
- No API submission or scoring persistence.
