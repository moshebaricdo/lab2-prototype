import type {
  ChoiceBasedInstructionGuide,
  InstructionGuide,
  LinearInstructionGuide,
  TutorOpening,
  TutorOpeningTone,
} from "../../types/tutor";

interface TutorOpeningOverrides {
  goal?: string;
  success?: string;
  firstMove?: string;
}

const OPENING_OVERRIDE_PATTERNS = {
  goal: /<!--\s*tutor-opening-goal:\s*([\s\S]*?)-->/i,
  success: /<!--\s*tutor-opening-success:\s*([\s\S]*?)-->/i,
  firstMove: /<!--\s*tutor-opening-first-move:\s*([\s\S]*?)-->/i,
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdownInline(value: string) {
  return normalizeWhitespace(
    value
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s*/, "")
      .replace(/^[-*]\s+/, ""),
  );
}

function stripWorksheetPrefix(value: string) {
  return stripMarkdownInline(value)
    .replace(/^(expected behavior|do this|start here|level guide|try these prompts[^:]*):?\s*/i, "")
    .replace(/^\d+\s*:\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
}

function looksLikeNumberedStepTitle(value: string) {
  const trimmed = value.trim();
  return /^\d+\s*:\s*.+/i.test(trimmed) || /^\d+\.\s+.+/i.test(trimmed);
}

function isUsableSuccessPhrase(value: string) {
  const normalized = stripWorksheetPrefix(value);
  if (!normalized) return false;
  if (looksLikeNumberedStepTitle(normalized)) return false;
  if (/^(create|save|revert|test|check|ask)\b/i.test(normalized) && normalized.split(" ").length <= 6) {
    return false;
  }
  return true;
}

function firstHeadingTitle(markdown: string) {
  const heading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));
  return heading ? stripWorksheetPrefix(heading.replace(/^#{1,6}\s+/, "")) : "";
}

function markdownLines(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseOpeningOverrides(markdown: string): TutorOpeningOverrides {
  return {
    goal: markdown.match(OPENING_OVERRIDE_PATTERNS.goal)?.[1]?.trim(),
    success: markdown.match(OPENING_OVERRIDE_PATTERNS.success)?.[1]?.trim(),
    firstMove: markdown.match(OPENING_OVERRIDE_PATTERNS.firstMove)?.[1]?.trim(),
  };
}

function expectedBehaviorFromMarkdown(markdown: string) {
  const line = markdownLines(markdown).find((candidate) =>
    /\*\*expected behavior:\*\*/i.test(candidate) ||
    /^expected behavior:/i.test(stripMarkdownInline(candidate))
  );
  return line ? stripWorksheetPrefix(line) : "";
}

function firstNumberedAction(guide: LinearInstructionGuide) {
  const firstStep = guide.steps[0];
  const candidates = [
    guide.firstMove,
    firstStep?.prompt,
    firstStep?.notes?.[0],
  ].map((value) => (value ? stripWorksheetPrefix(value) : ""));

  return candidates.find((value) => value && !looksLikeNumberedStepTitle(value)) ?? "";
}

function deriveTone(markdown: string, guide: InstructionGuide): TutorOpeningTone {
  if (guide.type === "choice-based") return "creative";
  const text = `${markdown} ${guide.overview} ${guide.firstMove}`.toLowerCase();
  if (/\bpromise|pending|fulfilled|rejected\b/.test(text)) return "concept";
  if (/\bwhile\s+loop|increment|push|sequence|loader\b/.test(text)) return "procedure";
  if (/\bdebug|broken|isn'?t working|not working|button|expected behavior\b/.test(text)) return "debug";
  return "procedure";
}

function titleSubject(title: string) {
  return title
    .replace(/^trace\s+/i, "")
    .replace(/^polish\s+/i, "")
    .replace(/^the\s+/i, "")
    .trim();
}

function deriveDebugGoal(title: string, success: string) {
  if (/next button/i.test(success)) {
    return "debug why the Next button is not working correctly";
  }
  if (title) return `debug the ${titleSubject(title).toLowerCase()}`;
  return "debug what is not working yet";
}

function deriveConceptGoal(markdown: string, title: string) {
  if (/\bpromise/i.test(markdown)) {
    return "tracing how Promises change state over time";
  }
  return title ? `understanding ${titleSubject(title).toLowerCase()}` : "understanding the code behavior";
}

function deriveProcedureGoal(markdown: string, title: string) {
  if (/\bloader|ship|cargo|freez/i.test(markdown)) {
    return "fix the loader so the ship can fill up without freezing the browser";
  }
  return title ? `work through ${titleSubject(title).toLowerCase()}` : "work through the code one piece at a time";
}

function deriveCreativeGoal(guide: ChoiceBasedInstructionGuide) {
  return stripWorksheetPrefix(guide.goal)
    .replace(/^with the help of ai,\s*/i, "")
    .replace(/^improve\s+/i, "polishing ")
    .replace(/\.$/, "");
}

function deriveSuccess(markdown: string, guide: InstructionGuide, tone: TutorOpeningTone) {
  const expectedBehavior = expectedBehaviorFromMarkdown(markdown);
  if (expectedBehavior) return expectedBehavior;

  if (guide.type === "choice-based") {
    return "the buttons, links, and hover/focus states feel intentional, on-brand, and easy to use";
  }

  const text = markdown.toLowerCase();
  if (tone === "concept" && /\bpromise/i.test(text)) {
    return "each numbered spot is labeled as pending, fulfilled, or rejected, with a short explanation";
  }
  if (/\bship|cargo|800 tons|freez/i.test(text)) {
    return "the loop adds cargo and moves forward until the ship reaches 800 tons without freezing";
  }

  const fallback = stripWorksheetPrefix(guide.firstMove || guide.overview);
  return isUsableSuccessPhrase(fallback) ? fallback : "";
}

function deriveFirstMove(markdown: string, guide: InstructionGuide, tone: TutorOpeningTone) {
  if (guide.type === "choice-based") {
    const labels = guide.options.map((option) => option.label.toLowerCase()).slice(0, 4);
    return labels.length > 0
      ? `Pick one area to improve first, like ${labels.join(", ")}. Tell me what you want to focus on.`
      : "Pick one area to improve first, then tell me what you want to focus on.";
  }

  const firstAction = firstNumberedAction(guide);
  if (tone === "concept" && /\bpromise/i.test(markdown)) {
    return "Start with the first numbered comment in the code. Tell me what state you think the Promise is in.";
  }
  if (/\bwhile\s+loop|runBtn/i.test(markdown)) {
    return "Start by finding the while loop inside the runBtn event listener. Tell me what you notice around the missing-code comments.";
  }
  if (firstAction) {
    const actionOnly = firstAction
      .replace(/\s+What happens.*$/i, "")
      .replace(/[?.]+$/, "")
      .trim();
    if (looksLikeNumberedStepTitle(actionOnly)) {
      const cleaned = stripWorksheetPrefix(actionOnly);
      return `Start with "${cleaned}". Tell me what you'd like to do first.`;
    }
    return `First, ${actionOnly.charAt(0).toLowerCase()}${actionOnly.slice(1)}. Tell me what you notice.`;
  }
  return "Try the first small step, then tell me what you notice.";
}

function formatGoalSentence(tone: TutorOpeningTone, goal: string) {
  if (tone === "debug") return `Let's ${goal}.`;
  if (tone === "creative") return `This level is about ${goal}.`;
  if (tone === "concept") return `This level is about ${goal}.`;
  return `In this level, you'll ${goal}.`;
}

function formatSuccessSentence(tone: TutorOpeningTone, success: string) {
  if (tone === "debug") return `When the page works, ${success.charAt(0).toLowerCase()}${success.slice(1)}`;
  if (tone === "creative") return `Aim for a page where ${success}.`;
  return `You'll know you're on track when ${success}.`;
}

export function buildTutorOpening(markdown: string, guide: InstructionGuide): TutorOpening {
  const overrides = parseOpeningOverrides(markdown);
  const title = firstHeadingTitle(markdown);
  const tone = deriveTone(markdown, guide);
  const success = stripWorksheetPrefix(overrides.success ?? deriveSuccess(markdown, guide, tone));
  const goal = stripWorksheetPrefix(overrides.goal ?? (
    guide.type === "choice-based"
      ? deriveCreativeGoal(guide)
      : tone === "debug"
        ? deriveDebugGoal(title, success)
        : tone === "concept"
          ? deriveConceptGoal(markdown, title)
          : deriveProcedureGoal(markdown, title)
  ));
  const firstMove = stripWorksheetPrefix(overrides.firstMove ?? deriveFirstMove(markdown, guide, tone));

  return {
    tone,
    goal,
    success,
    firstMove,
    sourceSignature: `${guide.sourceSignature}:${tone}:${goal}:${success}:${firstMove}`,
  };
}

export function formatInstructionOpeningMessage(opening: TutorOpening) {
  const goalSentence = formatGoalSentence(opening.tone, opening.goal);
  const success = opening.success?.trim();
  const successPart =
    success && isUsableSuccessPhrase(success)
      ? ` ${formatSuccessSentence(opening.tone, success)}`
      : "";

  return [goalSentence + successPart, opening.firstMove].filter(Boolean).join("\n\n");
}

export function formatTutorOpening(opening: TutorOpening) {
  return formatInstructionOpeningMessage(opening);
}
