import type {
  TutorPolicy,
  TutorPolicyPreset,
  TutorSupportContext,
} from "../../types/tutor";
import type { TutorRunnerContracts } from "../../lib/tutor/runners/runnerContracts";

export const TUTOR_POLICY_PRESET_DEV_KEY = "tutorPolicyPreset";
export const ALLOW_TUTOR_BUILD_DEV_KEY = "allowTutorBuild";
export const ALLOW_TUTOR_PLAN_DEV_KEY = "allowTutorPlan";
export const ALLOW_TUTOR_HELP_DEV_KEY = "allowTutorHelp";
export const TUTOR_BUILD_CONTRACT_DEV_KEY = "tutorBuildContract";
export const TUTOR_PLAN_CONTRACT_DEV_KEY = "tutorPlanContract";
export const TUTOR_HELP_CONTRACT_DEV_KEY = "tutorHelpContract";
export const TUTOR_ROUTING_DIAGNOSTICS_DEV_KEY = "tutorRoutingDiagnostics";

export interface WebLab2TutorDevSettings {
  policy: TutorPolicy;
  runnerContracts: TutorRunnerContracts;
  routingDiagnostics: boolean;
}

interface ResolveWebLab2TutorDevSettingsOptions {
  values: Record<string, unknown>;
  routeSupportContext: TutorSupportContext;
  hasValidationReviewConfig: boolean;
  allowTutorBuild: boolean;
  allowTutorPlan: boolean;
  allowTutorHelp: boolean;
  tutorBuildContract: string;
  tutorPlanContract: string;
  tutorHelpContract: string;
}

function resolveBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function resolveString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function resolveTutorPolicyPreset(value: unknown): TutorPolicyPreset {
  if (
    value === "standalone-project" ||
    value === "guided-level" ||
    value === "validation-checkpoint"
  ) {
    return value;
  }
  return "route-default";
}

export function getDefaultTutorRoutingProfile(
  supportContext: TutorSupportContext,
  hasValidationReviewConfig: boolean,
): TutorPolicy["routingProfile"] {
  if (hasValidationReviewConfig) return "validation-checkpoint";
  return supportContext === "standalone-project" ? "open-ended-project" : "guided-level";
}

function getSupportContextForPreset(
  preset: TutorPolicyPreset,
  routeSupportContext: TutorSupportContext,
): TutorSupportContext {
  if (preset === "standalone-project") return "standalone-project";
  if (preset === "guided-level" || preset === "validation-checkpoint") {
    return "curriculum-level";
  }
  return routeSupportContext;
}

function getRoutingProfileForPreset(
  preset: TutorPolicyPreset,
  supportContext: TutorSupportContext,
  hasValidationReviewConfig: boolean,
): TutorPolicy["routingProfile"] {
  if (preset === "validation-checkpoint") return "validation-checkpoint";
  if (preset === "standalone-project") return "open-ended-project";
  if (preset === "guided-level") return "guided-level";
  return getDefaultTutorRoutingProfile(supportContext, hasValidationReviewConfig);
}

export function resolveWebLab2TutorDevSettings({
  values,
  routeSupportContext,
  hasValidationReviewConfig,
  allowTutorBuild,
  allowTutorPlan,
  allowTutorHelp,
  tutorBuildContract,
  tutorPlanContract,
  tutorHelpContract,
}: ResolveWebLab2TutorDevSettingsOptions): WebLab2TutorDevSettings {
  const policyPreset = resolveTutorPolicyPreset(values[TUTOR_POLICY_PRESET_DEV_KEY]);
  const supportContext = getSupportContextForPreset(policyPreset, routeSupportContext);
  const buildEnabled = resolveBoolean(values[ALLOW_TUTOR_BUILD_DEV_KEY], allowTutorBuild);
  const planEnabled = resolveBoolean(values[ALLOW_TUTOR_PLAN_DEV_KEY], allowTutorPlan);
  const helpEnabled = resolveBoolean(values[ALLOW_TUTOR_HELP_DEV_KEY], allowTutorHelp);

  return {
    policy: {
      lab: "weblab2",
      supportContext,
      capabilities: {
        guidance: helpEnabled,
        planning: planEnabled,
        workspaceEdits: buildEnabled,
        validationReview: hasValidationReviewConfig,
        proposalReview: buildEnabled || planEnabled,
      },
      pedagogy: {
        mode: "curriculum-socratic",
        revealPolicy: "hint-first",
      },
      routingProfile: getRoutingProfileForPreset(
        policyPreset,
        supportContext,
        hasValidationReviewConfig,
      ),
    },
    runnerContracts: {
      build: buildEnabled
        ? resolveString(values[TUTOR_BUILD_CONTRACT_DEV_KEY], tutorBuildContract).trim()
        : "",
      plan: planEnabled
        ? resolveString(values[TUTOR_PLAN_CONTRACT_DEV_KEY], tutorPlanContract).trim()
        : "",
      help: helpEnabled
        ? resolveString(values[TUTOR_HELP_CONTRACT_DEV_KEY], tutorHelpContract).trim()
        : "",
    },
    routingDiagnostics: resolveBoolean(
      values[TUTOR_ROUTING_DIAGNOSTICS_DEV_KEY],
      true,
    ),
  };
}
