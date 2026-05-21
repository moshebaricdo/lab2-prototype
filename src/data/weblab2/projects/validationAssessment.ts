import type { ValidationReviewCheck } from "../../../types/validationReview";

function stripListMarker(line: string) {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

interface AssessmentGoalEntry {
  label?: string;
  requirement: string;
}

function parseGoalEntry(line: string): AssessmentGoalEntry {
  const stripped = stripListMarker(line);
  const labeledMatch = stripped.match(/^\[([^\]]+)\]\s+(.+)$/);
  if (labeledMatch) {
    return {
      label: labeledMatch[1].trim(),
      requirement: labeledMatch[2].trim(),
    };
  }

  return {
    requirement: stripped,
  };
}

function parseAssessmentGoalEntries(markdown: string) {
  const lines = markdown.split("\n");
  const entries: AssessmentGoalEntry[] = [];
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
      entries.push(parseGoalEntry(line));
    }
  }

  return entries;
}

export function parseAssessmentGoals(markdown: string) {
  return parseAssessmentGoalEntries(markdown).map((entry) => entry.requirement);
}

export function parseAssessmentGoalLabels(markdown: string) {
  return parseAssessmentGoalEntries(markdown).map((entry) =>
    entry.label ?? entry.requirement
  );
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
