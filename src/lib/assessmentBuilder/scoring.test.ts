import { describe, expect, it } from "vitest";
import { mockAifCourseBank } from "../../data/assessmentBuilder/mockBank";
import { mockP0ExamAssessment } from "../../data/assessmentBuilder/mockAssessments";
import { mockQuizStudentResponseSubmitted } from "../../data/assessmentBuilder/mockStudentResponses";
import type { QuestionItem, QuestionResponse } from "../../types/assessmentBuilder";
import { scoreByStandard, scoreQuestionResponse } from "./scoring";

function demoEntries() {
  const byId = new Map(mockAifCourseBank.questions.map((q) => [q.bankId, q]));
  const { answers } = mockQuizStudentResponseSubmitted;
  return mockP0ExamAssessment.questionRefs.flatMap((ref) => {
    const question = ref.type === "bank" ? byId.get(ref.bankId) : ref.item;
    if (!question) return [];
    const response: QuestionResponse = {
      bankId: question.bankId,
      multiSelectedIds: answers.multi[question.bankId]
        ? [answers.multi[question.bankId]]
        : undefined,
      freeText: answers.freeText[question.bankId],
      matchAssignments: answers.match[question.bankId],
    };
    return [{ question: question as QuestionItem, response }];
  });
}

describe("scoreByStandard", () => {
  it("agrees with the overall tally when every graded question has one standard", () => {
    const entries = demoEntries();
    const breakdown = scoreByStandard(entries);
    const graded = entries.filter((e) => e.question.item.kind !== "freeResponse");
    const correct = graded.filter(
      (e) => scoreQuestionResponse(e.question, e.response).outcome === "correct",
    ).length;

    const sumGraded = breakdown.rows.reduce((n, r) => n + r.graded, 0);
    const sumCorrect = breakdown.rows.reduce((n, r) => n + r.correct, 0);
    const multiTagged = graded.filter((e) => e.question.tags.length > 1);

    // Multi-tagged questions are counted once per tag.
    const extraGraded = multiTagged.reduce((n, e) => n + e.question.tags.length - 1, 0);
    expect(sumGraded).toBe(graded.length - breakdown.untaggedGraded + extraGraded);
    expect(sumCorrect).toBeLessThanOrEqual(correct + extraGraded);
    expect(breakdown.hasMultiTagged).toBe(multiTagged.length > 0);
  });

  it("leaves free response out and counts untagged questions separately", () => {
    const [mc] = demoEntries().filter((e) => e.question.item.kind === "multi");
    const fr = demoEntries().find((e) => e.question.item.kind === "freeResponse")!;
    const untagged = { ...mc, question: { ...mc.question, bankId: "x", tags: [] } };
    const breakdown = scoreByStandard([fr, untagged]);
    expect(breakdown.rows).toEqual([]);
    expect(breakdown.untaggedGraded).toBe(1);
    expect(breakdown.untaggedCorrect).toBe(
      scoreQuestionResponse(untagged.question, untagged.response).outcome === "correct" ? 1 : 0,
    );
  });

  it("rounds percent per standard", () => {
    const multis = demoEntries().filter((e) => e.question.item.kind === "multi");
    const tag = { id: "t", label: "Only" };
    const entries = multis.slice(0, 3).map((e, i) => ({
      question: { ...e.question, tags: [tag] },
      response: i === 0 ? e.response : { bankId: e.question.bankId, multiSelectedIds: ["zzz"] },
    }));
    const [row] = scoreByStandard(entries).rows;
    expect(row.graded).toBe(3);
    expect(row.percent).toBe(Math.round((row.correct / 3) * 100));
  });

  it("subtotals categories in outline order, counting each question once", () => {
    const [mc] = demoEntries().filter((e) => e.question.item.kind === "multi");
    const cat = { id: "c2", code: "2", label: "Two" };
    const a = { id: "a", label: "A", code: "X 2.1", category: cat };
    const b = { id: "b", label: "B", code: "X 2.2", category: cat };
    const first = { id: "f", label: "F", code: "X 1.1", category: { id: "c1", code: "1", label: "One" } };
    const breakdown = scoreByStandard([
      { ...mc, question: { ...mc.question, bankId: "both", tags: [a, b] } },
      { ...mc, question: { ...mc.question, bankId: "first", tags: [first] } },
    ]);
    expect(breakdown.categories.map((c) => c.category.id)).toEqual(["c1", "c2"]);
    expect(breakdown.categories[1].graded).toBe(1);
    expect(breakdown.rows.filter((r) => r.tag.category?.id === "c2")).toHaveLength(2);
  });
});
