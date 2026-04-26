import type { FileItem } from "../../types/file";
import type { ChatMessage } from "../../types/chat";
import type { TutorChatMessage, TutorPatchResponse } from "./types";
import { buildConversationContext, buildConversationImageInputs, buildProjectContext } from "./contextBuilder";

const INTERACTIVE_REQUEST_PATTERN =
  /(click|clickable|tap|select|selected|interactive|javascript|\bjs\b|event listener|dynamic|update\s+(the\s+)?(detail|info|panel)|change\s+(the\s+)?(detail|info|panel))/i;

function hasJavascriptFile(files: FileItem[]): boolean {
  return files.some((file) => {
    if (file.children) {
      return hasJavascriptFile(file.children);
    }
    return /\.m?js$/i.test(file.name);
  });
}

function flattenToolLoopManifest(files: FileItem[], parentPath = ""): Array<{
  fileName: string;
  path: string;
  type: FileItem["type"];
}> {
  if (
    parentPath === "" &&
    files.length === 1 &&
    files[0].type === "folder" &&
    files[0].children
  ) {
    return flattenToolLoopManifest(files[0].children);
  }

  return files.flatMap((file) => {
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    if (file.children) {
      return flattenToolLoopManifest(file.children, path);
    }
    if (file.proposedStatus === "deleted" || file.type === "image") {
      return [];
    }
    return [{ fileName: file.name, path, type: file.type }];
  });
}

function buildRequestExpectations(message: string, files: FileItem[]) {
  if (!INTERACTIVE_REQUEST_PATTERN.test(message)) {
    return undefined;
  }

  return {
    requiresJavaScript: true,
    preferredImplementation: hasJavascriptFile(files)
      ? "Modify the existing JavaScript file and any required HTML hooks."
      : "Create script.js for non-trivial behavior and add a script src reference from index.html.",
    mustDo: [
      "Add real event handling for the clickable elements.",
      "Update the existing detail/info panel from JavaScript state or data.",
      "Keep prior accepted layout changes as the current baseline.",
    ],
    mustNotDo: [
      "Do not duplicate the static detail panel markup.",
      "Do not only repeat the currently hard-coded Earth content.",
      "Do not limit edits to files touched by earlier requests if a new JavaScript file is the clearer solution.",
    ],
  };
}

const BASE_SYSTEM_PROMPT = `You are Web Lab Tutor, a supportive coach and generative coding tool for students building small HTML/CSS/JS web projects.

Your job:
- Help the student improve and modify their project while teaching them what changed and why.
- You may edit existing project files, create new files, and delete files when the student's request calls for it.
- Infer the relevant files, elements, classes, and selectors from the project code. The student does not need to mention exact selectors or ids. 
- You may also infer the project intent and style from the project code.
- When image attachments are present, inspect them as visual context. They may be annotated screenshots, mockups, or reference images from the student.
- Keep responses encouraging, specific, and student-friendly.
- Explain the learning idea briefly. Do not over-explain.
- Prefer simple, readable HTML and CSS code that avoids unnecessary complexity (ie. avoid Tailwind, frameworks, or complex selectors). 
- Generate JavaScript when the student explicitly asks for behavior that needs it, or if you infer that the student's request requires it.
- Preserve the student's project intent and style unless they ask for a redesign.

Bias toward useful edits:
- Treat natural-language UI change requests as permission to modify the relevant project files. Do not require the student to name exact files, selectors, ids, or components.
- If the project contains one likely target for a phrase like "detail panel", "card", "header", "sidebar", "footer", or "button", choose that target and edit it.
- Infer targets from visible text, class names, ids, element structure, existing CSS, and file names. Mention your interpretation briefly in the student-facing message.
- For broad layout changes, update both structure and CSS when needed. Prefer exact edits when reliable; use complete full-file content for affected existing files when the layout change is too broad or exact search/replace is brittle.
- For follow-up requests, treat the provided project context as the current visible state, including any pending AI proposal the student is reviewing.
- Do not say you cannot make a safe edit plan just because the request is high level. If the intent is clear from the project, make the most reasonable safe edit.

Interactive behavior rules:
- If the student asks for something to be clickable, selectable, dynamic, interactive, or to update when clicked, you must add actual JavaScript event handling with addEventListener, onclick, or an equivalent DOM event pattern.
- When converting hard-coded detail content into clickable behavior, store data for each item in JavaScript and update the existing detail panel DOM. Do not duplicate the static detail panel markup as a substitute for interactivity.
- For non-trivial interactivity, prefer creating script.js when no JavaScript file exists yet, then add the matching script src reference in index.html.
- Inline script is acceptable only for very small behavior; if using inline script, include a complete script block near the end of index.html.

Editing rules:
- First decide which existing project structure best matches the student's intent, then edit that structure directly.
- For small or medium edits to existing files, use exact search/replace edits.
- For broad structural edits to existing files, you may return full file content, but it must be complete and preserve unrelated code.
- For new files, return the full file content.
- For deleted files, include the file name and status "deleted" with no content.
- If no code edit is needed, return an empty changes array and answer pedagogically.
- Do not include markdown fences in file content.
- Do not invent external assets. Use existing file names or simple CSS/HTML/JavaScript.
- Search strings must match the current file content exactly, including whitespace.
- If the same exact search text intentionally needs to be changed everywhere it appears, set "replaceAll": true.
- Use "replaceAll": true only when every match should change for the user's request.
- Never use placeholders like "... rest of code unchanged", "<!-- rest unchanged -->", "same as before", or abbreviated content as you are working with actual project code.
- If returning "content" for a modified existing file, it must be the complete file from first character to last character, with no omissions.

Respond only as JSON with this exact shape:
{
  "message": "student-facing explanation",
  "changes": [
    {
      "fileName": "index.html",
      "status": "new" | "modified" | "deleted",
      "content": "full file content for new files or broad existing-file replacements",
      "edits": [
        {
          "search": "exact existing text from the current file",
          "replace": "replacement text",
          "replaceAll": false,
          "reason": "brief reason for this edit"
        }
      ]
    }
  ]
}`;

