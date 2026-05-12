---
name: add-lab-route
description: Adds a new Lab2 route or demo page using the repository's route composition, shell, resource-panel, hook, data, and documentation conventions. Use when creating a new route, demo page, prototype variant, or level page.
disable-model-invocation: true
---

# Add Lab Route

## Required Reading

Read these before editing:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `.cursor/rules/design-system.mdc`
4. The relevant guide in `src/guidelines/level-types/`

## Workflow

1. Determine the route family:
   - `src/pages/weblab2`
   - `src/pages/pythonlab`
   - `src/pages/aichatlab`
   - `src/pages/<assessment-type>`
   - `src/pages/progression`

2. Find and read the closest existing route page. Match its composition style, prop naming, dev-panel defaults, session-storage conventions, and data imports.

3. Keep route files responsible for composition only:
   - import `TopNavigation`
   - compose `Lab2Shell`
   - configure `Sidebar` tabs and resource-panel content
   - pass state into the level-specific workspace
   - avoid embedding complex reusable behavior directly in the route

4. Put reusable state in hooks under `src/hooks` and shared contracts in `src/types`.

5. Put lab-specific workspace UI under `src/components/ide/<labname>/views`. Put assessment UI under `src/components/assessment/<type>/views`.

6. Add or reuse fixtures from `src/data/<domain>/`. Keep route-specific demo defaults close to the route only when they are not reusable data.

7. Register the route in `src/App.tsx` and update any route index or navigation data that exposes the demo.

8. Style any new UI with SCSS modules and design-system tokens. Use shared UI primitives and `FAIcon`.

9. Update docs when behavior, route lists, level-type patterns, or architecture change.

10. Verify:
    - `npm run typecheck`
    - `npm run build`
    - manual smoke check of the new route URL

## Output

Report:

- route URL
- route page file
- workspace/component files changed
- fixture files changed
- docs updated or why not
- verification run
