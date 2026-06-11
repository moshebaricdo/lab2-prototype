import type { FileItem } from "../../../types/file";
import type { ChatMessage } from "../../../types/chat";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import type { TutorSupportContext } from "../../../types/tutor";
import type { TutorChatMessage, TutorPatchResponse } from "../types";
import { buildConversationContext, buildConversationImageInputs, buildProjectContext } from "../context/contextBuilder";

const NON_ROOT_WRAPPER_FOLDERS = new Set(["Plans"]);

type RequestCapability =
  | "content"
  | "style"
  | "layout"
  | "behavior"
  | "structure"
  | "accessibility"
  | "asset";

const CAPABILITY_PATTERNS: Array<{
  capability: RequestCapability;
  pattern: RegExp;
  guidance: string;
}> = [
  {
    capability: "content",
    pattern: /\b(text|copy|wording|heading|title|label|description|paragraph|caption|content|rename|data|list item)\b/i,
    guidance: "Update the requested text, labels, data, or copy while preserving unrelated content and structure.",
  },
  {
    capability: "style",
    pattern: /\b(color|colour|font|typography|spacing|padding|margin|border|shadow|background|theme|visual|polish|style|restyle|make it look|hover\w*|focus-visible|focus|visited|underline|transition|animate|animation)\b/i,
    guidance: "Prefer CSS changes for visual styling, following the project's existing styling pattern.",
  },
  {
    capability: "layout",
    pattern: /\b(layout|align|center|grid|flex|column|row|position|move|resize|width|height|responsive|mobile|desktop|screen|viewport|breakpoint|overlap|sidebar|panel|header|footer)\b/i,
    guidance: "Adjust HTML structure and CSS together when needed so layout changes are reflected in the rendered page.",
  },
  {
    capability: "behavior",
    pattern: /\b(click|clickable|tap|select|selected|javascript|\bjs\b|event listener|dynamic|toggl\w*|open\w*|clos\w*|show\w*|hid\w*|dropdown|modal|submit|filter|sort)\b/i,
    guidance: "Add real JavaScript or DOM event handling for requested behavior, and make sure it is wired into an HTML entry point.",
  },
  {
    capability: "structure",
    pattern: /\b(add|create|remove|delete|replace|section|card|list|item|nav|navigation|menu|hamburger|button|link|form|input|wrap|group|reorganize|organize)\b/i,
    guidance: "Edit the relevant HTML structure directly and preserve existing semantic landmarks where possible.",
  },
  {
    capability: "accessibility",
    pattern: /\b(accessible|accessibility|aria|keyboard|focus|screen reader|alt text|labelled|labeled|tab order)\b/i,
    guidance: "Preserve or improve labels, focus behavior, keyboard access, and appropriate ARIA only where it matches the UI.",
  },
  {
    capability: "asset",
    pattern: /\b(image|photo|picture|icon|svg|asset|audio|video|media)\b/i,
    guidance: "Use existing project assets or simple HTML/CSS/JS; do not invent unavailable external assets.",
  },
];

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
    !NON_ROOT_WRAPPER_FOLDERS.has(files[0].name) &&
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

