# Lab2 UI Prototype

A **Lab2 frame and prototyping environment** for interactive lab and assessment level-type experiments. This repo is meant for exploration of Lab2 UI/UX, lab functionality, AI Tutor behavior, and more.

It is **not** a production platform or tied to the CodeAI repo: there is no backend, no real submission pipeline, and no server-side persistence. Everything runs in the browser with local fixtures and session-scoped state.

---

## What's in the Box

The app opens to a categorized level catalog at **`/levels`**. From there you can open any demo route or locally-saved variants.

### Lab2 Environments

| Lab | What it prototypes | Entry routes |
|-----|-------------------|--------------|
| **Web Lab 2** | Full HTML/CSS/JS IDE with live preview, file manager, version history, functional AI Tutor, and validation review | `/levels/weblab2-level`, `/levels/weblab2-demo-project` |
| **Python Lab** | Python IDE with Pyodide runtime, console I/O, guidance-only Tutor | `/levels/pythonlab` |
| **Sketch Lab** | Whiteboarding/diagramming canvas with shape, text, image, and line nodes, contextual property controls, and image export/backpack save | `/levels/sketchlab`, `/levels/sketchlab-blank` |
| **AI Chat Lab** | Model configuration, chat stream, and published model-card layouts (no Tutor support yet) | `/levels/aichatlab` |

### Web Lab 2 Agentic AI

Optional specialist-agent levels run on top of the same Web Lab 2 Tutor harness with scoped agents, roster UI, hand-off cards, and saved custom agents in Backpack.

**Entry routes:** `/levels/agentic-crew` through `/levels/agentic-standalone`, plus `/levels/agentic-mission`

### Assessment Level-types

Local-only assessment UIs with mocked submit feedback and inline teacher-answer reveal:

- **Multi-choice** — `/levels/multi` (+ authoring, code-ref, and all-that-apply variants)
- **Free response** — `/levels/free-response` (+ reveal, markdown, upload, code-ref variants)
- **Match** — definition bank, connector, and swipe-card demos
- **Levelgroup** — scroll, stepped, intro, and demo-quiz compositions
- **Bubble choice** — choose-your-path selector and image-card variants

---

## Key Systems

Three subsystems define what makes this environment more than a UI mockup:

### 1. Lab2 frame (shared shell)

Every level type renders inside the same chrome:

- `TopNavigation` + level progress bubbles
- Resource panel (instructions, Tutor, validation, version history, Backpack, resources, settings)
- Dev panel and annotation overlay for rapid iteration
- Brand theme + light/dark token switching

**Paths:** `src/components/lab2/`, `src/components/ui/`

### 2. Tutor harness (client-side AI)

Powers the AI Tutor panel for Web Lab 2 and Python Lab:

- **Web Lab 2** — guidance, project planning (`Plans/PROJECT_PLAN.md`), structured code edits with accept/reject proposals, tool-loop fallback, instruction delivery, and validation-aware coaching
- **Python Lab** — guidance-only; reads project files but never proposes edits

Web Lab 2 can also mount specialist agents via `agentConfig`; those agents add policy, context, and write-scope constraints without creating a separate chat pipeline.

Orchestration lives in `src/lib/tutor/`. UI wiring starts at `src/components/lab2/resource-panel/views/ai-tutor/`.

**Full spec:** [`src/guidelines/tutor-harness.md`](src/guidelines/tutor-harness.md)

### 3. Validation harness (assessment-owned review)

Web Lab 2 curriculum levels can opt into **Check my work** review:

- Checklist items come from `assessment.md` goals only
- AI evaluation when a Tutor API key is present; deterministic fallback otherwise
- Effort gates, version-history evaluators, and Continue-button gating

**Paths:** `src/lib/validation/`  
**Spec:** [`src/guidelines/validation-harness-spec.md`](src/guidelines/validation-harness-spec.md)

