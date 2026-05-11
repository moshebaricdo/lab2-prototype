# Tutor Harness

## Purpose

The Tutor harness powers the functional AI Tutor prototype for Web Lab 2 and Python Lab. Web Lab 2 can answer HTML, CSS, and JavaScript learning questions without changing files, and it can propose local project edits that the student can review, accept, or reject. Python Lab uses a guidance-only path: it can read Python project files and help explain or debug them, but it never proposes file changes.

This remains a client-side prototype. Project state, API keys, prompt overrides, accepted workspace state, and version history are stored locally in browser session state rather than server-backed persistence.

## Entry Points

- UI panel: `src/components/lab2/resource-panel/views/ai-tutor/AiTutorPanel.tsx`
- Sidebar wiring: `src/components/lab2/resource-panel/Sidebar.tsx`
- Page orchestration: `src/pages/weblab2/WebLab2LevelPage.tsx`
- Tutor client: `src/lib/tutor/tutorClient.ts`
- Compatibility re-export: `src/lib/tutor/mockTutorClient.ts`

`WebLab2LevelPage.tsx` calls `tutorClient()` and expects this stable result shape:

```ts
{
  message: string;
  saveTitle?: string;
  changes: Array<{
    fileName: string;
    status: "new" | "modified" | "deleted";
    content?: string;
    linesAdded?: number;
    linesRemoved?: number;
  }>;
}
```

When `changes` are present, the page starts an AI proposal through `useFileWorkspaceState`. The editor, preview, file manager, banner, and accept/reject flow all read from that proposal state. When the student accepts AI changes, `saveTitle` becomes the description for the AI version-history snapshot.

For empty/rootless Web Lab projects, proposal application adds new files at the top level rather than requiring a project wrapper folder. The page expands the file manager when generated code arrives; if the project was empty before the request, it also switches to preview mode so the generated page is visible immediately.

`PythonLabLevelPage.tsx` calls `pythonTutorClient()`, which uses the guidance runner with a Python-specific prompt and always returns `changes: []`. Python Lab does not wire proposal accept/reject handlers, plan generation, build mode, or the tool-loop edit fallback.

## Module Map

The harness lives in `src/lib/tutor`.

- `types.ts` defines shared request, response, guidance, structured-edit, tool-loop, validation, and result contracts.
- `requestIntent.ts` classifies requests as guidance, planning, or edit before any edit generation starts.
- `guidanceRunner.ts` returns project-aware explanations with `changes: []`; it supports separate Web Lab and Python Lab guidance prompts.
- `planningRunner.ts` creates or revises `Plans/PROJECT_PLAN.md` for spec-driven project planning without generating runnable app files.
- `contextBuilder.ts` builds conversation and attachment context, including image inputs.
- `projectAnalyzer.ts` deterministically maps project files, HTML ids/classes, CSS selectors, JS DOM references, and linked assets.
- `contextPacker.ts` selects full files, snippets, or previews within a character budget.
- `editSessionRunner.ts` is the primary code-generation path. It asks for one structured edit proposal, applies it atomically, validates it, and runs compact repair passes when needed.
- `atomicEditApplicator.ts` applies structured `replace`, `searchReplace`, and `delete` edits to a scratch workspace as one all-or-nothing edit set.
- `webProjectValidator.ts` adds web-specific checks on top of the base validator, including CSS brace balance, duplicate HTML ids, and browser-script syntax.
- `editValidator.ts` normalizes and validates final proposal changes, including cross-file references, behavior wiring, edit intent, and `saveTitle`.
- `openAiProvider.ts` owns API-key lookup, OpenAI fetch configuration, model settings, structured JSON parsing, guidance calls, and tool-call transport.
- `toolLoopRunner.ts` is the fallback edit path. It runs bounded scratch-workspace file tools, compacts tool history, validates final scratch state, and can salvage valid accumulated edits after repeated stale tool failures.
- `workspaceEditor.ts` is the scratch in-memory workspace used by both structured edits and tool calls.
- `saveTitle.ts` normalizes model-provided save titles into short commit-style labels.
- `fallbackTutor.ts` holds no-key fallback behavior and unsafe-edit fallback messages.
- `tutorClient.ts` orchestrates the full Web Lab request flow and exposes `pythonTutorClient()` for Python Lab’s guidance-only flow.
- `repairRunner.ts`, `tutorPrompt.ts`, and `mockTutorClient.ts` remain for legacy compatibility.

## Request Flow

