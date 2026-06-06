# Tutor Harness

## Purpose

The Tutor harness powers the functional AI Tutor prototype for Web Lab 2 and Python Lab. Web Lab 2 can answer HTML, CSS, and JavaScript learning questions without changing files, and it can propose local project edits that the student can review, accept, or reject. Python Lab uses a guidance-only path: it can read Python project files and help explain or debug them, but it never proposes file changes.

This remains a client-side prototype. Project state, API keys, prompt overrides, accepted workspace state, and version history are stored locally in browser session state rather than server-backed persistence.

## Entry Points

- UI panel: `src/components/lab2/resource-panel/views/ai-tutor/AiTutorPanel.tsx`
- Sidebar wiring: `src/components/lab2/resource-panel/Sidebar.tsx`
- Page orchestration: `src/pages/weblab2/WebLab2LevelPage.tsx`
- Tutor client: `src/lib/tutor/tutorClient.ts`

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

The harness lives in `src/lib/tutor`, grouped by responsibility. Root-level files are the public orchestration surface; everything else lives in subfolders.

### Root (`src/lib/tutor/`)

- `types.ts` — shared request, response, guidance, structured-edit, tool-loop, validation, and result contracts.
- `tutorClient.ts` — orchestrates the full Web Lab request flow; exposes `pythonTutorClient()` for Python Lab’s guidance-only flow.

### `intent/` — request classification

- `requestIntent.ts` classifies requests as guidance, planning, or edit before any edit generation starts. `classifyTutorRequestIntentVerdict()` returns the intent plus a `confident` flag; `isAmbiguousTutorRequestIntent()` exposes the inverse, which is the gate the model classifier uses to decide whether a request is worth a round-trip. The plan-revision guard is factored into `applyPlanRevisionOverride()` and shared across paths.
- `requestIntentClassifier.ts` is the model-assisted intent layer. `resolveAutoTutorRequestIntent()` trusts the deterministic verdict when the regex is confident (instant, no network) and only calls the model for ambiguous phrasings (indirect requests, unusual verbs, a verb inside a question). It always falls back to the deterministic verdict on no key, malformed output, or request failure, so routing can never hard-fail and the no-key lab keeps today's behavior exactly. `requestIntentFixtures.ts` is the labeled corpus and `requestIntentClassifier.liveeval.test.ts` is an opt-in (key-gated) accuracy harness over it.
- `studentIntentSignals.ts` is the shared deterministic lexicon for reading student-message intent (`EDIT_VERBS`/`EDIT_VERB_GROUP`, vague-edit quality terms, `mentionsConcept`, `asksForExplicitAnswer`, `mentionsHelpRequest`, `asksTutorAQuestion`, `reportsSuccess`, `asksToContinue`, `isAffirmation`, `messageIndicatesCompletionOrReadiness`). `requestIntent.ts`, `guidanceRunner.ts`, `editClarification.ts`, and `instructionCoach.ts` import from it so the same intent is not re-detected by divergent regexes. It is intentionally a vocabulary, not a classifier: `validationReviewIntent.ts` keeps its own conservative readiness gate, and `requestIntent`'s broad routing patterns stay wider than these focused predicates.

### `routing/` — turn resolution and UI-facing actions

- `validationReviewFlow.ts` owns validation offer copy and the shared append helpers used by chat NL readiness, offer-card clicks, and the Continue header action. Page `handleValidationReview()` remains the single execution path for running a review.
- `editClarification.ts` detects broad, underspecified implementation requests before code generation starts.
- `editClarificationRunner.ts` asks the model for a short intro plus project-aware direction options, then the UI renders them in an edit-options card.
- `tutorAction.ts` resolves UI-facing Tutor actions, including when to return an edit-options card instead of calling the model immediately.
- `resolveTutorTurn.ts` is the **single pre-runner decision point** for Web Lab 2: it runs `resolveTutorAction`, then instruction-coach / focus-pick upgrade when the base action is guidance. `useWebLab2TutorFlow` executes the returned action and does not invent parallel routes (focus → edit-clarification uses `editClarification` with `source: "focus-pick"`).
- `tutorComposerMode.ts` owns composer request-mode lifecycle (one-shot Build/Plan from cards; Auto reset after curriculum composer sends unless the dev model selector keeps modes sticky).
- `tutorActionRunner.ts` maps a resolved `TutorAction` to runner intent; `tutorClient()` accepts `resolvedAction` and skips the legacy `resolveTutorRequestPolicy` pass when present.

