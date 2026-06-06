import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../types/file";
import { runTutorGuidance } from "./guidanceRunner";

const files: FileItem[] = [
  {
    name: "Promise Trace Tool",
    type: "folder",
    children: [
      {
        name: "script.js",
        type: "file",
        content: "// 1. Pending\n// 2. Fulfilled\n// 3. Fulfilled\n// 4. Rejected",
      },
    ],
  },
];

describe("runTutorGuidance", () => {
  it("answers curriculum concept questions instead of falling back to selector/id guidance", async () => {
    const result = await runTutorGuidance({
      message: "What is a promise?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "For each numbered comment, identify whether the Promise is Pending, Fulfilled, or Rejected.",
      instructionFocus: {
        guideType: "linear",
        overview: "Trace Promise states.",
        didAdvance: false,
        currentStep: {
          id: "identify-state",
          title: "Identify the state",
          prompt: "Write whether the Promise is Pending, Fulfilled, or Rejected.",
          intent: "explain",
          expectedStudentMove: "reflection",
        },
        guidanceDirective:
          "Keep the response scoped to the current instructional step.",
      },
      provider: {
        requestGuidance: async (messages) => {
          const systemPrompt = messages[0].content as string;
          const payload = JSON.parse(messages[1].content as string);
          expect(systemPrompt).toContain("answer that concept question first");
          expect(payload.guidanceDisclosurePolicy.style).toBe("concept-help");
          return {
            message:
              "A Promise is JavaScript's way to represent work that may finish in the future. For this level, use that idea to decide whether each numbered spot is pending, fulfilled, or rejected.",
          };
        },
      },
    });

    expect(result.message).toContain("may finish in the future");
    expect(result.message).toContain("pending, fulfilled, or rejected");
    expect(result.message).not.toContain("selector");
  });

  it("forbids browser troubleshooting through the system prompt instead of scrubbing output", async () => {
    let capturedPrompt = "";
    const result = await runTutorGuidance({
      message: "What is a promise?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "For each numbered comment, identify whether the Promise is Pending, Fulfilled, or Rejected.",
      provider: {
        requestGuidance: async (messages) => {
          capturedPrompt = messages[0].content as string;
          return {
            message:
              "A Promise represents work that finishes later. Compare each numbered comment to its state.",
          };
        },
      },
    });

    expect(capturedPrompt).toContain("hard refresh");
    expect(capturedPrompt).toContain("inspect the browser console");
    expect(result.message).toContain("A Promise represents work that finishes later");
  });

  it("instructs the model not to claim project files are invisible, and passes clean output through", async () => {
    let capturedPrompt = "";
    const clean =
      "Looking at your script, compare each numbered comment to the Promise state.";
    const result = await runTutorGuidance({
      message: "Did I label them correctly?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      provider: {
        requestGuidance: async (messages) => {
          capturedPrompt = messages[0].content as string;
          return { message: clean };
        },
      },
    });

    expect(capturedPrompt).toContain("do not say you cannot see their files");
    expect(result.message).toBe(clean);
  });

  it("instructs the model not to ask for work already in project context", async () => {
    let capturedPrompt = "";
    const clean =
      "Compare each numbered comment to the Promise state to check your work.";
    const result = await runTutorGuidance({
      message: "Does this look right?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      levelInstructionsMarkdown:
        "For each numbered comment, identify whether the Promise is Pending, Fulfilled, or Rejected.",
      provider: {
        requestGuidance: async (messages) => {
          capturedPrompt = messages[0].content as string;
          return { message: clean };
        },
      },
    });

    expect(capturedPrompt).toContain("inspect projectContext and answer from what you can see");
    expect(capturedPrompt).toContain("Do not ask them to paste or share");
    expect(result.message).toBe(clean);
  });

  it("returns curriculum guidance unmodified rather than post-scrubbing it", async () => {
    const original =
      "Open the console if you want, but really just compare each comment to its Promise state.";
    const result = await runTutorGuidance({
      message: "Does this look right?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      provider: {
        requestGuidance: async () => ({ message: original }),
      },
    });

    expect(result.message).toBe(original);
  });

  it("leaves legitimate share requests intact outside curriculum levels", async () => {
    const result = await runTutorGuidance({
      message: "It throws an error when I run it.",
      conversation: [],
      files,
      supportContext: "standalone-project",
      provider: {
        requestGuidance: async () => ({
          message: "Can you paste the error message you see in the console?",
        }),
      },
    });

    expect(result.message).toContain("paste the error message");
  });

  it("passes instruction focus context into guidance payloads", async () => {
    const result = await runTutorGuidance({
      message: "The image doesn't appear.",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      instructionFocus: {
        guideType: "linear",
        overview: "Debug the carousel.",
        didAdvance: true,
        previousStep: {
          id: "test-it",
          title: "Test it",
          prompt: "Click the button and report what happens.",
          intent: "observe",
          expectedStudentMove: "observation",
        },
        currentStep: {
          id: "check-basics",
          title: "Check the basics",
          prompt: "Compare the JavaScript selector with the HTML id.",
          intent: "inspect",
          expectedStudentMove: "observation",
        },
        guidanceDirective:
          "Acknowledge the observation, then continue the instructional sequence.",
      },
      provider: {
        requestGuidance: async (messages) => {
          const payload = JSON.parse(messages[1].content as string);
          expect(payload.instructionFocus.currentStep.id).toBe("check-basics");
          expect(payload.instructionFocus.didAdvance).toBe(true);
          expect(messages[0].content).toContain("Instruction-coach context");
          return {
            message:
              "Good observation. Next, compare the selector in JavaScript with the matching id in HTML.",
          };
        },
      },
    });

    expect(result.message).toContain("Good observation");
  });
});
