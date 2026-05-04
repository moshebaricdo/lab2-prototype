import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import { PROJECT_PLAN_FILE } from "./planningRunner";
import { tutorClient } from "./tutorClient";
import type {
  TutorChatMessage,
  TutorGuidanceResponse,
  TutorStructuredEditResponse,
  TutorToolAssistantMessage,
  TutorToolDefinition,
  TutorToolChatMessage,
} from "./types";
import type {
  TutorGuidanceProvider,
  TutorStructuredEditProvider,
  TutorToolProvider,
} from "./openAiProvider";

function rootProject(children: FileItem[]): FileItem[] {
  return [{ name: "Project", type: "folder", children }];
}

class GuidanceProvider implements TutorGuidanceProvider {
  calls = 0;
  messages: TutorChatMessage[][] = [];

  constructor(private readonly response: TutorGuidanceResponse | null) {}

  async requestGuidance(messages: TutorChatMessage[]) {
    this.calls += 1;
    this.messages.push(messages);
    return this.response;
  }
}

class StructuredProvider implements TutorStructuredEditProvider {
  calls = 0;
  messages: TutorChatMessage[][] = [];

  constructor(private readonly response: TutorStructuredEditResponse | null = {
    message: "Updated the project.",
    saveTitle: "Update project",
    edits: [{
      path: "index.html",
      strategy: "replace",
      content: "<!doctype html><html><body><main><h1>Edited</h1></main></body></html>",
    }],
  }) {}

  async requestStructuredEdit(messages: TutorChatMessage[]): Promise<TutorStructuredEditResponse | null> {
    this.calls += 1;
    this.messages.push(messages);
    return this.response;
  }
}

class ToolProvider implements TutorToolProvider {
  calls = 0;

  async requestToolStep(
    _messages: TutorToolChatMessage[],
    _tools: TutorToolDefinition[],
  ): Promise<TutorToolAssistantMessage | null> {
    this.calls += 1;
    return null;
  }
}

describe("tutorClient guidance routing", () => {
  it("answers conceptual JavaScript questions without editing the project", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "Functions are reusable blocks of JavaScript. In your project, a function could update the page after a button click.",
    });
    const structuredProvider = new StructuredProvider();
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "Can you explain functions to me?",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<main><button id="demo">Demo</button><script src="app.js"></script></main>',
        },
        {
          name: "app.js",
          type: "file",
          content: "function handleClick() {}\n",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("Functions");
    expect(guidanceProvider.calls).toBe(1);
    expect(structuredProvider.calls).toBe(0);
    expect(toolProvider.calls).toBe(0);
  });

  it("falls back to a no-edit canned explanation if guidance has no API key", async () => {
    const result = await tutorClient({
      message: "Can you explain functions to me?",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider(null),
      structuredProvider: new StructuredProvider(),
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("function");
  });

  it("routes project code-location questions to guidance without edits", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "Look in `styles.css` for the responsive `@media` rules and `main.js` for the canvas resize function.",
    });
    const structuredProvider = new StructuredProvider();
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "Where in the project can I find the code that makes the responsive adjustment for the solar system visualization so I can tweak it myself?",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<main id="app"><canvas id="solar-canvas"></canvas><script src="main.js"></script></main>',
        },
        {
          name: "styles.css",
          type: "css",
          content: "@media (max-width: 700px) { #canvas-wrap { height: 67vh; } }\n",
        },
        {
          name: "main.js",
          type: "file",
          content: "function resizeCanvas() { const canvas = document.getElementById('solar-canvas'); }\n",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("styles.css");
    expect(guidanceProvider.calls).toBe(1);
    expect(structuredProvider.calls).toBe(0);
    expect(toolProvider.calls).toBe(0);
  });
});

