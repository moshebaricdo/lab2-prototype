import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../types/file";
import type {
  TutorToolAssistantMessage,
  TutorToolChatMessage,
  TutorToolDefinition,
} from "../types";
import { runTutorToolLoop } from "./toolLoopRunner";
import { buildToolLoopMessages } from "../provider/promptBuilder";
import { buildPreviewSrcDoc } from "../../../components/ide/weblab2/views/buildPreviewSrcDoc";

function rootProject(children: FileItem[]): FileItem[] {
  return [{ name: "Project", type: "folder", children }];
}

function callTool(name: string, args: Record<string, unknown>, id: string): TutorToolAssistantMessage {
  return {
    role: "assistant",
    content: null,
    tool_calls: [{
      id,
      type: "function",
      function: {
        name,
        arguments: JSON.stringify(args),
      },
    }],
  };
}

function callToolRaw(name: string, rawArguments: string, id: string): TutorToolAssistantMessage {
  return {
    role: "assistant",
    content: null,
    tool_calls: [{
      id,
      type: "function",
      function: {
        name,
        arguments: rawArguments,
      },
    }],
  };
}

function finish(message: string, id: string, saveTitle?: string): TutorToolAssistantMessage {
  return callTool("finish", { message, ...(saveTitle ? { saveTitle } : {}) }, id);
}

class ScriptedToolProvider {
  private index = 0;

  constructor(private readonly steps: TutorToolAssistantMessage[]) {}

  async requestToolStep(
    _messages: TutorToolChatMessage[],
    _tools: TutorToolDefinition[],
  ) {
    const step = this.steps[this.index];
    this.index += 1;
    return step ?? finish("Done.", `finish-${this.index}`);
  }
}

class CapturingToolProvider {
  private index = 0;
  readonly messageSnapshots: TutorToolChatMessage[][] = [];

  constructor(private readonly steps: TutorToolAssistantMessage[]) {}

  async requestToolStep(
    messages: TutorToolChatMessage[],
    _tools: TutorToolDefinition[],
  ) {
    this.messageSnapshots.push(structuredClone(messages));
    const step = this.steps[this.index];
    this.index += 1;
    return step ?? finish("Done.", `finish-${this.index}`);
  }
}

class CapturingSchemaProvider {
  tools: TutorToolDefinition[] = [];

  async requestToolStep(
    _messages: TutorToolChatMessage[],
    tools: TutorToolDefinition[],
  ) {
    this.tools = tools;
    return null;
  }
}

function getToolLoopPayload(messages: ReturnType<typeof buildToolLoopMessages>) {
  const userMessage = messages[1];
  const content = userMessage.content;
  const text = typeof content === "string"
    ? content
    : content.find((item) => item.type === "text")?.text;
  return JSON.parse(text ?? "{}") as {
    requestCapabilities?: {
      capabilities?: string[];
      requiresJavaScript?: boolean;
      existingJavaScript?: boolean;
      guidance?: string[];
      constraints?: string[];
    };
  };
}

