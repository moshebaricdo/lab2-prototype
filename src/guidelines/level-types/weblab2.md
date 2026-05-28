# Web Lab 2

## Purpose

Baseline coding-lab environment in this prototype. Serves as the richest existing Lab2 implementation and reference for shared-shell behavior.

## Routes

- `/levels/weblab2-demo-project`
- `/levels/weblab2-demo-project-blank`
- `/levels/weblab2-tutor-action-card`
- `/levels/weblab2-validation-test`
- `/levels/progression-upload-mechanisms-staged`
- `/levels/progression-upload-mechanisms-action-card`
- `/levels/progression-upload-mechanisms-file-chip`
- `/levels/progression-weblab2-validation-fix`
- `/levels/progression-weblab2-validation-create`
- `/levels/progression-weblab2-validation-refine`
- `/levels/progression-weblab2-validation-sandbox`

## Key Files

- `src/pages/weblab2/WebLab2LevelPage.tsx`
- `src/pages/weblab2/webLab2DevPanel.ts`
- `src/components/ide/weblab2/useWebLab2TutorFlow.ts`
- `src/components/ide/weblab2/useWebLab2Preview.ts`
- `src/components/ide/weblab2/webLab2FileTree.ts`
- `src/components/ide/weblab2/webLab2Uploads.ts`
- `src/pages/weblab2/WebLab2DemoProjectLevelPage.tsx`
- `src/pages/weblab2/WebLab2BlankDemoProjectLevelPage.tsx`
- `src/pages/weblab2/WebLab2TutorActionCardLevelPage.tsx`
- `src/pages/weblab2/WebLab2UploadMechanismsLevelPage.tsx`
- `src/pages/weblab2/WebLab2ValidationLevel.tsx`
- `src/pages/weblab2/WebLab2ValidationPhotoCarouselLevelPage.tsx`
- `src/pages/weblab2/WebLab2ValidationLoopStylePolishLevelPage.tsx`
- `src/pages/weblab2/WebLab2ValidationPromiseTraceLevelPage.tsx`
- `src/pages/weblab2/WebLab2ValidationStarshipLoaderLevelPage.tsx`
- `src/pages/weblab2/webLab2ValidationProgressionCommon.ts`
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
- Web Lab 2's file manager plus menu supports uploading project files and image assets from the student's computer. Uploaded UI assets are session-scoped; image contents are stored as data URLs in the in-memory/session file tree and are not encoded into share URLs.
- Tutor chat uploads are staged into an `uploads/` project folder as soon as they are attached in the composer; removing the attachment before send deletes the staged file. Tutor then decides from message intent whether to reference those files in code. Staged uploads stay silent: they do not add chat success/failure messages, count as project content for the new-project empty state, switch view mode, expand the file manager, or auto-open in the editor. Once the workspace is visible for real project files, the `uploads/` folder appears in the file manager.
- The Upload Mechanisms progression compares the current functional staged-upload flow with two mock-only alternatives: an in-chat add-files action card and upload file chips with plus buttons. The mock alternatives intentionally do not mutate the project tree.
- Tabbed resource panel integration (AI Tutor, Version History; optional tabs supported)
- Resources tab support with placeholder cards for student lesson resources, lab documentation, and restartable walkthroughs; Web Lab 2 dev controls can toggle each card independently.
- Functional AI Tutor prototype can respond with no-edit guidance, Markdown planning proposals, or validated project edit proposals when a session API key is present. Route-level Tutor proposal orchestration lives in `useWebLab2TutorFlow`, while `WebLab2LevelPage` stays focused on composing the Lab2 shell, resource panel, workspace, and modals. Web Lab 2 routes choose a Tutor support context: standalone project routes allow broader co-building behavior, while curriculum/validation routes keep instruction breakdown, debugging, concept, and idea requests in guidance unless the student explicitly asks for implementation. Direct curriculum implementation requests such as "help me make/update/improve..." route to code generation when the level enables Build, especially when level instructions tell students to ask Tutor to make a change. Curriculum guidance is scoped to the level's instructions and project code, avoiding generic browser/cache/devtools troubleshooting or optional stretch-feature nudges.
- Tutor response length is controlled in the runner prompts and runner-specific style contracts before generation. Help should answer the immediate question and stop, Plan should give a quick project-coach handoff, and Build should give a quick edit handoff rather than a changelog.
- AI Tutor composer is mode-neutral for students. Web Lab 2 infers Help, Plan, or Build from the request, then applies route/dev-panel capability gates. The dev panel can enable or disable Build, Plan, and Help independently and attach runner-scoped contract text to each enabled path. Help uses the same Socratic, hint-first communication style across policy presets.
- Functional Tutor requests receive the resolved instructions Markdown as `levelInstructionsMarkdown` on every turn. This keeps curriculum guidance grounded in the actual level directions even when the student asks follow-up questions after discussing project files.
- Curriculum routes can opt into Tutor-primary instruction delivery with `tutorInstructionsDelivery`. When enabled, the page derives a short conversational `TutorOpening`, then derives either a linear guide for procedural/debugging instructions or a choice-based guide for open-ended prompt lists. The page owns resettable guide state keyed to the current Markdown signature and passes the current instructional focus into Tutor guidance. Student typed conversation drives step advancement and focus selection; the guide does not expose step/focus chips or canned chip replies. The static Markdown remains a first-class fallback and the guide must not become the authority for completion.
- Validation review results also feed a compact `levelProgress` snapshot into Tutor requests. Partial checks distinguish completed criteria from the next incomplete criterion, and the in-card Hint/Debug/Suggestion actions prefill prompts for that next item instead of sending generic help requests. Validation configs can set `followUpPreference: "debug" | "suggestion"` so bug-fix levels surface Debug while creative/refinement levels surface Suggestion.
- AI-generated changes enter proposal state with file styling, diffs, preview updates, and accept/reject controls
- Broad Build requests such as "make the buttons more exciting" can surface an inline edit-options card before Tutor stages file changes. Tutor asks the model for the intro copy and 2-4 project-aware direction options; the student picks one (or enters custom text), then Tutor submits the enriched Build request. Specific requests such as "make all buttons blue" or "improve the button hover styles" still go straight to code generation.
- The Tutor composer disables sending while an AI proposal is pending, requiring the student to accept or reject before asking for more changes. It also disables while a pending edit-options card or new-project plan questionnaire is waiting for student input.
- Web Lab 2 can enable an intentional Tutor review affordance for validation experiments. When a route passes a validation review config, Tutor can surface an in-chat review offer for clear readiness phrases such as “check my work,” “can I continue?”, “I think I did it,” “it works now,” “I got the button working,” or “I'm done,” while debugging asks such as “can you check why this is broken?” stay in normal Tutor help. While the in-chat review is running, the offer button stays visible in its spinner state. Once the assessment completes, the original button is removed and a lightweight “You requested a review” alert is inserted after the trigger message before the assessment result. The Web Lab 2 dev panel includes a multiline Validation requirements field, with one requirement per line, to override the route's review goals; authors can prefix a line with `[Student-facing label]` to render a shorter checklist label while keeping the full requirement for evaluation. When a session Tutor API key is available, the review path asks AI to evaluate current project files against those explicit requirements without revealing exact fixes; without a key or after an AI failure, it falls back to the local evidence summary. Validation configs can opt into starter-diff effort evidence with `effortPolicy`; technical levels default to no effort gate, while open-ended/hybrid levels default to advisory effort and can explicitly require it. Required effort is intended for iteration/refinement levels, not as a global time-spent rule. Validation routes can also set Continue behavior to require a successful review first, which makes the Continue button run a review and show **Check my work** until the latest review looks complete; successful review cards can also surface a Continue action in-chat.
- In validation style-polish levels, Tutor treats hover, focus, visited, transition, and visual animation requests as CSS work by default. The edit path should prefer `style.css` and avoid creating JavaScript unless the student explicitly asks for dynamic/click behavior.
- Empty/rootless projects render the workspace-level `NewProjectEmptyState` flow on the secondary surface instead of selecting a workspace view. For functional version history, this only applies before the project has ever had files; after files have existed, deleting everything or restoring the initial version shows the ordinary empty workspace so saved versions remain reachable. The workspace view switcher is hidden until files exist.
- Empty projects expose manual starts (create file or upload starter files) and AI Tutor starts (plan first or build a starter). The plan-first start opens the AI Tutor tab and shows a two-question inline questionnaire one question at a time, asking what the app is/does and then what it should look and feel like with style choices plus custom text. While the questionnaire is pending, the composer is disabled so the card owns input. Submitting it leaves the answered state in the card and sends an enriched Plan-mode request so the first generated plan includes the student's project idea. If the student switches from the pending plan questionnaire to the starter-build start, the questionnaire chat is cleared. The starter-build start then opens AI Tutor, pre-fills the build prompt, leaves routing in Auto, and focuses the composer after the panel finishes sliding open.
- Planning mode creates or revises `Plans/PROJECT_PLAN.md` and keeps the workspace in code view so the student can review the spec. `Plans/` is reserved for plan Markdown files and is never treated as the project root for generated app files. Plan Markdown uses a readable project title as the top-level heading with status underneath, renders with top/bottom edge fades, and stays in planning when the student answers Tutor follow-up questions until they explicitly ask to build. The file manager renders plan files in a separate Plans section rather than the normal tree, using a custom outlined circle for unbuilt plans and a circle-check icon for accepted built plans; the plus menu's New Plan action is the manual way to create plan files, while normal `.md` files created through New File stay with project files. Plan files show a rendered Markdown view by default, with an Edit/Done source toggle and Build plan action in a secondary editor toolbar only while the plan is actually open; closing all visible editor tabs shows the ordinary editor empty state even when a plan exists. Build is disabled while a proposal is pending; building from that action switches to preview once runnable files are proposed, but completed plan UI only appears after the proposal is accepted. First code generation from an empty or plan-only project opens the preview view and expands the file manager so proposed runnable files are visible.
- Preview mode includes a debug panel toggle in the URL bar controls, disabled when the preview is empty. `useWebLab2Preview` owns preview path fallback, file/react preview config, and design-edit gating before passing preview props to the workspace. The resizable debug panel renders full-width across the workspace even in split view or after switching back to code view, while capture remains tied to the preview session. It captures console output plus `fetch`/`XMLHttpRequest` activity from file previews, with Console and Network tabs; the Network tab selects the latest request by default, shows request/response metadata for the selected call, and can block network activity for debugging.
- The resource panel animates width on collapse/expand. Its contents keep their expanded width inside a clipped shell so the panel behaves like a drawer rather than reflowing during the transition.
- Save/restore version feedback; brand-new empty projects show a Version History empty state until files are created or added.
- Create-file modal flow

