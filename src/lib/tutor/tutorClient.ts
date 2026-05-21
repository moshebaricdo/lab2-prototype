import { getNoKeyTutorFallback, getUnsafeEditFallback } from "./fallbackTutor";
import {
  openAiTutorProvider,
  openAiTutorToolProvider,
  type TutorGuidanceProvider,
  type TutorStructuredEditProvider,
  type TutorToolProvider,
} from "./openAiProvider";
import { runTutorGuidance } from "./guidanceRunner";
import { runTutorEditSession } from "./editSessionRunner";
import { fallbackPlanning, runTutorPlanning } from "./planningRunner";
import { runTutorToolLoop } from "./toolLoopRunner";
import { resolveTutorRequestPolicy } from "./requestIntent";
import { buildRunnerSystemPromptAddendum } from "./runnerContracts";
import { logTutorEvent } from "./tutorDebugLogger";
import type { TutorEditResult, TutorRequest } from "./types";
import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";

function getEffectiveFileContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function isPlanMarkdownPath(path: string) {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts.length >= 2 &&
    parts.at(-2) === "Plans" &&
    parts.at(-1)?.toLowerCase().endsWith(".md");
}

function hasActivePlan(files: FileItem[], parentPath = ""): boolean {
  return files.some((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) {
      return hasActivePlan(file.children, path);
    }
    if (!isPlanMarkdownPath(path)) {
      return false;
    }
    return !/\bStatus:\s*Completed\b/i.test(getEffectiveFileContent(file));
  });
}

function didLastAssistantAskPlanningQuestion(conversation: ChatMessage[]) {
  let lastAssistantMessage: ChatMessage | undefined;
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const message = conversation[index];
    if (message.role === "assistant" && !message.isAlert) {
      lastAssistantMessage = message;
      break;
    }
  }
  if (!lastAssistantMessage?.content.includes("?")) return false;
  return /\b(plan|project|idea|audience|feature|style|interaction|question|before\s+building|before\s+we\s+build)\b/i
    .test(lastAssistantMessage.content);
}

function summarizeTutorResult(result: TutorEditResult) {
  return {
    changes: result.changes.map((change) => ({
      fileName: change.fileName,
      status: change.status,
      linesAdded: change.linesAdded,
      linesRemoved: change.linesRemoved,
    })),
    changeCount: result.changes.length,
    hasSaveTitle: Boolean(result.saveTitle),
    messageLength: result.message.length,
  };
}

