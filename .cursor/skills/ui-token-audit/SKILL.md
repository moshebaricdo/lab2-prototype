---
name: ui-token-audit
description: Audits changed UI code for design-system token compliance, shared component usage, icon patterns, focus states, and styling regressions. Use when reviewing UI changes, polishing components, or checking SCSS, CSS, Tailwind, or React markup in this project.
disable-model-invocation: true
---

# UI Token Audit

## Required Reading

Read these before auditing:

1. `.cursor/rules/design-system.mdc`
2. `src/guidelines/Guidelines.md`
3. `src/ARCHITECTURE.md`

## Audit Scope

Inspect changed UI files and nearby styles. Include `.tsx`, `.ts`, `.scss`, `.css`, and route files touched by the change.

## Checks

1. Colors:
   - No hardcoded hex values in component styles.
   - No mapped aliases such as `--foreground`, `--background`, `--card`, `--muted-foreground`, `--border`, or `--accent` in hand-written component CSS/SCSS.
   - Use explicit `var(--ds-*)` tokens.

2. Typography:
   - Use `var(--text-*)` font-size tokens.
   - Use `var(--font-weight-normal|medium|semibold)`.
   - Use `var(--font-heading)`, `var(--font-body)`, or `var(--font-mono)`.
   - If a missing typography size is truly needed, add a token rather than hardcoding it.

3. Components:
   - Use `AppButton` for buttons unless there is a clear reason not to.
   - Use shared form primitives, sliders, dialogs, modals, tooltips, and headers where available.
   - Use `FAIcon`; do not import view-specific FontAwesome icons directly at the top of a view.

4. Styling structure:
   - New component styling should use colocated SCSS modules.
   - Avoid new utility-heavy Tailwind class composition.
   - Keep shared vs lab-specific placement aligned with `src/guidelines/Guidelines.md`.

5. Accessibility and interaction:
   - Interactive elements have visible focus states.
   - Icon-only buttons have accessible names.
   - Keyboard behavior is preserved for controls, dialogs, menus, tabs, and list interactions.

6. Risk:
   - Flag global style changes, token changes, or shared primitive changes as higher risk.
   - Check whether docs need updates for placement or behavior changes.

## Useful Searches

Use targeted searches in changed files for:

- `#[0-9a-fA-F]`
- `var\(--foreground|var\(--background|var\(--card|var\(--muted-foreground|var\(--border|var\(--accent`
- `font-size: [0-9]`
- `font-weight: [0-9]`
- `font-family:`
- `@fortawesome`

## Output

Lead with findings, ordered by severity. For each finding include:

- file path
- issue
- expected project pattern
- suggested fix

If no issues are found, say that clearly and mention any residual visual or manual-testing risk.