## Current Data Shape

- Uses starter file trees and local version state from `src/data/weblab2` and `useFileWorkspaceState`.
- The default AI Tutor instructions drawer copy lives with the project fixture as raw Markdown in `src/data/weblab2/projects/default/instructions.md`; project-specific routes such as validation can pass their own fixture Markdown through `instructionsMarkdown`, and the dev panel can still override it.
- Validation review experiment fixtures live under `src/data/weblab2/projects/validation-*`, with folder names aligned to their level pages: `validation-photo-carousel`, `validation-loop-style-polish`, `validation-promise-trace`, and `validation-starship-loader`. The photo-carousel fixture powers `/levels/weblab2-validation-test` and the first validation progression level. Each validation fixture keeps author-facing assessment requirements in `assessment.md`, with route config importing those requirements for AI review and local fallback checks. A requirement can start with a student-facing label in brackets, for example `- [Fix the Next button] Clicking Next hides...`; the bracketed label is used in review cards while the full requirement remains the evaluator input. Open-ended fixtures can set `effortPolicy: "required"` plus `minimumChangedFiles` when the level goal is for students to make an intentional refinement beyond starter code that may already satisfy some visual checks.
- Web Lab 2 supports rootless file trees (`[]` or top-level files) as well as single-folder project wrappers. `useFileWorkspaceState` only treats a folder as the project root wrapper when it is the only top-level item.
- Route pages can pass a `storageKeySuffix` when a starter fixture changes and should not reuse an older route-scoped file/version-history session tree.
- The Web Lab 2 dev panel includes a Clear level session cache action that removes route-scoped file tree/version-history session storage and reloads from the current fixture.
- Static fixture images may be inline data URLs for preview compatibility; initial inline image payloads are stripped from route-scoped file/version-history storage and fixture images are rehydrated from the fixture at render time. Tutor-staged uploads persist in the route-scoped file tree so reloads keep uploaded assets, but version-history snapshots omit the upload folder and merge the current uploads back when viewing or restoring saved versions to avoid duplicating image bytes across snapshots.
- Uploaded project files are shaped by `webLab2Uploads.ts`, inserted into the current project root, and persisted through the route-scoped session-storage file tree. Text starter uploads may still be encoded into share links, but UI-uploaded images are session-only unless they are committed into sample data.
- `tutorInstructionsDelivery` is enabled across the validation progression routes so the four curriculum-backed fixtures exercise technical debugging, open-ended style polish, concept tracing, and loop debugging instruction styles. The guide is deterministically derived from markdown, with lightweight author hints such as `tutor-mode` and `tutor-first-move` available as escape hatches.
- Functional Tutor settings, API key, Tutor instruction delivery, and Build/Plan/Help capability overrides are session- or URL-scoped according to the dev-panel field storage. Prompt customization is runner-scoped through the enabled capability contracts rather than one global dev-panel addendum. If validation review is configured but no Tutor API key is present, header validation controls fall back to the normal Continue action instead of routing review through Tutor.
- No server-backed persistence in this prototype.

## Known Gaps

- No real project storage or execution backend.
- Tutor provider calls are browser-side prototype calls using the user's session API key.
- Top-level metadata is still mocked per route.
- Validation review cards are local prototype evidence summaries, not authoritative grading or backend completion records.
