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
│   └── tutor/                      # Functional Tutor harness (see tutor-harness.md)
│       ├── tutorClient.ts          # Root orchestration entry points
│       ├── types.ts
│       ├── intent/                 # Request classification
│       ├── routing/                # Turn resolution & UI actions
│       ├── runners/                # Guidance, planning, edit, tool-loop
│       ├── context/                # Conversation & project packing
│       ├── instruction/            # Tutor-primary curriculum delivery
│       ├── edit/                   # Proposal application & validation
│       ├── provider/               # OpenAI transport & prompts
│       └── conversation/           # Transcript signals & debug logging
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
- `useChatState` for Tutor messages/input where the sidebar Tutor is visible. Web Lab 2 and Python Lab pass route-scoped session storage keys so chat history survives reload alongside file workspace state.
- `useVersionHistoryState` for version selection/save/restore feedback
- `ThemeProvider` / `useTheme` for brand theme selection and Lab2-scoped light/dark token switching, with current choices persisted in session storage. Brand themes can swap shared chrome assets such as `Logo`, add generated brand-only color token layers in `tokens.css`, and override typography tokens in `globals.css`; light/dark markers are applied by `Lab2Shell` below `TopNavigation` so the header stays brand-stable.

`useFileWorkspaceState` accepts both single-folder project wrappers and rootless file trees. Rootless trees are used by blank Web Lab projects; new files, folders, and AI proposal additions are inserted at the top level until the user creates their own folders.

Python Lab also uses `useFileWorkspaceState`, with route-scoped session storage for file edits and created files. Its blank standalone route starts from a rootless empty tree while the guided route seeds `main.py`, `README.md`, and drawer instructions from `src/data/pythonlab/projects/default`. Python Lab now also uses `useVersionHistoryState` with route-scoped snapshot storage; selecting a saved snapshot maps the open/selected files onto the historical file tree and renders the editor read-only until the student returns to Current Version.

The shared resource panel supports a standalone Instructions tab, a Resources tab for contextual student-facing materials, optional floating card chrome via `surfaceVariant: "card"`, and a compact rail mode via `compact`. Resources currently render non-functional cards for associated lesson resources, lab documentation, and available walkthroughs based on booleans passed by the level page. Python Lab also enables the Validation tab, which receives the current editable file tree and deterministic test definitions from page/dev-panel configuration.

Python code execution is isolated behind `components/ide/pythonlab/runtime/pythonRunner.ts`, which starts a Pyodide web worker, streams stdout/stderr back to `PythonWorkspace`, and blocks on interactive stdin through a shared buffer while the console shows a terminal-style input row.

## Tutor Harness

Functional AI Tutor behavior is isolated under `src/lib/tutor`. `WebLab2LevelPage.tsx` calls `tutorClient()` and receives a stable `{ message, saveTitle?, changes }` result used by the existing AI proposal state and AI version-history saves. `PythonLabLevelPage.tsx` calls `pythonTutorClient()`, a guidance-only entry point that can read Python project files and always returns `changes: []`.

The harness first resolves requests as guidance, planning, or edit. The student composer stays mode-neutral while Web Lab 2 infers the route and applies Build, Plan, and Help capability gates from route props or dev-panel overrides. Each enabled capability can contribute runner-scoped contract text, so Help addenda reach only guidance, Plan addenda reach only planning, and Build addenda reach only edit/tool-loop code generation. Built-in runner style contracts keep Help, Plan, and Build responses short, concrete, and supportive at generation time. Guidance covers no-edit learning, how-to, and project-navigation questions, and Web Lab 2 uses a Socratic, hint-first communication style across policy presets. Curriculum Web Lab requests also include the resolved instructions Markdown as first-class level context so instruction-help answers can reference the actual directions, not just project files. Routes can opt into Tutor-primary instruction delivery, which derives an inspectable linear or choice-based `InstructionGuide` and a deterministic conversational `TutorOpening` from the same Markdown; page-owned guide state and `instructionCoach.ts` produce hidden `instructionFocus` context so typed conversation preserves the intended instructional move before normal help/debug routing, while the static instructions remain available as the authoritative fallback. Direct implementation phrasing in curriculum levels, including "help me make/update/improve..." or instructions that say to ask Tutor to make a change, still routes to the code-generation path when Build is enabled. Planning creates or revises a Markdown `Plans/PROJECT_PLAN.md` spec before code generation. Edit requests use a staged structured-edit path that analyzes and packs project context, applies atomic HTML/CSS/JS edits to a scratch workspace, validates the result, and runs compact repair passes. A bounded tool-loop runner remains as a fallback for edit requests. See `src/guidelines/tutor-harness.md` for the full request flow and safety model.