### `runners/` — model execution paths

- `guidanceRunner.ts` returns project-aware explanations with `changes: []`; it supports separate Web Lab and Python Lab guidance prompts.
- `planningRunner.ts` creates or revises `Plans/PROJECT_PLAN.md` for spec-driven project planning without generating runnable app files.
- `editSessionRunner.ts` is the primary code-generation path. It asks for one structured edit proposal, applies it atomically, validates it, and runs compact repair passes when needed.
- `toolLoopRunner.ts` is the fallback edit path. It runs bounded scratch-workspace file tools, compacts tool history, validates final scratch state, and can salvage valid accumulated edits after repeated stale tool failures.
- `repairRunner.ts` handles compact repair passes when structured edits fail validation.
- `runnerContracts.ts` selects route/dev-panel runner contracts and always adds built-in response-style contracts for Help, Plan, and Build. These contracts keep Tutor's student-facing messages short and useful at generation time instead of relying on a later cleanup pass.

### `context/` — project and conversation packing

- `contextBuilder.ts` builds conversation and attachment context, including image inputs.
- `projectAnalyzer.ts` deterministically maps project files, HTML ids/classes, CSS selectors, JS DOM references, and linked assets.
- `contextPacker.ts` selects full files, snippets, or previews within a character budget.

### `instruction/` — Tutor-primary curriculum delivery

