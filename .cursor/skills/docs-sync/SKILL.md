---
name: docs-sync
description: Reviews project changes for documentation impact and updates the minimal relevant architecture, guideline, level-type, Tutor, or refactoring docs. Use after feature work, refactors, route changes, data-shape changes, or behavior changes in this Lab2 prototype.
disable-model-invocation: true
---

# Docs Sync

## Required Reading

Read these before updating docs:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. Relevant docs under `src/guidelines/level-types/`
4. `src/guidelines/tutor-harness.md` when Tutor behavior changed
5. `src/REFACTORING_SUMMARY.md` when files moved or ownership changed

## When Docs Are Needed

Update docs when a change affects:

- file ownership or placement guidance
- route paths or route composition
- level-type UX behavior
- shared component responsibilities
- state ownership
- data shapes or fixture conventions
- Tutor request flow, context, validation, proposal, or save behavior
- known gaps or manual QA expectations
- refactoring maps or deprecated paths

Do not update docs for purely internal code cleanup that leaves behavior, ownership, routes, and public patterns unchanged.

## Workflow

1. Inspect the change set:
   - `git status --short`
   - `git diff --stat`
   - targeted diffs for changed files

2. Map each change to the doc that owns it:
   - broad architecture: `src/ARCHITECTURE.md`
   - repo-wide placement and styling rules: `src/guidelines/Guidelines.md`
   - level-specific behavior: `src/guidelines/level-types/*.md`
   - Tutor harness: `src/guidelines/tutor-harness.md`
   - file moves/refactors: `src/REFACTORING_SUMMARY.md`

3. Make the smallest accurate doc edit. Keep docs descriptive and current; do not add speculative future plans unless the change creates a known gap.

4. Preserve existing tone and structure. Prefer updating current sections over adding new sections.

5. Verify that docs do not reference removed legacy paths or stale component names.

6. If no docs are needed, explicitly state that documentation impact was checked and why no update was required.

## Output

Report:

- docs checked
- docs changed
- reason each change was needed
- docs intentionally left unchanged
