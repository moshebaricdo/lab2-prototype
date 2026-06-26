# Level Types Overview

This folder captures an implementation-focused snapshot of each level type currently represented in this Lab2 prototype suite.

Use these docs as handoff context for follow-up threads.

## Included Level Types

- [Web Lab 2](./weblab2.md)
- [Web Lab 2 — specialist agents](./weblab2-agents.md) (optional `agentConfig` on Web Lab 2 levels)
- [Python Lab](./pythonlab.md)
- [Sketch Lab](./sketchlab.md)
- [AI Chat Lab](./aichatlab.md)
- [Multi-choice](./multi-choice.md)
- [Free response](./free-response.md)
- [Match](./match.md)
- [Drag and drop](./drag-drop.md)
- [Fill in the blank](./fill-in-blank.md)
- [Levelgroup](./levelgroup.md)
- [Assessment builder](./assessment-builder.md)
- Assessment product specs (repo root): [Question types & fields](../../../docs/question-types-and-fields.md), [Assessment config & modes](../../../docs/assessment-config-and-modes.md)
- [Bubble choice](./bubble-choice.md)
- [Teacher Answer Key Pattern](./teacher-answer-key.md)

## Shared Assumptions

- Level pages generally render inside the Lab2 shell (`TopNavigation` + resource panel + main surface), but the main surface is not always resizable. AI Chat Lab card surfaces intentionally disable sidebar resizing while floating.
- Assessment-focused levels currently run with AI Tutor visible and Version History hidden.
- AI Chat Lab hides AI Tutor because its primary workspace is the AI chat stream.
- Python Lab keeps the sidebar Tutor guidance-only; Web Lab 2 owns the full functional Tutor edit/planning flow.
- Web Lab 2's functional Tutor harness is documented in `../tutor-harness.md`.
- All assessment flows are prototype-level and local-only (no backend submission yet).
- Where teacher answers appear in this prototype, they use **inline reveal** from the assessment footer (see [multi-choice](./multi-choice.md) and [free response](./free-response.md)), not a separate collapsible card below the workspace. See [teacher answer key](./teacher-answer-key.md) for the legacy card pattern as reference only.

## Routes Snapshot

- `/levels` -> categorized level index
- `/levels/pythonlab` and `/levels/pythonlab-blank`
- `/levels/sketchlab` and `/levels/sketchlab-blank`
- `/levels/aichatlab`, `/levels/aichatlab-setup`, and `/levels/aichatlab-model-card`
- Web Lab 2 core templates: `/levels/weblab2-level`, `/levels/weblab2-demo-project`, and `/levels/weblab2-demo-project-blank`; Web Lab 2 experiments (`/levels/weblab2-tutor-action-card`, `/levels/weblab2-validation-test`, `/levels/weblab2-drawer-improvements`, `/levels/weblab2-drawer-instructions-tab`, `/levels/weblab2-drawer-notification-halo`) and progressions are listed under Sample Progressions on `/levels`
- Web Lab 2 progression routes: Upload Mechanisms under `/levels/progression-upload-mechanisms-*`, Backpack Filtering under `/levels/progression-backpack-filter-*`, and the validation progression under `/levels/progression-weblab2-validation-*` (including Feature Roulette AIF as the fifth level — see `weblab2.md`)
- Web Lab 2 agent sample progression: `/levels/agentic-crew` through `/levels/agentic-standalone`, plus `/levels/agentic-mission` (see `weblab2-agents.md`)
- `/levels/multi` (and other multi-choice demo routes — see `multi-choice.md`)
- `/levels/free-response` (and `/levels/free-response-reveal`, `/levels/free-response-markdown`, `/levels/free-response-upload` — see `free-response.md`)
- `/levels/match-definition-bank`, `/levels/match-connector`, `/levels/match-connector-images`, `/levels/match-connector-code` (see `match.md`)
- `/levels/drag-drop-parsons`, `/levels/drag-drop-categorization`, `/levels/drag-drop-parsons-code-ref` (see `drag-drop.md`)
- `/levels/fill-in-blank`, `/levels/fill-in-blank-multi`, `/levels/fill-in-blank-code-ref` (see `fill-in-blank.md`)
- `/levels/levelgroup-scroll`, `/levels/levelgroup-stepped` (see `levelgroup.md`)
- `/levels/assessment-builder-new` and `/levels/assessment-builder-seeded` (see `assessment-builder.md`)
- `/levels/bubble-choice` and `/levels/bubble-choice-images`