1. Level pages choose `tutorMode={{ kind: "mock" }}` or `tutorMode={{ kind: "functional" }}`.
2. `AiTutorPanel` appends the student message and starts the thinking state when a mock or functional response is pending.
3. In functional mode, `WebLab2LevelPage.tsx` receives the submitted message plus visible conversation and current project files.
4. The composer normally sends `requestMode: "auto"` and hides the manual selector. When the dev-controlled selector is shown, it can send `requestMode: "auto" | "build" | "plan" | "help"`. Auto uses request inference; Build, Plan, and Help force edit, planning, or guidance routing.
5. `tutorClient()` resolves intent with `resolveTutorRequestIntent()` from `requestIntent.ts`.
6. If the message is a conceptual, how-to, or project-navigation question, `guidanceRunner.ts` returns a project-aware explanation and no file changes.
7. If the message asks to plan, brainstorm, ask guiding questions, or make a spec before building, `planningRunner.ts` returns a constrained Markdown proposal for `Plans/PROJECT_PLAN.md`.
8. Otherwise, `editSessionRunner.ts` analyzes the project, packs compact context, and asks the provider for structured JSON edits.
9. `atomicEditApplicator.ts` applies the entire structured edit set to a scratch workspace. If any edit fails, no visible project files are changed.
10. `webProjectValidator.ts` validates the resulting proposal through base edit rules and web-specific checks.
11. If validation fails, `editSessionRunner.ts` sends compact repair context and validation errors back to the model for up to two repair attempts.
12. If the staged edit session succeeds, `tutorClient()` returns the student-facing message, optional `saveTitle`, and validated changes.
13. If there is no API key, `fallbackTutor.ts` returns a no-key educational fallback.
14. If the staged edit session fails after repair, `tutorClient()` falls back to `toolLoopRunner.ts`.
15. If the tool loop also fails validation, `fallbackTutor.ts` returns a safe "try again" response with no changes.

Python Lab skips request-intent routing entirely. It calls the guidance runner directly through `pythonTutorClient()`, so student phrasing like "fix my loop" is answered as debugging guidance rather than routed to planning, structured edits, or tool calls.

## Guidance Mode

Guidance mode is for questions such as "can you explain functions?", "how do you make things responsive?", "how would I make my map interactive?", or "where can I find the responsive CSS?". These requests should not modify the project.

- `requestIntent.ts` requires a guidance or project-navigation cue, a code-topic cue, and no direct edit command.
- Project-adjacent how-to phrasing stays guidance: "How would I make my map interactive?" should teach strategy and likely files, while "Let's make the map interactive" routes to edit generation.
- `guidanceRunner.ts` still receives packed project context so it can point to likely files, selectors, functions, ids, or snippets.
- Guidance responses always return `changes: []`.
- The fallback guidance copy also returns no changes.
- Python guidance uses the same no-change contract, but its system prompt is scoped to Python concepts, runtime errors, `input()`, stdout/stderr, functions, loops, lists, conditionals, and project-specific debugging.

## Planning Mode

Planning mode is for students who want to shape a project before generating code, including prompts like "help me plan a new web project", "ask me guiding questions first", "brainstorm ideas", or "make a project spec".

- `requestIntent.ts` routes planning requests before edit generation, unless the latest message clearly says to build, create files, implement the plan, or otherwise change the project. When an active unbuilt plan exists and the previous Tutor response asked planning questions, Auto mode treats the student's answer as a plan revision rather than jumping into code generation.
- The composer mode selector can force Plan when the student wants a spec, even if the typed prompt uses build-like words.
- Blank Web Lab projects can start planning through an inline AI Tutor questionnaire. The UI collects two fixed project details one question at a time: what the app is/does, then what it should look and feel like using style choices, a custom text option, or uploaded moodboard images. The composer is disabled while the questionnaire is pending, the answered state stays in the card, and the UI submits one enriched Plan-mode request so the first generated plan includes student-specific content.
- Tutor messages support lightweight Markdown rendering for headings, paragraphs, inline code, and ordered/unordered lists. Planning follow-up questions should use a short intro plus a numbered list instead of one dense text block.
- `planningRunner.ts` uses the structured JSON provider with a constrained prompt that can only create or replace `Plans/PROJECT_PLAN.md`.
- Plan Markdown starts with a readable project title as the top-level heading and places `Status: Planned` or `Status: Completed` directly underneath it.
- Planning responses explicitly tell the student to review the plan before building, using natural language rather than exposing the internal plan file path.
- Planning proposals use the same `TutorEditResult` shape and AI proposal UI as code edits, so students can review, accept, or reject the Markdown spec.
- Existing or pending `Plans/PROJECT_PLAN.md` content is part of project context for future requests. `Plans/` is a reserved plan-only folder, not a project root for generated app files. Plan files are surfaced in a dedicated file-manager Plans section; normal Markdown files created through the generic file modal remain regular project files. When the student explicitly says they are ready to build or uses the Build plan action, the latest build request routes to the normal code-generation pipeline and the plan is treated as requirements context.
- Plan files show a plan action row in the editor chrome. The row defaults to rendered Markdown, includes an Edit/Done source toggle, and exposes a Build plan action. While a build proposal is pending, the action row shows "Built, awaiting user review." without the completed tag. After the student accepts the proposal, built plans show a completed tag in the action row and a completed icon in the Plans file list. Build is disabled while any proposal is pending, then submits a Build request, asks the edit path to update the plan status/checklist, and switches to preview when runnable files are proposed.
- Planning has its own safe no-edit fallback; failed planning responses do not fall through into code generation.

## Pending Proposal Guard

When any AI proposal is pending, the Tutor composer disables send actions and Enter-to-send. The student must accept or reject the current proposal before starting another Tutor request. This keeps proposal state, preview state, and version-history saves aligned.