describe("tutor tool-loop harness", () => {
  it("uses a strict finish tool schema accepted by OpenAI", async () => {
    const provider = new CapturingSchemaProvider();

    await runTutorToolLoop({
      message: "Change the heading.",
      conversation: [],
      files: rootProject([{
        name: "index.html",
        type: "html",
        content: "<h1>Before</h1>",
      }]),
      provider,
    });

    const finishTool = provider.tools.find((tool) => tool.function.name === "finish");
    const parameters = finishTool?.function.parameters as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    expect(parameters.required?.sort()).toEqual(Object.keys(parameters.properties ?? {}).sort());
  });

  it("infers broad capabilities for mixed HTML/CSS/JS requests", () => {
    const messages = buildToolLoopMessages({
      message: "Make this recipe page work better on mobile, add a button that shows and hides the ingredients, and improve the labels for keyboard users.",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<!doctype html><html><body><main><h1>Soup</h1><section id="ingredients"><h2>Ingredients</h2></section></main><script src="app.js"></script></body></html>',
        },
        {
          name: "styles.css",
          type: "css",
          content: "main { display: grid; grid-template-columns: 1fr 1fr; }\n",
        },
        {
          name: "app.js",
          type: "file",
          content: "const ingredients = document.getElementById('ingredients');\n",
        },
      ]),
    });

    const payload = getToolLoopPayload(messages);

    expect(payload.requestCapabilities).toEqual(expect.objectContaining({
      requiresJavaScript: true,
      existingJavaScript: true,
    }));
    expect(payload.requestCapabilities?.capabilities).toEqual(expect.arrayContaining([
      "layout",
      "behavior",
      "accessibility",
    ]));
    expect(payload.requestCapabilities?.constraints).toEqual(expect.arrayContaining([
      expect.stringContaining("HTML, CSS, and JavaScript"),
      expect.stringContaining("external dependencies"),
    ]));
  });

  it("handles a generic layout restructuring edit", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<main><section class="gallery"></section><aside class="detail-panel">Earth</aside></main>',
      },
      {
        name: "styles.css",
        type: "css",
        content: ".detail-panel {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n}\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Move the bottom detail panel into a right sidebar.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", {
          path: "styles.css",
          search: ".detail-panel {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n}\n",
          replace: ".detail-panel {\n  position: fixed;\n  top: 0;\n  right: 0;\n  height: 100vh;\n}\n",
          replaceAll: false,
        }, "layout-1"),
        finish("I moved the detail panel into a right sidebar.", "layout-2", "Move detail panel into sidebar"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: "styles.css", status: "modified" }),
    ]));
    expect(result.result.saveTitle).toBe("Move detail panel into sidebar");
  });

  it("allows CSS-only tuning of existing open-state behavior", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<main><div id="canvas-wrap"></div><div id="info-panel"></div><script src="main.js"></script></main>',
      },
      {
        name: "styles.css",
        type: "css",
        content: "@media (max-width: 700px) {\n  #canvas-wrap.shift-up {\n    transform: translateY(-33vh);\n  }\n}\n",
      },
      {
        name: "main.js",
        type: "file",
        content: "document.getElementById('info-panel')?.classList.add('open');\ndocument.getElementById('canvas-wrap')?.classList.add('shift-up');\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Thanks! Can you make it so that it moves up less? Right now it's moving too far up and the solar system visual gets cut off at the top when the info panel opens.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", {
          path: "styles.css",
          search: "transform: translateY(-33vh);",
          replace: "transform: translateY(-18vh);",
          replaceAll: false,
        }, "css-tune-1"),
        finish(
          "I reduced the CSS shift amount. No JavaScript changes were needed because the existing dynamic behavior already toggles the class.",
          "css-tune-2",
          "Reduce mobile canvas shift",
        ),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "styles.css", status: "modified" }),
    ]);
  });

  it("salvages valid edits after repeated stale patch failures", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<main><div id="canvas-wrap"></div><div id="info-panel"></div><script src="main.js"></script></main>',
      },
      {
        name: "styles.css",
        type: "css",
        content: "@media (max-width: 700px) {\n  #canvas-wrap.shift-up {\n    transform: translateY(-33vh);\n  }\n}\n",
      },
      {
        name: "main.js",
        type: "file",
        content: "document.getElementById('info-panel')?.classList.add('open');\ndocument.getElementById('canvas-wrap')?.classList.add('shift-up');\n",
      },
    ]);

    const stalePatch = {
      path: "styles.css",
      search: "#canvas-wrap.shift-up {\n    transform: translateY(-33vh);",
      replace: "#canvas-wrap.shift-up {\n    transform: translateY(-22vh);",
      replaceAll: false,
    };
    const result = await runTutorToolLoop({
      message: "On mobile, the solar system moves up too aggressively when the info panel is visible. Reduce how much it moves up a little bit.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", stalePatch, "stale-1"),
        callTool("patch_file", stalePatch, "stale-2"),
        callTool("patch_file", stalePatch, "stale-3"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({
        fileName: "styles.css",
        status: "modified",
        content: expect.stringContaining("translateY(-22vh)"),
      }),
    ]);
  });

  it("does not accept a no-op finish for an edit request", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<main><aside class="detail-panel">Earth</aside></main>',
      },
      {
        name: "styles.css",
        type: "css",
        content: ".detail-panel { position: fixed; bottom: 0; }\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Make the detail panel a sidebar.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        finish("I made the detail panel a sidebar.", "noop-1"),
        callTool("replace_file", {
          path: "styles.css",
          content: ".detail-panel { position: fixed; right: 0; top: 0; height: 100vh; }\n",
        }, "noop-2"),
        finish("I made the detail panel a sidebar.", "noop-3"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "styles.css", status: "modified" }),
    ]);
  });

  it("recovers from one malformed tool argument by retrying with a patch", async () => {
    const files = rootProject([
      {
        name: "style.css",
        type: "css",
        content: ".detail-panel {\n  grid-area: detail;\n}\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Move the detail panel to a right sidebar.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callToolRaw("replace_file", "{\"path\":\"style.css\",\"content\":\".detail-panel {", "bad-json-1"),
        callTool("patch_file", {
          path: "style.css",
          search: ".detail-panel {\n  grid-area: detail;\n}\n",
          replace: ".detail-panel {\n  grid-area: detail;\n  position: fixed;\n  right: 0;\n  top: 0;\n  height: 100vh;\n}\n",
          replaceAll: false,
        }, "bad-json-2"),
        finish("I moved the detail panel to a right sidebar.", "bad-json-3"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "style.css", status: "modified" }),
    ]);
  });

  it("stops repeated malformed tool arguments instead of looping", async () => {
    const files = rootProject([
      {
        name: "style.css",
        type: "css",
        content: ".detail-panel { grid-area: detail; }\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Move the detail panel to a right sidebar.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callToolRaw("replace_file", "{\"path\":\"style.css\",\"content\":\".detail-panel {", "bad-loop-1"),
        callToolRaw("replace_file", "{\"path\":\"style.css\",\"content\":\".detail-panel {", "bad-loop-2"),
      ]),
    });

    expect(result.kind).toBe("failed");
    if (result.kind !== "failed") return;
    expect(result.errors[0]).toContain("replace_file failed 2 times");
  });

  it("keeps patch failure feedback concise for large files", async () => {
    const longContent = `const state = 'old';\n${"// filler line\n".repeat(500)}`;
    const files = rootProject([
      {
        name: "app.js",
        type: "file",
        content: longContent,
      },
    ]);
    const provider = new CapturingToolProvider([
      callTool("patch_file", {
        path: "app.js",
        search: "",
        replace: "const state = 'new';",
        replaceAll: false,
      }, "concise-failure-1"),
      callTool("patch_file", {
        path: "app.js",
        search: "const state = 'old';",
        replace: "const state = 'new';",
        replaceAll: false,
      }, "concise-failure-2"),
      finish("I updated the app state.", "concise-failure-3"),
    ]);

    const result = await runTutorToolLoop({
      message: "Update the app state text.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");
    const retryMessages = provider.messageSnapshots[1];
    const feedback = JSON.parse(String(retryMessages.at(-1)?.content ?? "{}")) as {
      currentContent?: string;
      currentContentPreview?: string;
      currentContentLength?: number;
    };
    expect(feedback.currentContent).toBeUndefined();
    expect(feedback.currentContentLength).toBe(longContent.length);
    expect(feedback.currentContentPreview?.length).toBeLessThan(longContent.length);
    expect(feedback.currentContentPreview?.length).toBeLessThanOrEqual(1700);
  });

  it("compacts large tool arguments in conversation history", async () => {
    const largeReplacement = `body {\n  color: black;\n}\n${".card { margin: 1rem; }\n".repeat(300)}`;
    const files = rootProject([
      {
        name: "styles.css",
        type: "css",
        content: "body {\n  color: navy;\n}\n",
      },
    ]);
    const provider = new CapturingToolProvider([
      callTool("replace_file", {
        path: "styles.css",
        content: largeReplacement,
      }, "compact-history-1"),
      finish("I updated the stylesheet.", "compact-history-2"),
    ]);

    const result = await runTutorToolLoop({
      message: "Restyle the page cards.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");
    const secondRequestMessages = provider.messageSnapshots[1];
    const assistantWithToolCall = secondRequestMessages.find((message) =>
      message.role === "assistant" && message.tool_calls?.[0]?.function.name === "replace_file"
    );
    const historyArgs = assistantWithToolCall?.tool_calls?.[0]?.function.arguments ?? "";
    expect(historyArgs.length).toBeLessThan(largeReplacement.length);
    expect(historyArgs).toContain("_historyCompacted");
  });

  it("compacts consumed read_file results but preserves fresh tool output", async () => {
    const longContent = `const headline = 'Before';\n${"const item = 'content';\n".repeat(500)}`;
    const files = rootProject([
      {
        name: "app.js",
        type: "file",
        content: longContent,
      },
    ]);
    const provider = new CapturingToolProvider([
      callTool("read_file", {
        path: "app.js",
      }, "compact-read-1"),
      callTool("patch_file", {
        path: "app.js",
        search: "const headline = 'Before';",
        replace: "const headline = 'After';",
        replaceAll: false,
      }, "compact-read-2"),
      finish("I updated the headline.", "compact-read-3"),
    ]);

    const result = await runTutorToolLoop({
      message: "Update the headline text.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");

    const stepAfterRead = provider.messageSnapshots[1];
    const freshReadResult = JSON.parse(String(stepAfterRead.at(-1)?.content ?? "{}")) as {
      content?: string;
      contentPreview?: string;
    };
    expect(freshReadResult.content).toBe(longContent);
    expect(freshReadResult.contentPreview).toBeUndefined();

    const stepAfterPatch = provider.messageSnapshots[2];
    const compactedReadMessage = stepAfterPatch.find((message) =>
      message.role === "tool" && message.tool_call_id === "compact-read-1"
    );
    const compactedReadResult = JSON.parse(String(compactedReadMessage?.content ?? "{}")) as {
      content?: string;
      contentPreview?: string;
      contentLength?: number;
      _historyCompacted?: string;
    };
    expect(compactedReadResult.content).toBeUndefined();
    expect(compactedReadResult.contentLength).toBe(longContent.length);
    expect(compactedReadResult.contentPreview?.length).toBeLessThan(longContent.length);
    expect(compactedReadResult._historyCompacted).toContain("compacted");
  });

  it("repairs a first JavaScript behavior edit after validation feedback", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><main><button class="planet">Earth</button><aside class="detail-panel">Earth</aside></main></body></html>',
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Make the planet clickable so it updates the detail panel dynamically.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("create_file", {
          path: "script.js",
          content: "document.querySelector('.planet')?.addEventListener('click', () => {\n  document.querySelector('.detail-panel').textContent = 'Clicked Earth';\n});\n",
        }, "js-1"),
        finish("I added the click behavior.", "js-2"),
        callTool("patch_file", {
          path: "index.html",
          search: "</body>",
          replace: '<script src="script.js"></script></body>',
          replaceAll: false,
        }, "js-3"),
        finish("I added click behavior and wired the script into the page.", "js-4"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: "script.js", status: "new" }),
      expect.objectContaining({ fileName: "index.html", status: "modified" }),
    ]));
  });

  it("adds behavior to an existing JavaScript file", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><button id="answer">Answer</button><script src="script.js"></script></body></html>',
      },
      {
        name: "script.js",
        type: "file",
        content: "const answer = document.getElementById('answer');\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Make the answer button interactive.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", {
          path: "script.js",
          search: "const answer = document.getElementById('answer');\n",
          replace: "const answer = document.getElementById('answer');\nanswer?.addEventListener('click', () => {\n  answer.textContent = 'Correct!';\n});\n",
          replaceAll: false,
        }, "existing-js-1"),
        finish("I made the existing button interactive.", "existing-js-2"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "script.js", status: "modified" }),
    ]);
  });

  it("creates a new linked stylesheet file", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: "<!doctype html><html><head></head><body><main><h1>Hello</h1></main></body></html>",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Move the page styling into a separate stylesheet.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("create_file", {
          path: "styles.css",
          content: "main {\n  max-width: 48rem;\n}\n",
        }, "css-1"),
        callTool("patch_file", {
          path: "index.html",
          search: "<head>",
          replace: '<head><link rel="stylesheet" href="styles.css">',
          replaceAll: false,
        }, "css-2"),
        finish("I created and linked a stylesheet.", "css-3"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: "styles.css", status: "new" }),
      expect.objectContaining({ fileName: "index.html", status: "modified" }),
    ]));
  });

  it("uses accepted follow-up state as the next editing baseline", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><main><aside class="detail-panel side-panel">Earth</aside><script src="script.js"></script></main></body></html>',
      },
      {
        name: "script.js",
        type: "file",
        content: "const data = { earth: 'Earth' };\ndocument.querySelector('.detail-panel').textContent = data.earth;\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Add Mars to the existing planet data.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", {
          path: "script.js",
          search: "const data = { earth: 'Earth' };",
          replace: "const data = { earth: 'Earth', mars: 'Mars' };",
          replaceAll: false,
        }, "follow-up-1"),
        finish("I added Mars to the existing data.", "follow-up-2"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "script.js", status: "modified" }),
    ]);
  });

  it("supports Stellar Atlas as one representative fixture", async () => {
    const files: FileItem[] = [{
      name: "Stellar Atlas",
      type: "folder",
      children: [
        {
          name: "index.html",
          type: "html",
          content: '<!doctype html><html><body><main><ul class="planet-list"><li data-planet="earth">Earth</li><li data-planet="mars">Mars</li></ul><aside class="detail-panel">Earth</aside></main></body></html>',
        },
        {
          name: "styles.css",
          type: "css",
          content: ".detail-panel { position: fixed; right: 0; }\n",
        },
      ],
    }];

    const result = await runTutorToolLoop({
      message: "Make each planet selectable and update the right-side detail panel.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("read_file", {
          path: "Stellar Atlas/index.html",
        }, "stellar-root-alias"),
        callTool("create_file", {
          path: "script.js",
          content: "const planetDetails = { earth: 'Earth', mars: 'Mars' };\ndocument.querySelectorAll('[data-planet]').forEach((item) => {\n  item.addEventListener('click', () => {\n    document.querySelector('.detail-panel').textContent = planetDetails[item.dataset.planet];\n  });\n});\n",
        }, "stellar-1"),
        callTool("patch_file", {
          path: "index.html",
          search: "</body>",
          replace: '<script src="script.js"></script></body>',
          replaceAll: false,
        }, "stellar-2"),
        finish("I made the planet list update the detail panel.", "stellar-3"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes.map((change) => change.fileName)).toEqual(
      expect.arrayContaining(["index.html", "script.js"]),
    );
  });

  it("repairs mixed layout and behavior edits after validation feedback", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><main><section class="gallery"><figure><img src="photo.jpg" alt="City skyline"><figcaption>City skyline</figcaption></figure></section><script src="app.js"></script></main></body></html>',
      },
      {
        name: "styles.css",
        type: "css",
        content: ".gallery { display: grid; grid-template-columns: repeat(3, 1fr); }\nfigcaption { display: block; }\n",
      },
      {
        name: "app.js",
        type: "file",
        content: "const gallery = document.querySelector('.gallery');\n",
      },
    ]);

    const result = await runTutorToolLoop({
      message: "Make the gallery more responsive and add a button that toggles the photo captions.",
      conversation: [],
      files,
      provider: new ScriptedToolProvider([
        callTool("patch_file", {
          path: "styles.css",
          search: ".gallery { display: grid; grid-template-columns: repeat(3, 1fr); }\n",
          replace: ".gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }\n",
          replaceAll: false,
        }, "mixed-first-1"),
        finish("I made the gallery more responsive.", "mixed-first-2"),
        callTool("patch_file", {
          path: "index.html",
          search: '<main><section class="gallery">',
          replace: '<main><button id="caption-toggle" aria-pressed="false">Hide captions</button><section class="gallery">',
          replaceAll: false,
        }, "mixed-repair-1"),
        callTool("patch_file", {
          path: "styles.css",
          search: "figcaption { display: block; }\n",
          replace: "figcaption { display: block; }\n.gallery.captions-hidden figcaption { display: none; }\n",
          replaceAll: false,
        }, "mixed-repair-2"),
        callTool("patch_file", {
          path: "app.js",
          search: "const gallery = document.querySelector('.gallery');\n",
          replace: "const gallery = document.querySelector('.gallery');\nconst captionToggle = document.getElementById('caption-toggle');\ncaptionToggle?.addEventListener('click', () => {\n  const captionsHidden = gallery?.classList.toggle('captions-hidden') ?? false;\n  captionToggle.textContent = captionsHidden ? 'Show captions' : 'Hide captions';\n  captionToggle.setAttribute('aria-pressed', String(captionsHidden));\n});\n",
          replaceAll: false,
        }, "mixed-repair-3"),
        finish("I made the gallery responsive and added a caption toggle button.", "mixed-repair-4"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: "index.html", status: "modified" }),
      expect.objectContaining({ fileName: "styles.css", status: "modified" }),
      expect.objectContaining({ fileName: "app.js", status: "modified" }),
    ]));
  });

  it("inlines local scripts in the preview srcdoc", () => {
    const srcDoc = buildPreviewSrcDoc(
      rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<!doctype html><html><body><button id="planet">Earth</button><script src="script.js"></script></body></html>',
        },
        {
          name: "script.js",
          type: "file",
          content: "document.getElementById('planet')?.addEventListener('click', () => {});",
        },
      ]),
      false,
      "index.html",
    );

    expect(srcDoc).toContain('data-preview-source="script.js"');
    expect(srcDoc).toContain("addEventListener");
    expect(srcDoc).not.toContain('<script src="script.js"></script>');
  });
});

