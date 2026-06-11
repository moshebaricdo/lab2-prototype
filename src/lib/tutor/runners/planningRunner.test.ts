import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../types/file";
import { runTutorPlanning, PROJECT_PLAN_FILE } from "./planningRunner";
import type { TutorChatMessage, TutorStructuredEditResponse } from "../types";
import type { TutorStructuredEditProvider } from "../provider/openAiProvider";

class StructuredProvider implements TutorStructuredEditProvider {
  calls = 0;
  messages: TutorChatMessage[][] = [];

  constructor(private readonly response: TutorStructuredEditResponse | null) {}

  async requestStructuredEdit(messages: TutorChatMessage[]) {
    this.calls += 1;
    this.messages.push(messages);
    return this.response;
  }
}

/** Returns a queued response per call, repeating the last one once exhausted. */
class SequencedStructuredProvider implements TutorStructuredEditProvider {
  calls = 0;
  messages: TutorChatMessage[][] = [];

  constructor(private readonly responses: (TutorStructuredEditResponse | null)[]) {}

  async requestStructuredEdit(messages: TutorChatMessage[]) {
    this.messages.push(messages);
    const response = this.responses[this.calls] ?? this.responses.at(-1) ?? null;
    this.calls += 1;
    return response;
  }
}

function rootProject(children: FileItem[]): FileItem[] {
  return [{ name: "Project", type: "folder", children }];
}

const PLAN_BODY =
  "# Gallery Project\n\nStatus: Planned\n\n## Project Goal\nBuild a cat gallery.\n\n## Open Questions\n- Who is this for?\n";

describe("runTutorPlanning — named plan files (Decision A)", () => {
  it("defaults to Plans/PROJECT_PLAN.md", async () => {
    const provider = new StructuredProvider({
      message: "I drafted a plan to review.",
      saveTitle: "Draft plan",
      edits: [{ path: PROJECT_PLAN_FILE, strategy: "replace", content: PLAN_BODY }],
    });

    const result = await runTutorPlanning({
      message: "Plan my project.",
      conversation: [],
      files: rootProject([]),
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: PROJECT_PLAN_FILE, status: "new" }),
    ]);
  });

  it("targets a custom plan file and rewrites a bare basename onto it", async () => {
    // Model drops the Plans/ prefix; the runner should normalize it back.
    const provider = new StructuredProvider({
      message: "I drafted gallery-spec.md to review.",
      saveTitle: "Draft gallery spec",
      edits: [{ path: "gallery-spec.md", strategy: "replace", content: PLAN_BODY }],
    });

    const result = await runTutorPlanning({
      message: "Write a spec for my gallery.",
      conversation: [],
      files: rootProject([]),
      planningFileName: "Plans/gallery-spec.md",
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: "Plans/gallery-spec.md", status: "new" }),
    ]);
    // The custom path appears in the system prompt the model receives.
    const systemPrompt = provider.messages[0]?.[0]?.content;
    expect(typeof systemPrompt === "string" && systemPrompt).toContain("Plans/gallery-spec.md");
    // The student-facing message never leaks the file path/basename.
    expect(result.result.message).not.toContain("gallery-spec.md");
  });

  it("accepts a plan for an app idea with interactive words like 'filter'", async () => {
    // Regression: the web-project intent validator rejected Markdown plans when
    // the request mentioned dynamic behavior (filter/sort/toggle). Planning must
    // not run those code-edit heuristics.
    const provider = new StructuredProvider({
      message: "I drafted a plan to review.",
      saveTitle: "Draft recipe plan",
      edits: [{ path: PROJECT_PLAN_FILE, strategy: "replace", content: PLAN_BODY }],
    });

    const result = await runTutorPlanning({
      message:
        "Help me plan a recipe tracker that allows filtering and sorting by dietary preference.",
      conversation: [],
      files: rootProject([]),
      provider,
    });

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: PROJECT_PLAN_FILE, status: "new" }),
    ]);
  });

  it("repairs a questions-only reply into a first-pass plan edit", async () => {
    // First reply asks questions but includes no plan edit; the runner should
    // re-prompt and accept the repaired draft instead of falling back.
    const provider = new SequencedStructuredProvider([
      {
        message: "A few quick questions before I draft anything:\n1. Who is it for?",
        saveTitle: "Questions",
        edits: [],
      },
      {
        message: "I drafted a first-pass plan to review.",
        saveTitle: "Draft plan",
        edits: [{ path: PROJECT_PLAN_FILE, strategy: "replace", content: PLAN_BODY }],
      },
    ]);

    const result = await runTutorPlanning({
      message: "Plan my cat gallery.",
      conversation: [],
      files: rootProject([]),
      provider,
    });

    expect(provider.calls).toBe(2);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.result.changes).toEqual([
      expect.objectContaining({ fileName: PROJECT_PLAN_FILE, status: "new" }),
    ]);
  });

  it("falls back to failed when the repair pass still omits the edit", async () => {
    const provider = new SequencedStructuredProvider([
      { message: "Questions only.", saveTitle: "Q", edits: [] },
      { message: "Still questions only.", saveTitle: "Q", edits: [] },
    ]);

    const result = await runTutorPlanning({
      message: "Plan my cat gallery.",
      conversation: [],
      files: rootProject([]),
      provider,
    });

    expect(provider.calls).toBe(2);
    expect(result.kind).toBe("failed");
  });

  it("rejects edits to a different plan file than requested", async () => {
    const provider = new StructuredProvider({
      message: "I edited the wrong file.",
      saveTitle: "Wrong file",
      edits: [{ path: PROJECT_PLAN_FILE, strategy: "replace", content: PLAN_BODY }],
    });

    const result = await runTutorPlanning({
      message: "Write a spec for my gallery.",
      conversation: [],
      files: rootProject([]),
      planningFileName: "Plans/gallery-spec.md",
      provider,
    });

    expect(result.kind).toBe("failed");
  });
});
