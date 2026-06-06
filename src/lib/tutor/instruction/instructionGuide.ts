import type {
  ChoiceBasedInstructionGuide,
  InstructionGuide,
  InstructionOption,
  InstructionStep,
  InstructionStepIntent,
  LinearInstructionGuide,
} from "../../../types/tutor";

interface TutorGuideMetadata {
  overview?: string;
  firstMove?: string;
  mode?: "linear" | "open-ended" | "choice-based";
  checkpoints: string[];
}

const TUTOR_GUIDE_COMMENT_PATTERN = /<!--\s*tutor-guide:\s*([\s\S]*?)-->/i;
const TUTOR_MODE_COMMENT_PATTERN = /<!--\s*tutor-mode:\s*([\w-]+)\s*-->/i;
const TUTOR_FIRST_MOVE_COMMENT_PATTERN = /<!--\s*tutor-first-move:\s*([\s\S]*?)-->/i;
const HEADING_PATTERN = /^#{1,6}\s+(.+)$/;
const BOLD_LABEL_PATTERN = /^\*\*([^*]+):\*\*\s*(.*)$/;
const ORDERED_LABEL_PATTERN = /^\*\*(\d+\s*:\s*[^*]+)\*\*\s*(.*)$/;
const PLAIN_ORDERED_PATTERN = /^(\d+)\.\s+(.+)$/;
const BULLET_PATTERN = /^[-*]\s+(.+)$/;

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

export function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

export function stableSignature(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function parseTutorGuideMetadata(markdown: string): TutorGuideMetadata | null {
  const match = markdown.match(TUTOR_GUIDE_COMMENT_PATTERN);
  const body = match?.[1]?.trim();
  const modeMatch = markdown.match(TUTOR_MODE_COMMENT_PATTERN);
  const firstMoveMatch = markdown.match(TUTOR_FIRST_MOVE_COMMENT_PATTERN);

  const metadata: TutorGuideMetadata = { checkpoints: [] };
  const rawMode = modeMatch?.[1]?.trim().toLowerCase();
  if (rawMode === "open-ended" || rawMode === "choice-based") {
    metadata.mode = "choice-based";
  } else if (rawMode === "linear") {
    metadata.mode = "linear";
  }
  if (firstMoveMatch?.[1]?.trim()) {
    metadata.firstMove = stripMarkdownInline(firstMoveMatch[1]);
  }

  if (body) {
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      const [rawKey, ...valueParts] = line.split(":");
      const key = rawKey?.trim();
      const value = valueParts.join(":").trim();
      if (!key || !value) continue;

      if (key === "overview") {
        metadata.overview = value;
      } else if (key === "firstMove") {
        metadata.firstMove = value;
      } else if (key === "mode") {
        const mode = value.toLowerCase();
        if (mode === "open-ended" || mode === "choice-based") {
          metadata.mode = "choice-based";
        } else if (mode === "linear") {
          metadata.mode = "linear";
        }
      } else if (key === "checkpoint") {
        metadata.checkpoints.push(value);
      }
    }
  }

  return metadata.overview || metadata.firstMove || metadata.mode || metadata.checkpoints.length > 0
    ? metadata
    : null;
}

/** Removes Tutor-only authoring metadata before student-facing instruction render. */
export function stripInstructionAuthoringMetadata(markdown: string) {
  return markdown
    .replace(TUTOR_GUIDE_COMMENT_PATTERN, "")
    .replace(TUTOR_MODE_COMMENT_PATTERN, "")
    .replace(TUTOR_FIRST_MOVE_COMMENT_PATTERN, "")
    .trim();
}

function markdownWithoutTutorGuideMetadata(markdown: string) {
  return stripInstructionAuthoringMetadata(markdown);
}

