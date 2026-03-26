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
    weblab2/views/         # Workspace/editor surfaces (current Web Lab implementation)
    resource-panel/        # Left rail shell + panel views
    ui/                    # Shared atomic UI primitives
    ui/header/             # Header-specific UI components
    icons/                 # Reusable icon components
  hooks/                   # App-level state hooks
  styles/                  # Tokens, globals, and SCSS helpers
  types/                   # Shared type contracts
  guidelines/              # This document
```

### Naming Intent

- `weblab2/views` is currently Web Lab implementation detail.
- Shared shell pieces belong in `resource-panel`, `ui`, `ui/header`, or `icons`.
- As new labs are introduced, create lab-specific feature directories without reworking shared frame primitives.

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
- Reusable custom icons belong under `src/components/icons`.

---

## Component Architecture Rules

### Shared vs Lab-Specific

- Shared frame components:
  - `src/components/resource-panel`
  - `src/components/ui`
  - `src/components/ui/header`
  - `src/components/icons`
- Current Web Lab-specific workspace views:
  - `src/components/weblab2/views`

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
- resource panel views in `src/components/resource-panel/views`
- shared atoms (`AppButton`, `Tooltip`, `SuccessAlert`) in `src/components/ui`
- AI tutor icon in `src/components/icons`
- legacy/deprecated files removed

Do not reintroduce removed legacy paths or compatibility shims unless there is a concrete migration need.

---

## Quick Decision Guide

- **Need a new reusable button/input/tooltip variant?** -> `src/components/ui`
- **Need a new sidebar tab panel?** -> `src/components/resource-panel/views`
- **Need workspace/editor behavior for current Web Lab?** -> `src/components/weblab2/views`
- **Need behavior used across many surfaces?** -> hook in `src/hooks` + typed contract in `src/types`
- **Need new styling values?** -> tokens pipeline first, then semantic aliasing

---

## Versioning

**Last Updated:** March 25, 2026  
**Status:** Active baseline for Lab2-powered prototypes
