# Web Lab 2

## Purpose

Baseline coding-lab environment in this prototype. Serves as the richest existing Lab2 implementation and reference for shared-shell behavior.

## Route

- `/levels/weblab2`

## Key Files

- `src/pages/WebLab2LevelPage.tsx`
- `src/components/ide/weblab2/views/Workspace.tsx`
- `src/lib/tutor/tutorClient.ts`
- `src/guidelines/tutor-harness.md`
- `src/hooks/useFileWorkspaceState.ts`
- `src/data/weblab2/mockData.ts`

## Current UX Behavior

- File manager + editor + preview workspace
- Tabbed resource panel integration (AI Tutor, Version History; optional tabs supported)
- Functional AI Tutor prototype can respond with validated project edit proposals when a session API key is present
- AI-generated changes enter proposal state with file styling, diffs, preview updates, and accept/reject controls
- Save/restore version feedback
- Create-file modal flow

## Current Data Shape

- Uses starter file trees and local version state from `src/data/weblab2` and `useFileWorkspaceState`.
- Functional Tutor settings, API key, and custom prompt addendum are session-scoped.
- No server-backed persistence in this prototype.

## Known Gaps

- No real project storage or execution backend.
- Tutor provider calls are browser-side prototype calls using the user's session API key.
- Top-level metadata is still mocked per route.
