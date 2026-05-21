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
import { buildTutorOpening, formatTutorOpening } from "./tutorOpening";

function openingText(markdown: string) {
  return formatTutorOpening(buildTutorOpening(markdown, buildInstructionGuide(markdown)));
}

describe("Tutor opening tone", () => {
  it("turns photo-carousel instructions into a conversational debugging opening", () => {
    const text = openingText(validationPhotoCarouselInstructionsMarkdown);

    expect(text).toContain("Let's debug why the Next button is not working correctly.");
    expect(text).toContain("When the page works, clicking the Next button should show a new photo and caption on the page.");
    expect(text).toContain("First, click the next button once.");
    expect(text).toContain("Tell me what you notice.");
    expect(text).not.toMatch(/Expected Behavior|Start here|1: Test it/);
  });

  it("turns style-polish instructions into an open-ended creative opening", () => {
    const text = openingText(validationLoopStylePolishInstructionsMarkdown);

    expect(text).toContain("This level is about polishing the button, links, and their hover/focus styles");
    expect(text).toContain("Aim for a page where the buttons, links, and hover/focus states feel intentional");
    expect(text).toContain("Pick one area to improve first");
    expect(text).toContain("nav links");
    expect(text).not.toMatch(/Try these prompts|With the help of AI|Start here/);
  });

  it("turns promise tracing instructions into a concept opening", () => {
    const text = openingText(validationPromiseTraceInstructionsMarkdown);

    expect(text).toContain("This level is about tracing how Promises change state over time.");
    expect(text).toContain("pending, fulfilled, or rejected");
    expect(text).toContain("Start with the first numbered comment in the code.");
    expect(text).not.toMatch(/Do This|For each numbered comment/);
  });

  it("turns loader instructions into a procedural opening", () => {
    const text = openingText(validationStarshipLoaderInstructionsMarkdown);

    expect(text).toContain("In this level, you'll fix the loader so the ship can fill up without freezing the browser.");
    expect(text).toContain("the loop adds cargo and moves forward");
    expect(text).toContain("Start by finding the while loop inside the runBtn event listener.");
    expect(text).not.toMatch(/Do this|1\. Find/);
  });

  it("uses lightweight opening overrides without exposing the comments", () => {
    const markdown = `
# Custom Level

<!-- tutor-opening-goal: practice reading event handlers -->
<!-- tutor-opening-success: you can describe what each button click does -->
<!-- tutor-opening-first-move: Start with the first button and tell me what it changes. -->

**Do This:** Read the code.
`;
    const text = openingText(markdown);

    expect(text).toContain("practice reading event handlers");
    expect(text).toContain("you can describe what each button click does");
    expect(text).toContain("Start with the first button and tell me what it changes.");
    expect(text).not.toContain("tutor-opening");
    expect(text).not.toContain("Do This");
  });
});
