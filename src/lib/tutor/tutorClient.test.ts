import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import { PROJECT_PLAN_FILE } from "./runners/planningRunner";
import { pythonTutorClient, tutorClient } from "./tutorClient";
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
} from "./provider/openAiProvider";

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

  it("explains curriculum instructions without creating a plan or editing files", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "The level is asking you to identify each Promise state, then add a short explanation under each numbered comment. Start by checking what each example is waiting for.",
    });
    const structuredProvider = new StructuredProvider();
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "I'm not sure what the instructions are asking me to do, can you help?",
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "Read each numbered Promise example and write whether it is pending, fulfilled, or rejected. This level does not ask you to add new UI.",
      levelProgress: {
        title: "Promise trace review",
        mode: "hybrid",
        status: "in_progress",
        phase: "partially_complete",
        passedCriteria: [{
          id: "pending-state",
          label: "The first Promise state is identified.",
          status: "pass",
        }],
        incompleteCriteria: [{
          id: "fulfilled-state",
          label: "The fulfilled Promise state still needs an explanation.",
          status: "missing",
        }],
        nextIncompleteCriterion: {
          id: "fulfilled-state",
          label: "The fulfilled Promise state still needs an explanation.",
          status: "missing",
        },
      },
      conversation: [],
      files: rootProject([
        {
          name: "script.js",
          type: "file",
          content: "// 1.\nfetch('/data').then(response => response.json());\n",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("Promise");
    expect(guidanceProvider.calls).toBe(1);
    expect(structuredProvider.calls).toBe(0);
    expect(toolProvider.calls).toBe(0);

    const payload = JSON.parse(guidanceProvider.messages[0][1].content as string);
    expect(payload.levelInstructionsMarkdown).toContain("pending, fulfilled, or rejected");
    expect(payload.levelProgress.nextIncompleteCriterion.label).toContain("fulfilled Promise");
    expect(payload.guidanceDisclosurePolicy).toEqual(
      expect.objectContaining({
        style: "socratic-nudge",
        maxObservationQuestions: 1,
      }),
    );
    expect(payload.guidanceDisclosurePolicy.revealPolicy.join(" ")).toContain("Avoid naming exact project-only selectors");
  });

  it("asks for a small check before revealing exact project-only selectors", async () => {
    const guidanceProvider = new GuidanceProvider({
      message:
        "The goal is to connect the button to the photo and caption change. First, compare the selector in your JavaScript with the matching id in the HTML. What do you notice about those two names?",
    });

    const result = await tutorClient({
      message: "Can you walk me through what I'm supposed to do in this level?",
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "Clicking the Next button should show a new photo and caption. Check whether the JavaScript selector matches the HTML id exactly.",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<main><button id="next">Next</button><img id="photo1"><img id="photo2"></main>',
        },
        {
          name: "script.js",
          type: "file",
          content: 'document.querySelector("#missing").addEventListener("click", () => {});\n',
        },
      ]),
      guidanceProvider,
      structuredProvider: new StructuredProvider(),
      toolProvider: new ToolProvider(),
    });

    expect(result.message).toContain("selector");
    expect(result.message).not.toContain("#photo2");
    const payload = JSON.parse(guidanceProvider.messages[0][1].content as string);
    expect(payload.guidanceDisclosurePolicy.style).toBe("socratic-nudge");
  });

  it("keeps instruction-scoped Back button guidance when it is an actual requirement", async () => {
    const result = await tutorClient({
      message: "I already fixed the next button.",
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "First fix the Next button. Then add a Back button that returns to the previous photo.",
      levelProgress: {
        title: "Photo carousel review",
        mode: "technical",
        status: "in_progress",
        phase: "partially_complete",
        passedCriteria: [{
          id: "next-button",
          label: "Clicking Next shows the second photo.",
          status: "pass",
        }],
        incompleteCriteria: [{
          id: "back-button",
          label: "The student adds a functional Back button.",
          status: "missing",
        }],
        nextIncompleteCriterion: {
          id: "back-button",
          label: "The student adds a functional Back button.",
          status: "missing",
        },
      },
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider({
        message: "Yes, the Next button step is already complete. The next requirement is the Back button.",
      }),
      structuredProvider: new StructuredProvider(),
      toolProvider: new ToolProvider(),
    });

    expect(result.message).toContain("Back button");
    expect(result.message).toContain("already complete");
  });

  it("scopes curriculum guidance to project code via the system prompt and returns it unmodified", async () => {
    const message = [
      "Look at the photo selector in `script.js` and compare it to the matching id in your HTML.",
      "- Check that the selector points at an id that actually exists on the page.",
      "- Check there are no typos in the selector.",
    ].join("\n");
    const guidanceProvider = new GuidanceProvider({ message });
    const structuredProvider = new StructuredProvider();
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "I updated the selector but it still is not working.",
      supportContext: "curriculum-level",
      conversation: [],
      files: rootProject([
        {
          name: "script.js",
          type: "file",
          content: "const secondPhoto = document.querySelector('#missing');\n",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    // Curriculum guidance is no longer post-scrubbed; the model output is returned verbatim.
    expect(result.message).toBe(message);
    expect(guidanceProvider.calls).toBe(1);
    expect(structuredProvider.calls).toBe(0);
    expect(toolProvider.calls).toBe(0);

    // Browser-troubleshooting / stretch prevention now lives only in the system prompt.
    const systemPrompt = guidanceProvider.messages[0][0].content;
    expect(systemPrompt).toContain("Curriculum-level Web Lab guidance");
    expect(systemPrompt).toContain("Do not tell students to save files");
    const payload = JSON.parse(guidanceProvider.messages[0][1].content as string);
    expect(payload.tutorSupportContext).toBe("curriculum-level");
  });

  it("keeps curriculum concept questions from modifying project content", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "A Promise is a JavaScript object that represents work that may finish later.",
    });
    const structuredProvider = new StructuredProvider();
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "What is a Promise in JS?",
      supportContext: "curriculum-level",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: "<main><h1>Global Population Data</h1></main>",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("Promise");
    expect(guidanceProvider.calls).toBe(1);
    expect(structuredProvider.calls).toBe(0);
    expect(toolProvider.calls).toBe(0);
  });

  it("asks for a Lab Settings API key if guidance has no API key", async () => {
    const result = await tutorClient({
      message: "Can you explain functions to me?",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider(null),
      structuredProvider: new StructuredProvider(),
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("Add a Tutor API key in Lab Settings first");
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

describe("pythonTutorClient guidance routing", () => {
  it("answers Python requests with project context and never invokes edit paths", async () => {
    const guidanceProvider = new GuidanceProvider({
      message: "The `greet` function reads the name and prints a friendly message. Check the value returned by `input()` if the greeting looks wrong.",
    });

    const result = await pythonTutorClient({
      message: "Fix my greeting function",
      conversation: [],
      files: rootProject([
        {
          name: "main.py",
          type: "python",
          content: "def greet():\n    name = input('Name? ')\n    print(f'Hello, {name}!')\n",
        },
      ]),
      guidanceProvider,
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("greet");
    expect(guidanceProvider.calls).toBe(1);
    const systemPrompt = guidanceProvider.messages[0][0].content;
    expect(systemPrompt).toContain("Python Lab Tutor");
    const payload = JSON.parse(guidanceProvider.messages[0][1].content as string);
    expect(payload.projectContext.projectMap.python[0].functions).toContain("greet");
  });

  it("asks for a Lab Settings API key for Python guidance with no API key", async () => {
    const result = await pythonTutorClient({
      message: "Can you explain functions?",
      conversation: [],
      files: rootProject([]),
      guidanceProvider: new GuidanceProvider(null),
    });

    expect(result.changes).toEqual([]);
    expect(result.message).toContain("Add a Tutor API key in Lab Settings first");
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

  it("asks for a Lab Settings API key when planning has no API key", async () => {
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
    expect(result.message).toContain("Add a Tutor API key in Lab Settings first");
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

  it("asks for a Lab Settings API key when active plan revision has no API key", async () => {
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
    expect(result.message).toContain("Add a Tutor API key in Lab Settings first");
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

  it("treats curriculum hover/focus style polish as CSS work, not JavaScript behavior", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I polished the nav link hover and focus states in `style.css` so they feel more interactive without changing the page behavior.",
      saveTitle: "Polish nav link states",
      edits: [{
        path: "style.css",
        strategy: "searchReplace",
        replacements: [{
          search: ".nav-link { text-decoration: none; }\n.nav-link:hover { color: blue; }\n",
          replace: ".nav-link { text-decoration: none; text-underline-offset: 6px; transition: color 180ms ease, text-decoration-color 180ms ease; }\n.nav-link:hover { color: blue; text-decoration: underline; }\n.nav-link:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }\n",
        }],
      }],
    });
    const toolProvider = new ToolProvider();

    const result = await tutorClient({
      message: "Make the nav bar links feel interactive: add hover underline that animates, and a strong focus-visible outline.",
      supportContext: "curriculum-level",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><main><nav><a class="nav-link" href="#features">Features</a></nav></main></body></html>',
        },
        {
          name: "style.css",
          type: "css",
          content: ".nav-link { text-decoration: none; }\n.nav-link:hover { color: blue; }\n",
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
        fileName: "style.css",
        status: "modified",
      }),
    ]);
    expect(structuredProvider.calls).toBe(1);
    expect(toolProvider.calls).toBe(0);

    const payload = JSON.parse(structuredProvider.messages[0][1].content as string);
    expect(payload.requestStylePolicy.kind).toBe("css-style-polish");
    expect(payload.requestStylePolicy.guidance.join(" ")).toContain("Treat hover");
    expect(structuredProvider.messages[0][0].content).toContain("CSS interaction states");
  });

  it("routes curriculum prompts that ask Tutor to help make style changes to code generation", async () => {
    const structuredProvider = new StructuredProvider({
      message: "I updated `style.css` to make the nav links feel more interactive and easier to focus.",
      saveTitle: "Polish nav link states",
      edits: [{
        path: "style.css",
        strategy: "searchReplace",
        replacements: [{
          search: ".nav-link { color: navy; }\n",
          replace: ".nav-link { color: navy; text-underline-offset: 6px; transition: color 180ms ease, text-decoration-color 180ms ease; }\n.nav-link:hover { text-decoration: underline; }\n.nav-link:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }\n",
        }],
      }],
    });
    const guidanceProvider = new GuidanceProvider({
      message: "Unexpected guidance.",
    });

    const result = await tutorClient({
      message: "Can you help me make the nav bar links feel interactive and add a strong focus-visible outline?",
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "With the help of AI, improve the button, links, and their hover/focus styles so they feel on-brand and easy to use.",
      conversation: [],
      files: rootProject([
        {
          name: "index.html",
          type: "html",
          content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><nav><a class="nav-link" href="#features">Features</a></nav></body></html>',
        },
        {
          name: "style.css",
          type: "css",
          content: ".nav-link { color: navy; }\n",
        },
      ]),
      guidanceProvider,
      structuredProvider,
      toolProvider: new ToolProvider(),
    });

    expect(result.changes).toEqual([
      expect.objectContaining({
        fileName: "style.css",
        status: "modified",
      }),
    ]);
    expect(guidanceProvider.calls).toBe(0);
    expect(structuredProvider.calls).toBe(1);
    expect(structuredProvider.messages[0][0].content).toContain("explicit implementation help");
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
