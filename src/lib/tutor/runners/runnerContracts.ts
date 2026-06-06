import type { TutorRequestIntent } from "../intent/requestIntent";

export interface TutorRunnerContracts {
  help?: string;
  plan?: string;
  build?: string;
}

type TutorRunnerContractKey = keyof TutorRunnerContracts;

const INTENT_TO_CONTRACT_KEY: Record<TutorRequestIntent, TutorRunnerContractKey> = {
  guidance: "help",
  planning: "plan",
  edit: "build",
};

const RUNNER_STYLE_CONTRACTS: Record<TutorRequestIntent, string> = {
  guidance: `Help response style:
- Answer the student's immediate question, then stop.
- Prefer one concrete next check over a broad explanation.
- Use 2-5 short sentences or 2-3 compact bullets unless the student explicitly asks for depth.`,
  planning: `Plan response style:
- Give a quick project-coach handoff, not a full plan summary.
- Mention the plan was created or updated, then ask only the highest-value next question or review action.
- Keep the chat message short; the detailed plan belongs in the plan file.`,
  edit: `Build response style:
- Give a quick edit handoff, not a changelog.
- Name the main changed file or page area, why it helps, and what the student should review next.
- Keep the chat message to 2 short paragraphs or 3 bullets max.`,
};

export function getTutorRunnerContract(
  intent: TutorRequestIntent,
  contracts?: TutorRunnerContracts,
) {
  const key = INTENT_TO_CONTRACT_KEY[intent];
  return contracts?.[key]?.trim() ?? "";
}

export function getTutorRunnerStyleContract(intent: TutorRequestIntent) {
  return RUNNER_STYLE_CONTRACTS[intent];
}

export function buildRunnerSystemPromptAddendum(options: {
  basePrompt?: string;
  intent: TutorRequestIntent;
  contracts?: TutorRunnerContracts;
}) {
  const parts = [
    options.basePrompt?.trim(),
    getTutorRunnerStyleContract(options.intent),
    getTutorRunnerContract(options.intent, options.contracts),
  ].filter(Boolean);

  return parts.join("\n\n");
}
