import { describe, expect, it } from "vitest";
import {
  classifyTutorRequestIntent,
  isGuidanceOnlyRequest,
  resolveTutorRequestIntent,
} from "./requestIntent";

describe("tutor request intent", () => {
  it("classifies conceptual HTML/CSS/JS questions as guidance-only", () => {
    expect(isGuidanceOnlyRequest("Can you explain functions to me?")).toBe(true);
    expect(isGuidanceOnlyRequest("How do I add a button in HTML?")).toBe(true);
    expect(classifyTutorRequestIntent("How do you make things responsive?")).toBe("guidance");
    expect(classifyTutorRequestIntent("What is a Promise in JavaScript?")).toBe("guidance");
  });

  it("classifies project navigation questions as guidance-only", () => {
    expect(
      isGuidanceOnlyRequest(
        "Where in the project can I find the code that makes the responsive adjustment for the solar system visualization?",
      ),
    ).toBe(true);
    expect(isGuidanceOnlyRequest("Which file controls the mobile canvas layout so I can tweak it myself?")).toBe(true);
  });

  it("routes project-adjacent how-to questions to guidance without edits", () => {
    expect(classifyTutorRequestIntent("How would I make my map interactive?")).toBe("guidance");
    expect(classifyTutorRequestIntent("How can I animate the button when someone clicks it?")).toBe("guidance");
  });

  it("classifies explicit and implicit project planning as planning", () => {
    expect(
      classifyTutorRequestIntent(
        "Help me plan a new web project before we build. Ask me a few guiding questions, then suggest a simple HTML, CSS, and JavaScript structure.",
      ),
    ).toBe("planning");
    expect(classifyTutorRequestIntent("I'm not sure what to build. Can you help me brainstorm ideas for a website?")).toBe("planning");
    expect(classifyTutorRequestIntent("Let's make a project spec for a study app.")).toBe("planning");
  });

  it("keeps direct project edit requests on the edit path", () => {
    expect(isGuidanceOnlyRequest("Add a button to the page.")).toBe(false);
    expect(isGuidanceOnlyRequest("Can you make our app responsive?")).toBe(false);
    expect(isGuidanceOnlyRequest("Can you update the responsive layout in our project?")).toBe(false);
    expect(classifyTutorRequestIntent("Let's make the map interactive.")).toBe("edit");
    expect(classifyTutorRequestIntent("Polish the nav link hover styles.")).toBe("edit");
    expect(classifyTutorRequestIntent("Make the nav links feel interactive and add a strong focus-visible outline.")).toBe("edit");
    expect(classifyTutorRequestIntent("Can you help me make the nav links feel interactive?")).toBe("edit");
    expect(classifyTutorRequestIntent("I need you to improve the button hover styles.")).toBe("edit");
    expect(classifyTutorRequestIntent("Improve the button.")).toBe("edit");
    expect(classifyTutorRequestIntent("Improve the hero section.")).toBe("edit");
    expect(classifyTutorRequestIntent("Give this button a blue color.")).toBe("edit");
    expect(classifyTutorRequestIntent("Give the card more spacing.")).toBe("edit");
    expect(classifyTutorRequestIntent("Create the first files for this starter project.")).toBe("edit");
    expect(classifyTutorRequestIntent("I'm ready to build the project from this plan.")).toBe("edit");
  });

  it("does not treat give-me help requests as edit requests", () => {
    expect(classifyTutorRequestIntent("Give me a hint.")).toBe("guidance");
    expect(classifyTutorRequestIntent("Can you give me a tip?")).toBe("guidance");
  });

  it("uses curriculum context to keep instruction, idea, and debug help out of edit/planning", () => {
    const curriculum = { supportContext: "curriculum-level" as const };
    expect(
      classifyTutorRequestIntent(
        "I'm not sure what the instructions are asking me to do, can you help?",
        curriculum,
      ),
    ).toBe("guidance");
    expect(classifyTutorRequestIntent("Can you give me ideas for how to approach this?", curriculum)).toBe("guidance");
    expect(classifyTutorRequestIntent("Can you check why this button is broken?", curriculum)).toBe("guidance");
    expect(classifyTutorRequestIntent("How can I improve the nav links?", curriculum)).toBe("guidance");
  });

  it("still allows standalone planning and explicit curriculum edits", () => {
    expect(
      classifyTutorRequestIntent(
        "I'm not sure what to build. Can you help me brainstorm ideas for a website?",
        { supportContext: "standalone-project" },
      ),
    ).toBe("planning");
    expect(
      classifyTutorRequestIntent(
        "Improve the nav link hover styles.",
        { supportContext: "curriculum-level" },
      ),
    ).toBe("edit");
    expect(
      classifyTutorRequestIntent(
        "Can you help me make the nav bar links feel interactive and add a focus-visible outline?",
        { supportContext: "curriculum-level" },
      ),
    ).toBe("edit");
    expect(
      classifyTutorRequestIntent(
        "The instructions say to ask Tutor to make the styling updates.",
        { supportContext: "curriculum-level" },
      ),
    ).toBe("edit");
  });

  it("allows manual mode overrides", () => {
    expect(resolveTutorRequestIntent("How would I make my map interactive?", "build")).toBe("edit");
    expect(resolveTutorRequestIntent("Create a starter project.", "plan")).toBe("planning");
    expect(resolveTutorRequestIntent("Let's make the map interactive.", "help")).toBe("guidance");
    expect(resolveTutorRequestIntent("Help me plan a project.", "auto")).toBe("planning");
  });

  it("keeps answers to planning questions in planning mode until build is explicit", () => {
    expect(
      resolveTutorRequestIntent(
        "It should be for middle schoolers and include a quiz.",
        "auto",
        { hasActivePlan: true, lastAssistantAskedPlanningQuestion: true },
      ),
    ).toBe("planning");
    expect(
      resolveTutorRequestIntent(
        "I'm ready to build it.",
        "auto",
        { hasActivePlan: true, lastAssistantAskedPlanningQuestion: true },
      ),
    ).toBe("edit");
    expect(
      resolveTutorRequestIntent(
        "Can you explain functions?",
        "auto",
        { hasActivePlan: true, lastAssistantAskedPlanningQuestion: true },
      ),
    ).toBe("guidance");
    expect(
      resolveTutorRequestIntent(
        "It should be for middle schoolers and include a quiz.",
        "auto",
        {
          hasActivePlan: true,
          lastAssistantAskedPlanningQuestion: true,
          supportContext: "curriculum-level",
        },
      ),
    ).toBe("guidance");
  });
});
