import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import { applyStructuredEditsAtomically } from "./atomicEditApplicator";
import { packTutorContext } from "./contextPacker";
import { runTutorEditSession } from "./editSessionRunner";
import { getRetryDelayMs, type TutorStructuredEditProvider } from "./openAiProvider";
import { analyzeProject } from "./projectAnalyzer";
import type { TutorChatMessage, TutorStructuredEditResponse } from "./types";
import { validateWebProjectChanges } from "./webProjectValidator";

function rootProject(children: FileItem[]): FileItem[] {
  return [{ name: "Project", type: "folder", children }];
}

class ScriptedStructuredProvider implements TutorStructuredEditProvider {
  private index = 0;
  readonly messages: TutorChatMessage[][] = [];

  constructor(private readonly responses: Array<TutorStructuredEditResponse | null>) {}

  async requestStructuredEdit(messages: TutorChatMessage[]) {
    this.messages.push(messages);
    const response = this.responses[this.index];
    this.index += 1;
    return response ?? null;
  }
}

describe("staged tutor edit session", () => {
  it("packs large JavaScript files as bounded snippets instead of full content", () => {
    const largeJs = [
      "const state = {};",
      "function initializeGallery() {",
      "  document.querySelector('.gallery')?.addEventListener('click', () => {});",
      "}",
      "function resizeCanvas() {",
      "  const canvas = document.getElementById('solar-canvas');",
      "}",
      "initializeGallery();",
      "resizeCanvas();",
      "const filler = 1;",
    ].join("\n") + "\n" + "const fillerValue = 42;\n".repeat(900);
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><main><canvas id="solar-canvas"></canvas><script src="app.js"></script></main></body></html>',
      },
      {
        name: "app.js",
        type: "file",
        content: largeJs,
      },
    ]);

    const context = packTutorContext(
      analyzeProject(files),
      "Make the canvas responsive and add a toggle button.",
      9000,
    );
    const packedJs = context.files.find((file) => file.path === "app.js");

    expect(context.usedChars).toBeLessThanOrEqual(context.budgetChars);
    expect(packedJs?.mode).not.toBe("full");
    expect(JSON.stringify(packedJs).length).toBeLessThan(largeJs.length);
    expect(JSON.stringify(packedJs)).toContain("resizeCanvas");
  });

  it("applies structured edits atomically and rejects partial failure", () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: "<main><h1>Before</h1></main>",
      },
      {
        name: "styles.css",
        type: "css",
        content: "main { color: navy; }\n",
      },
    ]);

    const result = applyStructuredEditsAtomically(files, [
      {
        path: "index.html",
        strategy: "searchReplace",
        replacements: [{ search: "Before", replace: "After" }],
      },
      {
        path: "styles.css",
        strategy: "searchReplace",
        replacements: [{ search: ".missing", replace: ".present" }],
      },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok !== false) return;
    expect(result.errors[0]).toContain("not found");
  });

  it("repairs a failed first edit with compact validation feedback", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: "<!doctype html><html><body><main><button id=\"demo\">Demo</button></main></body></html>",
      },
    ]);
    const provider = new ScriptedStructuredProvider([
      {
        message: "I added the click behavior.",
        edits: [{
          path: "app.js",
          strategy: "replace",
          content: "document.getElementById('demo')?.addEventListener('click', () => {\n  document.body.classList.toggle('active');\n});\n",
        }],
      },
      {
        message: "I added the script and wired it into the page.",
        saveTitle: "Add demo button interaction",
        edits: [
          {
            path: "app.js",
            strategy: "replace",
            content: "document.getElementById('demo')?.addEventListener('click', () => {\n  document.body.classList.toggle('active');\n});\n",
          },
          {
            path: "index.html",
            strategy: "searchReplace",
            replacements: [{
              search: "</body>",
              replace: '<script src="app.js"></script></body>',
            }],
          },
        ],
      },
    ]);

    const result = await runTutorEditSession({
      message: "Make the demo button interactive.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(provider.messages).toHaveLength(2);
    expect(JSON.stringify(provider.messages[1])).toContain("previousResponse");
    expect(result.result.changes.map((change) => change.fileName)).toEqual(
      expect.arrayContaining(["app.js", "index.html"]),
    );
    expect(result.result.saveTitle).toBe("Add demo button interaction");
  });

  it("uses a second structured repair before falling back", async () => {
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: "<!doctype html><html><body><main><button id=\"demo\">Demo</button></main></body></html>",
      },
    ]);
    const unwiredScript = {
      path: "app.js",
      strategy: "replace" as const,
      content: "document.getElementById('demo')?.addEventListener('click', () => {\n  document.body.classList.toggle('active');\n});\n",
    };
    const provider = new ScriptedStructuredProvider([
      {
        message: "I added the click behavior.",
        edits: [unwiredScript],
      },
      {
        message: "I added the click behavior.",
        edits: [unwiredScript],
      },
      {
        message: "I wired the click behavior into the page.",
        saveTitle: "Wire demo button script",
        edits: [
          unwiredScript,
          {
            path: "index.html",
            strategy: "searchReplace",
            replacements: [{
              search: "</body>",
              replace: '<script src="app.js"></script></body>',
            }],
          },
        ],
      },
    ]);

    const result = await runTutorEditSession({
      message: "Make the demo button interactive.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(provider.messages).toHaveLength(3);
    expect(String(provider.messages[2][1].content)).toContain("\"repairAttempt\":2");
    expect(result.result.saveTitle).toBe("Wire demo button script");
  });

  it("validates CSS brace balance", () => {
    const files = rootProject([
      {
        name: "styles.css",
        type: "css",
        content: "main { color: navy; }\n",
      },
    ]);
    const applyResult = applyStructuredEditsAtomically(files, [{
      path: "styles.css",
      strategy: "replace",
      content: "main { color: navy;\n",
    }]);

    expect(applyResult.ok).toBe(true);
    if (!applyResult.ok) return;
    const validation = validateWebProjectChanges({
      files,
      changes: applyResult.changes,
      requestMessage: "Update the page styles.",
      responseMessage: "I updated the page styles.",
    });
    expect("errors" in validation && validation.errors[0]).toContain("unmatched opening brace");
  });

  it("returns no-key when the staged provider has no API key", async () => {
    const result = await runTutorEditSession({
      message: "Change the heading.",
      conversation: [],
      files: rootProject([{
        name: "index.html",
        type: "html",
        content: "<h1>Before</h1>",
      }]),
      provider: new ScriptedStructuredProvider([null]),
    });

    expect(result.kind).toBe("no-key");
  });

  it("smoke-tests the responsive solar app prompt through one staged edit call", async () => {
    const largeMainJs = [
      "const canvas = document.getElementById('solar-canvas');",
      "function resize() {",
      "  const wrap = document.getElementById('canvas-wrap');",
      "  canvas.width = Math.min(wrap.clientWidth, wrap.clientHeight);",
      "}",
      "function buildSidebar() {",
      "  document.getElementById('planet-list').textContent = 'Earth';",
      "}",
      "buildSidebar();",
      "resize();",
      "window.addEventListener('resize', resize);",
    ].join("\n") + "\n" + "planetData.push('large data');\n".repeat(700);
    const files = rootProject([
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><body><div id="app"><div id="sidebar"><h1>Our Solar System</h1><div id="planet-list"></div></div><div id="canvas-wrap"><canvas id="solar-canvas"></canvas></div><div id="info-panel"></div></div><script src="main.js"></script></body></html>',
      },
      {
        name: "styles.css",
        type: "css",
        content: "#app { display: flex; height: 100vh; }\n#sidebar { width: 230px; }\n#canvas-wrap { flex: 1; }\n#info-panel.open { width: 290px; }\n",
      },
      {
        name: "main.js",
        type: "file",
        content: largeMainJs,
      },
    ]);
    const provider = new ScriptedStructuredProvider([{
      message: "I made the layout responsive with a mobile menu and bottom info panel.",
      edits: [
        {
          path: "index.html",
          strategy: "searchReplace",
          replacements: [{
            search: '<div id="app">',
            replace: '<div id="app"><button id="mobile-menu-toggle" aria-expanded="false" aria-controls="sidebar">Planets</button>',
          }],
        },
        {
          path: "styles.css",
          strategy: "searchReplace",
          replacements: [{
            search: "#info-panel.open { width: 290px; }\n",
            replace: "#info-panel.open { width: 290px; }\n@media (max-width: 700px) {\n  #app { display: grid; grid-template-rows: 10vh 50vh 40vh; height: 100dvh; }\n  #mobile-menu-toggle { display: block; }\n  #sidebar { position: fixed; top: 10vh; left: 0; transform: translateX(-100%); }\n  #sidebar.open { transform: translateX(0); }\n  #canvas-wrap { grid-row: 2; min-height: 0; }\n  #info-panel.open { grid-row: 3; width: 100%; height: 40vh; }\n}\n",
          }],
        },
        {
          path: "main.js",
          strategy: "searchReplace",
          replacements: [{
            search: "window.addEventListener('resize', resize);",
            replace: "window.addEventListener('resize', resize);\nconst mobileMenuToggle = document.getElementById('mobile-menu-toggle');\nconst sidebar = document.getElementById('sidebar');\nmobileMenuToggle?.addEventListener('click', () => {\n  const isOpen = sidebar?.classList.toggle('open') ?? false;\n  mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));\n});",
          }],
        },
      ],
    }]);

    const result = await runTutorEditSession({
      message: "Please make our app responsive. On mobile, planets list should be collapsed into a hamburger menu. The info panel should move to the bottom 40 percent of the screen, the solar system visualization should fill the rest.",
      conversation: [],
      files,
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(provider.messages).toHaveLength(1);
    const payloadText = String(provider.messages[0][1].content);
    expect(payloadText.length).toBeLessThan(26000);
    expect(payloadText).not.toContain("planetData = 'large data';\nplanetData = 'large data';\nplanetData = 'large data';");
    expect(result.result.changes.map((change) => change.fileName)).toEqual(
      expect.arrayContaining(["index.html", "styles.css", "main.js"]),
    );
  });

  it("parses millisecond rate-limit retry hints", () => {
    const response = new Response("", { status: 429 });
    expect(getRetryDelayMs(response, "Please try again in 720ms.")).toBe(720);
  });
});
