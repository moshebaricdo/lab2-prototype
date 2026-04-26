import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import type {
  TutorToolAssistantMessage,
  TutorToolChatMessage,
  TutorToolDefinition,
} from "./types";
import { runTutorToolLoop } from "./toolLoopRunner";
import { buildPreviewSrcDoc } from "../../components/ide/weblab2/views/buildPreviewSrcDoc";

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

function finish(message: string, id: string): TutorToolAssistantMessage {
  return callTool("finish", { message }, id);
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

describe("tutor tool-loop harness", () => {
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
        finish("I moved the detail panel into a right sidebar.", "layout-2"),
      ]),
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: "styles.css", status: "modified" }),
    ]));
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

