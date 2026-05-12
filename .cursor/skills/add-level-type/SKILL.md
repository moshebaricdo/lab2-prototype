---
name: add-level-type
description: Guides adding a new Lab2 level type with the correct route, component, data, hook, styling, and documentation patterns. Use when creating a new level type, adding a new assessment type, or expanding Lab2 beyond existing Web Lab, Python Lab, AI Chat Lab, or assessment patterns.
disable-model-invocation: true
---

# Add Level Type

## Required Reading

Read these before changing files:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `.cursor/rules/design-system.mdc`
4. `src/guidelines/level-types/README.md`
5. The closest existing level-type guide in `src/guidelines/level-types/`

## Workflow

1. Identify the level type category:
   - IDE lab: use `src/components/ide/<labname>/views` and `src/pages/<labname>`
   - Assessment: use `src/components/assessment/<type>/views`, `src/pages/<type>`, and `src/data/assessment`
   - Shared Lab2 frame behavior: use `src/components/lab2`, `src/hooks`, or `src/types`

2. Inspect the closest existing implementation before creating new files. Prefer copying the composition shape, state ownership, and route conventions already used by the nearest level type.

3. Keep `App.tsx` focused on routing. Put page composition in `src/pages/<level-type>/` and reusable behavior in hooks or typed contracts.

4. Use shared primitives first:
   - `TopNavigation` and `LevelProgressBubbles` from `src/components/ui/header`
   - `Lab2Shell` from `src/components/lab2`
   - `Sidebar` and resource-panel views from `src/components/lab2/resource-panel`
   - `AppButton`, form primitives, dialogs, tooltips, and `FAIcon` from `src/components/ui`

5. Add mock data under `src/data/<domain>/` only when the route needs fixtures. Keep fixture shapes typed and close to existing data patterns.

6. Style new UI with colocated SCSS modules. Use `var(--ds-*)`, typography tokens, and existing mixins. Do not add utility-heavy Tailwind markup for new UI.

7. Update documentation in the same change:
   - Add or update a level-type guide in `src/guidelines/level-types/`
   - Update `src/ARCHITECTURE.md` for new composition, state ownership, or major folders
   - Update `src/guidelines/Guidelines.md` if placement guidance changes

8. Verify:
   - `npm run typecheck`
   - `npm run build`
   - Manual route smoke check when a visible route was added

## Output

When planning or summarizing, include:

- new route path and page file
- component/data locations
- state hooks used or added
- docs updated
- verification run
