import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../types/file";
import { runEditClarification } from "./editClarificationRunner";
import type { TutorEditClarificationResponse } from "../types";

class ClarificationProvider {
  calls = 0;

  constructor(private readonly response: TutorEditClarificationResponse | null) {}

  async requestEditClarification() {
    this.calls += 1;
    return this.response;
  }
}

function rootProject(children: FileItem[]): FileItem[] {
  return [{ name: "Project", type: "folder", children }];
}

describe("runEditClarification", () => {
  it("returns model-authored intro and options without file changes", async () => {
    const provider = new ClarificationProvider({
      message: "Your buttons could feel more lively. Pick one approach:",
      options: [
        {
          id: "motion",
          label: "Hover motion",
          enrichPrompt:
            "Update style.css so all .btn buttons get smooth hover scale and shadow.",
        },
        {
          id: "color",
          label: "Bolder colors",
          enrichPrompt:
            "Update style.css so .btn-primary and .btn-secondary use stronger colors and contrast.",
        },
      ],
    });

    const result = await runEditClarification({
      message: "make the buttons more exciting",
      conversation: [],
      files: rootProject([
        {
          name: "style.css",
          type: "file",
          content: ".btn { padding: 8px; }\n.btn-primary { background: blue; }",
        },
      ]),
      provider,
    });

    expect(provider.calls).toBe(1);
    expect(result.message).toContain("lively");
    expect(result.editOptions?.options).toHaveLength(2);
    expect(result.editOptions?.originalMessage).toBe("make the buttons more exciting");
  });

  it("returns a guidance-style message when the model response cannot be normalized", async () => {
    const provider = new ClarificationProvider({
      message: "Tell me more about what you want.",
      options: [{ label: "Only one", enrichPrompt: "" }],
    });

    const result = await runEditClarification({
      message: "make it better",
      conversation: [],
      files: rootProject([]),
      provider,
    });

    expect(result.editOptions).toBeUndefined();
    expect(result.message).toContain("Tell me more");
  });
});
