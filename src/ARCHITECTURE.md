# Web Lab 2 Architecture

## Overview

The app is organized around a thin `App.tsx` orchestrator that composes major UI regions and delegates behavior to focused hooks and feature components.

## Current High-Level Structure

```text
src/
├── App.tsx
├── data/
│   ├── weblab2/
│   │   ├── index.ts
│   │   └── projects/
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
│       ├── projectAnalyzer.ts
│       ├── contextPacker.ts
│       ├── promptBuilder.ts
│       ├── openAiProvider.ts
│       ├── requestIntent.ts
│       ├── guidanceRunner.ts
│       ├── planningRunner.ts
│       ├── editSessionRunner.ts
│       ├── atomicEditApplicator.ts
│       ├── webProjectValidator.ts
│       ├── editValidator.ts
│       ├── toolLoopRunner.ts
│       ├── fallbackTutor.ts
│       ├── saveTitle.ts
│       └── types.ts
├── components/
│   ├── ui/                         # Universal primitives
│   │   ├── AppButton.tsx
│   │   ├── Tooltip.tsx
│   │   ├── AlertBanner.tsx
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
│   │   │       ├── ResourcesPanel.tsx
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
│   │   │   ├── WorkspaceHeader.tsx
│   │   │   ├── NewProjectEmptyState.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── CreateFileModal.tsx
│   │   │   ├── VersionBanner.tsx
│   │   │   └── SegmentedControl.tsx
│   │   └── pythonlab/views/
│   │       └── PythonWorkspace.tsx
│   └── assessment/                 # Assessment level types (unchanged)
│       ├── shared/
│       ├── multi/
│       ├── match/
│       └── ...
├── assets/
│   └── empty-states/                # Empty-state illustrations used by shared IDE surfaces
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

`useFileWorkspaceState` accepts both single-folder project wrappers and rootless file trees. Rootless trees are used by blank Web Lab projects; new files, folders, and AI proposal additions are inserted at the top level until the user creates their own folders.

The shared resource panel supports a Resources tab for contextual student-facing materials. It currently renders non-functional cards for associated lesson resources, lab documentation, and available walkthroughs based on booleans passed by the level page.

## Tutor Harness

Functional AI Tutor behavior is isolated under `src/lib/tutor`. `WebLab2LevelPage.tsx` calls `tutorClient()` and receives a stable `{ message, saveTitle?, changes }` result used by the existing AI proposal state and AI version-history saves.

The harness first resolves requests as guidance, planning, or edit. The composer defaults to hidden Auto mode, where the harness infers the route; a dev-controlled selector can expose Build, Plan, and Help overrides. Guidance covers no-edit learning, how-to, and project-navigation questions. Planning creates or revises a Markdown `Plans/PROJECT_PLAN.md` spec before code generation. Edit requests use a staged structured-edit path that analyzes and packs project context, applies atomic HTML/CSS/JS edits to a scratch workspace, validates the result, and runs compact repair passes. A bounded tool-loop runner remains as a fallback for edit requests. See `src/guidelines/tutor-harness.md` for the full request flow and safety model.

Web Lab 2 adds UI behavior around the harness result: if functional Tutor returns code changes for an empty project, the page applies the proposal, expands the file manager, and switches to preview mode so the generated project is immediately visible. If the only change is `Plans/PROJECT_PLAN.md`, the page opens the plan in code view instead of switching to preview. Accepted plan files show a Build plan action in the editor chrome; building from that action switches to preview when code changes are proposed. The Tutor composer is disabled while an AI proposal is pending so the student must accept or reject first.

## Empty States

Shared IDE empty-state rendering lives in `src/components/ide/shared/EmptyState.tsx`. It supports the legacy generated illustration, preview illustration, and caller-provided image assets. Web Lab 2 uses `src/components/ide/weblab2/views/NewProjectEmptyState.tsx` for the workspace-level new-project flow when a functional-history project has never had files; this hides the workspace view switcher and avoids selecting code/preview/split until files exist. Once files have existed, deleting everything or restoring the initial version falls back to the normal empty workspace so prior versions remain reachable. The ordinary editor-level "No files open" state still appears when a non-empty project has no open tabs.

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
