# Levelgroup

## Purpose

Prototype of a grouped assessment experience where multiple question types appear on one page and submit together.

## Route

- `/levels/levelgroup`

## Key Files

- `src/pages/LevelGroupLevelPage.tsx`
- `src/components/assessment/levelgroup/views/LevelGroupWorkspace.tsx`
- `src/components/assessment/levelgroup/views/LevelGroupWorkspace.module.scss`
- `src/data/assessment/levelGroup.ts`

## Current UX Behavior

- Renders three sections in one flow:
  - multi-choice
  - free response
  - match
- Single footer action submits all sections at once
- Shows aggregate "sections met expectations" summary
- Includes full reset for quick replay
- Teacher answer presentation in this prototype has not been updated to match the newer **inline reveal** pattern; see `teacher-answer-key.md` for current direction vs. legacy card-under-workspace reference.

## Teacher Answer Key Content

- When implemented, align with `teacher-answer-key.md` (inline reveal where applicable, or sectioned blocks for grouped flows).
- Body should contain sectioned answer blocks (multi-choice, free-response, match).
- Each section should reuse the same presenter style as the standalone level type.

## Current Data Shape

- `LevelGroupPayload`
  - `level.questions.multi`
  - `level.questions.freeResponse`
  - `level.questions.match`
  - `level.metadata`

## Known Gaps

- Section-level partial completion states are not persisted.
- No per-section rubric or weighted scoring model yet.
