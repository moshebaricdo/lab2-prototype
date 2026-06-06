import type { InstructionStep } from "../../../types/tutor";
import {
  openAiTutorProvider,
  type TutorInstructionStepSatisfactionProvider,
} from "../provider/openAiProvider";
import { getTutorApiKey } from "../../../hooks/useTutorApiSettings";
import {
  asksToContinue,
  asksTutorAQuestion,
  reportsSuccess,
} from "../intent/studentIntentSignals";
import type { TutorChatMessage } from "../types";

function tutorApiKeyAvailable() {
  try {
    return Boolean(getTutorApiKey().trim());
  } catch {
    return false;
  }
}

const STEP_SATISFACTION_SYSTEM_PROMPT = `You decide whether a student's chat reply satisfies the active instruction step in a coding lab.

The student is working through a linear guide one step at a time. Given the step title, prompt, expected move, and the student's latest message, return whether they have done enough to move on to the next step.

Be practical, not pedantic:
- Accept paraphrases, partial observations, and informal completion claims when they clearly address the step.
- Hold when the student is still asking Tutor for help, explaining confusion, or clearly has not attempted the step yet.
- Do not require exact keywords from the step prompt.

Return JSON only:
{
  "satisfied": true|false,
  "confidence": "high|low",
  "reason": "short phrase"
}`;

export function isStrongStepCompletionSignal(step: InstructionStep, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (reportsSuccess(trimmed) || asksToContinue(trimmed)) return true;
  if (step.intent === "ask-for-help") return true;
  return false;
}

export function buildInstructionStepSatisfactionMessages(
  step: InstructionStep,
  message: string,
): TutorChatMessage[] {
  return [
    { role: "system", content: STEP_SATISFACTION_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        step: {
          title: step.title,
          prompt: step.prompt ?? step.title,
          intent: step.intent,
          expectedStudentMove: step.expectedStudentMove,
        },
        studentMessage: message.trim(),
      }),
    },
  ];
}

/**
 * Optional keyed check for weak step-completion signals. Fail-open when no key,
 * on model error, or on malformed output so the coach never stalls the guide.
 */
export async function assessInstructionStepSatisfaction({
  step,
  message,
  provider = openAiTutorProvider,
}: {
  step: InstructionStep;
  message: string;
  provider?: TutorInstructionStepSatisfactionProvider;
}): Promise<boolean> {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (isStrongStepCompletionSignal(step, trimmed)) return true;
  if (asksTutorAQuestion(trimmed)) return false;

  if (provider === openAiTutorProvider && !tutorApiKeyAvailable()) {
    return true;
  }

  try {
    const response = await provider.requestInstructionStepSatisfaction(
      buildInstructionStepSatisfactionMessages(step, trimmed),
    );
    if (typeof response?.satisfied !== "boolean") return true;
    return response.satisfied;
  } catch {
    return true;
  }
}