- `instructionGuide.ts` deterministically derives an inspectable `InstructionGuide` from instructions Markdown. Procedural/debugging instructions become linear guides with ordered instructional steps; open-ended/creative prompt lists become choice-based guides with selectable focus options. This regex derivation is the permanent **deterministic fallback** for the model-assisted layer below, and also honors authored `<!-- tutor-mode / tutor-guide / tutor-first-move -->` overrides (highest priority). It exports shared construction helpers (`slugify`, `expectedMoveForIntent`, `stableSignature`, `normalizeStepIntent`, `normalizeOptionIntent`).
- `instructionAnalysisRunner.ts` infers the guide **shape** (linear vs open-ended) and structure with a single model call from instructions Markdown plus optional **assessment goals** (`goals` / `goalLabels` from `assessment.md`). When goals are absent it still calls the model with an instructions-only payload (`inferShapeFromInstructionsOnly`). It returns both the `InstructionGuide` and the opening copy in one round-trip, applies tutor-scope rules (Version History not observable in chat; procedural save/revert tails evaluated at Check My Work), and falls back to `buildProgrammaticInstructionAnalysis` (regex guide + programmatic opening) on request failure or unusable output. `WebLab2LevelPage` runs analysis only when a Tutor API key is present; without a key, chat and the drawer pinned step show Lab Settings guidance (`instructionDelivery.ts`) instead of fallback copy. With a key, both stay in a loading state until analysis completes, then `AiTutorPanel` seeds chat from the cached opening. `instructionAnalysisFixtures.ts` is the labeled real-level corpus (including an instructions-only row) and `instructionAnalysisRunner.liveeval.test.ts` is the opt-in accuracy harness (`npm run test:tutor:live:analysis`, gated on `TUTOR_LIVE_EVAL_KEY`).
- `instructionStepSatisfaction.ts` optionally checks weak linear-step replies with a cheap model call when a Tutor API key is present; strong signals (success/readiness, ask-for-help steps) and no-key paths stay fail-open. Wired through `instructionCoach.ts`.
- `instructionOptionSelector.ts` (P4 / I10, foundation present) resolves which open-ended focus a student message selects: deterministic word-overlap first, then a small model call only when overlap is ambiguous, returning null on no key, error, or an unknown id.
- `instructionOpeningRunner.ts` exports `buildProgrammaticInstructionOpening()` — programmatic opening + step summaries used when instruction analysis is unkeyed or fails.
- `tutorOpening.ts` deterministically derives the programmatic fallback opening. It strips worksheet labels such as "Expected Behavior" and "Do This", never echoes raw numbered step titles such as `1: Create a New Feature`, and applies tone-specific templates (`This level is about …`, `Aim for a page where …`) so the fallback stays stable across students without live per-student generation. These templates are used only for the fallback, not for LLM output.
- `instructionCoach.ts` owns deterministic guide state helpers and next-move decisions for Tutor-primary instruction delivery. Linear-guide advancement is fail-open for strong signals (success/readiness, ask-for-help steps). Weak substantive replies optionally pass through `instructionStepSatisfaction.ts` when keyed. The guide holds on the current step while the student is still asking Tutor for help/explanation without reporting a result. Advancement never marks validation criteria complete, so over-advancing only shifts conversational focus. When validation reports `ready_to_continue`, `syncInstructionGuideStateWithLevelProgress()` marks the guide complete so the drawer pin can show **Ready to continue** even on levels without crisp per-step artifacts. `deriveInstructionPinnedStep()` uses validation phase for **Ready to continue**. When `validationReviewConfig` is present, the pin is **`Step N of M`** from assessment goals and `levelProgress`; otherwise it follows the instruction guide (linear steps or open-ended focus). `getActiveInstructionStep()` no longer falls back to step 1 after completion. Open-ended focus matching uses `selectInstructionOption` when overlap is ambiguous.
- `instructionDelivery.ts` — copy for no-key / loading pinned-step states.
- `instructionPinnedStep.ts` — pinned-step derivation for the instructions drawer.

### `edit/` — proposal application and validation

- `atomicEditApplicator.ts` applies structured `replace`, `searchReplace`, and `delete` edits to a scratch workspace as one all-or-nothing edit set.
- `webProjectValidator.ts` adds web-specific checks on top of the base validator, including CSS brace balance, duplicate HTML ids, and browser-script syntax.
- `editValidator.ts` normalizes and validates final proposal changes, including cross-file references, behavior wiring, edit intent, and `saveTitle`.
- `workspaceEditor.ts` is the scratch in-memory workspace used by both structured edits and tool calls.
- `saveTitle.ts` normalizes model-provided save titles into short commit-style labels.
- `responseSummary.ts` builds diff-aware summaries when model copy is too generic.

### `provider/` — OpenAI transport and prompts

- `openAiProvider.ts` owns API-key lookup, OpenAI fetch configuration, model settings, structured JSON parsing, guidance calls, and tool-call transport.
- `promptBuilder.ts` assembles system/user messages for guidance, edit, planning, and tool-loop paths.
- `fallbackTutor.ts` holds no-key fallback behavior and unsafe-edit fallback messages.

### `conversation/` — transcript signals and debug logging

- `tutorConversationSignals.ts` derives workflow context from the transcript (`lastAssistantInvitedEditableFollowUp`, planning/review-offer helpers) instead of duplicating keyword scans in the flow hook and `tutorClient`.
- `tutorDebugLogger.ts` logs UI actions, routing, validation review, model-path selection, proposal accept/reject, and returned runner results to the browser console with the `[TutorFlow]` prefix. Set `localStorage.setItem("weblab:tutorDebugLogging", "off")` to silence this local debugging stream.

## Request Flow

