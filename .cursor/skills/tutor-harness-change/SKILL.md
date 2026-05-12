---
name: tutor-harness-change
description: Guides safe changes to the functional Tutor harness, including request routing, context packing, planning, edit application, validation, provider behavior, and docs. Use when modifying src/lib/tutor, AI Tutor behavior, proposal flows, or Tutor-related UI contracts.
disable-model-invocation: true
---

# Tutor Harness Change

## Required Reading

Read these before editing Tutor behavior:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `src/guidelines/tutor-harness.md`
4. The level-type guide for the route that invokes Tutor

## Key Boundaries

- Functional Tutor logic belongs in `src/lib/tutor`.
- Route pages own composition and UI state wiring.
- Sidebar Tutor UI belongs under `src/components/lab2/resource-panel/views/ai-tutor`.
- Web Lab 2 can produce plans and code proposals.
- Python Lab is guidance-only and should not enter planning, edit, or tool-loop proposal flows unless the project intentionally changes that contract.

## Workflow

1. Identify the affected stage:
   - request intent
   - context building
   - context packing
   - guidance response
   - planning response
   - structured edit session
   - atomic edit application
   - validation or repair
   - tool-loop fallback
   - save-title generation
   - route/UI proposal handling

2. Read the relevant files in `src/lib/tutor` and the route page that calls the Tutor client. Do not change the UI contract before understanding the returned `{ message, saveTitle?, changes }` shape.

3. Preserve the student-facing safety model:
   - guidance requests should not edit files
   - planning should write or revise `Plans/PROJECT_PLAN.md`
   - edit proposals should remain reviewable before acceptance
   - pending proposals should block additional Tutor submissions until accepted or rejected

4. Keep provider-specific behavior isolated. Avoid leaking OpenAI-specific details into UI or route code.

5. Update validation and repair paths when changing generated file formats, allowed operations, or project-analysis assumptions.

6. Add or adjust focused tests if the repo has relevant coverage for the changed harness behavior. If not, document manual verification clearly.

7. Update `src/guidelines/tutor-harness.md` whenever request flow, context shape, validation, proposal behavior, save behavior, or known gaps change.

8. Verify:
   - `npm run typecheck`
   - `npm run build`
   - manual Tutor smoke checks for each affected route type

## Output

Summarize:

- affected Tutor stage
- route behavior changed
- safety contract preserved or intentionally changed
- docs updated
- verification run