function nonEmptyInstructionLines(markdown: string) {
  return markdownWithoutTutorGuideMetadata(markdown)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      line &&
      !/^---+$/.test(line) &&
      !/^```/.test(line)
    );
}

function firstContentLine(lines: string[]) {
  return lines.find((line) => {
    if (HEADING_PATTERN.test(line)) return false;
    if (PLAIN_ORDERED_PATTERN.test(line)) return false;
    const stripped = stripMarkdownInline(line).replace(/:\s*$/, "");
    return !/^(do this|start here)$/i.test(stripped);
  });
}

function titleFromLine(line: string, fallback: string) {
  const headingMatch = line.match(HEADING_PATTERN);
  if (headingMatch?.[1]) return stripMarkdownInline(headingMatch[1]);

  const orderedMatch = line.match(ORDERED_LABEL_PATTERN);
  if (orderedMatch?.[1]) return stripMarkdownInline(orderedMatch[1]).replace(/:\s*$/, "");

  const boldMatch = line.match(BOLD_LABEL_PATTERN);
  if (boldMatch?.[1]) return stripMarkdownInline(boldMatch[1]).replace(/:\s*$/, "");

  const orderedMatchPlain = line.match(PLAIN_ORDERED_PATTERN);
  if (orderedMatchPlain?.[2]) return stripMarkdownInline(orderedMatchPlain[2]);

  return fallback;
}

function promptFromLine(line: string) {
  const orderedMatch = line.match(ORDERED_LABEL_PATTERN);
  if (orderedMatch?.[2]) return stripMarkdownInline(orderedMatch[2]);

  const boldMatch = line.match(BOLD_LABEL_PATTERN);
  if (boldMatch?.[2]) return stripMarkdownInline(boldMatch[2]);

  const orderedMatchPlain = line.match(PLAIN_ORDERED_PATTERN);
  if (orderedMatchPlain?.[2]) return stripMarkdownInline(orderedMatchPlain[2]);

  return stripMarkdownInline(line);
}

function lineIsNote(line: string) {
  return /^[-*]\s+/.test(line) || /^>\s*/.test(line);
}

function deriveOverview(lines: string[]) {
  const title = lines.find((line) => HEADING_PATTERN.test(line));
  const firstContent = firstContentLine(lines);

  if (firstContent) return stripMarkdownInline(firstContent);
  if (title) return stripMarkdownInline(title.replace(/^#{1,6}\s+/, ""));
  return "Review the level instructions and get oriented before making a change.";
}

function deriveFirstMove(lines: string[], overview: string) {
  const actionLine = lines.find((line) =>
    ORDERED_LABEL_PATTERN.test(line) ||
    PLAIN_ORDERED_PATTERN.test(line) ||
    /\b(test|find|identify|start|choose|look|run|check|use|ask)\b/i.test(line)
  );

  if (actionLine) return promptFromLine(actionLine);
  return overview;
}

function instructionIntentFromText(value: string): InstructionStepIntent {
  if (/\b(ask|help|stuck|ai|tutor)\b/i.test(value)) return "ask-for-help";
  if (/\b(fix|change|update|make|edit|refine|polish|style|choose)\b/i.test(value)) return "fix";
  if (/\b(verify|confirm|check again|test again|works|continue)\b/i.test(value)) return "verify";
  if (/\b(test|run|click|try|what happens|observe|notice)\b/i.test(value)) return "observe";
  if (/\b(check|look|find|inspect|selector|basics|match|order|event|handler)\b/i.test(value)) return "inspect";
  return "explain";
}

export function expectedMoveForIntent(intent: InstructionStepIntent): InstructionStep["expectedStudentMove"] {
  if (intent === "observe" || intent === "inspect") return "observation";
  if (intent === "fix") return "code-change";
  if (intent === "verify") return "review-request";
  return "reflection";
}

const STEP_INTENTS: InstructionStepIntent[] = [
  "observe",
  "inspect",
  "explain",
  "fix",
  "verify",
  "ask-for-help",
];

const OPTION_INTENTS: InstructionOption["intent"][] = [
  "style-polish",
  "content-choice",
  "debug-focus",
  "concept-focus",
];

/** Coerces an arbitrary value to a known step intent, defaulting to "explain". */
export function normalizeStepIntent(value: unknown): InstructionStepIntent {
  return STEP_INTENTS.includes(value as InstructionStepIntent)
    ? (value as InstructionStepIntent)
    : "explain";
}

/** Coerces an arbitrary value to a known option intent, defaulting to "content-choice". */
export function normalizeOptionIntent(value: unknown): InstructionOption["intent"] {
  return OPTION_INTENTS.includes(value as InstructionOption["intent"])
    ? (value as InstructionOption["intent"])
    : "content-choice";
}

function checkpointFromMetadata(value: string, index: number): InstructionStep {
  const [rawTitle, ...promptParts] = value.split("|");
  const title = stripMarkdownInline(rawTitle || `Checkpoint ${index + 1}`);
  const prompt = stripMarkdownInline(promptParts.join("|"));
  const intent = instructionIntentFromText(`${title} ${prompt}`);

  return {
    id: slugify(title, `checkpoint-${index + 1}`),
    title,
    intent,
    expectedStudentMove: expectedMoveForIntent(intent),
    ...(prompt ? { prompt } : {}),
  };
}

function deriveLinearSteps(lines: string[]) {
  const steps: InstructionStep[] = [];
  const usedIds = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const isCheckpoint =
      ORDERED_LABEL_PATTERN.test(line) ||
      BOLD_LABEL_PATTERN.test(line) ||
      PLAIN_ORDERED_PATTERN.test(line);
    if (!isCheckpoint) continue;

    const title = titleFromLine(line, `Step ${steps.length + 1}`);
    if (!title || /^(do this|expected behavior)$/i.test(title)) continue;

    const baseId = slugify(title, `step-${steps.length + 1}`);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    const prompt = promptFromLine(line);
    const notes: string[] = [];
    for (let noteIndex = index + 1; noteIndex < lines.length; noteIndex += 1) {
      const candidate = lines[noteIndex] ?? "";
      if (
        ORDERED_LABEL_PATTERN.test(candidate) ||
        BOLD_LABEL_PATTERN.test(candidate) ||
        PLAIN_ORDERED_PATTERN.test(candidate) ||
        HEADING_PATTERN.test(candidate)
      ) {
        break;
      }
      if (lineIsNote(candidate)) {
        notes.push(stripMarkdownInline(candidate));
      }
    }

    const intent = instructionIntentFromText(`${title} ${prompt} ${notes.join(" ")}`);
    steps.push({
      id,
      title,
      intent,
      expectedStudentMove: expectedMoveForIntent(intent),
      ...(prompt && prompt !== title ? { prompt } : {}),
      ...(notes.length > 0 ? { notes } : {}),
    });
  }

  if (steps.length > 0) return steps.slice(0, 6);

  const overview = deriveOverview(lines);
  const firstMove = deriveFirstMove(lines, overview);
  const intent = instructionIntentFromText(firstMove);
  return [{
    id: "start",
    title: "Start",
    prompt: firstMove,
    intent,
    expectedStudentMove: expectedMoveForIntent(intent),
  }];
}

function bulletText(line: string) {
  const match = line.match(BULLET_PATTERN);
  return match?.[1] ? stripMarkdownInline(match[1]) : "";
}

function lineLooksLikePromptOption(line: string) {
  const text = bulletText(line);
  if (!text) return false;
  if (/^(don'?t|do not|remember|ensure|make sure)\b/i.test(text)) return false;
  return /\b(make|improve|give|import|apply|style|polish|choose|try|add|update|refine)\b/i.test(text);
}

function lineLooksLikeConstraint(line: string) {
  const text = bulletText(line);
  return Boolean(text) && /^(don'?t|do not|remember|ensure|make sure|keep|avoid)\b/i.test(text);
}

function optionLabelFromPrompt(prompt: string, fallback: string) {
  if (/\bnav\b|\bnav bar\b|\bnavigation\b/i.test(prompt)) return "Polish nav links";
  if (/\bbutton\b/i.test(prompt)) return "Improve buttons";
  if (/\bcards?\b/i.test(prompt) && /\blinks?\b/i.test(prompt)) return "Style card links";
  if (/\bfont\b|\btypeface\b|\btypography\b/i.test(prompt)) return "Apply a font";

  const firstClause = prompt.split(":")[0]?.trim() || prompt;
  const normalized = firstClause
    .replace(/\[[^\]]+\]/g, "this")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length <= 42 ? normalized : `${normalized.slice(0, 39)}...` || fallback;
}

function optionIntentFromPrompt(prompt: string): InstructionOption["intent"] {
  if (/\b(style|polish|hover|focus|font|button|link|card|nav|color|spacing|brand)\b/i.test(prompt)) {
    return "style-polish";
  }
  if (/\bdebug|bug|broken|fix|error|not working\b/i.test(prompt)) return "debug-focus";
  if (/\bexplain|describe|identify|promise|loop|concept\b/i.test(prompt)) return "concept-focus";
  return "content-choice";
}

function deriveChoiceOptions(lines: string[]) {
  const options: InstructionOption[] = [];
  const promptOptions = lines.filter(lineLooksLikePromptOption);

  for (let index = 0; index < promptOptions.length; index += 1) {
    const prompt = bulletText(promptOptions[index] ?? "");
    const label = optionLabelFromPrompt(prompt, `Focus ${index + 1}`);
    options.push({
      id: slugify(label, `option-${index + 1}`),
      label,
      prompt,
      intent: optionIntentFromPrompt(prompt),
      editOriented: /\b(make|improve|give|import|apply|style|polish|add|update|refine)\b/i.test(prompt),
    });
  }

  return options.slice(0, 6);
}

function shouldUseChoiceBasedGuide(lines: string[], metadata?: TutorGuideMetadata | null) {
  if (metadata?.mode === "choice-based") return true;
  if (metadata?.mode === "linear") return false;

  const text = lines.join("\n");
  const optionCount = lines.filter(lineLooksLikePromptOption).length;
  return optionCount >= 2 &&
    /\b(try these prompts|choose|pick|improve|polish|explore|style|creative)\b/i.test(text);
}

function buildLinearInstructionGuide(options: {
  id: string;
  sourceSignature: string;
  overview: string;
  firstMove: string;
  fallbackMarkdown: string;
  lines: string[];
  metadata?: TutorGuideMetadata | null;
}): LinearInstructionGuide {
  const metadataSteps = options.metadata?.checkpoints.map(checkpointFromMetadata) ?? [];
  return {
    type: "linear",
    id: options.id,
    sourceSignature: options.sourceSignature,
    overview: options.overview,
    firstMove: options.firstMove,
    steps: metadataSteps.length > 0 ? metadataSteps : deriveLinearSteps(options.lines),
    fallbackMarkdown: options.fallbackMarkdown,
  };
}

function buildChoiceBasedInstructionGuide(options: {
  id: string;
  sourceSignature: string;
  overview: string;
  fallbackMarkdown: string;
  lines: string[];
}): ChoiceBasedInstructionGuide {
  const constraints = options.lines
    .filter(lineLooksLikeConstraint)
    .map(bulletText)
    .slice(0, 4);
  const derivedOptions = deriveChoiceOptions(options.lines);
  const fallbackOption: InstructionOption = {
    id: "choose-a-focus",
    label: "Choose a focus",
    prompt: options.overview,
    intent: "content-choice",
  };

  return {
    type: "choice-based",
    id: options.id,
    sourceSignature: options.sourceSignature,
    goal: options.overview,
    constraints,
    options: derivedOptions.length > 0 ? derivedOptions : [fallbackOption],
    fallbackMarkdown: options.fallbackMarkdown,
  };
}

export function buildInstructionGuide(markdown: string): InstructionGuide {
  const fallbackMarkdown = markdown.trim();
  const lines = nonEmptyInstructionLines(markdown);
  const metadata = parseTutorGuideMetadata(markdown);
  const derivedOverview = deriveOverview(lines);
  const overview = stripMarkdownInline(metadata?.overview ?? derivedOverview);
  const firstMove = stripMarkdownInline(metadata?.firstMove ?? deriveFirstMove(lines, overview));
  const sourceSignature = stableSignature(markdownWithoutTutorGuideMetadata(markdown));
  const id = slugify(firstHeadingTitle(lines) ?? overview, `guide-${sourceSignature}`);

  if (shouldUseChoiceBasedGuide(lines, metadata)) {
    return buildChoiceBasedInstructionGuide({
      id,
      sourceSignature,
      overview,
      fallbackMarkdown,
      lines,
    });
  }

  return buildLinearInstructionGuide({
    id,
    sourceSignature,
    overview,
    firstMove,
    fallbackMarkdown,
    lines,
    metadata,
  });
}

function firstHeadingTitle(lines: string[]) {
  const title = lines.find((line) => HEADING_PATTERN.test(line));
  return title ? stripMarkdownInline(title.replace(/^#{1,6}\s+/, "")) : undefined;
}

export function getInstructionGuideSignature(guide: InstructionGuide) {
  if (guide.type === "choice-based") {
    return JSON.stringify({
      type: guide.type,
      id: guide.id,
      sourceSignature: guide.sourceSignature,
      goal: guide.goal,
      constraints: guide.constraints,
      options: guide.options.map((option) => [
        option.id,
        option.label,
        option.prompt,
        option.intent,
        option.editOriented,
      ]),
      fallbackMarkdown: guide.fallbackMarkdown,
    });
  }

  return JSON.stringify({
    type: guide.type,
    id: guide.id,
    sourceSignature: guide.sourceSignature,
    overview: guide.overview,
    firstMove: guide.firstMove,
    steps: guide.steps.map((step) => [
      step.id,
      step.title,
      step.prompt,
      step.intent,
      step.expectedStudentMove,
      step.notes,
    ]),
    fallbackMarkdown: guide.fallbackMarkdown,
  });
}