## Structured Edit Contract

The primary edit path asks the model for JSON only:

```ts
{
  message?: string;
  saveTitle?: string;
  edits?: Array<{
    path: string;
    strategy: "replace" | "searchReplace" | "delete";
    content?: string;
    replacements?: Array<{
      search: string;
      replace: string;
      replaceAll?: boolean;
    }>;
  }>;
}
```

Use `replace` only when the model can provide the complete final file. Use `searchReplace` for targeted edits against exact provided context. Related multi-file work should be returned in one atomic edit set so HTML, CSS, and JavaScript stay in sync.

## Tool Loop Fallback

The fallback runner still edits through scratch-workspace file tools:

- `list_files`
- `read_file`
- `create_file`
- `replace_file`
- `patch_file`
- `delete_file`
- `finish`

The tool loop exists for resilience when structured editing fails. It compacts earlier tool outputs to reduce token pressure, requires a strict `finish` schema with nullable `saveTitle`, and attempts to validate accumulated scratch edits before giving up after repeated tool failures.

## Context Rules

Context is split between broad conversation/attachment handling and compact project packing.

- `contextBuilder.ts` excludes alert messages and limits conversation history to the latest non-alert messages.
- Selected-code attachments from the editor are sent as `code-reference` context.
- Files attached through the composer upload are sent as `upload` context with readable metadata/content and image bytes for uploaded images.
- Project files dragged from the file manager or tab row are sent as `project` context when file content is available.
- `projectAnalyzer.ts` ignores image files, uses proposed content during pending proposals, resolves linked scripts/stylesheets, and extracts Python imports/functions/classes for `.py` files.
- `contextPacker.ts` sends a manifest and project map first, then includes high-priority full files, snippets, or previews within budget. Python files receive relevance boosts for Python/debugging questions so they remain visible in packed context.
- Repair passes use tighter conversation history and an expanded project-context budget on later attempts.

## Safety Checks

Validation protects the workspace from common model failure modes:

- Empty, no-op, malformed, or non-array edit responses are rejected.
- Modified/deleted file names must resolve by path or file name.
- Search strings must match exactly, and multi-match replacements require `replaceAll: true`.
- Placeholder content such as "rest of code unchanged" is rejected.
- Suspiciously large full-file shrinkage is rejected.
- HTML landmarks and existing project intent are preserved where possible.
- Script and stylesheet references in final HTML must resolve to project files.
- Requests that add new interactive behavior must include JavaScript/event wiring and ensure HTML references the script.
- CSS-only tuning of existing interactive states is allowed without requiring new JavaScript.
- Final CSS must have balanced braces.
- Final HTML must not introduce duplicate ids.
- Final non-module JavaScript must parse with `new Function()`.
- Validated changes include computed `linesAdded` and `linesRemoved` for the proposal UI.

## Version History And Workspace State

- `useFileWorkspaceState` persists the accepted file tree in `sessionStorage` so a hard refresh does not reset the current workspace to starter code.
- File workspace state supports both rootless project trees and single-folder project wrappers. A folder is treated as the root wrapper only when it is the sole top-level item.
- AI proposal state is still temporary until accepted.
- Accepting a proposal commits `proposedContent` into file content and passes the accepted tree to `handleSaveAiVersion`.
- `saveTitle` is normalized by the tutor harness and saved as the AI snapshot description.
- `useVersionHistoryState` stores manual, auto, AI, and initial snapshots in `sessionStorage`.
- On mount, if the workspace is still at the initial snapshot but history contains later changed snapshots, the latest non-initial snapshot is restored as current.
- Restoring the initial snapshot is a destructive "start over" action. The UI shows a confirmation dialog, then clears all other snapshots.

## Development Guidance

- Change guidance/planning/edit routing in `requestIntent.ts`.
- Change manual mode selector wiring through `types/tutor.ts`, `AiTutorComposer.tsx`, `Sidebar*.tsx`, and `WebLab2LevelPage.tsx`.
- Change guidance prompt behavior in `guidanceRunner.ts`.
- Change planning prompt behavior in `planningRunner.ts`.
- Change structured edit prompt behavior in `editSessionRunner.ts`.
- Change shared prompt/tool-loop wording in `promptBuilder.ts`.
- Change project analysis or context packing in `projectAnalyzer.ts` and `contextPacker.ts`.
- Change provider behavior, token limits, retry behavior, or model config in `openAiProvider.ts` and `useTutorApiSettings.ts`.
- Change structured edit application in `atomicEditApplicator.ts` or scratch file behavior in `workspaceEditor.ts`.
- Change web-specific validation in `webProjectValidator.ts`.
- Change base safety and intent validation in `editValidator.ts`.
- Change fallback tool behavior in `toolLoopRunner.ts`.
- Keep `tutorClient.ts` focused on orchestration rather than prompt, fetch, or validation details.
- Preserve the stable `TutorEditResult` shape unless the page proposal flow is updated at the same time. Python Lab intentionally uses the same shape with `changes: []`.

## Verification

For tutor harness changes, run:

```bash
npm run test:tutor
npm run typecheck
npm run build
```
