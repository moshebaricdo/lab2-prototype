# Web Lab 2

## Purpose

Baseline coding-lab environment in this prototype. Serves as the richest existing Lab2 implementation and reference for shared-shell behavior.

## Routes

- `/levels/weblab2-demo-project`
- `/levels/weblab2-demo-project-blank`
- `/levels/weblab2-tutor-action-card`

## Key Files

- `src/pages/weblab2/WebLab2LevelPage.tsx`
- `src/pages/weblab2/WebLab2DemoProjectLevelPage.tsx`
- `src/pages/weblab2/WebLab2BlankDemoProjectLevelPage.tsx`
- `src/pages/weblab2/WebLab2TutorActionCardLevelPage.tsx`
- `src/components/ide/weblab2/views/Workspace.tsx`
- `src/components/ide/weblab2/views/NewProjectEmptyState.tsx`
- `src/components/ide/weblab2/views/preview-panel/PreviewDebugPanel.tsx`
- `src/lib/tutor/tutorClient.ts`
- `src/guidelines/tutor-harness.md`
- `src/hooks/useFileWorkspaceState.ts`
- `src/data/weblab2`
- `src/assets/empty-states`

## Current UX Behavior

- File manager + editor + preview workspace
- Tabbed resource panel integration (AI Tutor, Version History; optional tabs supported)
- Resources tab support with placeholder cards for student lesson resources, lab documentation, and restartable walkthroughs; Web Lab 2 dev controls can toggle each card independently.
- Functional AI Tutor prototype can respond with no-edit guidance, Markdown planning proposals, or validated project edit proposals when a session API key is present
- AI Tutor composer defaults to hidden Auto routing. A dev-controlled Auto/Build/Plan/Help mode selector can be shown for testing; Auto infers from the latest request, while Build, Plan, and Help manually force code generation, planning, or guidance routing.
- AI-generated changes enter proposal state with file styling, diffs, preview updates, and accept/reject controls
- The Tutor composer disables sending while an AI proposal is pending, requiring the student to accept or reject before asking for more changes.
- Empty/rootless projects render the workspace-level `NewProjectEmptyState` flow on the secondary surface instead of selecting a workspace view. For functional version history, this only applies before the project has ever had files; after files have existed, deleting everything or restoring the initial version shows the ordinary empty workspace so saved versions remain reachable. The workspace view switcher is hidden until files exist.
- Empty projects expose manual starts (create file or upload starter files) and AI Tutor starts (plan first or build a starter). The plan-first start opens the AI Tutor tab and shows a two-question inline questionnaire one question at a time, asking what the app is/does and then what it should look and feel like with style choices plus custom text. While the questionnaire is pending, the composer is disabled so the card owns input. Submitting it leaves the answered state in the card and sends an enriched Plan-mode request so the first generated plan includes the student's project idea. If the student switches from the pending plan questionnaire to the starter-build start, the questionnaire chat is cleared. The starter-build start then opens AI Tutor, pre-fills the build prompt, leaves routing in Auto, and focuses the composer after the panel finishes sliding open.
- Planning mode creates or revises `Plans/PROJECT_PLAN.md` and keeps the workspace in code view so the student can review the spec. `Plans/` is reserved for plan Markdown files and is never treated as the project root for generated app files. Plan Markdown uses a readable project title as the top-level heading with status underneath, renders with top/bottom edge fades, and stays in planning when the student answers Tutor follow-up questions until they explicitly ask to build. The file manager renders plan files in a separate Plans section rather than the normal tree, using a custom outlined circle for unbuilt plans and a circle-check icon for accepted built plans; the plus menu's New Plan action is the manual way to create plan files, while normal `.md` files created through New File stay with project files. Plan files show a rendered Markdown view by default, with an Edit/Done source toggle and Build plan action in a secondary editor toolbar only while the plan is actually open; closing all visible editor tabs shows the ordinary editor empty state even when a plan exists. Build is disabled while a proposal is pending; building from that action switches to preview once runnable files are proposed, but completed plan UI only appears after the proposal is accepted. First code generation from an empty or plan-only project opens the preview view and expands the file manager so proposed runnable files are visible.
- Preview mode includes a debug panel toggle in the URL bar controls, disabled when the preview is empty. The resizable debug panel renders full-width across the workspace even in split view or after switching back to code view, while capture remains tied to the preview session. It captures console output plus `fetch`/`XMLHttpRequest` activity from file previews, with Console and Network tabs; the Network tab selects the latest request by default, shows request/response metadata for the selected call, and can block network activity for debugging.
- The resource panel animates width on collapse/expand. Its contents keep their expanded width inside a clipped shell so the panel behaves like a drawer rather than reflowing during the transition.
- Save/restore version feedback; brand-new empty projects show a Version History empty state until files are created or added.
- Create-file modal flow

## Current Data Shape

- Uses starter file trees and local version state from `src/data/weblab2` and `useFileWorkspaceState`.
- Web Lab 2 supports rootless file trees (`[]` or top-level files) as well as single-folder project wrappers. `useFileWorkspaceState` only treats a folder as the project root wrapper when it is the only top-level item.
- Functional Tutor settings, API key, and custom prompt addendum are session-scoped.
- No server-backed persistence in this prototype.

## Known Gaps

- No real project storage or execution backend.
- Tutor provider calls are browser-side prototype calls using the user's session API key.
- Top-level metadata is still mocked per route.