1. Level pages choose `tutorMode={{ kind: "mock" }}` or `tutorMode={{ kind: "functional" }}`.
2. `AiTutorPanel` appends the student message and starts the thinking state when a mock or functional response is pending.
3. In functional mode, `WebLab2LevelPage.tsx` receives the submitted message plus visible conversation and current project files.
4. The student composer stays mode-neutral. Web Lab 2 infers whether a request is Help, Plan, or Build, then checks route/dev-panel capabilities before calling the model. `resolveTutorAction()` can also return an app-owned edit-options card when a Build-bound request lacks enough concrete direction for Tutor to choose an outcome responsibly. Readiness to validate (`I'm done`, `check my work`, etc.) is resolved **before** explicit Build/Plan/Help composer mode so a sticky Build state after an edit-options pick cannot swallow the validation entry.
5. `WebLab2LevelPage.tsx` also passes a normalized Tutor policy. Standalone projects use `standalone-project`, where broad project-building requests can become edits. Curriculum/instruction levels use `curriculum-level`, where explanation, debugging, ideas, and instruction-breakdown requests stay guidance unless the student explicitly asks Tutor to implement a change. Direct implementation phrasing such as "make", "update", "improve", "help me make", "I need you to update", or "the instructions say to ask Tutor to make..." routes to code generation when Build is enabled.
6. Build, Plan, and Help can be enabled or disabled independently by route props or Web Lab 2 dev-panel overrides. Disabled capabilities are denied before model calls, so levels can allow guidance/debugging while preventing direct project code generation.
7. `tutorClient()` resolves a policy with `resolveTutorRequestPolicy()` from `requestIntent.ts`, including intent and whether workspace or plan edits are allowed.
8. If the message is a conceptual, how-to, instruction-breakdown, debugging, or project-navigation question, `guidanceRunner.ts` returns a project-aware explanation and no file changes.
9. If the message asks to plan, brainstorm, ask guiding questions, or make a spec before building in a standalone context, `planningRunner.ts` returns a constrained Markdown proposal for `Plans/PROJECT_PLAN.md`.
10. Otherwise, explicit edit requests go to `editSessionRunner.ts`, which analyzes the project, packs compact context, and asks the provider for structured JSON edits. Broad requests such as "make the buttons more exciting" first return an inline edit-options card in chat; only after the student picks a direction does the UI submit an enriched Build request and call the model. On open-ended (choice-based) instruction levels, a short focus pick after the opening invitation — e.g. replying `nav links` when the seed message invited that choice — also routes to the edit-options card when the matched focus is edit-oriented (`style-polish`, `content-choice`, or `editOriented: true`), instead of stopping at conversational guidance. Readiness/completion phrasing (`I'm done`, `nav links are done`, `check my work`, etc.) always routes to validation review when that capability is enabled — it must not re-trigger focus selection or edit clarification.
11. `atomicEditApplicator.ts` applies the entire structured edit set to a scratch workspace. If any edit fails, no visible project files are changed.
12. `webProjectValidator.ts` validates the resulting proposal through base edit rules and web-specific checks.
13. If validation fails, `editSessionRunner.ts` sends compact repair context and validation errors back to the model for up to two repair attempts.
14. If the staged edit session succeeds, `tutorClient()` returns the runner's student-facing message, optional `saveTitle`, and validated changes.
15. If there is no API key, Tutor returns a direct "Add a Tutor API key in Lab Settings first" message instead of canned guidance, planning, edits, or validation.
16. If the staged edit session fails after repair, `tutorClient()` falls back to `toolLoopRunner.ts`.
17. If the tool loop also fails validation, `fallbackTutor.ts` returns a safe "try again" response with no changes.

Python Lab skips request-intent routing entirely. It calls the guidance runner directly through `pythonTutorClient()`, so student phrasing like "fix my loop" is answered as debugging guidance rather than routed to planning, structured edits, or tool calls.

## Guidance Mode

Guidance mode is for questions such as "can you explain functions?", "what is a Promise?", "what are the instructions asking me to do?", "how do you make things responsive?", "how would I make my map interactive?", or "where can I find the responsive CSS?". These requests should not modify the project.

