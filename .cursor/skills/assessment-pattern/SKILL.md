---
name: assessment-pattern
description: Guides implementation and review of assessment level patterns, including multi-choice, free response, match, bubble choice, levelgroup, code references, and teacher-answer reveal behavior. Use when adding or changing assessment routes, views, data, or answer-key behavior.
disable-model-invocation: true
---

# Assessment Pattern

## Required Reading

Read these before editing assessment behavior:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `.cursor/rules/design-system.mdc`
4. `src/guidelines/level-types/README.md`
5. The relevant assessment guide in `src/guidelines/level-types/`
6. `src/guidelines/level-types/teacher-answer-key.md` when reveal or answer-key behavior is involved

## Placement

- Assessment workspace UI belongs in `src/components/assessment/<type>/views`.
- Shared assessment chrome belongs in `src/components/assessment/shared`.
- Route composition belongs in `src/pages/<assessment-route-family>`.
- Fixtures belong in `src/data/assessment`.
- Cross-cutting contracts belong in `src/types`.

## Workflow

1. Identify the assessment type and nearest existing route. Match the existing data shape, route composition, and interaction pattern unless the user explicitly asks for a new pattern.

2. Keep stem, answer area, reveal behavior, and code-reference layout aligned with existing shared assessment components.

3. For teacher-answer behavior, use the inline reveal pattern documented in `teacher-answer-key.md`. Do not reintroduce legacy collapsible-card behavior unless explicitly requested.

4. Preserve student interaction state clearly:
   - selected choices
   - submitted or revealed state
   - match pairings
   - free-response content
   - upload or markdown display state

5. Use shared UI primitives and SCSS modules. Follow design tokens strictly.

6. Keep fixtures realistic but small. Avoid duplicating large data blobs when a reusable fixture can express the pattern.

7. Update level-type docs when UX behavior, routes, data shape, or known gaps change. For assessment-builder / modernizing-assessments **product or architecture** changes, also update `docs/status.md` (skip polish-only turns).

8. Verify:
   - `npm run typecheck`
   - `npm run build`
   - manual smoke check of changed assessment route
   - keyboard/focus check for new interactions

## Output

Summarize:

- assessment type and route
- data shape changes
- reveal/answer-key behavior
- shared components reused
- docs updated
- verification run
