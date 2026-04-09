# Level Types Overview

This folder captures a rough, implementation-focused snapshot of each level type currently represented in this prototype.

Use these docs as handoff context for follow-up threads.

## Included Level Types

- [Web Lab 2](./weblab2.md)
- [Python Lab](./pythonlab.md)
- [Multi-choice](./multi-choice.md)
- [Free response](./free-response.md)
- [Match](./match.md)
- [Levelgroup](./levelgroup.md)
- [Bubble choice](./bubble-choice.md)
- [Teacher Answer Key Pattern](./teacher-answer-key.md)

## Shared Assumptions

- All level types render inside the Lab2 shell (`TopNavigation` + resource panel + resizable main surface).
- Assessment-focused levels currently run with AI Tutor visible and Version History hidden.
- All assessment flows are prototype-level and local-only (no backend submission yet).
- Where teacher answers appear in this prototype, they use **inline reveal** from the assessment footer (see [multi-choice](./multi-choice.md) and [free response](./free-response.md)), not a separate collapsible card below the workspace. See [teacher answer key](./teacher-answer-key.md) for the legacy card pattern as reference only.

## Routes Snapshot

- `/levels` -> categorized level index
- `/levels/pythonlab`
- `/levels/weblab2`
- `/levels/multi` (and other multi-choice demo routes — see `multi-choice.md`)
- `/levels/free-response` (and `/levels/free-response-reveal`, `/levels/free-response-markdown`, `/levels/free-response-upload` — see `free-response.md`)
- `/levels/match-definition-bank`, `/levels/match-connector`, `/levels/match-connector-images`, `/levels/match-connector-code` (see `match.md`)
- `/levels/levelgroup-scroll`, `/levels/levelgroup-stepped` (see `levelgroup.md`)
- `/levels/bubble-choice`
