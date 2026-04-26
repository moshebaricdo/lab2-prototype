# Tutor Harness

## Purpose

The Tutor harness powers the functional AI Tutor prototype for Web Lab 2. It lets the Tutor respond conversationally and, when appropriate, propose local project edits that the student can review, accept, or reject.

This is still a prototype. Project state, API keys, prompt overrides, and version history are local/session-scoped rather than server-backed.

## Entry Points

- UI panel: `src/components/lab2/resource-panel/views/ai-tutor/AiTutorPanel.tsx` with its tutor-only subcomponents and styles in the same folder
- Sidebar wiring: `src/components/lab2/resource-panel/Sidebar.tsx`
- Page orchestration: `src/pages/WebLab2LevelPage.tsx`
- Tutor client: `src/lib/tutor/tutorClient.ts`
- Compatibility re-export: `src/lib/tutor/mockTutorClient.ts`

`WebLab2LevelPage.tsx` calls `tutorClient()` and expects the stable result shape:

```ts
{
  message: string;
  changes: Array<{
    fileName: string;
    status: "new" | "modified" | "deleted";
    content?: string;
    linesAdded?: number;
    linesRemoved?: number;
  }>;
}
```

When `changes` are present, the page starts an AI proposal through `useFileWorkspaceState`. The editor, preview, file manager, banner, and accept/reject flow all read from that proposal state.

## Module Map

The harness lives in `src/lib/tutor`.

- `types.ts` defines shared request, response, tool-loop, validation, and result contracts.
- `contextBuilder.ts` builds project, conversation, and attachment context for the model.
- `promptBuilder.ts` owns the base prompts, request expectations, repair instructions, and Dev panel prompt addendum.
- `openAiProvider.ts` owns API-key lookup, OpenAI fetch configuration, model settings, JSON extraction, and tool-call transport.
- `workspaceEditor.ts` applies model file-tool operations to a scratch in-memory workspace.
- `toolLoopRunner.ts` runs the bounded edit loop, executes file tools, validates final scratch state, and retries with validation feedback.
- `editValidator.ts` applies local patch edits and rejects unsafe or unresolved whole-project states before they reach workspace state.
- `repairRunner.ts` remains for the legacy JSON path, but the functional tutor now uses the tool loop.
- `fallbackTutor.ts` holds no-key fallback behavior and unsafe-edit fallback messages.
- `tutorClient.ts` orchestrates the full request flow.
- `tutorPrompt.ts` and `mockTutorClient.ts` are compatibility re-exports.

## Request Flow

1. Level pages choose `tutorMode={{ kind: "mock" }}` or `tutorMode={{ kind: "functional" }}`.
2. `AiTutorPanel` appends the student message and starts the thinking state when a mock or functional response is pending.
3. In functional mode, `WebLab2LevelPage.tsx` receives the submitted message plus full visible conversation.
4. `tutorClient()` builds project and conversation context.
5. `toolLoopRunner.ts` creates a `workspaceEditor.ts` scratch copy of the project.
6. `promptBuilder.ts` combines the tool-loop system prompt, project context, conversation context, request expectations, image inputs, and any session-only Dev panel prompt addendum.
7. `openAiProvider.ts` sends the request to the stronger code-edit model with file tools.
8. The model can list, read, create, replace, patch, and delete scratch files, then calls `finish`.
9. `editValidator.ts` validates the whole final scratch project, including cross-file references and behavior wiring.
10. If validation fails, the tool loop sends structured feedback back to the model and continues within the bounded retry loop.
11. If validation succeeds, `tutorClient()` returns a student-facing message and validated changes.
12. If no API key exists, `fallbackTutor.ts` returns the canned fallback or a no-key educational response.
13. If the tool loop fails validation after all attempts, `fallbackTutor.ts` returns a safe "try again" response with no changes.

## Context Rules

`contextBuilder.ts` is the place for policy decisions about what the model receives.

- Project context includes the non-image project files and a manifest with file names, paths, and types.
- When a proposal is pending, project context uses the visible proposed file content so follow-up requests chain from what the student is reviewing.
- Conversation context excludes alert messages.
- Conversation history is limited to the latest 8 non-alert messages.
- File attachments include file name, path, source, content, and line ranges when available.
- Selected-code attachments from the editor are sent as `code-reference` context.
- Files attached through the composer upload are sent as `upload` context with readable file content, file metadata, and image bytes for uploaded images.
- Project files dragged from the file manager or tab row into the Tutor composer are sent as `project` context when file content is available.
- Clickable/dynamic requests are validated to ensure the proposed changes include JavaScript or event-handling code before they reach the workspace.

## Edit Tool Contract

The functional tutor now edits through file tools instead of returning final diffs directly. The available scratch-workspace tools are:

- `list_files`
- `read_file`
- `create_file`
- `replace_file`
- `patch_file`
- `delete_file`
- `finish`

The model never mutates the visible project directly. The runner converts the accepted scratch-workspace diff back into the stable `{ message, changes }` proposal contract used by the UI.

## Safety Checks

`editValidator.ts` protects the workspace from common model failure modes:

- The response must be an object with a `changes` array.
- File names must resolve by path or file name for modified/deleted files.
- Search strings must match exactly.
- Multi-match search strings require `replaceAll: true`.
- Empty or no-op edits are rejected.
- Placeholder content such as "rest of code unchanged" is rejected.
- Suspiciously large full-file shrinkage is rejected.
- HTML landmarks such as doctype/body/main/planet content are preserved when they existed before.
- Script and stylesheet references in final HTML must resolve to project files.
- Clickable/dynamic requests that add or change JavaScript must leave the final HTML referencing that JavaScript file so the preview can run it.
- Validated changes include computed `linesAdded` and `linesRemoved` for the proposal UI.

## UI State Notes

- The Tutor thinking animation is local to `AiTutorPanel`, but mock responses are now driven by `MockTutorConfig` data rather than hardcoded panel copy.
- `Sidebar.tsx` disables other resource panel tabs while a Tutor request is running so the panel does not unmount mid-request.
- AI proposal state is owned by `useFileWorkspaceState`.
- Accepting a proposal commits `proposedContent` into file content.
- Rejecting a proposal clears proposed content and restores the pre-request file state.
- The preview renders from the current project file tree and uses proposed content only for active proposals.

## Development Guidance

- Change prompt wording in `promptBuilder.ts`.
- Change context policy in `contextBuilder.ts`.
- Change provider behavior or model config in `openAiProvider.ts` and `useTutorApiSettings.ts`.
- Change scratch file-tool behavior in `workspaceEditor.ts` or `toolLoopRunner.ts`.
- Change safety rules in `editValidator.ts`.
- Change retry behavior in `toolLoopRunner.ts`.
- Keep `tutorClient.ts` focused on orchestration rather than prompt, fetch, or validation details.
- Preserve the stable `TutorEditResult` shape unless the page proposal flow is updated at the same time.
