# Fill In the Blank

## Purpose

Prototype short-answer assessment levels where students type into one or more blanks embedded in a sentence or passage. Answers are matched against one or more accepted strings per blank (trim + case-insensitive by default). Optional **code reference panel** layout matches other assessment types.

## Routes

Bubble navigation and demos are listed in `src/pages/levelTypeLinks.ts` (`fillInBlankLevelLinks`):

- `/levels/fill-in-blank` — single blank in a sentence
- `/levels/fill-in-blank-multi` — multi-blank “madlibs” passage (CSS box model)
- `/levels/fill-in-blank-code-ref` — blank answered from a side-by-side Python file

## Key Files

- `src/components/assessment/fill-in-blank/views/FillInBlankWorkspace.tsx` (+ `.module.scss`)
- `src/pages/fill-in-blank/*LevelPage.tsx`
- `src/data/assessment/fillInBlank.ts` — payload types, matching helpers, demo fixtures
- `src/components/assessment/shared/AssessmentCodeRefLayout.tsx`
- `src/components/assessment/shared/AssessmentStemSection.tsx`
- `src/components/assessment/shared/AssessmentBottomRow.tsx`

## Stem model

- `stem.question` — optional plain heading
- `stem.description` — optional markdown supplemental or description-only prompt

## Passage model

The task body is built from `question.segments`:

| Segment | Shape | Renders |
|---|---|---|
| Text | `{ type: "text", text: string }` | Inline prose |
| Blank | `{ type: "blank", blankId: string }` | Inline text input |

`question.blanks` defines each blank’s `id`, optional `placeholder`, `acceptedAnswers`, and optional `caseSensitive` / `trimWhitespace`.

Single-blank levels use one blank segment; multi-blank levels interleave multiple `{ type: "blank" }` segments in one passage.

## Student UX

- **Submit** enabled when every blank has a non-empty value.
- **Matching:** exact match against any `acceptedAnswers` entry after normalization (`trimWhitespace` default true, case-insensitive unless `caseSensitive: true`).
- **All correct** — success styling per blank; **Nice work!** and **Continue**.
- **Any incorrect** — per-blank ✓/✕ feedback; **Try again** until all blanks are correct.
- **Teacher tools (`revealAnswerEnabled`):** **Reveal answer** fills accepted values inline and disables inputs while revealed (same bottom-row pattern as multi-choice).

## Code reference panel

When `codePanel` is provided:

- Workspace uses `AssessmentCodeRefLayout` with one or more read-only code files beside the passage.
- Typical use: predict output or complete a missing expression while reading a full program.

## Data shape

`FillInBlankLevelPayload` (`src/data/assessment/fillInBlank.ts`):

- `level.type: "FillInBlank"`
- `level.question.segments` — ordered passage segments
- `level.question.blanks` — blank definitions and accepted answers
- `level.question.revealAnswerEnabled` — optional teacher reveal

Helpers: `isBlankAnswerCorrect`, `normalizeBlankAnswer`.

## Levelgroup embedding

`LevelGroupQuestionBlock` supports `kind: "fillInBlank"` with compact question data mapped via `levelGroupFillInBlankToPayload`. See `levelgroup.md`.

## Known gaps

- No fuzzy/regex matching (exact normalized match only).
- No persistence of typed answers across reloads.
- No API submission or scoring persistence.
