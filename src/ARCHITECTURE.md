# Web Lab 2 Architecture

## Overview

The app is organized around a thin `App.tsx` orchestrator that composes major UI regions and delegates behavior to focused hooks and feature components.

## Current High-Level Structure

```text
src/
├── App.tsx
├── data/
│   ├── weblab2/
│   │   └── mockData.ts
│   └── pythonlab/
│       └── mockData.ts
├── hooks/
│   ├── useChatState.ts
│   ├── useFileWorkspaceState.ts
│   ├── useLayoutState.ts
│   └── useVersionHistoryState.ts
├── lib/
│   └── tutor/                      # Functional Tutor harness
│       ├── tutorClient.ts
│       ├── contextBuilder.ts
│       ├── promptBuilder.ts
│       ├── openAiProvider.ts
│       ├── editValidator.ts
│       ├── repairRunner.ts
│       ├── fallbackTutor.ts
│       └── types.ts
├── components/
│   ├── ui/                         # Universal primitives
│   │   ├── AppButton.tsx
│   │   ├── Tooltip.tsx
│   │   ├── SuccessAlert.tsx
│   │   ├── PanelHeader.tsx
│   │   ├── ResizableHandle.tsx
│   │   ├── header/
│   │   │   ├── TopNavigation.tsx
│   │   │   └── LevelProgressBubbles.tsx
│   │   └── icons/
│   │       ├── FaIcon.tsx
│   │       ├── AiTutorIcon.tsx
│   │       └── Logo.tsx
│   ├── lab2/                       # Lab2 frame — shared by ALL level types
│   │   ├── Lab2Shell.tsx
│   │   ├── resource-panel/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ContinueButton.tsx
│   │   │   ├── InstructionsDrawer.tsx
│   │   │   └── views/
│   │   │       ├── InstructionsPanel.tsx
│   │   │       ├── ValidationPanel.tsx
│   │   │       ├── ai-tutor/
│   │   │       │   ├── AiTutorPanel.tsx
│   │   │       │   ├── AiTutorComposer.tsx
│   │   │       │   └── AiTutorMessageList.tsx
│   │   │       ├── VersionHistory.tsx
│   │   │       ├── TeacherResourcesPanel.tsx
│   │   │       └── SettingsPanel.tsx
│   │   └── dev/
│   │       ├── AnnotationOverlay.tsx
│   │       ├── DevPanel.tsx
│   │       └── DevPanelFields.tsx
│   ├── ide/                        # IDE lab environments
│   │   ├── shared/                 # Shared between IDE labs
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── FileManager.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FileContextMenu.tsx
│   │   │   └── FileManagerDropdown.tsx
│   │   ├── weblab2/views/
│   │   │   ├── Workspace.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── CreateFileModal.tsx
│   │   │   ├── VersionBanner.tsx
│   │   │   ├── SavedTag.tsx
│   │   │   └── SegmentedControl.tsx
│   │   └── pythonlab/views/
│   │       └── PythonWorkspace.tsx
│   └── assessment/                 # Assessment level types (unchanged)
│       ├── shared/
│       ├── multi/
│       ├── match/
│       └── ...
└── types/
```

## Composition Flow

`App.tsx` composes:

1. `TopNavigation` from `components/ui/header`
2. `Sidebar` from `components/lab2/resource-panel`
3. `Workspace` and `CreateFileModal` from `components/ide/weblab2/views`

This keeps feature rendering close to feature folders while the hooks layer keeps cross-cutting state logic isolated.

## State Ownership

`App.tsx` gets state and handlers from dedicated hooks:

- `useLayoutState` for tab/layout/sidebar width
- `useFileWorkspaceState` for selected/open files and file view behavior
- `useChatState` for tutor messages/input
- `useVersionHistoryState` for version selection/save/restore feedback

## Tutor Harness

Functional AI Tutor behavior is isolated under `src/lib/tutor`. `WebLab2LevelPage.tsx` calls `tutorClient()` and receives a stable `{ message, changes }` result used by the existing AI proposal state.

The harness separates context building, prompt composition, provider transport, scratch workspace editing, whole-project validation, tool-loop retry, and fallback responses so each can be tuned independently. See `src/guidelines/tutor-harness.md` for the full request flow and safety model.

## Migration Notes

- Legacy panel paths under `components/panels` are replaced by `components/lab2/resource-panel/views`.
- Header components moved to `components/ui/header`.
- Shared atoms moved to `components/ui`.
- Icon components moved to `components/ui/icons`.
- Dev tools (annotation overlay, dev panel) moved to `components/lab2/dev`.
- Deprecated UI pieces (`SaveVersionPopover`, `VersionTag`, `TertiaryIconButton`) are removed.

## Adding New UI

- Add shared code-editor features (file tree, tabs, syntax highlighting) under `components/ide/shared`.
- Add lab-specific workspace chrome under `components/ide/<labname>/views`.
- Add sidebar tabs/panel content under `components/lab2/resource-panel/views`.
- Add Tutor provider/prompt/context/validation changes under `lib/tutor`.
- Add reusable primitives under `components/ui`.
- Add icon-only assets under `components/ui/icons`.

## Verification Checklist

- `npm run typecheck`
- `npm run build`
- Confirm `App.tsx` imports only from current folders above.