- `requestIntent.ts` treats explicit guidance, instruction-help, debugging, and project-navigation cues as guidance. In curriculum context, code-topic questions also stay guidance unless there is a direct edit command. Direct edit verbs include make/update/improve/use (for example, "use this image for that card" or "use blue for the heading"). "Help me make/update/improve..." is a direct edit request, while "help me understand how to..." remains guidance.
- In Auto mode, when the deterministic regex is confident, that verdict is used directly. When it is ambiguous (indirect requests like "the heading feels too small", unusual verbs like "jazz up the hero", or a verb inside a question) and a Tutor API key is present, `resolveAutoTutorRequestIntent()` asks a small model classifier to judge intent in context. This is what lets the harness understand intent rather than literal keywords. With no key it stays on the deterministic verdict, so behavior is unchanged.
- Project-adjacent how-to phrasing stays guidance: "How would I make my map interactive?" should teach strategy and likely files, while "Let's make the map interactive" routes to edit generation.
- `guidanceRunner.ts` still receives packed project context so it can point to likely files, selectors, functions, ids, or snippets.
- For "does this look right?", "are my answers right?", and similar informal check questions, Tutor should inspect the packed `projectContext` and reason from visible workspace state instead of asking the student to paste/share answers, code, or files that Tutor already has. Formal readiness still goes through the validation review/check affordance when the student is trying to continue.
- The validation-review trigger is deterministic (`isValidationReviewIntent`), but `resolveTutorAction()` also fires a review when the student gives a bare affirmation (`isAffirmation`) and the previous Tutor turn offered one (`workflow.lastAssistantOfferedReview`, derived in `useWebLab2TutorFlow.ts`). This handles "Tutor: …request a review." / "Student: yes" without making the readiness gate itself looser. A false trigger is low-harm because the review re-derives completion truth.
- `validationHarness.ts` evaluates **assessment goals only**. Each goal maps to an evaluator (`ai`, `version-history-save`, `version-history-revert`) via requirement-text patterns in `validationGoalEvaluators.ts`. Effort policy gates AI-evaluated goals without adding extra checklist rows. Version-history snapshots run when assessment goals require them, not when instructions mention Version History.
- In curriculum-level Web Lab contexts, guidance is scoped to the level's instructions and current project code. It should avoid generic browser troubleshooting such as saving files, clearing cache, hard refreshes, opening devtools/F12, or inspecting the browser console, and it should not suggest optional stretch features outside the level goals.
- Web Lab 2 help uses a light Socratic disclosure policy for curriculum guidance. It now applies by default to every curriculum turn — including observations and symptom-sharing, not just explicit hint/debug keywords — and only steps aside when the student explicitly asks for the answer (`EXPLICIT_ANSWER_REQUEST_PATTERN`). The policy: start with the goal, give one small next check, ask at most one focused observation question, nudge toward the discovery rather than confirming the exact problem, and avoid naming exact project-only selectors, ids, values, or replacement text (even when visible in `projectContext`) unless the student supplied them, the level instructions contain them, or the student explicitly asks for the answer.
- Concept questions such as "What is a Promise?" use a separate `concept-help` disclosure policy. Tutor should answer the concept directly in beginner-friendly language, connect it back to the current step, and then continue gently; instruction-focus guidance must not redirect the student to "focus on the instructions" before explaining the concept.
- Output rules (no false-blindness claims, no asking the student to share/paste work that is already in `projectContext`, no browser troubleshooting, no optional stretch-feature nudges in curriculum levels) are enforced in the guidance system prompt at generation time. `guidanceRunner.ts` returns the model's message unmodified and does **not** post-scrub it with regex; earlier `.replace`-based sanitizers were removed because they silently corrupted good answers when they over-matched.
- Socratic guidance must not override the code-generation contract. When a curriculum level instructs students to ask Tutor to make styling or code updates, that direct implementation request should produce a proposal instead of saying Tutor cannot make the change.
- Web Lab validation routes can pass `levelProgress`, a compact snapshot of the latest review card. Guidance should use passed criteria to avoid re-teaching completed work and should target hints/debug help at `nextIncompleteCriterion` when present. Review cards may use short student-facing criterion labels while preserving fuller evaluator requirements in `requirements`.
- Review follow-up chips (Hint vs Debug vs Suggestion beside a review card) are inferred from review card text and derived review mode when no explicit preference is set on the card.
- Guidance responses always return `changes: []`.
- Guidance prompts should keep answers short at the source: answer the immediate question, offer one concrete next check, and avoid generic closing lines.
- The fallback guidance copy also returns no changes.
- Python guidance uses the same no-change contract, but its system prompt is scoped to Python concepts, runtime errors, `input()`, stdout/stderr, functions, loops, lists, conditionals, and project-specific debugging.

