import type {
  ChoiceBasedInstructionGuide,
  InstructionGuide,
  LinearInstructionGuide,
  TutorOpening,
  TutorOpeningTone,
} from "../../../types/tutor";

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

function deriveDebugGoal(title: string, success: string, markdown: string) {
  if (/next button|photo|carousel|caption/i.test(`${success} ${markdown}`)) {
    return "In this level, we'll debug and fix the Next button in the photo carousel.";
  }
  if (title && !/^do this$/i.test(title)) {
    return `Let's debug and fix ${titleSubject(title).toLowerCase()}.`;
  }
  return "Let's figure out what's not working yet and fix it together.";
}

function deriveConceptGoal(markdown: string, title: string) {
  if (/\bpromise/i.test(markdown)) {
    return "We'll trace how Promises change state over time.";
  }
  return title
    ? `Let's explore ${titleSubject(title).toLowerCase()}.`
    : "Let's understand how this code behaves.";
}

function deriveProcedureGoal(markdown: string, title: string) {
  if (/\bloader|ship|cargo|freez/i.test(markdown)) {
    return "Let's fix the loader so the ship can fill up without freezing the browser.";
  }
  return title
    ? `We'll work through ${titleSubject(title).toLowerCase()} step by step.`
    : "We'll work through the code one piece at a time.";
}

function deriveCreativeGoal(guide: ChoiceBasedInstructionGuide) {
  const subject = stripWorksheetPrefix(guide.goal)
    .replace(/^with the help of ai,\s*/i, "")
    .replace(/^improve\s+/i, "polish ")
    .replace(/\.$/, "");
  return subject.match(/^polish/i)
    ? `We'll ${subject}.`
    : `Let's work on ${subject}.`;
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
      ? `Pick one area to improve first — maybe ${labels.join(", ")} — and tell me what you'd like to focus on.`
      : "Pick one area to improve first and tell me what you'd like to focus on.";
  }

  const firstAction = firstNumberedAction(guide);
  if (tone === "concept" && /\bpromise/i.test(markdown)) {
    return "Start with the first numbered comment in the code and tell me what state you think the Promise is in.";
  }
  if (/\bwhile\s+loop|runBtn/i.test(markdown)) {
    return "Start by finding the while loop inside the runBtn event listener and tell me what you notice around the missing-code comments.";
  }
  if (/\bnext button|click the next/i.test(`${markdown} ${firstAction}`)) {
    return "Start by clicking the Next button and tell me what you observe.";
  }
  if (firstAction) {
    const actionOnly = firstAction
      .replace(/\s+What happens.*$/i, "")
      .replace(/[?.]+$/, "")
      .trim();
    if (looksLikeNumberedStepTitle(actionOnly)) {
      const cleaned = stripWorksheetPrefix(actionOnly);
      return `Start with "${cleaned}" and tell me what you'd like to do first.`;
    }
    return `Start by ${actionOnly.charAt(0).toLowerCase()}${actionOnly.slice(1)} and tell me what you observe.`;
  }
  return "Try the first small step and tell me what you observe.";
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
        ? deriveDebugGoal(title, success, markdown)
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
  const goal = opening.goal?.trim();
  const firstMove = opening.firstMove?.trim();
  return [goal, firstMove].filter(Boolean).join("\n\n");
}

export function formatTutorOpening(opening: TutorOpening) {
  return formatInstructionOpeningMessage(opening);
}
