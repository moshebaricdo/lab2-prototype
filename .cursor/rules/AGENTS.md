---
description: Project playbook — required reading, folder placement, styling rules, and doc dispatch for every task
alwaysApply: true
---

# Lab2 UI Prototype — Agent Playbook

This is a Lab2 frame/base for interactive coding-lab experiences (Web Lab 2, Python Lab, assessment levels). Before making any changes, read the relevant docs below.

---

## Required Reading (every task)

Read these **before writing any code**, regardless of what you are working on:

| Doc | Path | Why |
|-----|------|-----|
| Development Guidelines | `src/guidelines/Guidelines.md` | Canonical folder structure, styling rules, component placement, naming intent, implementation checklist |
| Architecture | `src/ARCHITECTURE.md` | Composition flow, state ownership, hook responsibilities, where to add new UI |
| Design System Tokens | `.cursor/rules/design-system.mdc` | Color (`--ds-*`), typography, and weight tokens — **never hard-code values unless explicitly asked to do so** |

These three files are the source of truth for how code is organized, styled, and composed. Skipping them causes the most common issues: wrong folder placement, hardcoded colors, alias misuse, and broken imports.

---

## Conditional Reading (by task type)

Consult these based on what the task involves:

### Working on a specific level type

Read `src/guidelines/level-types/README.md` first (shared assumptions, route map), then the specific level-type doc:

| Level type | Doc path |
|------------|----------|
| Web Lab 2 (IDE) | `src/guidelines/level-types/weblab2.md` |
| Python Lab (IDE) | `src/guidelines/level-types/pythonlab.md` |
| Multi-choice | `src/guidelines/level-types/multi-choice.md` |
| Free response | `src/guidelines/level-types/free-response.md` |
| Match | `src/guidelines/level-types/match.md` |
| Levelgroup | `src/guidelines/level-types/levelgroup.md` |
| Bubble choice | `src/guidelines/level-types/bubble-choice.md` |

These docs define routes, key files, data shapes, UX behavior, and known gaps for each type.

### Working on teacher answer / reveal behavior

Read `src/guidelines/level-types/teacher-answer-key.md` — defines the inline reveal pattern used across assessment types and the historical collapsible-card reference.

### Refactoring or moving files

Read `src/REFACTORING_SUMMARY.md` — documents what changed in the last reorg, the canonical directory-intent map, and follow-up hygiene rules.

---

## Quick Placement Guide

| I need to… | Put it in… |
|------------|-----------|
| Add a reusable button/input/tooltip | `src/components/ui` |
| Add an icon component | `src/components/ui/icons` |
| Add a header/nav piece | `src/components/ui/header` |
| Add a sidebar tab or panel view | `src/components/lab2/resource-panel/views` |
| Add shared code-editor features | `src/components/ide/shared` |
| Add Web Lab workspace chrome | `src/components/ide/weblab2/views` |
| Add Python Lab workspace chrome | `src/components/ide/pythonlab/views` |
| Add a new assessment type | `src/components/assessment/<type>/views` |
| Add cross-cutting behavior | Hook in `src/hooks` + contract in `src/types` |
| Add mock data for a level type | `src/data/<domain>/` |
| Add a new page/route | `src/pages/` |

---

## Styling Rules (summary)

- **SCSS modules** for all new component styling (`Component.module.scss` colocated with `Component.tsx`).
- **Use `--ds-*` tokens** directly — never mapped aliases (`--foreground`, `--background`, etc.) in component styles.
- **No hardcoded hex** — find the matching `--ds-*` token.
- **Typography tokens** for font size, weight, and family — never raw `px` or font names.
- Tailwind exists for base/theme plumbing only; do not add new utility-class-heavy markup.

---

## Verification

Always run before considering work complete:

```bash
npm run typecheck
npm run build
```