export async function tutorClient({
  message,
  conversation = [],
  files,
  additionalSystemPrompt = "",
  runnerContracts,
  levelInstructionsMarkdown = "",
  levelProgress,
  instructionFocus,
  requestMode = "auto",
  supportContext = "standalone-project",
  guidanceProvider = openAiTutorProvider,
  structuredProvider = openAiTutorProvider,
  toolProvider = openAiTutorToolProvider,
}: TutorRequest & {
  guidanceProvider?: TutorGuidanceProvider;
  structuredProvider?: TutorStructuredEditProvider;
  toolProvider?: TutorToolProvider;
}): Promise<TutorEditResult> {
  const policy = resolveTutorRequestPolicy(message, requestMode, {
    hasActivePlan: hasActivePlan(files),
    lastAssistantAskedPlanningQuestion: didLastAssistantAskPlanningQuestion(conversation),
    supportContext,
  });
  const intent = policy.intent;
  const runnerSystemPromptAddendum = buildRunnerSystemPromptAddendum({
    basePrompt: additionalSystemPrompt,
    intent,
    contracts: runnerContracts,
  });
  logTutorEvent("core request classified", {
    requestMode,
    supportContext,
    intent,
    allowWorkspaceEdits: policy.allowWorkspaceEdits,
    allowPlanEdits: policy.allowPlanEdits,
    conversationTurns: conversation.length,
    topLevelFiles: files.length,
    hasLevelInstructions: Boolean(levelInstructionsMarkdown.trim()),
    hasLevelProgress: Boolean(levelProgress),
    hasInstructionFocus: Boolean(instructionFocus),
    hasRunnerContract: Boolean(runnerSystemPromptAddendum.trim()),
  });
  const returnResult = (result: TutorEditResult, source: string) => {
    logTutorEvent("core response returned", {
      source,
      intent,
      ...summarizeTutorResult(result),
    });
    return result;
  };

  if (intent === "guidance") {
    try {
      logTutorEvent("guidance path started", { supportContext: policy.supportContext });
      return returnResult(await runTutorGuidance({
        message,
        conversation,
        files,
        additionalSystemPrompt: runnerSystemPromptAddendum,
        levelInstructionsMarkdown,
        levelProgress,
        instructionFocus,
        supportContext: policy.supportContext,
        provider: guidanceProvider,
      }), "guidance");
    } catch (error) {
      logTutorEvent("guidance path failed", error, "error");
      console.error("[TutorGuidance] Request failed", error);
      return returnResult({
        message:
          "I can answer that as a learning question without changing your project, but I had trouble generating the explanation this time. Try asking again in a sentence or two.",
        changes: [],
      }, "guidance-fallback");
    }
  }

  if (intent === "planning") {
    try {
      logTutorEvent("planning path started", { supportContext: policy.supportContext });
      const planning = await runTutorPlanning({
        message,
        conversation,
        files,
        additionalSystemPrompt: runnerSystemPromptAddendum,
        levelInstructionsMarkdown,
        levelProgress,
        provider: structuredProvider,
      });

      if (planning.kind === "ok") {
        return returnResult(planning.result, "planning");
      }

      if (planning.kind === "failed") {
        logTutorEvent("planning path returned fallback", { errors: planning.errors }, "warn");
        console.warn("[TutorPlanning] Returning planning fallback", planning.errors);
      }

      if (planning.kind === "no-key") {
        return returnResult(getNoKeyTutorFallback(message, files), "planning-no-key");
      }

      return returnResult(fallbackPlanning(message, files), `planning-${planning.kind}`);
    } catch (error) {
      logTutorEvent("planning path failed", error, "error");
      console.error("[TutorPlanning] Request failed", error);
      return returnResult(fallbackPlanning(message, files), "planning-error-fallback");
    }
  }

  let editSession;
  try {
    logTutorEvent("edit session path started", { supportContext: policy.supportContext });
    editSession = await runTutorEditSession({
      message,
      conversation,
      files,
      additionalSystemPrompt: runnerSystemPromptAddendum,
      levelInstructionsMarkdown,
      levelProgress,
      supportContext: policy.supportContext,
      provider: structuredProvider,
    });
  } catch (error) {
    logTutorEvent("edit session threw before validation", error, "error");
    console.error("[TutorEditSession] Request failed before validation", error);
  }

  if (editSession?.kind === "ok") {
    return returnResult(editSession.result, "edit-session");
  }

  if (editSession?.kind === "no-key") {
    logTutorEvent("edit session has no API key", undefined, "warn");
    return returnResult(getNoKeyTutorFallback(message, files), "edit-session-no-key");
  }

  if (editSession?.kind === "failed") {
    logTutorEvent("edit session falling back to tool loop", { errors: editSession.errors }, "warn");
    console.warn("[TutorEditSession] Falling back to tool loop", editSession.errors);
  }

  let toolLoop;
  try {
    logTutorEvent("tool loop path started", { supportContext: policy.supportContext });
    toolLoop = await runTutorToolLoop({
      message,
      conversation,
      files,
      additionalSystemPrompt: runnerSystemPromptAddendum,
      levelInstructionsMarkdown,
      levelProgress,
      supportContext: policy.supportContext,
      provider: toolProvider,
    });
  } catch (error) {
    logTutorEvent("tool loop threw before validation", error, "error");
    console.error("[TutorToolLoop] Request failed before validation", error);
    return returnResult(getUnsafeEditFallback(message, files), "tool-loop-error-fallback");
  }

  if (toolLoop.kind === "ok") {
    return returnResult(toolLoop.result, "tool-loop");
  }

  if (toolLoop.kind === "no-key") {
    logTutorEvent("tool loop has no API key", undefined, "warn");
    return returnResult(getNoKeyTutorFallback(message, files), "tool-loop-no-key");
  }

  logTutorEvent("tool loop returned unsafe-edit fallback", { errors: toolLoop.errors }, "warn");
  console.warn("[TutorToolLoop] Returning unsafe-edit fallback", toolLoop.errors);
  return returnResult(getUnsafeEditFallback(message, files), "tool-loop-unsafe-fallback");
}

export async function pythonTutorClient({
  message,
  conversation = [],
  files,
  additionalSystemPrompt = "",
  guidanceProvider = openAiTutorProvider,
}: TutorRequest & {
  guidanceProvider?: TutorGuidanceProvider;
}): Promise<TutorEditResult> {
  try {
    logTutorEvent("python guidance path started", {
      conversationTurns: conversation.length,
      topLevelFiles: files.length,
    });
    const guidanceResult = await runTutorGuidance({
      message,
      conversation,
      files,
      additionalSystemPrompt,
      provider: guidanceProvider,
      guidanceProfile: "python",
    });

    const result = {
      message: guidanceResult.message,
      changes: [],
    };
    logTutorEvent("python guidance response returned", summarizeTutorResult(result));
    return result;
  } catch (error) {
    logTutorEvent("python guidance path failed", error, "error");
    console.error("[PythonTutorGuidance] Request failed", error);
    const result = {
      message:
        "I can help with Python questions and debugging without changing your project, but I had trouble generating an answer this time. Try asking again in a sentence or two.",
      changes: [],
    };
    logTutorEvent("python guidance fallback returned", summarizeTutorResult(result), "warn");
    return result;
  }
}

export type { TutorEditResult, TutorRequest };
