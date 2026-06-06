import type { FileItem } from "../../../types/file";
import type { ChatMessage } from "../../../types/chat";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import type { TutorSupportContext } from "../../../types/tutor";
import { openAiTutorToolProvider, type TutorToolProvider } from "../provider/openAiProvider";
import { buildToolLoopMessages } from "../provider/promptBuilder";
import { validateTutorChanges } from "../edit/editValidator";
import { summarizeTutorEditResponse } from "../edit/responseSummary";
import type {
  TutorEditResult,
  TutorToolChatMessage,
  TutorToolDefinition,
  TutorValidatedChange,
} from "../types";
import { TutorWorkspaceEditor } from "../edit/workspaceEditor";

const MAX_TOOL_LOOP_STEPS = 14;
const MAX_REPEATED_TOOL_FAILURES = 2;
const MAX_HISTORY_TOOL_ARGUMENT_CHARS = 1200;
const MAX_HISTORY_TOOL_RESULT_CONTENT_CHARS = 1200;
const MAX_FAILURE_CONTENT_PREVIEW_CHARS = 1600;

const fileTools: TutorToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all editable project files in the scratch workspace.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read one project file from the scratch workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Create a new project file in the scratch workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "replace_file",
      description: "Replace the complete contents of an existing project file in the scratch workspace. Avoid this for large HTML/CSS files; use patch_file for focused layout/style edits.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "patch_file",
      description: "Patch an existing file by exact search/replace in the scratch workspace. Prefer this for layout/style edits and follow-up requests.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          search: { type: "string" },
          replace: { type: "string" },
          replaceAll: { type: "boolean" },
        },
        required: ["path", "search", "replace", "replaceAll"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a project file from the scratch workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "finish",
      description: "Finish after all requested project edits have been made and explain the changes to the student.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
          saveTitle: {
            type: ["string", "null"],
            description: "Short commit-style summary for the accepted AI save. One sentence max, no markdown, under 72 characters.",
          },
        },
        required: ["message", "saveTitle"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

export type TutorToolLoopResult =
  | { kind: "ok"; result: TutorEditResult }
  | { kind: "no-key" }
  | { kind: "failed"; errors: string[] };

function parseToolArguments(raw: string) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Tool arguments were not valid JSON. Raw arguments preview: ${raw.slice(0, 300)}`);
  }
}

function toolResult(content: unknown) {
  return JSON.stringify(content);
}

function compactString(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  const headLength = Math.floor(maxChars * 0.6);
  const tailLength = maxChars - headLength;
  return `${value.slice(0, headLength)}\n\n[... ${value.length - maxChars} chars omitted ...]\n\n${value.slice(-tailLength)}`;
}

function compactToolArgumentsForHistory(name: string, rawArguments: string) {
  if (!rawArguments || rawArguments.length <= MAX_HISTORY_TOOL_ARGUMENT_CHARS) {
    return rawArguments;
  }

  try {
    const args = JSON.parse(rawArguments) as Record<string, unknown>;
    const compacted: Record<string, unknown> = { ...args };
    for (const key of ["content", "search", "replace"]) {
      if (typeof compacted[key] === "string") {
        compacted[key] = compactString(compacted[key], MAX_HISTORY_TOOL_ARGUMENT_CHARS);
      }
    }
    compacted._historyCompacted = `Large ${name} arguments were compacted after execution; read the file again if exact current content is needed.`;
    return JSON.stringify(compacted);
  } catch {
    return JSON.stringify({
      _historyCompacted: `Large ${name} arguments were compacted after execution; original arguments were ${rawArguments.length} chars.`,
    });
  }
}

function compactAssistantMessageForHistory(message: TutorToolChatMessage): TutorToolChatMessage {
  if (!message.tool_calls?.length) {
    return message;
  }

  return {
    ...message,
    tool_calls: message.tool_calls.map((toolCall) => ({
      ...toolCall,
      function: {
        ...toolCall.function,
        arguments: compactToolArgumentsForHistory(
          toolCall.function.name,
          toolCall.function.arguments,
        ),
      },
    })),
  };
}

function compactToolResultContentForHistory(content: TutorToolChatMessage["content"]) {
  if (typeof content !== "string" || content.length <= MAX_HISTORY_TOOL_RESULT_CONTENT_CHARS) {
    return content;
  }

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (typeof parsed.content !== "string") {
      return compactString(content, MAX_HISTORY_TOOL_RESULT_CONTENT_CHARS);
    }

    const originalContent = parsed.content;
    const compacted = {
      ...parsed,
      contentPreview: compactString(originalContent, MAX_HISTORY_TOOL_RESULT_CONTENT_CHARS),
      contentLength: originalContent.length,
      content: undefined,
      _historyCompacted: "Historical tool result content was compacted after the model consumed it once; call read_file again if exact content is needed.",
    };
    delete compacted.content;
    return JSON.stringify(compacted);
  } catch {
    return compactString(content, MAX_HISTORY_TOOL_RESULT_CONTENT_CHARS);
  }
}

function compactMessagesForRequest(messages: TutorToolChatMessage[]) {
  let lastAssistantToolCallIndex = -1;
  messages.forEach((message, index) => {
    if (message.role === "assistant" && message.tool_calls?.length) {
      lastAssistantToolCallIndex = index;
    }
  });

  return messages.map((message, index) => {
    const isPendingToolResult = lastAssistantToolCallIndex >= 0 && index > lastAssistantToolCallIndex;
    if (isPendingToolResult || message.role !== "tool") {
      return message;
    }

    return {
      ...message,
      content: compactToolResultContentForHistory(message.content),
    };
  });
}

function logTutorInfo(label: string, data: unknown) {
  console.info(`[TutorToolLoop] ${label}: ${JSON.stringify(data)}`);
}

function logTutorWarn(label: string, data: unknown) {
  console.warn(`[TutorToolLoop] ${label}: ${JSON.stringify(data)}`);
}

function logTutorError(label: string, data: unknown) {
  console.error(`[TutorToolLoop] ${label}: ${JSON.stringify(data)}`);
}

function changesToPatchChanges(changes: TutorValidatedChange[]) {
  return changes.map(({ fileName, status, content }) => ({
    fileName,
    status,
    content,
  }));
}

function buildToolFailureFeedback(
  workspace: TutorWorkspaceEditor,
  name: string,
  args: Record<string, unknown>,
  message: string,
) {
  const path = typeof args.path === "string" ? args.path : "";
  const feedback: Record<string, unknown> = {
    ok: false,
    error: message,
    instruction: "Use list_files/read_file to inspect current scratch files before retrying. Do not call finish until the requested edit has actually changed at least one file.",
  };

  if (message.includes("not valid JSON")) {
    feedback.instruction = "Your tool arguments were invalid JSON, usually because a large replace_file payload was malformed or truncated. Retry with patch_file using small exact search/replace edits, or call read_file first and then use valid JSON arguments.";
  }

  if (path) {
    feedback.path = path;
  }

  if (name === "patch_file" && path) {
    try {
      const currentContent = workspace.readFile(path);
      feedback.currentContentPreview = compactString(currentContent, MAX_FAILURE_CONTENT_PREVIEW_CHARS);
      feedback.currentContentLength = currentContent.length;
      feedback.instruction = "The patch failed against the current file content. Use the preview to choose a smaller exact patch, or call read_file if more context is needed.";
    } catch {
      feedback.availableFiles = workspace.listFiles();
    }
  }

  return feedback;
}

function failureKey(name: string, message: string) {
  return `${name}:${message.replace(/Raw arguments preview:.*/s, "Raw arguments preview")}`;
}

function executeToolCall(
  workspace: TutorWorkspaceEditor,
  name: string,
  args: Record<string, unknown>,
) {
  switch (name) {
    case "list_files":
      return { ok: true, files: workspace.listFiles() };
    case "read_file":
      return { ok: true, path: args.path, content: workspace.readFile(String(args.path ?? "")) };
    case "create_file":
      workspace.createFile(String(args.path ?? ""), String(args.content ?? ""));
      return { ok: true, message: `Created ${String(args.path ?? "")}.` };
    case "replace_file":
      workspace.replaceFile(String(args.path ?? ""), String(args.content ?? ""));
      return { ok: true, message: `Replaced ${String(args.path ?? "")}.` };
    case "patch_file":
      workspace.patchFile(
        String(args.path ?? ""),
        String(args.search ?? ""),
        String(args.replace ?? ""),
        Boolean(args.replaceAll),
      );
      return { ok: true, message: `Patched ${String(args.path ?? "")}.` };
    case "delete_file":
      workspace.deleteFile(String(args.path ?? ""));
      return { ok: true, message: `Deleted ${String(args.path ?? "")}.` };
    default:
      throw new Error(`Unknown tool: ${name}.`);
  }
}

function validateWorkspaceResult({
  workspace,
  files,
  message,
  responseMessage,
  saveTitle,
}: {
  workspace: TutorWorkspaceEditor;
  files: FileItem[];
  message: string;
  responseMessage: string;
  saveTitle?: string;
}) {
  const changes = workspace.getChanges();
  const validationMessage = summarizeTutorEditResponse({
    responseMessage,
    requestMessage: message,
    changes,
  });
  const validation = validateTutorChanges(
    changesToPatchChanges(changes),
    files,
    message,
    validationMessage,
    saveTitle,
  );
  return validation;
}

export async function runTutorToolLoop({
  message,
  conversation,
  files,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  supportContext = "standalone-project",
  provider = openAiTutorToolProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  supportContext?: TutorSupportContext;
  provider?: TutorToolProvider;
}): Promise<TutorToolLoopResult> {
  const workspace = new TutorWorkspaceEditor(files);
  const messages = buildToolLoopMessages({
    message,
    files,
    conversation,
    additionalSystemPrompt,
    levelInstructionsMarkdown,
    levelProgress,
    supportContext,
  }) as TutorToolChatMessage[];
  let lastErrors: string[] = [];
  const toolFailureCounts = new Map<string, number>();

  logTutorInfo("Start", {
    request: message,
    initialFiles: workspace.listFiles().map((file) => file.path),
  });

  for (let step = 0; step < MAX_TOOL_LOOP_STEPS; step += 1) {
    logTutorInfo("Step", { step: step + 1 });
    const requestMessages = compactMessagesForRequest(messages);
    const assistantMessage = await provider.requestToolStep(requestMessages, fileTools);
    if (!assistantMessage) {
      console.info("[TutorToolLoop] No API key; using fallback.");
      return { kind: "no-key" };
    }

    const historyAssistantMessage = compactAssistantMessageForHistory({
      role: "assistant",
      content: assistantMessage.content ?? null,
      tool_calls: assistantMessage.tool_calls,
    });
    messages.push(historyAssistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      const responseMessage =
        assistantMessage.content?.trim() ||
        "I made a set of project edits for you to review.";
      const validation = validateWorkspaceResult({ workspace, files, message, responseMessage });
      if (!("errors" in validation)) {
        logTutorInfo("Finished without tool call", {
          changes: validation.changes.map((change) => `${change.status}:${change.fileName}`),
        });
        return { kind: "ok", result: validation };
      }
      lastErrors = validation.errors;
      logTutorWarn("Validation failed after assistant message", validation.errors);
      messages.push({
        role: "user",
        content: `Validation failed:\n${validation.errors.join("\n")}\nContinue editing the scratch workspace and call finish when fixed.`,
      });
      continue;
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const name = toolCall.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = parseToolArguments(toolCall.function.arguments);
        logTutorInfo("Tool call", {
          name,
          args: name === "replace_file" || name === "create_file"
            ? { ...args, content: `[${String(args.content ?? "").length} chars]` }
            : args,
        });
        if (name === "finish") {
          const responseMessage = String(args.message ?? "").trim() ||
            "I made a set of project edits for you to review.";
          const saveTitle = typeof args.saveTitle === "string" ? args.saveTitle : undefined;
          const validation = validateWorkspaceResult({
            workspace,
            files,
            message,
            responseMessage,
            saveTitle,
          });
          if (!("errors" in validation)) {
            logTutorInfo("Validation passed", {
              changes: validation.changes.map((change) => `${change.status}:${change.fileName}`),
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult({ ok: true, message: "Validation passed." }),
            });
            return { kind: "ok", result: validation };
          }
          lastErrors = validation.errors;
          logTutorWarn("Validation failed on finish", validation.errors);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult({
              ok: false,
              errors: validation.errors,
              instruction: "Fix these issues in the scratch workspace, then call finish again.",
            }),
          });
        } else {
          const output = executeToolCall(workspace, name, args);
          logTutorInfo("Tool result", output);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult(output),
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool call failed.";
        lastErrors = [message];
        const key = failureKey(name, message);
        const failureCount = (toolFailureCounts.get(key) ?? 0) + 1;
        toolFailureCounts.set(key, failureCount);
        const feedback = buildToolFailureFeedback(workspace, name, args, message);
        logTutorError("Tool call failed", {
          name,
          failureCount,
          feedback: {
            ...feedback,
            currentContentPreview: typeof feedback.currentContentPreview === "string"
              ? `[${feedback.currentContentPreview.length} chars]`
              : feedback.currentContentPreview,
          },
        });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult(feedback),
        });
        if (failureCount >= MAX_REPEATED_TOOL_FAILURES) {
          const validation = validateWorkspaceResult({
            workspace,
            files,
            message,
            responseMessage:
              "I made the requested project edit. Review the diff to confirm it looks right.",
          });
          if (!("errors" in validation)) {
            logTutorInfo("Recovered valid changes after repeated tool failure", {
              changes: validation.changes.map((change) => `${change.status}:${change.fileName}`),
            });
            return { kind: "ok", result: validation };
          }
          lastErrors = validation.errors;
          logTutorError("Stopping repeated tool failure", {
            name,
            failureCount,
            error: message,
            validationErrors: validation.errors,
          });
          return {
            kind: "failed",
            errors: [
              `${name} failed ${failureCount} times with the same error.`,
              message,
            ],
          };
        }
      }
    }
  }

  logTutorError("Failed to finish", lastErrors);
  return {
    kind: "failed",
    errors: lastErrors.length > 0
      ? lastErrors
      : [`Tutor tool loop did not finish within ${MAX_TOOL_LOOP_STEPS} steps.`],
  };
}

