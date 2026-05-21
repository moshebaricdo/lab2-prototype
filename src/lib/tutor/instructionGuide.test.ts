import { describe, expect, it } from "vitest";
import {
  validationLoopStylePolishInstructionsMarkdown,
} from "../../data/weblab2/projects/validation-loop-style-polish";
import {
  validationPhotoCarouselInstructionsMarkdown,
} from "../../data/weblab2/projects/validation-photo-carousel";
import {
  validationPromiseTraceInstructionsMarkdown,
} from "../../data/weblab2/projects/validation-promise-trace";
import {
  validationStarshipLoaderInstructionsMarkdown,
} from "../../data/weblab2/projects/validation-starship-loader";
import { buildInstructionGuide } from "./instructionGuide";

describe("buildInstructionGuide", () => {
  it("builds an inspectable guide from technical debugging instructions", () => {
    const guide = buildInstructionGuide(validationPhotoCarouselInstructionsMarkdown);

    expect(guide.type).toBe("linear");
    if (guide.type !== "linear") throw new Error("Expected linear guide");
    expect(guide.overview).toContain("Expected Behavior");
    expect(guide.firstMove).toContain("Click the next button once");
    expect(guide.steps.map((step) => step.title)).toEqual(
      expect.arrayContaining(["1: Test it", "2: Check the basics", "3: Ask AI for help"]),
    );
    expect(guide.steps[0]).toMatchObject({
      intent: "observe",
      expectedStudentMove: "observation",
    });
    expect(guide.fallbackMarkdown).toBe(validationPhotoCarouselInstructionsMarkdown.trim());
  });

  it("does not force open-ended style work into rigid numbered steps", () => {
    const guide = buildInstructionGuide(validationLoopStylePolishInstructionsMarkdown);

    expect(guide.type).toBe("choice-based");
    if (guide.type !== "choice-based") throw new Error("Expected choice-based guide");
    expect(guide.goal).toContain("With the help of AI");
    expect(guide.constraints).toEqual(
      expect.arrayContaining([
        expect.stringContaining("ensure the page still meets usability standards"),
      ]),
    );
    expect(guide.options.map((option) => option.label)).toEqual(
      expect.arrayContaining([
        "Polish nav links",
        "Improve buttons",
        "Style card links",
        "Apply a font",
      ]),
    );
    expect(guide.options[0]).toMatchObject({
      intent: "style-polish",
      editOriented: true,
    });
  });

  it("keeps concept tracing instructions actionable", () => {
    const guide = buildInstructionGuide(validationPromiseTraceInstructionsMarkdown);

    expect(guide.type).toBe("linear");
    if (guide.type !== "linear") throw new Error("Expected linear guide");
    expect(guide.overview).toContain("For each numbered comment");
    expect(guide.firstMove).toContain("Identify the state of the Promise");
    expect(guide.steps.length).toBeGreaterThan(0);
  });

  it("extracts a first move for loop-debugging instructions", () => {
    const guide = buildInstructionGuide(validationStarshipLoaderInstructionsMarkdown);

    expect(guide.type).toBe("linear");
    if (guide.type !== "linear") throw new Error("Expected linear guide");
    expect(guide.overview).toContain("The Infinite Loader");
    expect(guide.firstMove).toContain("Find the while loop");
    expect(guide.steps.length).toBeGreaterThan(0);
  });

  it("uses optional tutor-guide metadata as an authoring escape hatch", () => {
    const guide = buildInstructionGuide(`
# Regular Instructions
Students can still read this full markdown.

<!-- tutor-guide:
overview: Build a tiny weather card.
firstMove: Start by identifying the data the card needs.
checkpoint: Pick content | Decide which city and details to show.
checkpoint: Style the card | Choose spacing and colors that fit the theme.
-->
`);

    expect(guide.type).toBe("linear");
    if (guide.type !== "linear") throw new Error("Expected linear guide");
    expect(guide.overview).toBe("Build a tiny weather card.");
    expect(guide.firstMove).toBe("Start by identifying the data the card needs.");
    expect(guide.steps).toEqual([
      {
        id: "pick-content",
        title: "Pick content",
        intent: "explain",
        expectedStudentMove: "reflection",
        prompt: "Decide which city and details to show.",
      },
      {
        id: "style-the-card",
        title: "Style the card",
        intent: "fix",
        expectedStudentMove: "code-change",
        prompt: "Choose spacing and colors that fit the theme.",
      },
    ]);
    expect(guide.fallbackMarkdown).toContain("Regular Instructions");
  });
});
