# Match

## Purpose

Prototype matching assessment levels on the Lab2 shell: learners map terms to definitions using either a **card-slot definition bank** or **connector** (two fixed columns with curved lines). Submit feedback, sounds, teacher reveal, and Continue navigation align with multi-choice and free-response demos.

## Routes

Bubble navigation and demos are listed in `src/pages/levelTypeLinks.ts` (`matchLevelLinks`):

- `/levels/match-definition-bank` — card-slot bank + definition rows
- `/levels/match-connector` — connector lines (text-focused default)
- `/levels/match-connector-images` — connector with image-rich cards
- `/levels/match-connector-code` — connector with code / output blocks

## Key Files

- `src/components/assessment/shared/AssessmentLevelShell.tsx` — shared outer card chrome
- `src/components/assessment/shared/AssessmentStemSection.tsx` — eyebrow, optional `stem.question`, optional markdown `stem.description`, then task UI
- `src/components/assessment/shared/AssessmentBottomRow.tsx` — footer row (Reveal answer left; Submit / Try again / Continue + feedback right)
- `src/components/assessment/match/views/MatchDefinitionBankWorkspace.tsx` (+ `.module.scss`) — bank + row slots
- `src/components/assessment/match/views/MatchConnectorWorkspace.tsx` (+ `.module.scss`) — two columns, SVG connectors, keyboard + pointer
- `src/pages/match/MatchDefinitionBankLevelPage.tsx`, `MatchConnectorLevelPage.tsx`, `MatchConnectorImageLevelPage.tsx`, `MatchConnectorCodeLevelPage.tsx`
- `src/data/assessment/match.ts` — payload types and demo fixtures
- `src/assets/audio/success-sound.mp3` / `error-sound.mp3` — played on submit (all correct / any incorrect)
- `src/components/ui/AppButton.tsx` — `iconName` for Reveal / Hide answer (FA7 Pro Solid via `FaIcon`)

## Stem model

The `stem` object replaces a single flat `prompt` string. `title` is not used.

### `stem.question` (optional, string)

Plain text. **Recommended** for simple, single-sentence questions. Renders as the card heading.

### `stem.description` (optional, markdown)

Markdown-enabled. Use when the question needs rich formatting, inline code, lists, or when the full prompt is description-only (omit `stem.question`).

Rendering rules match multi-choice and free-response (`see multi-choice.md` stem table).

## Student UX (definition bank)

- Terms live in a **bank**; each definition row has a **slot**. Drag or click to assign; **one term per row**.
- **Clear all** in the task toolbar when not submitted and not in teacher reveal.
- **Submit** when every row is filled and **Reveal answer** is not active.

## Student UX (connector)

- Fixed **left column (terms)** and **right column (definitions)**. Learners connect pairs by dragging a line between tiles, or by clicking a term and then a definition (the other order works too). A click starts a connector from that tile that follows the pointer until the learner clicks the other tile, clicks the same tile again, presses Escape, or clicks outside the cards. The line is drawn only in the gap between the two columns; past that edge it stops visually, and the in-progress pair stays active so the learner can move back and finish it. A drag works the same way. Keyboard: arrow keys move focus. While a pair is in progress, the connector is drawn to the focused tile in the other column, and it hides while focus stays in the selected tile’s column. Enter or Space connects. Moving the pointer starts aiming the line with the cursor again.
- **Re-pairing** clears the existing pair as soon as that tile is chosen (click or drag), before the new pair is made.
- **Definition text** is left-aligned, including definition cards in the definition bank.
- **Keyboard focus** draws the shared focus ring around the tile.
- **Tile interaction** (Figma matching item): the whole tile uses a crosshair cursor while it can be paired. Hover/press/focus anywhere on the tile also drives the connector knob. Unmatched hover uses a secondary border and tertiary knob; press/focus fill the knob with brand-light and a selected-primary ring. Connected tiles use brand-light / selected-primary; hover and press darken the knob to selected-strong. Correct and incorrect pairs have **no** hover/press.
- **Pair letters:** each term node shows a letter in column order (A, B, C…). Definition nodes stay empty until that definition is matched, then show the letter of the term it is connected to. Rematching moves the letter with the pair. The same letters appear on the Correct Answer board.
- **Correctness** is the card, node, and connector color when every pair is correct, or when the key is revealed. An imperfect match with the key hidden keeps the student's pairs in the connected style, with no per-pair right or wrong marks, because those marks reveal the rest of the key. When marks are on, an incorrect connector is dashed. The card name includes “correct” or “incorrect” once those marks are showing. There is no check or x icon on the cards.
- **Clear all** and **Submit** follow the same footer rules as other assessment types.

## Student UX (submit and feedback)

- **Sounds:** `success-sound.mp3` when all matches are correct; `error-sound.mp3` when any are wrong.
- **All correct** — success styling; bottom bar **“Nice work!”** and **Continue** (next route in `matchLevelLinks` or `/levels` after the last demo).
- **Any incorrect** — the question is incorrect, but individual pairs stay in the connected style unless the key is revealed. **Try again** until all correct; **Continue** only after a fully correct attempt. On Try again, pairs that were already correct stay matched and locked (success styling, no hover/press); incorrect pairs clear. Submit stays disabled until every remaining pair is filled.
- **Teacher tools:** **Reveal answer** / **Hide answer** shows the key in the live UI; Submit disabled while revealed (same pattern as multi-choice).

## Teacher answer key

- **Reveal** is integrated into the student UI (no separate collapsible card below the workspace).
- **Peek / teacher key (no submitted attempt):** the live board is replaced with the correct pairings.
- **Reveal after an incorrect or partial attempt** (CFU / quiz `revealKeyAlongsideSelection`, or standalone Reveal after submit): the student’s matches stay on the first board (correct / incorrect), and a **Correct Answer** set with the key appears underneath. A fully correct attempt does not add the second set.
- See `teacher-answer-key.md` for the shared pattern.

## Data shape

`MatchLevelPayload` (`src/data/assessment/match.ts`): terms and prompts may include rich `contentBlocks` (text, code, image) for connector variants; optional `columnFlex` and `cardAlignment` for layout. See `match.ts` for the full type.

## Known gaps

- No timed mode, hints, or adaptive remediations.
- No persistence of intermediate match state.
- No API submission or scoring persistence.
