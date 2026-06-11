import { describe, expect, it } from "vitest";
import {
  applyDispatchToChatMessage,
  buildOrchestrationContract,
  parseDispatchFromMessage,
} from "./orchestration";
import {
  designerSpecialist,
  specWriterSpecialist,
} from "../../../data/agentic/specialists";

const specialists = [specWriterSpecialist, designerSpecialist];

describe("orchestration contract", () => {
  it("lists every dispatchable specialist by id and functional label", () => {
    const contract = buildOrchestrationContract(specialists);
    expect(contract).toContain('id "spec-writer" — Plan');
    expect(contract).toContain('id "designer" — Design');
    expect(contract).toContain("DISPATCH:");
  });
});

describe("parseDispatchFromMessage", () => {
  it("extracts a valid dispatch line and strips it from the content", () => {
    const message =
      "Design fits — this is a CSS-only change.\n" +
      'DISPATCH: {"agent":"designer","reason":"CSS-only change","brief":"Make the gallery headings teal and increase card spacing."}';
    const { content, handOff } = parseDispatchFromMessage(message, specialists);

    expect(content).toBe("Design fits — this is a CSS-only change.");
    expect(handOff).toMatchObject({
      agentId: "designer",
      label: "Design",
      iconName: "palette",
      reason: "CSS-only change",
      brief: "Make the gallery headings teal and increase card spacing.",
      status: "pending",
    });
  });

  it("tolerates a stray code fence around the dispatch line", () => {
    const message =
      "Sending this to Plan.\n```\nDISPATCH: {\"agent\":\"spec-writer\",\"reason\":\"plan work\",\"brief\":\"Write a plan for a three-photo cat gallery.\"}\n```";
    const { handOff } = parseDispatchFromMessage(message, specialists);
    expect(handOff?.agentId).toBe("spec-writer");
  });

  it("returns no hand-off for plain replies", () => {
    const message = "A context window is the slice of the project the agent can see.";
    const { content, handOff } = parseDispatchFromMessage(message, specialists);
    expect(content).toBe(message);
    expect(handOff).toBeUndefined();
  });

  it("strips but ignores dispatches to unknown agents or without a brief", () => {
    const unknownAgent =
      'Routing.\nDISPATCH: {"agent":"made-up","reason":"x","brief":"Do something."}';
    expect(parseDispatchFromMessage(unknownAgent, specialists).handOff).toBeUndefined();
    expect(parseDispatchFromMessage(unknownAgent, specialists).content).toBe("Routing.");

    const missingBrief = 'Routing.\nDISPATCH: {"agent":"designer","reason":"x"}';
    expect(parseDispatchFromMessage(missingBrief, specialists).handOff).toBeUndefined();
  });

  it("strips but ignores malformed dispatch JSON", () => {
    const message = "Routing.\nDISPATCH: {agent: designer}";
    const { content, handOff } = parseDispatchFromMessage(message, specialists);
    expect(content).toBe("Routing.");
    expect(handOff).toBeUndefined();
  });
});

describe("applyDispatchToChatMessage", () => {
  it("attaches the hand-off card to a plain assistant reply", () => {
    const result = applyDispatchToChatMessage(
      {
        role: "assistant",
        content:
          'Design is the right fit.\nDISPATCH: {"agent":"designer","reason":"styling","brief":"Use a dark theme."}',
      },
      specialists,
    );
    expect(result.content).toBe("Design is the right fit.");
    expect(result.agentHandOff?.brief).toBe("Use a dark theme.");
  });

  it("never doubles a reply that already carries a proposal", () => {
    const message = {
      role: "assistant" as const,
      content:
        'Done.\nDISPATCH: {"agent":"designer","reason":"styling","brief":"Use a dark theme."}',
      fileChanges: [{ fileName: "styles.css", status: "modified" as const }],
    };
    expect(applyDispatchToChatMessage(message, specialists)).toBe(message);
  });
});