describe("tutorClient planning routing", () => {
  it("creates a Markdown project plan without invoking the edit fallback path", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "Unexpected guidance.",
    });
    const structuredProvider = new StructuredProvider({
      message: "I drafted a plan and included a couple of questions to answer next.",
      saveTitle: "Draft project plan",
      edits: [{
        path: PROJECT_PLAN_FILE,
        strategy: "replace",
        content: "# Map Project Plan\n\nStatus: Planned\n\n## Project Goal\nBuild a map project.\n\n## Open Questions\n- Who is this for?\n",
      }],
    });
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "Help me plan a new web project before we build. Ask me a few guiding questions.",
      conversation: [],
      files: rootProject([]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: PROJECT_PLAN_FILE,
        status: "new",
      }),
    ]);
    expect(result.message).toContain("plan");
    expect(result.message).not.toContain(PROJECT_PLAN_FILE);
    expect(guidanceProvider.calls).toBe(0);
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);
  });

  it("keeps Plans as a real folder when revising a plan-only project", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I revised the plan. Review Plans/PROJECT_PLAN.md before building.",
      saveTitle: "Revise project plan",
      edits: [{
        path: PROJECT_PLAN_FILE,
        strategy: "replace",
        content: "# Map Explorer Plan\n\nStatus: Planned\n\n## Project Goal\nBuild a map explorer with pins.\n",
      }],
    });

    const result = await tutorClient({
      message: "Can we revise the plan for my map project?",
      conversation: [],
      files: [{
        name: "Plans",
        type: "folder",
        children: [{
          name: "PROJECT_PLAN.md",
          type: "text",
          content: "# Map Explorer Plan\n\nStatus: Planned\n\n## Project Goal\nBuild a map explorer.\n",
        }],
      }],
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: PROJECT_PLAN_FILE,
        status: "modified",
      }),
    ]);
    expect(result.message).toBe("I revised the plan. Review the plan before building.");
  });

  it("uses a no-edit planning fallback when planning has no API key", async () => {
    const structuredProvider = new StructuredProvider(null);
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "I'm not sure what to build. Can you help me brainstorm ideas for a website?",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("plan");
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);
  });

  it("honors manual plan mode even when the prompt sounds like a build request", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I drafted a plan instead of building files.",
      saveTitle: "Draft project plan",
      edits: [{
        path: PROJECT_PLAN_FILE,
        strategy: "replace",
        content: "# Starter Project Plan\n\nStatus: Planned\n\n## Project Goal\nPlan a starter project before building it.\n",
      }],
    });

    const result = await tutorClient({
      message: "Create the first files for this starter project.",
      requestMode: "plan",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: PROJECT_PLAN_FILE,
        status: "new",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
  });

  it("treats answers to plan detail questions as plan revisions", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I made edits to the plan with those details.",
      saveTitle: "Revise project plan",
      edits: [{
        path: "PROJECT_PLAN.md",
        strategy: "replace",
        content: "# Geography Quiz Plan\n\nStatus: Planned\n\n## Project Goal\nBuild a geography quiz for middle schoolers.\n",
      }],
    });
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "It should be for middle schoolers and include a score tracker.",
      conversation: [{
        role: "assistant",
        content: "I drafted a plan. Who is the project for? What interaction should it include?",
        fileChanges: [{ fileName: PROJECT_PLAN_FILE, status: "new" }],
        codeChangeStatus: "accepted",
      }],
      files: [{
        name: "Plans",
        type: "folder",
        children: [{
          name: "PROJECT_PLAN.md",
          type: "text",
          content: "# Geography Quiz Plan\n\nStatus: Planned\n\n## Open Questions\n- Who is this for?\n",
        }],
      }],
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: PROJECT_PLAN_FILE,
        status: "modified",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);
  });

  it("uses a plan-aware fallback when an active plan revision cannot run", async () => {
    const structuredProvider = new StructuredProvider(null);

    const result = await tutorClient({
      message: "It should be for middle schoolers and include a score tracker.",
      conversation: [{
        role: "assistant",
        content: "I drafted a plan. Who is the project for? What interaction should it include?",
        fileChanges: [{ fileName: PROJECT_PLAN_FILE, status: "new" }],
        codeChangeStatus: "accepted",
      }],
      files: [{
        name: "Plans",
        type: "folder",
        children: [{
          name: "PROJECT_PLAN.md",
          type: "text",
          content: "# Geography Quiz Plan\n\nStatus: Planned\n\n## Open Questions\n- Who is this for?\n",
        }],
      }],
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("still in planning mode");
    expect(result.message).not.toContain("Try telling me the audience");
  });
});

describe("tutorClient code generation routing", () => {
  it("keeps direct starter generation on the structured edit path", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I created the first starter file.",
      saveTitle: "Create starter page",
      edits: [{
        path: "index.html",
        strategy: "replace",
        content: "<!doctype html><html><body><main><h1>Starter</h1><p>Customize this page.</p></main></body></html>",
      }],
    });
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "Create the first files for this starter project.",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "index.html",
        status: "new",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);
  });

  it("honors manual build mode even when the prompt sounds like planning", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I created starter files.",
      saveTitle: "Create starter page",
      edits: [{
        path: "index.html",
        strategy: "replace",
        content: "<!doctype html><html><body><main><h1>Starter</h1></main></body></html>",
      }],
    });

    const result = await tutorClient({
      message: "Help me plan a new web project before we build.",
      requestMode: "build",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "index.html",
        status: "new",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
  });

  it("keeps guidance-like direct edits on the structured edit path", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I made the page responsive.",
      saveTitle: "Make page responsive",
      edits: [{
        path: "index.html",
        strategy: "replace",
        content: "<!doctype html><html><body><main><h1>Responsive</h1><p>The layout now adapts.</p></main></body></html>",
      }],
    });

    const result = await tutorClient({
      message: "Can you make our app responsive?",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: "<!doctype html><html><body><main><h1>Old</h1></main></body></html>",
        },
      ]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "index.html",
        status: "modified",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
  });

  it("builds from an accepted project plan instead of staying in planning mode", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I built the page from the plan.",
      saveTitle: "Build from plan",
      edits: [{
        path: "index.html",
        strategy: "replace",
        content: "<!doctype html><html><body><main><h1>Map Explorer</h1><p>Explore places from the plan.</p></main></body></html>",
      }],
    });
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "I'm ready to build the project from this plan.",
      conversation: [],
      files: rootProject([
        {
          name: "Plans",
          type: "folder",
          children: [{
            name: "PROJECT_PLAN.md",
            type: "text",
            content: "# Map Explorer Plan\n\nStatus: Planned\n\n## Project Goal\nBuild a map explorer.\n",
          }],
        },
      ]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "index.html",
        status: "new",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);
  });

  it("still falls back to the tool loop after structured edit validation fails", async () => {
    const structuredProvider = new StructuredProvider({
      message: "This will not validate.",
      saveTitle: "Broken edit",
      edits: [],
    });
    const toolProvider = new ToolProvider();

    await tutorClient({
      message: "Add a button to the page.",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: "<!doctype html><html><body><main><h1>Old</h1></main></body></html>",
        },
      ]),
      guidanceProvider: new GuidanceProvider({
        message: "Unexpected guidance.",
      }),
      structuredProvider,
      toolProvider,
    });

    expect(structuredProvider.calls).toBeGreaterThan(1);
    expect(toolProvider.calls).toBe(1);
  });
});
