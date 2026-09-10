import type {
  QuizStatusKind,
  QuizUnitPlacement,
  QuizUnitPublishedState,
} from "../../types/assessmentBuilder";
import type { FaIconName } from "../../icons/faProRegularCodepoints";

export interface QuizStatusMeta {
  kind: QuizStatusKind;
  label: string;
  headerLabel: string;
  tableLabel: string;
  iconName: FaIconName;
  tagColor: "neutral" | "success" | "warning";
  meaning: string;
}

const LIVE_STATES: QuizUnitPublishedState[] = ["preview", "stable"];
const UNPUBLISHED_STATES: QuizUnitPublishedState[] = [
  "in_development",
  "pilot",
  "beta",
];

function isLive(state: QuizUnitPublishedState): boolean {
  return LIVE_STATES.includes(state);
}

export function deriveQuizStatus(
  placements: QuizUnitPlacement[] | undefined,
): QuizStatusKind {
  const rows = placements ?? [];
  if (rows.length === 0) return "not_in_unit";
  if (rows.some((row) => isLive(row.publishedState))) return "live";
  if (rows.some((row) => row.publishedState === "sunsetting")) return "sunsetting";
  if (rows.some((row) => UNPUBLISHED_STATES.includes(row.publishedState))) {
    return "unpublished";
  }
  return "deprecated";
}

export function liveUnitCount(placements: QuizUnitPlacement[] | undefined): number {
  return (placements ?? []).filter((row) => isLive(row.publishedState)).length;
}

export function quizStatusMeta(
  kind: QuizStatusKind,
  liveCount = 0,
): QuizStatusMeta {
  switch (kind) {
    case "not_in_unit":
      return {
        kind,
        label: "Not in a unit",
        headerLabel: "Not in a unit",
        tableLabel: "Not in a unit",
        iconName: "circle-dashed",
        tagColor: "neutral",
        meaning:
          "This quiz is not placed in a unit. Question edits save in place.",
      };
    case "unpublished":
      return {
        kind,
        label: "Unpublished",
        headerLabel: "Unpublished",
        tableLabel: "Unpublished",
        iconName: "file-half-dashed",
        tagColor: "neutral",
        meaning:
          "Placed only in unpublished units. Question edits save in place.",
      };
    case "live":
      return {
        kind,
        label: "Live",
        headerLabel:
          liveCount === 1 ? "Live in 1 unit" : `Live in ${liveCount} units`,
        tableLabel: "Live",
        iconName: "circle-check",
        tagColor: "success",
        meaning:
          "This quiz is on a published unit. Saving a question creates a new version here so existing student work stays on the previous wording.",
      };
    case "sunsetting":
      return {
        kind,
        label: "Sunsetting",
        headerLabel: "Sunsetting",
        tableLabel: "Sunsetting",
        iconName: "hourglass-half",
        tagColor: "warning",
        meaning:
          "Live only in sunsetting units. Saving a question still creates a new version.",
      };
    case "deprecated":
      return {
        kind,
        label: "Deprecated",
        headerLabel: "Deprecated",
        tableLabel: "Deprecated",
        iconName: "box-archive",
        tagColor: "neutral",
        meaning:
          "Placed only in deprecated units. Question edits save in place.",
      };
  }
}

export function unitStateLabel(state: QuizUnitPublishedState): string {
  switch (state) {
    case "in_development":
      return "In development";
    case "pilot":
      return "Pilot";
    case "beta":
      return "Beta";
    case "preview":
      return "Preview";
    case "stable":
      return "Stable";
    case "sunsetting":
      return "Sunsetting";
    case "deprecated":
      return "Deprecated";
  }
}

export function unitPublishedTag(state: QuizUnitPublishedState): {
  label: string;
  color: "neutral" | "success" | "warning";
} {
  if (state === "preview" || state === "stable") {
    return { label: "Live", color: "success" };
  }
  if (state === "sunsetting") {
    return { label: "Sunsetting", color: "warning" };
  }
  return { label: unitStateLabel(state), color: "neutral" };
}

export function statusKindFromTable(status: QuizStatusKind): QuizStatusKind {
  return status;
}
