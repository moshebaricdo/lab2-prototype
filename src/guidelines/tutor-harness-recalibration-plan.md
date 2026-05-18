# Tutor Harness Recalibration Plan

## Goal

Make Tutor behavior predictable by separating product-owned decisions from LLM-owned reasoning.

The smallest useful change is to give the app an explicit policy and action-routing layer before any prompt runs:

- Capabilities decide what Tutor is allowed to do.
- Pedagogy decides how guidance is written.
- Routing chooses a mode before prompts run.
- App/page state owns workflow transitions.
- LLMs generate explanations, edit proposals, and rubric judgments, but do not decide product state.

## Current Boundary Problems

The current harness spreads decisions across route props, UI state, regex classifiers, prompts, chat messages, and validation modules.

- Capability policy is implied by `tutorMode`, `tutorSupportContext`, composer `requestMode`, validation config, and Python's guidance-only client.
- Socratic guidance is mostly scoped to `guidanceRunner.ts`, but routing decides whether a student ever reaches that guidance path or the edit path.
- Normal guidance/edit/plan routing happens in `tutorClient.ts` and `requestIntent.ts`.
- Validation/check-work routing happens earlier in `AiTutorPanel.tsx` through natural-language readiness detection.
- Validation results live both in `WebLab2LevelPage.tsx` page state and inside `ChatMessage.validationReview`.
- Chat messages carry transcript text, validation cards, proposal state, plan questionnaire state, alerts, file changes, and AI save metadata.
- `levelProgress` serializes validation outcomes back into Tutor prompt context, which is useful for hints but should not become progression authority.
- Plan build state currently leaks through Markdown content such as `Status: Completed` in `Plans/PROJECT_PLAN.md`; that is useful for the prototype, but it is another workflow-state-in-content coupling to retire.

## Target Architecture

Introduce an explicit policy object passed from each lab/level into the Tutor flow.

```ts
type TutorPolicy = {
  lab: "weblab2" | "pythonlab";
  supportContext: "standalone-project" | "curriculum-level";
  capabilities: {
    guidance: boolean;
    planning: boolean;
    workspaceEdits: boolean;
    validationReview: boolean;
    proposalReview: boolean;
  };
  pedagogy: {
    mode: "open" | "curriculum-socratic";
    revealPolicy?: "hint-first" | "direct-when-asked";
  };
  routingProfile: "open-ended-project" | "guided-level" | "validation-checkpoint";
};
```

`routingProfile` should describe the level shape, not force a mode. In particular, `validation-checkpoint` should only bias ambiguous readiness messages such as "done", "check", "next", or "can I continue?" toward a review offer. It should not override clear help, debug, planning, or edit requests.

Route every Tutor interaction through an app-owned action shape before invoking any runner.

```ts
type TutorActionDeniedReason =
  | "capability-disabled"
  | "pending-proposal"
  | "history-read-only"
  | "validation-required-first";

type TutorAction =
  | { kind: "guidance"; source: "message" | "ui"; message: string }
  | { kind: "plan"; source: "message" | "ui"; message: string }
  | { kind: "edit"; source: "message" | "ui"; message: string }
  | { kind: "validationReview"; source: "continue" | "review-button" | "review-offer" }
  | {
      kind: "denied";
      requested: "plan" | "edit" | "validationReview";
      fallback: "guidance" | "message";
      disabledReason: TutorActionDeniedReason;
      message: string;
    };
```

The denied action path gives the UI and harness a clean answer for cases like "student asked for an edit, but edits are not allowed in this lab or level." The fallback should be deterministic and student-friendly: do not surface internal errors or blunt denial language. Return a short guidance-style response that says what Tutor cannot do in this context and gives the next useful step, for example, "I can't edit files in this level, but you can try changing the selector in `style.css`; I can help you reason through it."

Routing should resolve in this order:

1. Explicit UI action: Continue, Check my work, Build from plan, Help, Plan, or Build mode.
2. Lab/level capability policy.
3. Current workflow state: pending proposal, pending plan questionnaire, active plan, latest validation status.
4. Level routing profile: open-ended project, guided level, or validation checkpoint.
5. Student message intent as the final fallback.

## Validation Harness

Validation should become a sibling harness to Tutor chat, not a chat interception behavior.

```ts
type ValidationReviewRequest = {
  config: WebLab2ValidationReviewConfig;
  currentFiles: FileItem[];
  starterFiles: FileItem[];
  evidence: {
    changedFileCount: number;
    changedFileNames: string[];
    acceptedTutorChanges: boolean;
    userTurnCount: number;
  };
};

type ValidationReviewResult = {
  status: "not_started" | "in_progress" | "needs_work" | "likely_complete";
  confidence: "low" | "medium" | "high";
  items: ValidationReviewItem[];
  requirements?: string[];
  nextStep?: string;
};
```

