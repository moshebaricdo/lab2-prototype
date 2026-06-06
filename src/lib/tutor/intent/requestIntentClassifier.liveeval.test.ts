import { describe, expect, it, vi } from "vitest";

import { classifyTutorRequestIntentWithModel } from "./requestIntentClassifier";
import { REQUEST_INTENT_FIXTURES } from "./requestIntentFixtures";

/**
 * Opt-in live evaluation of the model-assisted intent classifier against the
 * labeled fixture corpus. This makes a REAL OpenAI request per fixture, so it is
 * skipped unless you provide a key, keeping CI offline and deterministic.
 *
 * Run it manually to measure real model accuracy before trusting routing:
 *
 *   TUTOR_LIVE_EVAL_KEY=sk-... npx vitest run src/lib/tutor/intent/requestIntentClassifier.liveeval.test.ts
 *
 * Optional env:
 *   TUTOR_LIVE_EVAL_MODEL         (default "gpt-4.1-nano")
 *   TUTOR_LIVE_EVAL_MIN_ACCURACY  (default "0.8")
 */
const LIVE_KEY = process.env.TUTOR_LIVE_EVAL_KEY ?? "";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => process.env.TUTOR_LIVE_EVAL_KEY ?? "",
  getTutorCodeModel: () => process.env.TUTOR_LIVE_EVAL_MODEL ?? "gpt-4.1-nano",
}));

const describeLive = LIVE_KEY ? describe : describe.skip;

describeLive("request intent classifier — live evaluation", () => {
  it("classifies the fixture corpus accurately with the real model", async () => {
    const minAccuracy = Number(process.env.TUTOR_LIVE_EVAL_MIN_ACCURACY ?? "0.8");

    const rows: Array<{
      ok: boolean;
      got: string;
      expected: string;
      source: string;
      message: string;
    }> = [];

    for (const fixture of REQUEST_INTENT_FIXTURES) {
      const result = await classifyTutorRequestIntentWithModel({
        message: fixture.message,
        context: fixture.context,
      });
      rows.push({
        ok: result.intent === fixture.expectedIntent,
        got: result.intent,
        expected: fixture.expectedIntent,
        source: result.source,
        message: fixture.message,
      });
    }

    const correct = rows.filter((row) => row.ok).length;
    const accuracy = correct / rows.length;

    const report = [
      "",
      `Intent classifier live eval — ${correct}/${rows.length} correct (${(accuracy * 100).toFixed(1)}%)`,
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
