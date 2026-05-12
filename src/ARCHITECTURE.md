# Lab2 Prototype Architecture

## Overview

The app is organized around a thin `App.tsx` router. Route pages compose the Lab2 shell, resource panel, and level-specific workspace while delegating reusable behavior to focused hooks and feature components.

## Current High-Level Structure

```text
src/
├── App.tsx
├── data/
│   ├── assessment/                 # Assessment fixtures by level type
│   ├── weblab2/
│   │   ├── index.ts
│   │   └── projects/
│   └── pythonlab/
│       ├── index.ts
│       └── projects/
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
│   │   ├── AppTextField.tsx
│   │   ├── AppSlider.tsx
│   │   ├── AppCheckbox.tsx
│   │   ├── AppRadio.tsx
│   │   ├── AppDropdown.tsx
│   │   ├── Tooltip.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── Dialog.tsx
│   │   ├── Modal.tsx
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
│   │   │   ├── CreateFileModal.tsx
│   │   │   ├── VersionBanner.tsx
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
│   │   ├── pythonlab/
│   │   │   ├── runtime/
│   │   │   │   └── pythonRunner.ts
│   │   │   └── views/
│   │   │       └── PythonWorkspace.tsx
│   │   └── aichatlab/views/
│   │       ├── AiChatLabWorkspace.tsx
│   │       ├── AiChatLabConfigPanel.tsx
│   │       ├── AiChatLabModelCardPanel.tsx
│   │       ├── AiChatLabChatPanel.tsx
│   │       └── aiChatLabModel.ts
│   └── assessment/                 # Assessment level types
│       ├── shared/
│       ├── bubble-choice/
│       ├── free-response/
│       ├── levelgroup/
│       ├── match/
│       └── multi/
├── pages/                          # Route-level entry points grouped by level type
│   ├── aichatlab/
│   ├── bubble-choice/
│   ├── free-response/
│   ├── levelgroup/
│   ├── match/
│   ├── multi-choice/
│   ├── progression/
│   ├── pythonlab/
│   └── weblab2/
├── assets/
│   └── empty-states/                # Empty-state illustrations used by shared IDE surfaces
├── utils/
│   └── fileTree.ts                  # Shared file-tree lookup/mapping helpers
└── types/
```

## Composition Flow

`App.tsx` composes route-level pages. Each page generally composes:

1. `TopNavigation` from `components/ui/header`
2. `Lab2Shell` from `components/lab2`
3. `Sidebar` from `components/lab2/resource-panel`
4. A level-specific workspace, such as `components/ide/weblab2/views/Workspace`, `components/ide/pythonlab/views/PythonWorkspace`, `components/ide/aichatlab/views/AiChatLabWorkspace`, or an assessment workspace under `components/assessment/<type>/views`

This keeps feature rendering close to feature folders while the hooks layer keeps cross-cutting state logic isolated.

## State Ownership

Route pages get state and handlers from dedicated hooks:

- `useLayoutState` for tab/layout/sidebar width
- `useFileWorkspaceState` for selected/open files and file view behavior
- `useChatState` for Tutor messages/input where the sidebar Tutor is visible
- `useVersionHistoryState` for version selection/save/restore feedback

`useFileWorkspaceState` accepts both single-folder project wrappers and rootless file trees. Rootless trees are used by blank Web Lab projects; new files, folders, and AI proposal additions are inserted at the top level until the user creates their own folders.

Python Lab also uses `useFileWorkspaceState`, with route-scoped session storage for file edits and created files. Its blank standalone route starts from a rootless empty tree while the guided route seeds `main.py` and `README.md` from `src/data/pythonlab/projects/default`. Python Lab now also uses `useVersionHistoryState` with route-scoped snapshot storage; selecting a saved snapshot maps the open/selected files onto the historical file tree and renders the editor read-only until the student returns to Current Version.

The shared resource panel supports a standalone Instructions tab, a Resources tab for contextual student-facing materials, and optional floating card chrome via `surfaceVariant: "card"`. Resources currently render non-functional cards for associated lesson resources, lab documentation, and available walkthroughs based on booleans passed by the level page. Python Lab also enables the Validation tab, which receives the current editable file tree and deterministic test definitions from page/dev-panel configuration.

