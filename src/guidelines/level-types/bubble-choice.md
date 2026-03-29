# Bubble Choice

## Purpose

Prototype of a "choose your own adventure" selector level where students choose one authored variant for the same concept.

## Route

- `/levels/bubble-choice`

## Key Files

- `src/pages/BubbleChoiceLevelPage.tsx`
- `src/components/assessment/bubble-choice/views/BubbleChoiceWorkspace.tsx`
- `src/components/assessment/bubble-choice/views/BubbleChoiceWorkspace.module.scss`
- `src/data/assessment/bubbleChoice.ts`

## Current UX Behavior

- Displays four authored path cards
- Learner selects one path
- "Continue" navigates to the selected level route
- Selection can be cleared before continuing

## Teacher Answer Key Content

- Optional for this type (depends on whether branching has a pedagogical "best path")
- If enabled, use shared container pattern from `teacher-answer-key.md`
- Body should show recommended path and a short rationale, not a strict "correct/incorrect" answer

## Current Data Shape

- `BubbleChoiceLevelPayload`
  - `level.prompt`
  - `level.options[]` with title, description, estimated time, and destination route
  - `level.metadata`

## Known Gaps

- Options currently map directly to routes (not abstract level IDs yet).
- No tracking for which path was chosen across sessions.