## Planning Mode

Planning mode is for students who want to shape a standalone project before generating code, including prompts like "help me plan a new web project", "ask me guiding questions first", "brainstorm ideas", or "make a project spec".

- `requestIntent.ts` routes standalone planning requests before edit generation, unless the latest message clearly says to build, create files, implement the plan, or otherwise change the project. In curriculum context, idea, instruction, and approach questions are guidance instead of plan-file proposals. When an active unbuilt standalone plan exists and the previous Tutor response asked planning questions, Auto mode treats the student's answer as a plan revision rather than jumping into code generation.
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

## Edit Options Clarification

For broad implementation requests, Web Lab 2 can pause before code generation and surface a direction picker in chat.

- `editClarification.ts` treats a request as underspecified when it is already a direct edit request but only names vague quality goals such as "better", "exciting", "nicer", or "pop" without concrete properties like color, spacing, hover/focus, layout counts, selectors, or behavior wiring.
- `resolveTutorAction()` returns `editClarification` for those requests in Auto and Build modes. Build mode means the eventual path is code generation, not that the student's wording is specific enough to skip clarification.
- `runEditClarification()` packs project context and asks the model for JSON `{ message, options[] }` where each option includes a student-facing `label` and a complete `enrichPrompt` for the later build step. Option wording is not hard-coded in the app.
- `useWebLab2TutorFlow.ts` calls `runEditClarification()`, returns the model-authored intro in `content`, attaches `editOptions` for the card, and does not call `tutorClient()` until the student selects an option or submits custom text.
- `EditOptionsCard.tsx` renders the picker vertically while `editOptions.status` is `pending`. Selecting an option removes the card from the assistant message, posts the chosen label as the visible user turn, and submits the option's enriched Build prompt with `skipEditClarification: true`.
- Concrete system or teacher-authored build requests, such as building from `Plans/PROJECT_PLAN.md`, bypass the card.
- Pending edit-option cards disable the composer, similar to the new-project plan questionnaire. On reload, pending cards are stripped from stored messages so stale pickers cannot trigger edits later.

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

Edit responses must give the student a useful summary. The staged edit and tool-loop paths ask the model to name the main files or page areas changed and explain why the change helps. If the model returns generic copy such as "Updated the project," the harness replaces it with a diff-aware summary that names the changed file(s) and points the student to the proposal diff.

