---
name: prototype-qa
description: Runs a focused QA pass for Lab2 prototype work, combining repo verification, route smoke checks, UI token review, accessibility checks, and documentation impact review. Use before sharing, demoing, opening a PR, or handing off prototype changes.
disable-model-invocation: true
---

# Prototype QA

## Required Reading

Read these before QA:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `.cursor/rules/design-system.mdc`

## Workflow

1. Inspect the current change set:
   - `git status --short`
   - `git diff --stat`
   - targeted diffs for changed files

2. Identify impacted surfaces:
   - route pages
   - shared Lab2 shell or resource panel
   - IDE workspace views
   - assessment views
   - shared UI primitives
   - Tutor harness
   - data fixtures
   - docs

3. Run automated verification:
   - `npm run typecheck`
   - `npm run build`

4. Run a UI token audit on changed UI files:
   - no raw hex colors
   - no mapped aliases in component CSS/SCSS
   - no raw typography values when tokens exist
   - shared primitives used where available
   - `FAIcon` used for icons

5. Check interaction basics:
   - visible focus states
   - keyboard operation for newly touched controls
   - accessible names for icon-only controls
   - no broken disabled or loading states

6. Smoke test routes affected by the change. If a dev server is already running, use it. Do not start duplicate dev servers.

7. Review documentation impact:
   - `src/ARCHITECTURE.md`
   - `src/guidelines/Guidelines.md`
   - relevant `src/guidelines/level-types/*.md`
   - `src/guidelines/tutor-harness.md`
   - `src/REFACTORING_SUMMARY.md` when files moved

8. Separate blocking issues from acceptable prototype gaps.

## Output

Report:

- automated checks and results
- routes or surfaces smoke-tested
- issues found, ordered by severity
- docs updated or not needed
- residual risks

Mention known existing build warnings separately from new failures.
