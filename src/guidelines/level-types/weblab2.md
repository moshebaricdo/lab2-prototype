# Web Lab 2

## Purpose

Baseline coding-lab environment in this prototype. Serves as the richest existing Lab2 implementation and reference for shared-shell behavior.

## Route

- `/levels/weblab2`

## Key Files

- `src/pages/WebLab2LevelPage.tsx`
- `src/components/weblab2/views/Workspace.tsx`
- `src/hooks/useFileWorkspaceState.ts`
- `src/data/weblab2/mockData.ts`

## Current UX Behavior

- File manager + editor + preview workspace
- Tabbed resource panel integration (AI Tutor, Version History; optional tabs supported)
- Save/restore version feedback
- Create-file modal flow

## Current Data Shape

- Uses mock file tree and mock version labels from `src/data/weblab2`.
- No server-backed persistence in this prototype.

## Known Gaps

- No real project storage or execution backend.
- Top-level metadata is still mocked per route.
