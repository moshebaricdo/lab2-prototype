import type { TutorAction } from "../../../types/tutor";
import type { TutorRequestIntent } from "../intent/requestIntent";

/** Maps a resolved pre-runner action to the runner intent. Returns null when the harness should not call `tutorClient`. */
export function runnerIntentFromTutorAction(action: TutorAction): TutorRequestIntent | null {
  switch (action.kind) {
    case "guidance":
      return "guidance";
    case "plan":
      return "planning";
    case "edit":
      return "edit";
    default:
      return null;
  }
}

export function runnerAllowsWorkspaceEdits(action: TutorAction): boolean {
  return action.kind === "edit";
}

export function runnerAllowsPlanEdits(action: TutorAction): boolean {
  return action.kind === "plan";
}