```text
┌─────────────────────────────────────────────────────────┐
│  Lab2 Frame (nav · resource panel · dev tools)          │
├─────────────────────────────────────────────────────────┤
│  Level surface                                          │
│    IDE labs ──► Tutor/agent harness ──► Validation      │
│    Sketch Lab ─► ReactFlow canvas + Backpack images     │
│    Assessment types (local submit · teacher reveal)     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Install and run

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:3000** and redirects `/` → `/levels`.

### Enable live AI Tutor

Most Web Lab 2 and validation demos need a model to show their full behavior:

1. Open any Web Lab 2 or Python Lab level
2. Open **Lab Settings** in the resource panel
3. Paste an OpenAI API key (stored in `sessionStorage` only — never committed)
4. Optionally pick a code-generation model tier

Without a key, Tutor falls back to placeholder copy and local validation summaries. The prototype still runs; you just won't see live model responses.

### First-visit tour

If you're new to the repo, this sequence covers the major surfaces quickly:

1. **`/levels`** — browse the categorized index
2. **`/levels/weblab2-demo-project`** — full IDE + Tutor + version history
3. **`/levels/sketchlab`** — diagram canvas + property panel + Backpack image save
4. **`/levels/agentic-crew`** — Web Lab 2 specialist-agent roster
5. **`/levels/progression-weblab2-validation-fix`** — validation review + Continue gating (add API key)
6. **`/levels/multi`** — assessment multi-choice with local feedback
7. **`/levels/aichatlab-model-card`** — AI Chat Lab model-card layout

### Validate changes

```bash
npm run typecheck
npm run build
```

For Tutor harness work, also run:

```bash
npm run test:tutor
```

Key-gated live eval suites (require a session API key):

```bash
npm run test:tutor:live              # all live eval tests
npm run test:tutor:live:analysis   # instruction guide-shape inference
npm run test:tutor:live:intent       # request intent classifier
npm run test:tutor:live:clarification # edit clarification classifier
npm run test:tutor:live:validation    # validation-review intent classifier
```

---

## Tech Stack

| Layer | Choices |
|-------|---------|
| UI | React 19, React Router 7, SCSS modules |
| Build | Vite 6, TypeScript |
| Editor | CodeMirror 6 (HTML, CSS, JS, Python) |
| Python runtime | Pyodide (web worker; requires COOP/COEP headers — configured in `vite.config.ts`) |
| Markdown | react-markdown + remark-gfm |
| Drag-and-drop | @dnd-kit, react-dnd |
| Diagram canvas | @xyflow/react + html-to-image export |
| Icons | Font Awesome (via `FaIcon`) |
| Styling tokens | Generated CSS variables (`--ds-*`) + `globals.css` typography tokens |
| AI provider | OpenAI (client-side, session key) |

Tailwind exists for base/theme plumbing. **New component styling should use SCSS modules and design tokens**, not utility-class-heavy markup. See [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc).

---

## Repository Map

| Layer | Path | Role |
|-------|------|------|
| Routes | `src/pages/` | One page per demo; grouped by level type |
| Lab2 frame | `src/components/lab2/` | Shell, resource panel, dev tools |
| UI primitives | `src/components/ui/` | Buttons, inputs, header, icons, dialogs |
| IDE — shared | `src/components/ide/shared/` | CodeEditor, FileManager, EmptyState |
| IDE — Web Lab 2 | `src/components/ide/weblab2/` | Preview, uploads, Tutor flow helpers |
| IDE — Python Lab | `src/components/ide/pythonlab/` | Console workspace, Pyodide runtime |
| IDE — Sketch Lab | `src/components/ide/sketchlab/` | ReactFlow canvas, node palette, property panel, image export |
| IDE — AI Chat Lab | `src/components/ide/aichatlab/` | Config, chat, model-card panels |
| Agentic AI | `src/components/agentic/`, `src/data/agentic/` | Optional Web Lab 2 specialist roster, modals, and specialist definitions |
| Assessment | `src/components/assessment/` | Per-type workspace views + shared chrome |
| Data / fixtures | `src/data/` | Project trees, `instructions.md`, `assessment.md`, assessment mocks |
| Backpack | `src/lib/backpack/` | Cross-lab file/image/agent persistence and import helpers |
| Tutor harness | `src/lib/tutor/` | Intent, routing, runners, context, instruction, edit, provider |
| Validation harness | `src/lib/validation/` | Goal evaluators, review rollup, AI review path |
| State hooks | `src/hooks/` | Layout, file workspace, chat, version history, themes, share variants |
| Types | `src/types/` | Shared contracts |
| Styles | `src/styles/` | Tokens, globals, SCSS helpers |
| Guidelines | `src/guidelines/` | Development docs and level-type specs |

**Composition flow:** `App.tsx` routes → page composes `TopNavigation` + `Lab2Shell` + `Sidebar` + level-specific workspace. Reusable state lives in hooks, not in the router.

Details: [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md)

---

## Data Authoring

Demo content is colocated under `src/data/`:

- **Web Lab 2 projects** — `src/data/weblab2/projects/<slug>/` with `index.ts`, `instructions.md`, optional `assessment.md`, and `files/`
- **Python Lab** — `src/data/pythonlab/projects/default/`
- **Sketch Lab** — `src/data/sketchlab/`
- **Agentic Web Lab** — `src/data/agentic/` for specialist definitions and `src/data/weblab2/projects/agentic-portfolio/` for the sample starter project
- **Assessment fixtures** — `src/data/assessment/` (multi, match, free response, levelgroup, bubble choice)
- **Progressions** — `src/data/progression/`

Validation curriculum levels declare Continue requirements in `assessment.md` under `## AI Review Requirements`. Student-facing prose stays in `instructions.md`.

