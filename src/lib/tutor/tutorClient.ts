import { getNoKeyTutorFallback, getUnsafeEditFallback } from "./fallbackTutor";
import { openAiTutorToolProvider, type TutorToolProvider } from "./openAiProvider";
import { runTutorToolLoop } from "./toolLoopRunner";
import type { TutorEditResult, TutorRequest } from "./types";

export async function tutorClient({
  message,
  conversation = [],
  files,
  additionalSystemPrompt = "",
  toolProvider = openAiTutorToolProvider,
}: TutorRequest & {
  toolProvider?: TutorToolProvider;
}): Promise<TutorEditResult> {
  let toolLoop;
  try {
    toolLoop = await runTutorToolLoop({
      message,
      conversation,
      files,
      additionalSystemPrompt,
      provider: toolProvider,
    });
  } catch (error) {
    console.error("[TutorToolLoop] Request failed before validation", error);
    return getUnsafeEditFallback(message, files);
  }

  if (toolLoop.kind === "ok") {
    return toolLoop.result;
  }

  if (toolLoop.kind === "no-key") {
    return getNoKeyTutorFallback(message, files);
  }

  console.warn("[TutorToolLoop] Returning unsafe-edit fallback", toolLoop.errors);
  return getUnsafeEditFallback(message, files);
}

export type { TutorEditResult, TutorRequest };
