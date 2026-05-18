import type { ValidationReviewCheck } from "../../../types/validationReview";

function stripListMarker(line: string) {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

export function parseAssessmentGoals(markdown: string) {
  const lines = markdown.split("\n");
  const goals: string[] = [];
  let isInRequirements = false;
  let isInFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      isInFence = !isInFence;
      continue;
    }

    if (isInFence) continue;

    if (/^##\s+AI Review Requirements/i.test(line)) {
      isInRequirements = true;
      continue;
    }

    if (isInRequirements && line.startsWith("## ")) {
      break;
    }

    if (isInRequirements && line && !line.startsWith("#")) {
      goals.push(stripListMarker(line));
    }
  }

  return goals;
}

export function parseAssessmentChecks(markdown: string): ValidationReviewCheck[] {
  const match = markdown.match(/```validation-checks\s*\n([\s\S]*?)```/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[1]) as ValidationReviewCheck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
