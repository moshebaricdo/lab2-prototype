---
name: implement-figma-screen
description: Implements Figma screens in this Lab2 prototype by translating design context into project-native React, SCSS modules, shared components, and design-system tokens. Use when the user provides a Figma URL or asks to implement a screen, modal, panel, or view from Figma.
disable-model-invocation: true
---

# Implement Figma Screen

## Required Reading

Read these before coding:

1. `src/guidelines/Guidelines.md`
2. `src/ARCHITECTURE.md`
3. `.cursor/rules/design-system.mdc`
4. The closest level-type guide in `src/guidelines/level-types/` when the screen belongs to a specific route family

If the user provides a Figma URL, also load the appropriate Figma implementation skill and use the Figma MCP workflow before coding.

## Workflow

1. Pull design context from Figma when available. Treat generated React/Tailwind output as reference only, not final code.

2. Locate the target surface:
   - Lab2 shell or resource panel: `src/components/lab2`
   - IDE workspace: `src/components/ide/<labname>/views`
   - Assessment view: `src/components/assessment/<type>/views`
   - Route composition: `src/pages/<level-type>`
   - Reusable primitive: `src/components/ui`

3. Reuse existing project components before introducing new ones:
   - `AppButton` for buttons
   - existing form primitives for inputs
   - `FAIcon` for icons
   - `PanelHeader`, `Dialog`, `Modal`, `Tooltip`, and `AppSlider` where appropriate

4. Translate Figma tokens into project tokens:
   - colors: `var(--ds-*)`
   - font families: `var(--font-heading)`, `var(--font-body)`, `var(--font-mono)`
   - font weights: `var(--font-weight-normal|medium|semibold)`
   - font sizes: `var(--text-*)`

5. Use colocated SCSS modules for new component styling. Avoid hardcoded hex values, raw typography values, mapped aliases such as `--foreground`, and utility-heavy Tailwind markup.

6. Preserve interaction quality:
   - visible focus states for interactive elements
   - keyboard behavior for controls, dialogs, tabs, and menus
   - responsive behavior that matches the surrounding surface
   - accessible labels when icon-only controls are introduced

7. Keep the implementation scoped. Do not refactor unrelated layout, state, or token systems unless the design cannot be implemented safely without it.

8. Update docs only if the change creates new placement guidance, level-type behavior, route behavior, data shape, or architecture.

9. Verify:
   - `npm run typecheck`
   - `npm run build`
   - visual smoke check against the Figma screenshot or design context

## Output

Summarize:

- Figma node or screen implemented
- reused project components
- token/styling decisions
- verification run
- any fidelity gaps or assumptions