export function buildSystemPrompt(additionalSystemPrompt = "") {
  return additionalSystemPrompt.trim()
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : BASE_SYSTEM_PROMPT;
}

export function getRepairInstruction() {
  return "Return corrected JSON only. Infer the right target from the project code; do not ask for more specificity. If an exact search failed or a search matched too many times, either make the search text larger and more specific, set replaceAll true when every match should change, or replace the affected existing file with complete full-file content. For broad structural edits, full content is allowed only if it is the complete file with unrelated code preserved. If you create or modify a JavaScript file for behavior, also update an HTML file so it references that JavaScript with a script src.";
}

export function buildTutorMessages({
  message,
  files,
  conversation,
  additionalSystemPrompt = "",
  validationErrors,
  previousResponse,
}: {
  message: string;
  files: FileItem[];
  conversation: ChatMessage[];
  additionalSystemPrompt?: string;
  validationErrors?: string[];
  previousResponse?: TutorPatchResponse;
}): TutorChatMessage[] {
  const imageInputs = buildConversationImageInputs(conversation);
  const payload: Record<string, unknown> = {
    project: buildProjectContext(files),
    conversation: buildConversationContext(conversation),
    requestExpectations: buildRequestExpectations(message, files),
    imageAttachments: imageInputs.map(({ fileName, path, source, mimeType, sizeBytes }, index) => ({
      index: index + 1,
      fileName,
      path,
      source,
      mimeType,
      sizeBytes,
    })),
    userMessage: message,
  };

  if (validationErrors?.length) {
    payload.repairInstructions = {
      errors: validationErrors,
      previousResponse,
      instruction: getRepairInstruction(),
    };
  }

  const userContent: TutorChatMessage["content"] =
    imageInputs.length > 0
      ? [
          { type: "text", text: JSON.stringify(payload) },
          ...imageInputs.map((image) => ({
            type: "image_url" as const,
            image_url: {
              url: image.imageDataUrl,
              detail: "auto" as const,
            },
          })),
        ]
      : JSON.stringify(payload);

  return [
    { role: "system", content: buildSystemPrompt(additionalSystemPrompt) },
    { role: "user", content: userContent },
  ];
}

const TOOL_LOOP_SYSTEM_PROMPT = `You are Web Lab Tutor's code-editing agent for small HTML/CSS/JS projects.

Use the available file tools to inspect and edit the project. Do not answer with code blocks. Make the requested project changes directly in the scratch workspace, then call finish with a concise student-facing explanation.

Editing principles:
- Infer the relevant files, selectors, elements, and behavior from the whole project.
- Use list_files and read_file to inspect code before editing. The project root folder is omitted from tool paths; use exact paths like script.js or pages/index.html, not "Project/script.js".
- Do not limit yourself to files touched by earlier requests.
- For CSS/layout follow-up edits, prefer patch_file with small exact search/replace edits. Avoid replace_file for large files unless a broad rewrite is truly necessary.
- If a tool call fails because exact search text did not match or arguments were invalid, read the current file and retry with smaller patch_file edits.
- When behavior is requested, make sure the behavior can run in preview. If you create or change a JavaScript file, wire it into an HTML entry point with a script src.
- Prefer creating a JavaScript file for non-trivial behavior when the project has no JavaScript yet.
- Preserve prior accepted project changes as the current baseline.
- Avoid duplicating existing markup when the request is to make existing UI dynamic.
- Keep changes simple, readable, and appropriate for students.
`;

export function buildToolLoopMessages({
  message,
  files,
  conversation,
  additionalSystemPrompt = "",
  validationErrors = [],
}: {
  message: string;
  files: FileItem[];
  conversation: ChatMessage[];
  additionalSystemPrompt?: string;
  validationErrors?: string[];
}) {
  const imageInputs = buildConversationImageInputs(conversation);
  const manifest = flattenToolLoopManifest(files);
  const payload: Record<string, unknown> = {
    project: {
      manifest,
      note: "Use read_file to inspect file contents. Tool paths are the manifest paths and do not include the project root folder.",
    },
    conversation: buildConversationContext(conversation),
    requestExpectations: buildRequestExpectations(message, files),
    userMessage: message,
  };

  if (validationErrors.length > 0) {
    payload.validationFeedback = {
      errors: validationErrors,
      instruction: "Continue editing the scratch workspace until these errors are fixed, then call finish again.",
    };
  }

  const systemPrompt = additionalSystemPrompt.trim()
    ? `${TOOL_LOOP_SYSTEM_PROMPT}\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
    : TOOL_LOOP_SYSTEM_PROMPT;

  const userContent: TutorChatMessage["content"] =
    imageInputs.length > 0
      ? [
          { type: "text", text: JSON.stringify(payload) },
          ...imageInputs.map((image) => ({
            type: "image_url" as const,
            image_url: {
              url: image.imageDataUrl,
              detail: "auto" as const,
            },
          })),
        ]
      : JSON.stringify(payload);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
}

export { BASE_SYSTEM_PROMPT as TUTOR_SYSTEM_PROMPT };
