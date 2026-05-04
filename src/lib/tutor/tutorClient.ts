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
import { resolveTutorRequestIntent } from "./requestIntent";
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

export async function tutorClient({
  message,
  conversation = [],
  files,
  additionalSystemPrompt = "",
  requestMode = "auto",
  guidanceProvider = openAiTutorProvider,
  structuredProvider = openAiTutorProvider,
  toolProvider = openAiTutorToolProvider,
}: TutorRequest & {
  guidanceProvider?: TutorGuidanceProvider;
  structuredProvider?: TutorStructuredEditProvider;
  toolProvider?: TutorToolProvider;
}): Promise<TutorEditResult> {
  const intent = resolveTutorRequestIntent(message, requestMode, {
    hasActivePlan: hasActivePlan(files),
    lastAssistantAskedPlanningQuestion: didLastAssistantAskPlanningQuestion(conversation),
  });

  if (intent === "guidance") {
    try {
      return await runTutorGuidance({
        message,
        conversation,
        files,
        additionalSystemPrompt,
        provider: guidanceProvider,
      });
    } catch (error) {
      console.error("[TutorGuidance] Request failed", error);
      return {
        message:
          "I can answer that as a learning question without changing your project, but I had trouble generating the explanation this time. Try asking again in a sentence or two.",
        changes: [],
      };
    }
  }

  if (intent === "planning") {
    try {
      const planning = await runTutorPlanning({
        message,
        conversation,
        files,
        additionalSystemPrompt,
        provider: structuredProvider,
      });

      if (planning.kind === "ok") {
        return planning.result;
      }

      if (planning.kind === "failed") {
        console.warn("[TutorPlanning] Returning planning fallback", planning.errors);
      }

      return fallbackPlanning(message, files);
    } catch (error) {
      console.error("[TutorPlanning] Request failed", error);
      return fallbackPlanning(message, files);
    }
  }

  let editSession;
  try {
    editSession = await runTutorEditSession({
      message,
      conversation,
      files,
      additionalSystemPrompt,
      provider: structuredProvider,
    });
  } catch (error) {
    console.error("[TutorEditSession] Request failed before validation", error);
  }

  if (editSession?.kind === "ok") {
    return editSession.result;
  }

  if (editSession?.kind === "no-key") {
    return getNoKeyTutorFallback(message, files);
  }

  if (editSession?.kind === "failed") {
    console.warn("[TutorEditSession] Falling back to tool loop", editSession.errors);
  }

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