After edit/planning/tool-loop results are validated, `tutorClient()` returns the runner result directly. Keep student-facing response length controlled by runner prompts and contracts, not by post-generation summarization.

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
- Web Lab 2 stages eligible Tutor composer uploads into an `uploads/` project folder as soon as they are attached, before the student sends a message. If the student sends while browser upload processing is still pending, the composer accepts the send and shows the normal thinking state, then waits for pending uploads to settle before calling Tutor. Removing the composer attachment removes the staged project file. Staged uploads stay in project state for Tutor context and route-scoped file-tree persistence, but do not count as project content for the new-project empty state, so they never add separate upload status messages, expand the file manager, or switch the workspace layout. When uploads fail or the student's wording mentions more files than Tutor can see, the submitted user turn includes structured `attachmentStatus` context so the model can acknowledge missing files naturally in its normal response. Once real project files reveal the workspace, `uploads/` appears in the file manager. Version-history snapshots omit uploads and merge the current upload folder back when viewing/restoring a version so images persist without being duplicated into every snapshot. Tutor decides whether to wire staged assets into code from the student's message. Proposal application reads the latest file tree snapshot so staged uploads are not wiped when Tutor returns code changes.
- Project files dragged from the file manager or tab row are sent as `project` context when file content is available.
- Curriculum Web Lab routes pass the resolved instructions Markdown into every functional Tutor request as `levelInstructionsMarkdown`, separate from project files and dev-only prompt addenda. Guidance answers instruction-help questions from this field instead of giving generic advice about rereading directions.
- Web Lab routes can opt into Tutor-primary instruction delivery with `tutorInstructionsDelivery`. The route still treats `instructions.md` / `instructionsMarkdown` as the authoritative student-facing fallback. `WebLab2LevelPage` runs `runInstructionAnalysis()` when a Tutor API key is present (brief loading state, then cached guide + opening); without a key the drawer shows Lab Settings guidance instead of fallback copy. `AiTutorPanel` seeds chat from the cached opening keyed by `instructionGuideSignature`. The collapsed instructions drawer shows a pinned step summary from assessment goals (when `validationReviewConfig` is present) or the instruction guide otherwise. Subsequent typed conversation passes the current `instructionFocus` into normal guidance. Student typed conversation drives coach progression; the guide does not expose step/focus chips or return canned chip replies.
- Validation review cards are serialized into conversation context as compact progress snapshots, and the latest page-level review is passed into Tutor requests as `levelProgress`. This keeps follow-up hints and debug guidance aligned to completed versus incomplete checklist items even after the visible card scrolls up.
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
- Style-polish requests in curriculum levels treat hover, focus, visited, transition, and visual animation as CSS interaction states by default. They should modify the stylesheet and should not add JavaScript unless the student explicitly asks for click handlers, dynamic content, toggles, or other stateful behavior.

## Version History And Workspace State

- `useFileWorkspaceState` persists the accepted file tree in `sessionStorage` so a hard refresh does not reset the current workspace to starter code.
- `useChatState` persists AI Tutor messages and draft input in `sessionStorage` under a route-scoped key (`weblab2:chat:*` or `pythonlab:*:chat`). Upload attachment `imageSrc`, `imageDataUrl`, and heavy text context are stripped before persistence to avoid quota issues; Web Lab 2 rehydrates upload chip thumbnails from matching project image files on reload via `hydrateChatMessageUploadImages()`. Pending code-change cards are marked rejected on restore because AI proposal state is not persisted across reloads.
- File workspace state supports both rootless project trees and single-folder project wrappers. A folder is treated as the root wrapper only when it is the sole top-level item.
- AI proposal state is still temporary until accepted.
- Accepting a proposal commits `proposedContent` into file content and passes the accepted tree to `handleSaveAiVersion`.
- `saveTitle` is normalized by the tutor harness and saved as the AI snapshot description.
- `useVersionHistoryState` stores manual, auto, AI, and initial snapshots in `sessionStorage`.
- On mount, if the workspace is still at the initial snapshot but history contains later changed snapshots, the latest non-initial snapshot is restored as current.
- Restoring the initial snapshot is a destructive "start over" action. The UI shows a confirmation dialog, then clears all other snapshots.

## Development Guidance

Paths below are relative to `src/lib/tutor/` unless noted.

