# Multi-choice

## Purpose

Prototype of a multiple-choice / multiple-response assessment level on the Lab2 shell: flexible stems, typed answer options, list or grid layout, and polished submit feedback.

## Routes

- `/levels/multi` — text question, plain text options
- `/levels/multi-authoring` — text question + supplemental description (code block context)
- `/levels/multi-authoring-code` — text question, image answer options
- `/levels/multi-authoring-media` — description-only stem, **multiple response** (checkboxes, select two)
- `/levels/multi-authoring-arraylist` — description-only stem with embedded code block
- `/levels/multi-all-that-apply` — multi-select **survey** *(select all that apply)*, `surveyMode: true` (no graded key, Reveal answer hidden, Submit always continues)

## Key Files

- `src/components/assessment/shared/AssessmentStemSection.tsx` — reusable stem (eyebrow, question, markdown description) + slot for the task UI
- `src/components/assessment/shared/AssessmentBottomRow.tsx` — reusable card footer (teacher tools left, actions + optional `AssessmentSuccessFeedback` right)
- `src/pages/MultiChoiceLevelPage.tsx` (and sibling pages per route above)
- `src/pages/levelTypeLinks.ts` — bubble navigation between multi demos
- `src/components/assessment/multi/views/MultiChoiceWorkspace.tsx`
- `src/components/assessment/multi/views/MultiChoiceWorkspace.module.scss`
- `src/data/assessment/multi.ts` — payload types and demo fixtures
- `src/assets/audio/success-sound.mp3` / `error-sound.mp3` — played on submit (correct / incorrect)
- `src/components/ui/AppRadio.tsx` — single-select control
- `src/components/ui/AppCheckbox.tsx` — multi-select control
- `src/components/ui/AppButton.tsx` — supports `iconName` (FA7 Pro Solid webfont via `FaIcon`) for actions such as Reveal answer

## Selection mode

| `selectionMode` | Control | Correct answers | Notes |
|---|---|---|---|
| omitted or `"single"` | `AppRadio` | `correctAnswerId` | Default |
| `"multiple"` | `AppCheckbox` | `correctAnswerIds` | Order-independent match |

Optional `requiredSelectionCount` (e.g. `2`) keeps Submit disabled until exactly that many options are selected.

Optional `maxSelectionCount` caps how many options can be checked at once: when the cap is reached, remaining options are disabled until the user unchecks one. Omit `maxSelectionCount` for unlimited selection (e.g. “select all that apply” where the student may check every option).

## Survey mode (`surveyMode`)

Use for **reflection / ungraded** multi-select (e.g. end-of-unit survey). Set `surveyMode: true` and omit `correctAnswerId` / `correctAnswerIds`.

- **Reveal answer** is hidden (no keyed responses).
- **Submit** is always enabled (including **zero** selections).
- After submit: success sound, **“Thanks for your responses!”**, and **Continue** — no incorrect state, wrong marks, or Try again.
- Stem eyebrow shows **Survey** instead of Multiple response.

## Automatic option letters (A, B, C, …)

The workspace **prepends** a reference letter to each option in order (`A.`, `B.`, `C.`, …). This is **not** part of `answer.text` or `contentBlocks` — authors should not duplicate letters in copy. Letters are derived from the **array order** of `answers`. If there are more than 26 options, labeling continues Excel-style (`AA`, `AB`, …).

## Stem model

The `stem` object replaces the old `title`, `question`, and `description` fields. `title` has been dropped.

### `stem.question` (optional, string)

Plain text. **Recommended** for simple, single-sentence questions. Renders as the card heading.

Use when the question is straightforward and needs no formatting.

### `stem.description` (optional, markdown)

Markdown-enabled. Use when:

- The question itself requires inline code, bold, italics, or links.
- Supporting context (a list, an image, a code block) must appear before the student sees the answer options.
- The full scenario — context + question — belongs in one flowing block.

#### Rendering rules

| `stem.question` | `stem.description` | Result |
|---|---|---|
| ✓ | — | Heading only |
| ✓ | ✓ | Heading + boxed supplemental block below |
| — | ✓ | Plain body markdown — description **is** the question |

When `description` is used alone, write the question sentence as part of the markdown copy so students encounter context before the question, not after.

## Answer option content

Each answer can use plain text (`answer.text`) or typed blocks (`answer.contentBlocks`):

- `type: "text"` — rich-text fallback (use `answer.text` instead for simple strings)
- `type: "code"` — code block with optional `language`
- `type: "image"` — image with required `alt` and optional `caption`

Prefer `answer.text` for short plain-text options. Use `contentBlocks` when an option is a code snippet, an image, or a GIF.

## Student UX (submit and feedback)

- **Submit** is enabled when the selection satisfies `requiredSelectionCount` (if set) or at least one choice (single) / required count (multi).
- **Sounds:** `success-sound.mp3` on a correct submit; `error-sound.mp3` on an incorrect submit.
- **Correct answer**
  - Chosen correct option(s) use success (green) styling instead of the default teal “selected” look; a check glyph appears.
  - A short shimmer animation runs on those option cards.
  - Bottom bar: **“Nice work!”** and a primary **Continue** button that navigates to the next route in the demo `levelLinks` chain (or `/levels` after the last demo).
- **Incorrect answer** *(graded levels only; not used when `surveyMode` is true)*
  - Incorrect selected options show error styling and an ✕ mark; there is **no** separate incorrect message line beside **Try again** (options carry the feedback).
  - **Try again** clears the attempt and selection; options the learner had wrongly selected keep a **muted ✕** so prior mistakes remain visible across retries (accumulated until they submit correctly or change level).
  - **Continue** is not shown until they answer correctly.
- **Teacher tools:** **Reveal answer** / **Hide answer** toggles the keyed answer(s) with success styling; it disables submit until hidden again as implemented in the workspace.

## Option layout

`optionLayout.type` is `"list"` (default, stacked) or `"grid"` with optional `columns` (`2` | `3` | `4`). Use grid for short options, images, or code snippets; use list for longer text.

## Code Reference Panel Layout

When `codePanel` is provided alongside the multi-choice payload, the workspace switches from a centered single-column card to a **two-column split layout**: a read-only code viewer on the left and the assessment card on the right, separated by a resizable handle.

| Demo | Path |
|------|------|
| Code reference panel (AP CS trace) | `/levels/multi-code-ref` |

**Data shape:** `MultiChoiceCodeRefPayload` extends `MultiChoiceLevelPayload` with `codePanel: CodePanelConfig`. See `src/data/assessment/codePanel.ts` for the `CodePanelConfig` / `CodePanelFile` types and `src/data/assessment/codeRefMocks.ts` for mock payloads.

## Known gaps

- No API submission or scoring persistence.
- No partial credit for multi-select (all-or-nothing match against `correctAnswerIds`).
- Code reference panel: no editable mode, no line highlighting, no responsive breakpoint (stacked layout on narrow viewports).
