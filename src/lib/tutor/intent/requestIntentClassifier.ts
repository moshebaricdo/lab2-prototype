import type { TutorSupportContext } from "../../../types/tutor";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import {
  openAiTutorProvider,
  type TutorRequestIntentProvider,
} from "../provider/openAiProvider";
import {
  applyPlanRevisionOverride,
  type TutorRequestIntent,
} from "./requestIntent";
import { logTutorEvent } from "../conversation/tutorDebugLogger";
import type { TutorChatMessage } from "../types";

export interface RequestIntentClassifierContext {
  supportContext?: TutorSupportContext;
  hasActivePlan?: boolean;
  lastAssistantAskedPlanningQuestion?: boolean;
}

export interface RequestIntentClassification {
  intent: TutorRequestIntent;
  /** The student is asking what a concept means, not asking to change the project. */
  isConcept: boolean;
  /** The student explicitly wants the exact answer/fix spelled out. */
  asksForAnswer: boolean;
  /** Whether the verdict came from the model or a non-model fallback. */
  source: "model" | "deterministic";
  reason?: string;
}

const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You route a student's chat message in a coding lab to one of three behaviors. Judge the student's INTENT in context, not individual keywords. A verb like "build" or "fix" used inside a question ("why won't this build?", "how do I fix this?") is a help request, not an edit request. Conversely, an indirect request that implies a change ("the heading feels small", "these buttons are boring") is an edit request even with no edit verb.

Behaviors:
- "guidance": the student wants to understand, debug, get a hint, ask what a concept means, ask what the instructions want, or find where something is. No file changes.
- "planning": the student wants to shape or revise a project plan/spec before building (brainstorm, ask guiding questions, outline). Only relevant for open-ended standalone projects.
- "edit": the student is asking Tutor to actually change the project files now (make/add/update/fix/style/restyle/wire something, or an indirect request that clearly implies a concrete change).

Context rules:
- tutorSupportContext "curriculum-level": the student is in a guided lesson. Keep explanation, debugging, concept, idea, and instruction-breakdown questions as "guidance" UNLESS the student explicitly asks Tutor to implement a change (including "help me make/update/improve ..." or "the instructions say to ask Tutor to ..."). Curriculum levels rarely use "planning".
- tutorSupportContext "standalone-project": broad project-building requests can be "edit", and requests to plan/brainstorm/spec can be "planning". If hasActivePlan is true and the previous Tutor turn asked planning questions, a direct answer to those questions is "planning" (a plan revision), not "edit", unless the student clearly says to build now.
- "how would I..." / "how can I..." style questions are "guidance" even when they name an edit-like outcome; they want to learn the approach, not have Tutor do it.
- Asking to be TOLD or GIVEN an answer/value ("just tell me the selector", "what should it be?", "give me the answer", "which id do I use?") is "guidance" (the student wants the information, to apply it themselves), NOT "edit". Set asksForAnswer true in this case.

Also report:
- isConcept: true if the student is asking what a concept/term means (e.g. "what is a promise?", "what does hoisting mean?").
- asksForAnswer: true if the student explicitly wants the exact answer/fix handed over (e.g. "just tell me the selector", "what should it be?").

Return JSON only: { "intent": "guidance|planning|edit", "isConcept": true|false, "asksForAnswer": true|false, "confidence": "high|low", "reason": "short" }`;

function buildIntentClassifierMessages(
  message: string,
  context: RequestIntentClassifierContext,
): TutorChatMessage[] {
  const payload = {
    studentMessage: message,
    tutorSupportContext: context.supportContext ?? "standalone-project",
    hasActivePlan: Boolean(context.hasActivePlan),
    previousTutorAskedPlanningQuestion: Boolean(
      context.lastAssistantAskedPlanningQuestion,
    ),
  };

  return [
    { role: "system", content: INTENT_CLASSIFIER_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

function isTutorRequestIntent(value: unknown): value is TutorRequestIntent {
  return value === "guidance" || value === "planning" || value === "edit";
}

function tutorApiKeyAvailable() {
  try {
    return Boolean(getTutorApiKey().trim());
  } catch {
    return false;
  }
}

/** Safe default when functional routing cannot call the model. */
export function failClosedGuidanceIntent(
  reason = "api-key-required",
): RequestIntentClassification {
  return {
    intent: "guidance",
    isConcept: false,
    asksForAnswer: false,
    source: "deterministic",
    reason,
  };
}

/**
 * Classifies a student message with the model. Functional Tutor requires an
 * API key; without one, returns guidance (use mock Tutor mode for demos).
 */
export async function classifyTutorRequestIntentWithModel({
  message,
  context = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: RequestIntentClassifierContext;
  provider?: TutorRequestIntentProvider;
}): Promise<RequestIntentClassification> {
  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return failClosedGuidanceIntent();
  }

  let response;
  try {
    response = await provider.requestIntentClassification(
      buildIntentClassifierMessages(message, context),
    );
  } catch (error) {
    logTutorEvent("intent classifier failed, fail-closed to guidance", error, "warn");
    return failClosedGuidanceIntent("classifier-error");
  }

  if (!response || !isTutorRequestIntent(response.intent)) {
    logTutorEvent("intent classifier returned no usable intent, fail-closed to guidance", {
      hasResponse: Boolean(response),
    }, "warn");
    return failClosedGuidanceIntent("classifier-invalid-output");
  }

  if (response.confidence === "low") {
    return failClosedGuidanceIntent("classifier-low-confidence");
  }

  return {
    intent: response.intent,
    isConcept: response.isConcept === true,
    asksForAnswer: response.asksForAnswer === true,
    source: "model",
    reason: typeof response.reason === "string" ? response.reason : undefined,
  };
}

/**
 * Resolves intent for an `auto`-mode request via the model classifier when keyed.
 * Explicit composer modes (build/plan/help) are handled upstream in tutorAction.
 */
export async function resolveAutoTutorRequestIntent({
  message,
  context = {},
  provider = openAiTutorProvider,
}: {
  message: string;
  context?: RequestIntentClassifierContext;
  provider?: TutorRequestIntentProvider;
}): Promise<RequestIntentClassification> {
  const classification = await classifyTutorRequestIntentWithModel({
    message,
    context,
    provider,
  });

  return {
    ...classification,
    intent: applyPlanRevisionOverride(classification.intent, message, context),
  };
}