Python Lab intentionally bypasses planning/edit/tool-loop routing. Its AI Tutor panel hides the Build/Plan mode selector and proposal actions, while still passing the current editable file tree into the shared context packer. The packer includes Python-specific project metadata such as imports, functions, and classes so debugging answers can refer to concrete files and symbols.

Web Lab 2 adds UI behavior around the harness result through lab-specific orchestration helpers under `components/ide/weblab2`: `useWebLab2TutorFlow` owns functional Tutor proposal state, accept/reject messaging, and build-from-plan requests; `useWebLab2Preview` owns preview path selection, file preview configuration, and preview design-edit gating. If functional Tutor returns code changes for an empty project, the flow applies the proposal, expands the file manager, and switches to preview mode so the generated project is immediately visible. If the only change is `Plans/PROJECT_PLAN.md`, it opens the plan in code view instead of switching to preview. Accepted plan files show a Build plan action in the editor chrome; building from that action switches to preview when code changes are proposed. The Tutor composer is disabled while an AI proposal is pending so the student must accept or reject first.

Web Lab 2 validation experiments can opt into a Tutor review card through a route-provided validation review config. Web Lab routes also choose a Tutor support context: standalone project routes allow broader co-building behavior, while curriculum/validation routes keep instruction breakdown, debugging, concept, and idea requests in guidance unless the student explicitly asks for implementation. Curriculum guidance is scoped to the level's instructions, project code, and latest validation progress, avoiding generic browser/cache/devtools troubleshooting and optional stretch-feature nudges. It also uses a light Socratic disclosure policy for help and hint requests so Tutor gives one focused next check without immediately revealing exact project-only selectors or values. Validation review offers now require clear readiness intent, such as asking to check work or continue, saying a fix works, or saying they are done, so ordinary debug asks stay in the Tutor help flow. The Web Lab 2 dev panel can override the route's plain-language review goals with one Validation requirements line per requirement. When a session Tutor API key is present, the review path sends packed project context and those explicit requirements to an AI evaluator that returns non-spoiler statuses; if no key is present or the AI call fails, the card falls back to the local evidence summary. Validation configs can also opt into effort evidence with `effortPolicy: "none" | "advisory" | "required"` and `minimumChangedFiles`; this compares the current project to the starter and should only block completion for open-ended refinement levels that explicitly require student iteration. AI review results are post-processed with the same effort item so starter-perfect projects cannot bypass required iteration evidence. Partial reviews produce a compact progress snapshot so follow-up hints and debug prompts target the next incomplete criterion rather than already-passed checklist items. Validation routes can also make Continue incumbent on a successful review: the Continue button runs a review and shows **Check my work** until the latest review is likely complete, and successful review cards can surface a Continue action in-chat. The validation progression routes demonstrate photo-carousel debugging, style polish, Promise tracing, and loop debugging without adding those demos to the standard Web Lab 2 example list.

Preview-specific diagnostics live inside `components/ide/weblab2/views/preview-panel`, with transient debug state owned by `Workspace` so the panel can span the full workspace below code/preview/split surfaces. Lab-specific helpers in `components/ide/weblab2/webLab2FileTree.ts` and `components/ide/weblab2/webLab2Uploads.ts` handle Web Lab-specific file tree shaping, starter uploads, shareable upload filtering, inline fixture image hydration, and plan-file detection before data reaches the shared workspace. File previews inject a small runtime into the generated `srcDoc` to relay console output and `fetch`/`XMLHttpRequest` activity back to the workspace-level debug panel, including panel height and the network-block toggle.

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
