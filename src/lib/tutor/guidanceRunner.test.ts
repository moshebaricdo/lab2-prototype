import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
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
  it("does not claim project labels are invisible when project context is available", async () => {
    const result = await runTutorGuidance({
      message: "Did I label them correctly?",
      conversation: [],
      files,
      supportContext: "curriculum-level",
      provider: {
        requestGuidance: async () => ({
          message:
            "I can't see your exact labels, but I can help you check your work. Compare each numbered comment to the Promise state.",
        }),
      },
    });

    expect(result.message).toContain("I can use your current project context");
    expect(result.message).not.toContain("I can't see your exact labels");
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
