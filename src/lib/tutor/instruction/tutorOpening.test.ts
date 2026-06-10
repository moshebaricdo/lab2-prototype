import { describe, expect, it } from "vitest";
import {
  validationLoopStylePolishInstructionsMarkdown,
} from "../../../data/weblab2/projects/validation-loop-style-polish";
import {
  validationPhotoCarouselInstructionsMarkdown,
} from "../../../data/weblab2/projects/validation-photo-carousel";
import {
  validationPromiseTraceInstructionsMarkdown,
} from "../../../data/weblab2/projects/validation-promise-trace";
import {
  validationStarshipLoaderInstructionsMarkdown,
} from "../../../data/weblab2/projects/validation-starship-loader";
import { featureRouletteInstructionsMarkdown } from "../../../data/weblab2/projects/feature-roulette";
import { buildInstructionGuide } from "./instructionGuide";
import { buildTutorOpening, formatTutorOpening } from "./tutorOpening";

function openingText(markdown: string) {
  return formatTutorOpening(buildTutorOpening(markdown, buildInstructionGuide(markdown)));
}

describe("Tutor opening tone", () => {
  it("turns photo-carousel instructions into a conversational debugging opening", () => {
    const text = openingText(validationPhotoCarouselInstructionsMarkdown);

    expect(text).toContain("In this level, we'll debug and fix the Next button in the photo carousel.");
    expect(text).toContain("Start by clicking the Next button and tell me what you observe.");
    expect(text).not.toContain("When the page works");
    expect(text).not.toContain("on track when");
    expect(text).not.toMatch(/Expected Behavior|Start here|1: Test it/);
  });

  it("turns style-polish instructions into an open-ended creative opening", () => {
    const text = openingText(validationLoopStylePolishInstructionsMarkdown);

    expect(text).toContain("We'll polish the button, links, and their hover/focus styles");
    expect(text).toContain("Pick one area to improve first");
    expect(text).toContain("nav links");
    expect(text).not.toContain("Aim for a page where");
    expect(text).not.toMatch(/Try these prompts|With the help of AI|Start here/);
  });

  it("turns promise tracing instructions into a concept opening", () => {
    const text = openingText(validationPromiseTraceInstructionsMarkdown);

    expect(text).toContain("We'll trace how Promises change state over time.");
    expect(text).toContain("Start with the first numbered comment in the code");
    expect(text).not.toMatch(/Do This|For each numbered comment/);
  });

  it("turns loader instructions into a procedural opening", () => {
    const text = openingText(validationStarshipLoaderInstructionsMarkdown);

    expect(text).toContain("Let's fix the loader so the ship can fill up without freezing the browser.");
    expect(text).not.toContain("on track when");
    expect(text).toContain("Start by finding the while loop inside the runBtn event listener");
    expect(text).not.toMatch(/Do this|1\. Find/);
  });

  it("does not echo raw Feature Roulette worksheet step titles", () => {
    const text = openingText(featureRouletteInstructionsMarkdown);

    expect(text).not.toMatch(/on track when\s+1:\s*Create a New Feature/i);
    expect(text).not.toMatch(/First,\s*1:\s*Create a New Feature/i);
    expect(text).not.toContain("1: Create a New Feature");
    expect(text).toContain("tell me what you observe");
  });

  it("uses lightweight opening overrides without exposing the comments", () => {
    const markdown = `
# Custom Level

<!-- tutor-opening-goal: Let's practice reading event handlers together. -->
<!-- tutor-opening-success: you can describe what each button click does -->
<!-- tutor-opening-first-move: Start with the first button and tell me what it changes. -->

**Do This:** Read the code.
`;
    const text = openingText(markdown);

    expect(text).toContain("Let's practice reading event handlers together.");
    expect(text).not.toContain("you can describe what each button click does");
    expect(text).toContain("Start with the first button and tell me what it changes.");
    expect(text).not.toContain("tutor-opening");
    expect(text).not.toContain("Do This");
  });
});