function buildRequestCapabilities(message: string, files: FileItem[]) {
  const capabilities = CAPABILITY_PATTERNS
    .filter(({ pattern }) => pattern.test(message))
    .map(({ capability }) => capability);

  if (capabilities.length === 0) {
    return undefined;
  }

  const uniqueCapabilities = Array.from(new Set(capabilities));
  const guidance = CAPABILITY_PATTERNS
    .filter(({ capability }) => uniqueCapabilities.includes(capability))
    .map(({ guidance }) => guidance);

  const styleOnlyGuidance = uniqueCapabilities.includes("style") &&
    !uniqueCapabilities.includes("behavior");

  return {
    capabilities: uniqueCapabilities,
    requiresJavaScript: uniqueCapabilities.includes("behavior"),
    existingJavaScript: hasJavascriptFile(files),
    guidance,
    constraints: [
      "Use only HTML, CSS, and JavaScript supported by this project environment.",
      "Infer targets from the current project files; do not require exact selector or file names from the student.",
      "Prefer editing existing files and patterns before adding new files.",
      "Do not add external dependencies, frameworks, or unavailable assets.",
      ...(styleOnlyGuidance
        ? [
            "For hover, focus, visited, transition, and animation polish, use CSS; do not create or modify JavaScript unless the student explicitly asks for click or dynamic behavior.",
            "Prefer editing the existing stylesheet for style-polish requests.",
          ]
        : []),
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
- When preview-element attachments are present, treat them as the exact rendered element the student selected in the live preview, including its selector, text, computed styles, and HTML snippet.
- When a conversation turn includes attachmentStatus, briefly acknowledge missing or unavailable uploaded files in your normal student-facing response, then continue helping with the files and context you can see. Do not present it as a system error or separate alert.
- When levelInstructionsMarkdown is present, treat it as the curriculum task context and avoid edits outside that scope.
- When levelProgress is present, preserve passed criteria and focus requested help on incomplete criteria unless the student explicitly asks to revisit completed work.
- Keep responses encouraging, specific, and student-friendly.
- Write the student-facing message like a quick handoff, not a tutorial: 2 short paragraphs or 3 bullets max.
- Explain the learning idea briefly. Do not over-explain, narrate every edit, or add generic closers.
- When you propose file edits, the student-facing message must name the main files or page areas changed and explain why those changes help.
- Prefer simple, readable HTML and CSS code that avoids unnecessary complexity (ie. avoid Tailwind, frameworks, or complex selectors). 
- Generate JavaScript when the student explicitly asks for behavior that needs it, or if you infer that the student's request requires it.
- Preserve the student's project intent and style unless they ask for a redesign.

Bias toward useful edits:
- Treat natural-language UI change requests as permission to modify the relevant project files. Do not require the student to name exact files, selectors, ids, or components.
- If the project contains one likely target for a phrase like "detail panel", "card", "header", "sidebar", "footer", or "button", choose that target and edit it.
- Infer targets from visible text, class names, ids, element structure, existing CSS, and file names. Mention your interpretation briefly in the student-facing message.
- For broad layout changes, update both structure and CSS when needed. Prefer exact edits when reliable; use complete full-file content for affected existing files when the layout change is too broad or exact search/replace is brittle.
- Treat request guidance as capabilities, not prescribed implementation. For example, layout requests may need HTML and CSS; behavior requests need JavaScript; accessibility requests need labels, focus, or keyboard support only when relevant to the UI.
- For follow-up requests, treat the provided project context as the current visible state, including any pending AI proposal the student is reviewing.
- If the request asks to build from Plans/PROJECT_PLAN.md, treat that file as requirements context and include a targeted update to Plans/PROJECT_PLAN.md marking completed items and setting Status: Completed under the existing readable title when the build is represented in the proposed files.
- Do not say you cannot make a safe edit plan just because the request is high level. If the intent is clear from the project, make the most reasonable safe edit.

Interactive behavior rules:
- Hover, focus, visited, transition, and visual animation polish are CSS interaction states by default. Do not add JavaScript for them unless the student explicitly asks for click handlers, dynamic content, toggles, or other stateful behavior.
- If the student asks for something to be clickable, selectable, dynamic, stateful, or to update when clicked, you must add actual JavaScript event handling with addEventListener, onclick, or an equivalent DOM event pattern.
- When converting static content into interactive behavior, store or derive the relevant data in JavaScript and update the existing DOM rather than duplicating static markup as a substitute for interactivity.
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
- Generate only HTML, CSS, and JavaScript files. Keep any data the app needs inline in JavaScript (arrays/objects/constants); do not create separate data files (e.g. .json, .csv, .txt) or load local files with fetch()/XMLHttpRequest, since the preview runs a single inlined HTML/CSS/JS bundle and cannot serve local file requests.
- Search strings must match the current file content exactly, including whitespace.
- If the same exact search text intentionally needs to be changed everywhere it appears, set "replaceAll": true.
- Use "replaceAll": true only when every match should change for the user's request.
- Never use placeholders like "... rest of code unchanged", "<!-- rest unchanged -->", "same as before", or abbreviated content as you are working with actual project code.
- If returning "content" for a modified existing file, it must be the complete file from first character to last character, with no omissions.

Respond only as JSON with this exact shape:
{
  "message": "student-facing explanation",
  "saveTitle": "Short commit-style summary for version history, one sentence max, no trailing period, under 72 characters",
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

const CURRICULUM_SUPPORT_PROMPT = `Curriculum-level support:
- The student is working inside a guided level with instructions and learning goals.
- Use levelInstructionsMarkdown as the source of truth for what the level is asking.
- Use levelProgress to understand what the student has already completed and what remains.
- If the student asks for explanation, directions, debugging help, ideas, or a concept, answer pedagogically without changing files.
- Only edit files when the student explicitly asks you to implement or modify the project.
- Do not add explanatory lesson content into the student's page unless the student explicitly asks for that page content.`;

function buildSupportContextPrompt(supportContext: TutorSupportContext) {
  return supportContext === "curriculum-level" ? `\n\n${CURRICULUM_SUPPORT_PROMPT}` : "";
}

export function buildSystemPrompt(
  additionalSystemPrompt = "",
  supportContext: TutorSupportContext = "standalone-project",
) {
  return [
    BASE_SYSTEM_PROMPT,
    buildSupportContextPrompt(supportContext),
    additionalSystemPrompt.trim()
      ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
      : "",
  ].join("");
}

export function getRepairInstruction() {
  return "Return corrected JSON only. Infer the right target from the project code; do not ask for more specificity. If an exact search failed or a search matched too many times, either make the search text larger and more specific, set replaceAll true when every match should change, or replace the affected existing file with complete full-file content. For broad structural edits, full content is allowed only if it is the complete file with unrelated code preserved. If you create or modify a JavaScript file for behavior, also update an HTML file so it references that JavaScript with a script src.";
}

export function buildTutorMessages({
  message,
  files,
  conversation,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  validationErrors,
  previousResponse,
  supportContext = "standalone-project",
}: {
  message: string;
  files: FileItem[];
  conversation: ChatMessage[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  validationErrors?: string[];
  previousResponse?: TutorPatchResponse;
  supportContext?: TutorSupportContext;
}): TutorChatMessage[] {
  const imageInputs = buildConversationImageInputs(conversation);
  const payload: Record<string, unknown> = {
    project: buildProjectContext(files),
    conversation: buildConversationContext(conversation),
    tutorSupportContext: supportContext,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    requestCapabilities: buildRequestCapabilities(message, files),
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
    { role: "system", content: buildSystemPrompt(additionalSystemPrompt, supportContext) },
    { role: "user", content: userContent },
  ];
}

const TOOL_LOOP_SYSTEM_PROMPT = `You are Web Lab Tutor's code-editing agent for small HTML/CSS/JS projects.

Use the available file tools to inspect and edit the project. Do not answer with code blocks. Make the requested project changes directly in the scratch workspace, then call finish with a brief student-facing handoff that names the main files or page areas changed, why those changes help, and what to review next. Keep it to 2 short paragraphs or 3 bullets max, with no generic closer. Include a short saveTitle for version history.

Editing principles:
- Infer the relevant files, selectors, elements, and behavior from the whole project.
- Preview-element attachments identify the exact rendered element the student selected; use their selector, id, text, computed styles, and HTML snippet to choose the target.
- Use list_files and read_file to inspect code before editing. The project root folder is omitted from tool paths; use exact paths like script.js or pages/index.html, not "Project/script.js".
- Do not limit yourself to files touched by earlier requests.
- Treat requestCapabilities as a description of the work type, not a required implementation recipe.
- For content changes, update the targeted text/data while preserving unrelated markup.
- For style or layout changes, inspect the existing HTML/CSS relationship and choose the smallest clear change that makes the rendered page match the request.
- For structure changes, edit the relevant HTML directly and preserve existing semantic landmarks when they exist.
- For behavior changes, add real DOM event handling and make sure the JavaScript can run in preview. If you create or change a JavaScript file, wire it into an HTML entry point with a script src.
- For accessibility changes, add labels, focus behavior, keyboard support, or ARIA only when it matches the UI being changed.
- If the request asks to build from Plans/PROJECT_PLAN.md, read that plan as requirements context and update the plan file to mark completed items and set Status: Completed under the existing readable title when the build is represented in the scratch workspace.
- If levelInstructionsMarkdown is provided, treat it as the curriculum task context and avoid edits outside that scope.
- If levelProgress is provided, preserve passed criteria and target incomplete criteria first.
- If the latest conversation turn includes attachmentStatus, briefly acknowledge missing or unavailable uploaded files in the normal student-facing handoff, then continue with the files and context available.
- If a tool call fails because exact search text did not match or arguments were invalid, read the current file and retry with smaller patch_file edits.
- After reading the relevant files, batch related create_file/patch_file/replace_file calls in the same assistant turn when they are part of one coherent edit.
- Avoid one-file-per-turn editing for multi-file HTML/CSS/JS changes; it is slow and can hit rate limits.
- Prefer creating a JavaScript file for non-trivial behavior when the project has no JavaScript yet.
- Preserve prior accepted project changes as the current baseline.
- Avoid duplicating existing markup when the request is to make existing UI dynamic.
- Keep changes simple, readable, and appropriate for students.
- The finish saveTitle should read like a commit title: one sentence max, no markdown, no trailing period, under 72 characters.
`;

export function buildToolLoopMessages({
  message,
  files,
  conversation,
  additionalSystemPrompt = "",
  levelInstructionsMarkdown = "",
  levelProgress,
  validationErrors = [],
  supportContext = "standalone-project",
}: {
  message: string;
  files: FileItem[];
  conversation: ChatMessage[];
  additionalSystemPrompt?: string;
  levelInstructionsMarkdown?: string;
  levelProgress?: LevelProgressSnapshot;
  validationErrors?: string[];
  supportContext?: TutorSupportContext;
}) {
  const imageInputs = buildConversationImageInputs(conversation);
  const manifest = flattenToolLoopManifest(files);
  const payload: Record<string, unknown> = {
    project: {
      manifest,
      note: "Use read_file to inspect file contents. Tool paths are the manifest paths and do not include the project root folder.",
    },
    conversation: buildConversationContext(conversation),
    tutorSupportContext: supportContext,
    levelInstructionsMarkdown: levelInstructionsMarkdown.trim() || undefined,
    levelProgress,
    requestCapabilities: buildRequestCapabilities(message, files),
    userMessage: message,
  };

  if (validationErrors.length > 0) {
    payload.validationFeedback = {
      errors: validationErrors,
      instruction: "Continue editing the scratch workspace until these errors are fixed, then call finish again.",
    };
  }

  const systemPrompt = [
    TOOL_LOOP_SYSTEM_PROMPT,
    buildSupportContextPrompt(supportContext),
    additionalSystemPrompt.trim()
      ? `\n\nAdditional prototype instructions:\n${additionalSystemPrompt.trim()}`
      : "",
  ].join("");

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