---

## Share Links and Saved Variants

The `/levels` index supports saving **variants** (local snapshots of a level's dev-panel configuration) and generating shareable URLs. Promote-to-code exports variant config as copy-pasteable page boilerplate.

**Paths:** `src/hooks/useSavedVariants.ts`, `src/utils/promoteToCode.ts`, `src/lib/levelShareLinks.ts`

---

## Design Tokens

Design tokens are generated into `src/styles/tokens.css`.

```bash
npm run token:generate
```

The generator resolves token files in this order:

1. `WL2_LIGHT_TOKENS_PATH` / `WL2_DARK_TOKENS_PATH` environment variables
2. `tokens/semantic/light.tokens.json` and `tokens/semantic/dark.tokens.json`
3. Legacy desktop export paths used during migration

If semantic token source files are unavailable, the generator falls back to the existing generated `src/styles/tokens.css` for the base Code.org light/dark maps. Brand theme layers such as CodeAI are generated by `scripts/generate-tokens.mjs` and appended to `tokens.css`. Brand-specific typography tokens are defined in `src/styles/globals.css`.

**Rule of thumb:** use `--ds-*` tokens directly in component styles; never hard-code hex values. See [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc).

Other generators:

```bash
npm run generate:fa-codepoints   # Font Awesome codepoint map for FaIcon
```

---

## Deployment

Production builds output to `build/`.

```bash
npm run build
npm run deploy    # manual gh-pages deploy
```

Pushes to `main` or `master` also trigger [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), which builds and deploys to GitHub Pages automatically.

---

## Prototype Constraints

Keep these in mind when evaluating behavior or planning integrations:

| Constraint | Detail |
|------------|--------|
| **No backend** | Assessment submit, auth, and persistence are mocked or client-only |
| **Session storage** | Accepted workspace, chat history, version snapshots, and API keys persist in `sessionStorage` per route — a hard refresh keeps work; clearing site data resets it |
| **API keys** | Entered in Lab Settings; never stored in repo or env files for production use |
| **AI proposals** | Pending Tutor edits are ephemeral until accepted; reload marks them rejected |
| **Pyodide** | Python Lab needs cross-origin isolation headers (set in Vite dev/preview config) |
| **Sketch export** | Sketch Lab exports images client-side; Backpack saves downscaled JPGs to fit localStorage quota |
| **Agentic levels** | Specialist agents scope the existing Tutor harness; they are prototype tools, not separate assistants or backends |
| **Out of repo** | The `presentation/` folder is a standalone static deck, separate from the Vite app |

---

## Where to Put New Work

| I need to… | Put it in… |
|------------|------------|
| Add a reusable button, input, or tooltip | `src/components/ui/` |
| Add an icon | `src/components/ui/icons/` |
| Add a sidebar tab or panel view | `src/components/lab2/resource-panel/views/` |
| Add shared editor features | `src/components/ide/shared/` |
| Add Web Lab workspace chrome | `src/components/ide/weblab2/views/` |
| Add Python Lab workspace chrome | `src/components/ide/pythonlab/views/` |
| Add Sketch Lab canvas chrome | `src/components/ide/sketchlab/views/` |
| Add AI Chat Lab workspace chrome | `src/components/ide/aichatlab/views/` |
| Add or tune Web Lab 2 specialist agents | `src/data/agentic/`, `src/components/agentic/`, `src/lib/tutor/agents/` |
| Add an assessment type | `src/components/assessment/<type>/views/` |
| Add a new page / route | `src/pages/<level-type>/` + route in `App.tsx` |
| Add mock data | `src/data/<domain>/` |
| Add cross-cutting behavior | Hook in `src/hooks/` + contract in `src/types/` |
| Tune Tutor AI behavior | `src/lib/tutor/` + [`tutor-harness.md`](src/guidelines/tutor-harness.md) |
| Tune validation review | `src/lib/validation/` + [`validation-harness-spec.md`](src/guidelines/validation-harness-spec.md) |

Full placement rules and styling standards: [`src/guidelines/Guidelines.md`](src/guidelines/Guidelines.md)

---

## Documentation Index

### Start here

| Doc | Purpose |
|-----|---------|
| [`src/guidelines/Guidelines.md`](src/guidelines/Guidelines.md) | Canonical folder structure, styling rules, implementation checklist |
| [`src/ARCHITECTURE.md`](src/ARCHITECTURE.md) | Composition flow, state ownership, hook responsibilities |

### AI systems

| Doc | Purpose |
|-----|---------|
| [`src/guidelines/tutor-harness.md`](src/guidelines/tutor-harness.md) | Tutor request flow, runners, context, instruction delivery, safety model |
| [`src/guidelines/validation-harness-spec.md`](src/guidelines/validation-harness-spec.md) | Validation checklist invariants and evaluator routing |

### Level types

| Doc | Level type |
|-----|------------|
| [`src/guidelines/level-types/README.md`](src/guidelines/level-types/README.md) | Overview + shared assumptions |
| [`src/guidelines/level-types/weblab2.md`](src/guidelines/level-types/weblab2.md) | Web Lab 2 |
| [`src/guidelines/level-types/weblab2-agents.md`](src/guidelines/level-types/weblab2-agents.md) | Web Lab 2 specialist agents |
| [`src/guidelines/level-types/pythonlab.md`](src/guidelines/level-types/pythonlab.md) | Python Lab |
| [`src/guidelines/level-types/sketchlab.md`](src/guidelines/level-types/sketchlab.md) | Sketch Lab |
| [`src/guidelines/level-types/aichatlab.md`](src/guidelines/level-types/aichatlab.md) | AI Chat Lab |
| [`src/guidelines/level-types/multi-choice.md`](src/guidelines/level-types/multi-choice.md) | Multi-choice |
| [`src/guidelines/level-types/free-response.md`](src/guidelines/level-types/free-response.md) | Free response |
| [`src/guidelines/level-types/match.md`](src/guidelines/level-types/match.md) | Match |
| [`src/guidelines/level-types/levelgroup.md`](src/guidelines/level-types/levelgroup.md) | Levelgroup |
| [`src/guidelines/level-types/bubble-choice.md`](src/guidelines/level-types/bubble-choice.md) | Bubble choice |
| [`src/guidelines/level-types/teacher-answer-key.md`](src/guidelines/level-types/teacher-answer-key.md) | Teacher answer reveal pattern |

### Cursor / agent contributors

| Doc | Purpose |
|-----|---------|
| [`.cursor/rules/AGENTS.mdc`](.cursor/rules/AGENTS.mdc) | Agent playbook — required reading before code changes |
| [`.cursor/rules/design-system.mdc`](.cursor/rules/design-system.mdc) | Token and typography rules |

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build → `build/` |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run test:tutor` | Tutor harness unit tests (Vitest) |
| `npm run test:tutor:live` | Key-gated live model eval tests |
| `npm run test:tutor:live:clarification` | Key-gated edit clarification classifier evals |
| `npm run test:tutor:live:validation` | Key-gated validation-review intent evals |
| `npm run token:generate` | Regenerate `src/styles/tokens.css` |
| `npm run generate:fa-codepoints` | Regenerate FA icon codepoint map |
| `npm run deploy` | Build and push to `gh-pages` branch |

---

## Extending the Environment

To add a new IDE lab:

1. Create `src/components/ide/<labname>/views/` for workspace chrome
2. Reuse `src/components/ide/shared/` for editor primitives
3. Add `src/pages/<labname>/` route pages and register routes in `App.tsx`
4. Add fixtures under `src/data/<labname>/` if needed
5. Document the level type in `src/guidelines/level-types/<labname>.md`

The Lab2 frame, UI primitives, and hook layer are designed to absorb new level types without restructuring the app.
