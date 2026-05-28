import type { EditOptionChoice, EditOptionsCardData } from "../../types/chat";
import { asksForDirectEdit } from "./requestIntent";
import type { TutorEditClarificationResponse } from "./types";

export type { EditOptionChoice, EditOptionsCardData };

const VAGUE_QUALITY_PATTERN =
  /\b(better|best|exciting|nicer|nice|cooler|cool|pop|fun|funner|cleaner|clean|modern|professional|polished|polish|interesting|prettier|pretty|awesome|amazing|great|improve|improve it|improve this|improve that|make it look good|look better|stand out|eye[- ]?catching|engaging|dynamic|lively|vibrant)\b/i;

const CONCRETE_DIRECTIVE_PATTERN =
  /\b(blue|red|green|yellow|orange|purple|pink|black|white|gray|grey|teal|navy|#[0-9a-f]{3,8}\b|rgb\(|hsl\(|color|colour|background|font|fontsize|font-size|spacing|padding|margin|border|radius|shadow|hover|focus|visited|underline|transition|animation|animate|column|columns|row|rows|grid|flex|width|height|px|rem|em|%|selector|\.[a-z][\w-]*|#[a-z][\w-]*|index\.html|style\.css|script\.js|javascript|\bjs\b|click|toggle|dropdown|modal|2\s*column|two\s*column|three\s*column|left|right|center|align|wrap|gap|padding-top|margin-top|outline|focus-visible|aria|label|caption|copy|text|image|photo|upload|src=)\b/i;

export function isUnderspecifiedEditRequest(message: string) {
  const trimmed = message.trim();
  if (!trimmed || !asksForDirectEdit(trimmed)) return false;
  if (!VAGUE_QUALITY_PATTERN.test(trimmed)) return false;
  if (CONCRETE_DIRECTIVE_PATTERN.test(trimmed)) return false;
  return true;
}

function slugifyOptionId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `option-${index + 1}`;
}

export function normalizeEditClarificationOptions(
  response: TutorEditClarificationResponse,
): EditOptionChoice[] {
  if (!Array.isArray(response.options)) return [];

  const seenIds = new Set<string>();
  const normalized: EditOptionChoice[] = [];

  response.options.forEach((option, index) => {
    const label = typeof option.label === "string" ? option.label.trim() : "";
    const enrichPrompt =
      typeof option.enrichPrompt === "string" ? option.enrichPrompt.trim() : "";
    if (!label || !enrichPrompt) return;

    const requestedId =
      typeof option.id === "string" ? option.id.trim() : "";
    let id = requestedId || slugifyOptionId(label, index);
    if (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seenIds.add(id);

    normalized.push({
      id,
      label,
      enrichPrompt,
    });
  });

  return normalized.slice(0, 4);
}

export function buildEditOptionsCardFromClarification(
  originalMessage: string,
  response: TutorEditClarificationResponse,
): EditOptionsCardData | null {
  const options = normalizeEditClarificationOptions(response);
  if (options.length < 2) return null;

  const intro =
    typeof response.message === "string" ? response.message.trim() : "";

  return {
    status: "pending",
    originalMessage: originalMessage.trim(),
    intro: intro || undefined,
    options,
  };
}

export function enrichEditOptionPrompt(option: EditOptionChoice) {
  return option.enrichPrompt.trim();
}

export function buildCustomEditOptionPrompt(
  originalMessage: string,
  customDirection: string,
) {
  const direction = customDirection.trim();
  const base = originalMessage.trim();

  return `${base} Use this student direction: "${direction}". Apply a focused project edit that matches what they asked for, using the current project files as context.`;
}

export function buildCustomEditOptionChoice(
  originalMessage: string,
  customDirection: string,
): EditOptionChoice {
  const direction = customDirection.trim();

  return {
    id: "custom",
    label: direction,
    enrichPrompt: buildCustomEditOptionPrompt(originalMessage, direction),
  };
}
