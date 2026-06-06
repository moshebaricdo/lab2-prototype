import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { TutorProvider } from "../provider/openAiProvider";
import type { TutorPatchResponse, TutorValidationResult } from "../types";
import { validateTutorPatchResponse, validationSummary } from "../edit/editValidator";
import { buildTutorMessages } from "../provider/promptBuilder";

export type TutorRepairResult =
  | {
      ok: true;
      validation: Extract<TutorValidationResult, { ok: true }>;
    }
  | {
      ok: false;
      errors: string[];
      summary: string;
    };

export async function runTutorRepair({
  provider,
  message,
  files,
  conversation,
  additionalSystemPrompt = "",
  validationErrors,
  previousResponse,
}: {
  provider: TutorProvider;
  message: string;
  files: FileItem[];
  conversation: ChatMessage[];
  additionalSystemPrompt?: string;
  validationErrors: string[];
  previousResponse: TutorPatchResponse;
}): Promise<TutorRepairResult> {
  const repairedResponse = await provider.request(buildTutorMessages({
    message,
    files,
    conversation,
    additionalSystemPrompt,
    validationErrors,
    previousResponse,
  }));

  if (!repairedResponse) {
    return {
      ok: false,
      errors: validationErrors,
      summary: validationSummary(validationErrors),
    };
  }

  const repairedValidation = validateTutorPatchResponse(repairedResponse, files, message);
  if (!("errors" in repairedValidation)) {
    return {
      ok: true,
      validation: repairedValidation,
    };
  }

  return {
    ok: false,
    errors: repairedValidation.errors,
    summary: validationSummary(repairedValidation.errors),
  };
}
