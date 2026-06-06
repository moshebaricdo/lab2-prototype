import { describe, expect, it } from "vitest";
import {
  EDIT_VERBS,
  EDIT_VERB_GROUP,
  asksForExplicitAnswer,
  asksToContinue,
  asksTutorAQuestion,
  hasConcreteEditDirective,
  hasVagueEditQualityGoal,
  isAffirmation,
  mentionsCompletionStatus,
  mentionsConcept,
  mentionsHelpRequest,
  messageIndicatesCompletionOrReadiness,
  reportsSuccess,
} from "./studentIntentSignals";

describe("studentIntentSignals", () => {
  it("exposes the edit-verb alternation group built from EDIT_VERBS", () => {
    expect(EDIT_VERB_GROUP).toBe(`(${EDIT_VERBS.join("|")})`);
    expect(EDIT_VERBS).toContain("make");
    expect(EDIT_VERBS).toContain("wire");
  });

  it("detects concept questions but not progress reports", () => {
    expect(mentionsConcept("What is a promise?")).toBe(true);
    expect(mentionsConcept("define a closure")).toBe(true);
    expect(mentionsConcept("I don't know what to do")).toBe(true);
    expect(mentionsConcept("I added the comments")).toBe(false);
    expect(mentionsConcept("it works now")).toBe(false);
  });

  it("detects explicit answer requests", () => {
    expect(asksForExplicitAnswer("just tell me what selector to use")).toBe(true);
    expect(asksForExplicitAnswer("give me the answer")).toBe(true);
    expect(asksForExplicitAnswer("what do you think is happening?")).toBe(false);
  });

  it("detects help requests separately from concept questions", () => {
    expect(mentionsHelpRequest("why isn't this working?")).toBe(true);
    expect(mentionsHelpRequest("I'm stuck")).toBe(true);
    expect(mentionsHelpRequest("what is a promise?")).toBe(false);
  });

  it("treats both help and concept questions as questions for Tutor", () => {
    expect(asksTutorAQuestion("why isn't this working?")).toBe(true);
    expect(asksTutorAQuestion("what is a promise?")).toBe(true);
    expect(asksTutorAQuestion("I added the comments already")).toBe(false);
  });

  it("detects success reports and continue requests", () => {
    expect(reportsSuccess("it works now!")).toBe(true);
    expect(reportsSuccess("fixed it")).toBe(true);
    expect(reportsSuccess("nothing happens")).toBe(false);

    expect(asksToContinue("am I done?")).toBe(true);
    expect(asksToContinue("can I continue?")).toBe(true);
    expect(asksToContinue("what should I change?")).toBe(false);
  });

  it("detects bare affirmations but not qualified replies", () => {
    expect(isAffirmation("yes")).toBe(true);
    expect(isAffirmation("Yes please")).toBe(true);
    expect(isAffirmation("sure, go ahead")).toBe(true);
    expect(isAffirmation("ok")).toBe(true);
    expect(isAffirmation("let's do it")).toBe(true);
    expect(isAffirmation("yes but how do I fix the parsing step?")).toBe(false);
    expect(isAffirmation("no thanks")).toBe(false);
    expect(isAffirmation("what should I change?")).toBe(false);
  });

  it("detects vague edit quality goals and concrete directives separately", () => {
    expect(hasVagueEditQualityGoal("make the buttons more exciting")).toBe(true);
    expect(hasVagueEditQualityGoal("Let's refine the buttons")).toBe(true);
    expect(hasConcreteEditDirective("make all buttons blue")).toBe(true);
    expect(hasConcreteEditDirective("make the buttons better")).toBe(false);
  });

  it("composes completion and readiness guards for focus-pick routing", () => {
    expect(messageIndicatesCompletionOrReadiness("I'm done!")).toBe(true);
    expect(messageIndicatesCompletionOrReadiness("I'm finished with the links")).toBe(true);
    expect(mentionsCompletionStatus("nav links are done")).toBe(true);
    expect(messageIndicatesCompletionOrReadiness("nav links")).toBe(false);
  });
});
