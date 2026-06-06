import { describe, expect, it, vi } from "vitest";

import { runInstructionAnalysis } from "./instructionAnalysisRunner";
import { instructionAnalysisFixtures } from "./instructionAnalysisFixtures";

/**
 * Opt-in live evaluation of model-assisted guide-shape inference against the
 * labeled real-level corpus. Makes a REAL OpenAI request per fixture, so it is
 * skipped unless you provide a key, keeping CI offline and deterministic.
 *
 *   TUTOR_LIVE_EVAL_KEY=sk-... npx vitest run src/lib/tutor/instruction/instructionAnalysisRunner.liveeval.test.ts
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

describeLive("instruction analysis — live evaluation", () => {
  it("infers the guide shape accurately for the real-level corpus", async () => {
    const minAccuracy = Number(process.env.TUTOR_LIVE_EVAL_MIN_ACCURACY ?? "0.8");

    const rows: Array<{
      ok: boolean;
      got: string;
      expected: string;
      id: string;
      note?: string;
    }> = [];

    for (const fixture of instructionAnalysisFixtures) {
      const assessment = fixture.instructionsOnly ? undefined : fixture.assessment;
      const result = await runInstructionAnalysis({
        instructionsMarkdown: fixture.markdown,
        assessment,
      });
      const got = result.guide.type === "choice-based" ? "open-ended" : "linear";
      rows.push({
        ok: got === fixture.expectedMode,
        got,
        expected: fixture.expectedMode,
        id: fixture.id,
        note: fixture.note,
      });
    }

    const correct = rows.filter((row) => row.ok).length;
    const accuracy = correct / rows.length;

    const report = [
      "",
      `Instruction analysis live eval — ${correct}/${rows.length} correct (${(accuracy * 100).toFixed(1)}%)`,
      ...rows.map((row) => {
        const status = row.ok ? "PASS" : "FAIL";
        const detail = row.ok ? "" : `\n      ↳ ${row.note ?? ""}`;
        return `  ${status} got=${row.got} exp=${row.expected} :: ${row.id}${detail}`;
      }),
      "",
    ].join("\n");
    process.stdout.write(`${report}\n`);

    expect(accuracy, report).toBeGreaterThanOrEqual(minAccuracy);
  }, 120_000);
});
