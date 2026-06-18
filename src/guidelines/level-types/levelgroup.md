# Levelgroup

## Purpose

Grouped assessment experiences where multiple question types (multi, free response, match, drag and drop, fill in the blank) are composed from the same workspace components used by standalone levels, with a single submit for the whole group.

## Routes

- `/levels/levelgroup-scroll` — all questions visible on one page; submit once.
- `/levels/levelgroup-stepped` — one question at a time with in-level progress (Question *n* of *total*); submit on the last step.

## Key Files

- `src/pages/levelgroup/LevelGroupScrollLevelPage.tsx`, `src/pages/levelgroup/LevelGroupSteppedLevelPage.tsx`
- `src/components/assessment/levelgroup/views/LevelGroupScrollWorkspace.tsx`, `LevelGroupSteppedWorkspace.tsx`
- `src/components/assessment/levelgroup/views/LevelGroupFlowBlocks.tsx` (shared state + `LevelGroupEmbeddedBlock`)
- `src/components/assessment/levelgroup/views/LevelGroupWorkspace.module.scss` (layout shell shared by scroll/stepped)
- `src/data/assessment/levelGroup.ts` (`LevelGroupFlowPayload`, `mockLevelGroupScroll`, `mockLevelGroupStepped`, payload mappers)

## Current UX Behavior

- Each block maps to `MultiChoiceWorkspace`, `FreeResponseWorkspace`, `MatchConnectorWorkspace`, `DragDropWorkspace`, or `FillInBlankWorkspace` in **embedded** mode (no per-section shell submit; group footer submits).
- Scroll variant: stacked blocks + aggregate summary after submit.
- Stepped variant: progress chrome + Next/Back; after submit, all blocks render for review.
- After submit, the results summary shows **Try again** (secondary) and **Continue** / **Finish** (primary — next entry in `levelLinks`, or `/levels`). Stepped and scroll layouts also pin the continue action at the bottom of the review card.

## Teacher Answer Key Content

- When implemented, align with `teacher-answer-key.md` (inline reveal where applicable, or sectioned blocks for grouped flows).
- Body should contain sectioned answer blocks (multi-choice, free-response, match).
- Each section should reuse the same presenter style as the standalone level type.

## Current Data Shape

- `LevelGroupFlowPayload` — `level.steps`: ordered `LevelGroupQuestionBlock[]` (multi, freeResponse, or match).

## Known Gaps

- Section-level partial completion states are not persisted.
- No per-section rubric or weighted scoring model yet.