Python code execution is isolated behind `components/ide/pythonlab/runtime/pythonRunner.ts`, which starts a Pyodide web worker, streams stdout/stderr back to `PythonWorkspace`, and blocks on interactive stdin through a shared buffer while the console shows a terminal-style input row.

## Tutor Harness

Functional AI Tutor behavior is isolated under `src/lib/tutor`. `WebLab2LevelPage.tsx` calls `tutorClient()` and receives a stable `{ message, saveTitle?, changes }` result used by the existing AI proposal state and AI version-history saves. `PythonLabLevelPage.tsx` calls `pythonTutorClient()`, a guidance-only entry point that can read Python project files and always returns `changes: []`.

The harness first resolves requests as guidance, planning, or edit. The composer defaults to hidden Auto mode, where the harness infers the route; a dev-controlled selector can expose Build, Plan, and Help overrides. Guidance covers no-edit learning, how-to, and project-navigation questions. Planning creates or revises a Markdown `Plans/PROJECT_PLAN.md` spec before code generation. Edit requests use a staged structured-edit path that analyzes and packs project context, applies atomic HTML/CSS/JS edits to a scratch workspace, validates the result, and runs compact repair passes. A bounded tool-loop runner remains as a fallback for edit requests. See `src/guidelines/tutor-harness.md` for the full request flow and safety model.

Python Lab intentionally bypasses planning/edit/tool-loop routing. Its AI Tutor panel hides the Build/Plan mode selector and proposal actions, while still passing the current editable file tree into the shared context packer. The packer includes Python-specific project metadata such as imports, functions, and classes so debugging answers can refer to concrete files and symbols.

Web Lab 2 adds UI behavior around the harness result: if functional Tutor returns code changes for an empty project, the page applies the proposal, expands the file manager, and switches to preview mode so the generated project is immediately visible. If the only change is `Plans/PROJECT_PLAN.md`, the page opens the plan in code view instead of switching to preview. Accepted plan files show a Build plan action in the editor chrome; building from that action switches to preview when code changes are proposed. The Tutor composer is disabled while an AI proposal is pending so the student must accept or reject first.

Preview-specific diagnostics live inside `components/ide/weblab2/views/preview-panel`, with transient debug state owned by `Workspace` so the panel can span the full workspace below code/preview/split surfaces. File previews inject a small runtime into the generated `srcDoc` to relay console output and `fetch`/`XMLHttpRequest` activity back to the workspace-level debug panel, including panel height and the network-block toggle.

## Empty States

Shared IDE empty-state rendering lives in `src/components/ide/shared/EmptyState.tsx`. It supports the legacy generated illustration, preview illustration, and caller-provided image assets, and switches to a compact horizontal layout when its container height is constrained. Web Lab 2 uses `src/components/ide/weblab2/views/NewProjectEmptyState.tsx` for the workspace-level new-project flow when a functional-history project has never had files; this hides the workspace view switcher and avoids selecting code/preview/split until files exist. Once files have existed, deleting everything or restoring the initial version falls back to the normal empty workspace so prior versions remain reachable. The ordinary editor-level "No files open" state still appears when a non-empty project has no open tabs.

## AI Chat Lab

AI Chat Lab lives under `components/ide/aichatlab/views` because the chat stream, model-configuration column, and published model-card column are lab-specific workspace chrome, not the shared Tutor. `AiChatLabWorkspace.tsx` owns state orchestration while local panel components render config, chat, and published model-card surfaces. Its pages hide the AI Tutor resource-panel tab, render instructions through the shared standalone Instructions tab, and use URL-backed dev controls to toggle the config column, config tabs, individual controls, resource-panel tabs, model selector, Continue button placement, and floating card mode. Floating card sidebars are non-resizable but can collapse to a narrow card rail. When a model card is published, the page hides the resource panel and switches the workspace into a share-style two-column model-card/chat layout.

Model configuration controls use shared UI primitives where possible. The temperature control uses `components/ui/AppSlider.tsx`, the design-system slider primitive that supports range/centered layouts, control buttons, stepper notches, top-row value display, and design-token tones. Prototype defaults, sample rubric data, and AI Chat Lab dev-panel fields live in `pages/aichatlab/aiChatLabPageConfig.ts`; no separate `data/aichatlab` fixture directory exists yet.

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