- Change guidance/planning/edit routing in `intent/requestIntent.ts`. The deterministic cascade also drives the model classifier's ambiguity gate via `classifyTutorRequestIntentVerdict()`'s `confident` flag — widen `confident` to call the model less, narrow it to call the model more.
- Change the model-assisted classifier prompt, gate, or fallback in `intent/requestIntentClassifier.ts`. Add tricky phrasings to `intent/requestIntentFixtures.ts` and run the key-gated `intent/requestIntentClassifier.liveeval.test.ts` to measure real model accuracy before relying on it.
- Change shared student-intent vocabulary (edit verbs, concept/help/answer/readiness phrases) in `intent/studentIntentSignals.ts` so the fix lands once across `requestIntent`, `guidanceRunner`, and `instructionCoach`.
- Change broad edit clarification heuristics or option copy in `routing/editClarification.ts` and `routing/tutorAction.ts`.
- Change Web Lab 2 Tutor capability presets, Build/Plan/Help gates, and scoped contract addenda in `pages/weblab2/tutorDevSettings.ts`, `pages/weblab2/webLab2DevPanel.ts`, and `WebLab2LevelPage.tsx`.
- Change programmatic fallback opening copy in `instruction/tutorOpening.ts` and `instruction/instructionOpeningRunner.ts` (`buildProgrammaticInstructionOpening`), pinned-step copy in `instruction/instructionPinnedStep.ts`, instruction guide derivation in `instruction/instructionGuide.ts`, and deterministic guide-state behavior in `instruction/instructionCoach.ts`. Keep intended instruction flow separate from `levelProgress`; delivering or advancing a guide step must not mark validation criteria complete.
- Change model-assisted guide-shape inference in `instruction/instructionAnalysisRunner.ts` and `provider/openAiProvider.ts` (`requestInstructionAnalysis`); add tricky levels to `instruction/instructionAnalysisFixtures.ts` and run `npm run test:tutor:live:analysis` (key-gated) to measure real shape accuracy. Change open-ended choice-selection in `instruction/instructionOptionSelector.ts` (`requestInstructionOptionSelection`). Change weak linear-step advancement in `instruction/instructionStepSatisfaction.ts` (`requestInstructionStepSatisfaction`). Level load wiring lives in `WebLab2LevelPage.tsx` (key-gated `runInstructionAnalysis`, loading + API-key placeholder states) and `AiTutorPanel.tsx` (cached opening seed). Copy for no-key / loading pinned steps lives in `instruction/instructionDelivery.ts`.
- Change runner-scoped contract prompt selection in `runners/runnerContracts.ts` and `tutorClient.ts`.
- Tutor interaction diagnostics use `conversation/tutorDebugLogger.ts` and log UI actions, routing, validation review, model-path selection, proposal accept/reject, and returned runner results to the browser console with the `[TutorFlow]` prefix. Set `localStorage.setItem("weblab:tutorDebugLogging", "off")` to silence this local debugging stream.
- Change guidance prompt behavior in `runners/guidanceRunner.ts`.
- Change planning prompt behavior in `runners/planningRunner.ts`.
- Change structured edit prompt behavior in `runners/editSessionRunner.ts`.
- Change shared prompt/tool-loop wording in `provider/promptBuilder.ts`.
- Change project analysis or context packing in `context/projectAnalyzer.ts` and `context/contextPacker.ts`.
- Change provider behavior, token limits, retry behavior, or model config in `provider/openAiProvider.ts` and `useTutorApiSettings.ts`.
- Change structured edit application in `edit/atomicEditApplicator.ts` or scratch file behavior in `edit/workspaceEditor.ts`.
- Change web-specific validation in `edit/webProjectValidator.ts`.
- Change base safety and intent validation in `edit/editValidator.ts`.
- Change fallback tool behavior in `runners/toolLoopRunner.ts`.
- Keep `tutorClient.ts` focused on orchestration rather than prompt, fetch, or validation details.
- Preserve the stable `TutorEditResult` shape unless the page proposal flow is updated at the same time. Python Lab intentionally uses the same shape with `changes: []`.

## Verification

For tutor harness changes, run:

```bash
npm run test:tutor
npm run typecheck
npm run build
```