Natural-language readiness detection can remain as a soft affordance that offers a Check my work button. It should not be the primary mechanism that runs validation or gates progression.

## Response Shaping

Each runner should aim to produce the right-sized response upfront:

- Guidance should preserve the essential pedagogical move, especially Socratic hints and debugging clues.
- Edit summaries should name changed files and tell the student to review/test the proposal.
- Planning responses should tell the student to review the plan and use Build plan when ready.
- Validation responses should be shaped by the validation card/result builder, not by Tutor finalization.
- Fallback responses should stay short at the source.
- Mode prompts should specify a small Markdown contract: short paragraphs, valid bullets or numbered lists, inline code for file names/selectors, and fenced code snippets only when the mode explicitly allows examples.

`responseFinalizer.ts` should remain a conservative presentation seatbelt. This should be a programmatic, rule-based cleanup pass, not a second LLM request and not a semantic summarizer. It should only do transformations that are obviously safe without understanding the lesson content: remove generic closing lines, collapse repeated blank lines, drop duplicate boilerplate caveats, and leave short or structured answers alone. It can also run a lightweight Markdown hygiene pass: normalize list spacing, remove accidental empty bullets, close or unwrap unmatched code fences, and preserve code blocks exactly when they are already well-formed. It should not invent formatting, rewrite code examples, or decide which prose belongs in a list. If a response is too long or poorly structured because the explanation itself is too broad, fix that in the mode-specific runner prompt or response contract instead of asking the finalizer to condense it. The finalizer must preserve `changes`, `saveTitle`, validation status, criteria, routing, workflow state, and the core student-facing move.

## Files Likely To Change

- `src/types/tutor.ts`: add `TutorPolicy`, `TutorAction`, and action-source types.
- `src/lib/tutor/requestIntent.ts`: narrow to message-intent classification only.
- `src/lib/tutor/tutorClient.ts`: accept a resolved action or policy-resolved mode.
- `src/components/ide/weblab2/useWebLab2TutorFlow.ts`: own policy-aware action routing before calling the harness.
- `src/pages/weblab2/WebLab2LevelPage.tsx`: construct policy, own validation state, and own continue eligibility.
- `src/components/lab2/resource-panel/views/ai-tutor/AiTutorPanel.tsx`: stop owning validation routing; emit explicit actions or render passed-in state.
- `src/types/chat.ts`: gradually reduce workflow fields from transcript messages.

Files that can mostly remain as-is:

- `src/lib/tutor/guidanceRunner.ts`
- `src/lib/tutor/planningRunner.ts`
- `src/lib/tutor/editSessionRunner.ts`
- `src/lib/tutor/editValidator.ts`
- `src/lib/tutor/webProjectValidator.ts`
- `src/lib/validation/weblab2Review.ts`
- `src/lib/validation/aiWebLab2Review.ts`
- `src/lib/tutor/contextPacker.ts`

## Migration Plan

### Phase 1: Add Policy Without Behavior Changes

Create `TutorPolicy` and pass it from Web Lab 2 and Python Lab pages into the existing flow. Keep the existing routing behavior, but make current permissions visible and testable.

### Phase 2: Add A Policy-Aware Action Resolver

Add `resolveTutorAction()` near the Tutor flow layer. It should apply explicit UI action, capabilities, workflow state, routing profile, and then message intent. Keep using `requestIntent.ts` as the last step.

### Phase 3: Move Validation Out Of Chat Interception

Move validation triggering out of `AiTutorPanel.tsx`. Page or flow state should invoke the validation harness for Continue and Check my work actions. The chat panel may still render review offers and review cards.

### Phase 4: Separate Domain State From Transcript State

Keep chat as a display transcript. Store latest validation review, pending proposal, plan build status, and continue eligibility in page/flow state. Render those states into chat as cards where useful.

Move plan build status out of Markdown content over time. `Status: Completed` inside `Plans/PROJECT_PLAN.md` should become display content or derived metadata, not the authority for whether a plan was built. The authoritative state should live in page/flow state first, then in a typed persistence shape if the prototype later needs durable plan history.

### Phase 5: Tighten Response Contracts

Update runner prompts for concise, mode-specific response shape. Keep `responseFinalizer.ts` rule-based and conservative as a final presentation guard.

## Non-Goals

- Do not replace the structured edit pipeline.
- Do not rewrite the validation evaluator.
- Do not remove the chat-based UX.
- Do not introduce server persistence.
- Do not make LLMs responsible for app workflow transitions.
