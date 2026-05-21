import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type { LevelProgressSnapshot } from "../../types/validationReview";
import type {
  InstructionFocusContext,
  TutorRequestMode,
  TutorSupportContext,
} from "../../types/tutor";
import type { TutorRunnerContracts } from "./runnerContracts";

export type TutorFileStatus = "new" | "modified" | "deleted";

export interface TutorPatchEdit {
  search: string;
  replace: string;
  replaceAll?: boolean;
  reason?: string;
}

export interface TutorPatchChange {
  fileName: string;
  status: TutorFileStatus;
  content?: string;
  edits?: TutorPatchEdit[];
}

export interface TutorPatchResponse {
  message?: string;
  saveTitle?: string;
  changes?: TutorPatchChange[];
}

export type TutorStructuredEditStrategy = "replace" | "searchReplace" | "delete";

export interface TutorStructuredReplacement {
  search: string;
  replace: string;
  replaceAll?: boolean;
}

export interface TutorStructuredEdit {
  path: string;
  strategy: TutorStructuredEditStrategy;
  content?: string;
  replacements?: TutorStructuredReplacement[];
}

export interface TutorStructuredEditResponse {
  message?: string;
  saveTitle?: string;
  edits?: TutorStructuredEdit[];
}

export interface TutorGuidanceResponse {
  message?: string;
}

export type TutorValidatedChange = {
  fileName: string;
  status: TutorFileStatus;
  content?: string;
  linesAdded?: number;
  linesRemoved?: number;
};

export type TutorValidationResult =
  | {
      ok: true;
      message: string;
      saveTitle?: string;
      changes: TutorValidatedChange[];
    }
  | {
      ok: false;
      errors: string[];
    };

export type TutorEditResult = {
  message: string;
  saveTitle?: string;
  changes: TutorValidatedChange[];
};

export interface TutorRequest {
  message: string;
  conversation?: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  runnerContracts?: TutorRunnerContracts;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  instructionFocus?: InstructionFocusContext;
  requestMode?: TutorRequestMode;
  supportContext?: TutorSupportContext;
}

export type TutorChatMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | {
          type: "image_url";
          image_url: {
            url: string;
            detail?: "auto" | "low" | "high";
          };
        }
    >;

export interface TutorChatMessage {
  role: "system" | "user";
  content: TutorChatMessageContent;
}

export interface TutorToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface TutorToolChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: TutorChatMessageContent | null;
  tool_call_id?: string;
  tool_calls?: TutorToolCall[];
}

export interface TutorToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

export interface TutorToolAssistantMessage {
  role: "assistant";
  content?: string | null;
  tool_calls?: TutorToolCall[];
}

export interface TutorProjectContextFile {
  fileName: string;
  path: string;
  type: FileItem["type"];
  content: string;
}

export interface TutorProjectContext {
  manifest: Array<{
    fileName: string;
    path: string;
    type: FileItem["type"];
  }>;
  files: TutorProjectContextFile[];
}
