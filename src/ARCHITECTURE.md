# Web Lab 2 Architecture

## Overview

The app is organized around a thin `App.tsx` orchestrator that composes major UI regions and delegates behavior to focused hooks and feature components.

## Current High-Level Structure

```text
src/
├── App.tsx
├── data/
│   └── weblab2/
│       └── mockData.ts
├── hooks/
│   ├── useChatState.ts
│   ├── useFileWorkspaceState.ts
│   ├── useLayoutState.ts
│   └── useVersionHistoryState.ts
├── components/
│   ├── weblab2/
│   │   └── views/
│   │       ├── Workspace.tsx
│   │       ├── CodeEditor.tsx
│   │       ├── FileManager.tsx
│   │       ├── PreviewPanel.tsx
│   │       ├── CreateFileModal.tsx
│   │       ├── ResizableHandle.tsx
│   │       ├── EmptyState.tsx
│   │       ├── VersionBanner.tsx
│   │       ├── SavedTag.tsx
│   │       ├── SegmentedControl.tsx
│   │       ├── FileContextMenu.tsx
│   │       └── FileManagerDropdown.tsx
│   ├── resource-panel/
│   │   ├── Sidebar.tsx
│   │   ├── ContinueButton.tsx
│   │   ├── InstructionsDrawer.tsx
│   │   ├── ActionRow.tsx
│   │   └── views/
│   │       ├── InstructionsPanel.tsx
│   │       ├── ValidationPanel.tsx
│   │       ├── AiTutorPanel.tsx
│   │       ├── VersionHistory.tsx
│   │       ├── TeacherResourcesPanel.tsx
│   │       └── SettingsPanel.tsx
│   ├── ui/
│   │   ├── AppButton.tsx
│   │   ├── Tooltip.tsx
│   │   ├── SuccessAlert.tsx
│   │   └── header/
│   │       ├── TopNavigation.tsx
│   │       └── LevelProgressBubbles.tsx
│   └── icons/
│       ├── AiTutorIcon.tsx
│       └── Logo.tsx
└── types/
```

## Composition Flow

`App.tsx` composes:

1. `TopNavigation` from `components/ui/header`
2. `Sidebar` from `components/resource-panel`
3. `Workspace` and `CreateFileModal` from `components/weblab2/views`

This keeps feature rendering close to feature folders while the hooks layer keeps cross-cutting state logic isolated.

## State Ownership

`App.tsx` gets state and handlers from dedicated hooks:

- `useLayoutState` for tab/layout/sidebar width
- `useFileWorkspaceState` for selected/open files and file view behavior
- `useChatState` for tutor messages/input
- `useVersionHistoryState` for version selection/save/restore feedback

## Migration Notes

- Legacy panel paths under `components/panels` are replaced by `components/resource-panel/views`.
- Header components moved to `components/ui/header`.
- Shared atoms moved to `components/ui`.
- AI tutor icon moved to `components/icons`.
- Deprecated UI pieces (`SaveVersionPopover`, `VersionTag`, `TertiaryIconButton`) are removed.

## Adding New UI

- Add workspace/editor-related views under `components/weblab2/views`.
- Add sidebar tabs/panel content under `components/resource-panel` and `components/resource-panel/views`.
- Add reusable primitives under `components/ui`.
- Add icon-only assets under `components/icons`.

## Verification Checklist

- `npm run typecheck`
- `npm run build`
- Confirm `App.tsx` imports only from current folders above.
