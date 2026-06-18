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

- Fixed **left column (terms)** and **right column (definitions)**. Learners connect pairs with curved lines (pointer or keyboard).
- **Clear all** and **Submit** follow the same footer rules as other assessment types.

## Student UX (submit and feedback)

- **Sounds:** `success-sound.mp3` when all matches are correct; `error-sound.mp3` when any are wrong.
- **All correct** — success styling; bottom bar **“Nice work!”** and **Continue** (next route in `matchLevelLinks` or `/levels` after the last demo).
- **Any incorrect** — error styling where applicable; **Try again** until all correct; **Continue** only after a fully correct attempt.
- **Teacher tools:** **Reveal answer** / **Hide answer** shows the key in the live UI; Submit disabled while revealed (same pattern as multi-choice).

## Teacher answer key

- **Reveal** is integrated into the student UI (no separate collapsible card below the workspace).
- The **body** is the live task surface with correct pairings highlighted. See `teacher-answer-key.md` for the shared pattern.

## Data shape

`MatchLevelPayload` (`src/data/assessment/match.ts`): terms and prompts may include rich `contentBlocks` (text, code, image) for connector variants; optional `columnFlex` and `cardAlignment` for layout. See `match.ts` for the full type.

## Known gaps

- No timed mode, hints, or adaptive remediations.
- No persistence of intermediate match state.
- No API submission or scoring persistence.
