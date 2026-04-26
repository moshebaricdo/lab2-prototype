# Lab2 UI Prototype - Development Guidelines

## Overview

This repository is a **Lab2 frame/base**, not a Web Lab-only codebase.

Today it powers a Web Lab 2 prototype, but the architecture should support additional Lab2-powered environments (for example Python Lab, Music Lab, and future Lab2 experiences) with minimal structural churn.

When making changes, optimize for:

- reuse across multiple Lab2 environments
- clear separation between shared frame UI and lab-specific features
- stable styling primitives and tokens

---

## Canonical App Structure

Use these directories intentionally:

```text
src/
  components/
    ui/                    # Universal primitives (buttons, tooltips, etc.)
    ui/header/             # Header-specific UI components
    ui/icons/              # Reusable icon components (FaIcon, AiTutorIcon, Logo)
    lab2/                  # Lab2 frame — shared by ALL level types
    lab2/resource-panel/   # Left rail shell + panel views
    lab2/dev/              # Dev panel, annotation overlay
    ide/shared/            # Shared code-editor components (CodeEditor, FileManager, EmptyState)
    ide/weblab2/views/     # Web Lab-specific workspace chrome (preview, split view, etc.)
    ide/pythonlab/views/   # Python Lab-specific workspace chrome (console, run)
    assessment/            # Assessment level types
  hooks/                   # App-level state hooks
  lib/tutor/               # Functional Tutor harness
  styles/                  # Tokens, globals, and SCSS helpers
  types/                   # Shared type contracts
  guidelines/              # This document
```

### Naming Intent

- `ui/` contains all universal primitives: buttons, tooltips, icons, panel headers, etc.
- `lab2/` groups the Lab2 frame shell (`Lab2Shell`, resource panel, dev tools) shared across all Lab2 level types.
- `ide/shared/` contains shared editor components (CodeEditor, FileManager, EmptyState) used by IDE-type labs.
- `ide/weblab2/views` and `ide/pythonlab/views` hold lab-specific workspace composition.
- As new IDE labs are introduced, add `ide/<labname>/views/` and reuse shared components from `ide/shared/`.
- `lib/tutor/` contains the functional Tutor harness for prompt, context, provider, validation, repair, and fallback behavior. See `src/guidelines/tutor-harness.md`.

---

## Styling System (SCSS-First)

### Source of Truth

Design tokens and globals are layered:

1. `src/styles/tokens.css` (generated design token variables; do not hand-edit)
2. `src/styles/globals.css` (semantic aliases, typography, global base styles)
3. SCSS module files (`*.module.scss`) for component-level styling
4. SCSS helpers (`src/styles/_tokens.scss`, `src/styles/_mixins.scss`)

### Required Rules

- Prefer **SCSS modules** for new component styling.
- Use token variables (`var(--ds-...)` and semantic aliases like `var(--primary)`), never hard-coded color literals unless explicitly justified.
- Keep styles colocated with components (`Component.tsx` + `Component.module.scss`).
- Use shared mixins where appropriate (for example `focus-ring` from `_mixins.scss`).

### Tailwind Guidance

- Tailwind is part of the toolchain and still exists for base/theme plumbing.
- For **new component UI styling**, do not rely on long utility-class composition as the primary approach.
- If touching legacy utility-heavy markup, prefer incremental migration to module classes instead of large risky rewrites.

---

## Typography & Interaction Standards

### Typography

- Heading font: `var(--font-heading)`
- Body font: `var(--font-body)`
- Mono/code font: `var(--font-mono)`
- Weights: `var(--font-weight-normal|medium|semibold)`
- Sizes: semantic tokens in `globals.css` (for example `--text-h1`, `--text-base`, `--text-label`)

### Focus and Accessibility

- Every interactive element must expose a visible focus style.
- Preferred ring color is tokenized via `var(--ring)`.
- Ensure keyboard behavior is preserved for buttons, menus, dialogs, and list interactions.

### Icons

- Use FontAwesome-based patterns already established in the repo.
- Reusable custom icons belong under `src/components/ui/icons`.

---

## Component Architecture Rules

### Shared vs Lab-Specific

- Universal primitives:
  - `src/components/ui` (buttons, tooltips, panel headers, ResizableHandle)
  - `src/components/ui/header` (top navigation, level progress)
  - `src/components/ui/icons` (FaIcon, AiTutorIcon, Logo)
- Lab2 frame (shared by ALL level types):
  - `src/components/lab2` (Lab2Shell)
  - `src/components/lab2/resource-panel` (sidebar, panel views)
  - `src/components/lab2/dev` (dev panel, annotation overlay)
- IDE shared components:
  - `src/components/ide/shared` (code editor, file manager, empty state)
- Lab-specific workspace views:
  - `src/components/ide/weblab2/views` (Web Lab 2)
  - `src/components/ide/pythonlab/views` (Python Lab)

When adding a feature, ask:

1. Could this be used by multiple Lab2 environments?
2. If yes, place in shared directories and keep APIs generic.
3. If no, keep it within lab-specific folders and avoid leaking assumptions into shared primitives.

### State Management

Keep `App.tsx` as orchestration/composition and move behavior into hooks:

- `useLayoutState`
- `useFileWorkspaceState`
- `useChatState`
- `useVersionHistoryState`

Prefer typed props and small, explicit interfaces over broad untyped objects.

---

## Implementation Checklist

Before merging UI work:

1. Styling uses tokens + SCSS modules (no new hard-coded color system).
2. Shared vs lab-specific placement is intentional.
3. Focus states and keyboard interactions are preserved.
4. `npm run typecheck` passes.
5. `npm run build` passes.
6. Imports reference current folders (no legacy paths).

---

## Repository Hygiene

- Keep `.DS_Store` out of source control.
- Keep build artifacts ignored unless release process explicitly requires tracking them.
- Keep lockfile tracked for reproducible installs.

---

## Migration Notes (Current)

Recent organization cleanup established:

- `TopNavigation` + `LevelProgressBubbles` in `src/components/ui/header`
- resource panel views in `src/components/lab2/resource-panel/views`
- shared atoms (`AppButton`, `Tooltip`, `SuccessAlert`) in `src/components/ui`
- icon components in `src/components/ui/icons`
- dev tools in `src/components/lab2/dev`
- legacy/deprecated files removed

Do not reintroduce removed legacy paths or compatibility shims unless there is a concrete migration need.

---

## Quick Decision Guide

- **Need a new reusable button/input/tooltip variant?** -> `src/components/ui`
- **Need a new icon component?** -> `src/components/ui/icons`
- **Need a new sidebar tab panel?** -> `src/components/lab2/resource-panel/views`
- **Need shared code editor / file manager features?** -> `src/components/ide/shared`
- **Need Web Lab-specific workspace chrome?** -> `src/components/ide/weblab2/views`
- **Need Python Lab-specific workspace chrome?** -> `src/components/ide/pythonlab/views`
- **Need to tune Tutor prompts, model context, validation, repair, or provider config?** -> `src/lib/tutor` and `src/guidelines/tutor-harness.md`
- **Need behavior used across many surfaces?** -> hook in `src/hooks` + typed contract in `src/types`
- **Need new styling values?** -> tokens pipeline first, then semantic aliasing

---

## Versioning

**Last Updated:** March 25, 2026  
**Status:** Active baseline for Lab2-powered prototypes
