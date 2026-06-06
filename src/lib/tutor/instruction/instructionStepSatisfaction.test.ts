import { afterEach, describe, expect, it, vi } from "vitest";
import type { InstructionStep } from "../../../types/tutor";
import type { TutorInstructionStepSatisfactionProvider } from "../provider/openAiProvider";
import {
  assessInstructionStepSatisfaction,
  buildInstructionStepSatisfactionMessages,
  isStrongStepCompletionSignal,
} from "./instructionStepSatisfaction";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

const LABEL_STEP: InstructionStep = {
  id: "label-states",
  title: "Label the states",
  prompt: "Write whether each numbered Promise is pending, fulfilled, or rejected.",
  intent: "explain",
  expectedStudentMove: "reflection",
};

function mockProvider(
  response: { satisfied?: boolean } | null,
): TutorInstructionStepSatisfactionProvider {
  return {
    requestInstructionStepSatisfaction: vi.fn(async () => response),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("instructionStepSatisfaction", () => {
  it("treats success reports and ask-for-help steps as strong completion signals", () => {
    expect(isStrongStepCompletionSignal(LABEL_STEP, "it works now")).toBe(true);
    expect(isStrongStepCompletionSignal(
      { ...LABEL_STEP, intent: "ask-for-help" },
      "why isn't this working?",
    )).toBe(true);
    expect(isStrongStepCompletionSignal(LABEL_STEP, "I labeled them pending and fulfilled")).toBe(false);
  });

  it("builds satisfaction messages with step context", () => {
    const messages = buildInstructionStepSatisfactionMessages(
      LABEL_STEP,
      "I think step 1 is pending.",
    );
    const userContent = messages[1]?.content;
    const payload = JSON.parse(typeof userContent === "string" ? userContent : "{}");
    expect(payload.step.title).toBe("Label the states");
    expect(payload.studentMessage).toContain("pending");
  });

  it("fail-opens without an API key on weak signals", async () => {
    const result = await assessInstructionStepSatisfaction({
      step: LABEL_STEP,
      message: "maybe I should look at the comments",
    });

    expect(result).toBe(true);
  });

  it("honors a keyed model verdict on weak signals", async () => {
    const holdProvider = mockProvider({ satisfied: false });
    const hold = await assessInstructionStepSatisfaction({
      step: LABEL_STEP,
      message: "maybe I should look at the comments",
      provider: holdProvider,
    });
    expect(holdProvider.requestInstructionStepSatisfaction).toHaveBeenCalledOnce();
    expect(hold).toBe(false);

    const advanceProvider = mockProvider({ satisfied: true });
    const advance = await assessInstructionStepSatisfaction({
      step: LABEL_STEP,
      message: "I wrote pending for the first one and fulfilled for the second.",
      provider: advanceProvider,
    });
    expect(advance).toBe(true);
  });

  it("fail-opens when the provider throws", async () => {
    const provider: TutorInstructionStepSatisfactionProvider = {
      requestInstructionStepSatisfaction: vi.fn(async () => {
        throw new Error("network");
      }),
    };

    const result = await assessInstructionStepSatisfaction({
      step: LABEL_STEP,
      message: "I added the labels already.",
      provider,
    });

    expect(result).toBe(true);
  });
});
