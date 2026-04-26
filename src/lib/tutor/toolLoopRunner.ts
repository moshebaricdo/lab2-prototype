import type { FileItem } from "../../types/file";
import type { ChatMessage } from "../../types/chat";
import { openAiTutorToolProvider, type TutorToolProvider } from "./openAiProvider";
import { buildToolLoopMessages } from "./promptBuilder";
import { validateTutorChanges } from "./editValidator";
import type {
  TutorEditResult,
  TutorToolChatMessage,
  TutorToolDefinition,
  TutorValidatedChange,
} from "./types";
import { TutorWorkspaceEditor } from "./workspaceEditor";

const MAX_TOOL_LOOP_STEPS = 10;
const MAX_REPEATED_TOOL_FAILURES = 2;

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
        },
        required: ["message"],
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
      feedback.currentContent = workspace.readFile(path);
      feedback.instruction = "The patch failed against the current file content. Use this currentContent to create a new exact patch, or use replace_file with the complete updated file.";
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
}: {
  workspace: TutorWorkspaceEditor;
  files: FileItem[];
  message: string;
  responseMessage: string;
}) {
  const changes = workspace.getChanges();
  const validation = validateTutorChanges(
    changesToPatchChanges(changes),
    files,
    message,
    responseMessage,
  );
  return validation;
}

export async function runTutorToolLoop({
  message,
  conversation,
  files,
  additionalSystemPrompt = "",
  provider = openAiTutorToolProvider,
}: {
  message: string;
  conversation: ChatMessage[];
  files: FileItem[];
  additionalSystemPrompt?: string;
  provider?: TutorToolProvider;
}): Promise<TutorToolLoopResult> {
  const workspace = new TutorWorkspaceEditor(files);
  const messages = buildToolLoopMessages({
    message,
    files,
    conversation,
    additionalSystemPrompt,
  }) as TutorToolChatMessage[];
  let lastErrors: string[] = [];
  const toolFailureCounts = new Map<string, number>();

  logTutorInfo("Start", {
    request: message,
    initialFiles: workspace.listFiles().map((file) => file.path),
  });

  for (let step = 0; step < MAX_TOOL_LOOP_STEPS; step += 1) {
    logTutorInfo("Step", { step: step + 1 });
    const assistantMessage = await provider.requestToolStep(messages, fileTools);
    if (!assistantMessage) {
      console.info("[TutorToolLoop] No API key; using fallback.");
      return { kind: "no-key" };
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? null,
      tool_calls: assistantMessage.tool_calls,
    });

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
          const validation = validateWorkspaceResult({ workspace, files, message, responseMessage });
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
            currentContent: typeof feedback.currentContent === "string"
              ? `[${feedback.currentContent.length} chars]`
              : feedback.currentContent,
          },
        });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult(feedback),
        });
        if (failureCount >= MAX_REPEATED_TOOL_FAILURES) {
          logTutorError("Stopping repeated tool failure", {
            name,
            failureCount,
            error: message,
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

