import { describe, expect, it, vi } from "vitest";

import { resolveValidationReviewIntent } from "./validationReviewIntentClassifier";
import { VALIDATION_REVIEW_INTENT_FIXTURES } from "./validationReviewIntentFixtures";

/**
 * Opt-in live evaluation of the model-assisted validation-review intent gate.
 *
 *   TUTOR_LIVE_EVAL_KEY=sk-... npx vitest run src/lib/validation/validationReviewIntentClassifier.liveeval.test.ts
 *
 * Optional env:
 *   TUTOR_LIVE_EVAL_MODEL         (default "gpt-4.1-nano")
 *   TUTOR_LIVE_EVAL_MIN_ACCURACY  (default "0.75")
 */
const LIVE_KEY = process.env.TUTOR_LIVE_EVAL_KEY ?? "";

vi.mock("../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => process.env.TUTOR_LIVE_EVAL_KEY ?? "",
  getTutorCodeModel: () => process.env.TUTOR_LIVE_EVAL_MODEL ?? "gpt-4.1-nano",
}));

const describeLive = LIVE_KEY ? describe : describe.skip;

describeLive("validation review intent classifier — live evaluation", () => {
  it("classifies the fixture corpus accurately with the real model", async () => {
    const minAccuracy = Number(process.env.TUTOR_LIVE_EVAL_MIN_ACCURACY ?? "0.75");

    const rows: Array<{
      ok: boolean;
      got: boolean;
      expected: boolean;
      source: string;
      message: string;
    }> = [];

    for (const fixture of VALIDATION_REVIEW_INTENT_FIXTURES) {
      if (fixture.message === "yes" && fixture.lastAssistantOfferedReview) {
        const result = await resolveValidationReviewIntent({
          message: fixture.message,
          workflow: { lastAssistantOfferedReview: true },
        });
        rows.push({
          ok: result.shouldRunReview === fixture.expectedShouldRunReview,
          got: result.shouldRunReview,
          expected: fixture.expectedShouldRunReview,
          source: result.source,
          message: fixture.message,
        });
        continue;
      }

      const result = await resolveValidationReviewIntent({
        message: fixture.message,
        context: fixture.context,
        workflow: {
          lastAssistantOfferedReview: fixture.lastAssistantOfferedReview,
        },
      });
      rows.push({
        ok: result.shouldRunReview === fixture.expectedShouldRunReview,
        got: result.shouldRunReview,
        expected: fixture.expectedShouldRunReview,
        source: result.source,
        message: fixture.message,
      });
    }

    const correct = rows.filter((row) => row.ok).length;
    const accuracy = correct / rows.length;

    const report = [
      "",
      `Validation review intent classifier live eval — ${correct}/${rows.length} correct (${(accuracy * 100).toFixed(1)}%)`,
      ...rows.map(
        (row) =>
          `  ${row.ok ? "PASS" : "FAIL"} [${row.source}] got=${row.got} exp=${row.expected} :: ${row.message}`,
      ),
      "",
    ].join("\n");
    process.stdout.write(`${report}\n`);

    expect(accuracy, report).toBeGreaterThanOrEqual(minAccuracy);
  }, 120_000);
});
