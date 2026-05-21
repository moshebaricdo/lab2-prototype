import { describe, expect, it } from "vitest";
import {
  ALLOW_TUTOR_BUILD_DEV_KEY,
  ALLOW_TUTOR_HELP_DEV_KEY,
  ALLOW_TUTOR_PLAN_DEV_KEY,
  resolveWebLab2TutorDevSettings,
  TUTOR_BUILD_CONTRACT_DEV_KEY,
  TUTOR_HELP_CONTRACT_DEV_KEY,
  TUTOR_PLAN_CONTRACT_DEV_KEY,
  TUTOR_POLICY_PRESET_DEV_KEY,
} from "./tutorDevSettings";

describe("WebLab2 Tutor dev settings", () => {
  it("maps Build, Plan, and Help toggles to TutorPolicy capabilities", () => {
    const settings = resolveWebLab2TutorDevSettings({
      values: {
        [ALLOW_TUTOR_BUILD_DEV_KEY]: false,
        [ALLOW_TUTOR_PLAN_DEV_KEY]: true,
        [ALLOW_TUTOR_HELP_DEV_KEY]: true,
      },
      routeSupportContext: "curriculum-level",
      hasValidationReviewConfig: false,
      allowTutorBuild: true,
      allowTutorPlan: false,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });

    expect(settings.policy.capabilities.workspaceEdits).toBe(false);
    expect(settings.policy.capabilities.planning).toBe(true);
    expect(settings.policy.capabilities.guidance).toBe(true);
    expect(settings.policy.pedagogy).toMatchObject({
      mode: "curriculum-socratic",
      revealPolicy: "hint-first",
    });
  });

  it("keeps validation review separate from Build, Plan, and Help", () => {
    const settings = resolveWebLab2TutorDevSettings({
      values: {
        [ALLOW_TUTOR_BUILD_DEV_KEY]: false,
        [ALLOW_TUTOR_PLAN_DEV_KEY]: false,
        [ALLOW_TUTOR_HELP_DEV_KEY]: true,
      },
      routeSupportContext: "curriculum-level",
      hasValidationReviewConfig: true,
      allowTutorBuild: true,
      allowTutorPlan: false,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });

    expect(settings.policy.capabilities.workspaceEdits).toBe(false);
    expect(settings.policy.capabilities.validationReview).toBe(true);
    expect(settings.policy.routingProfile).toBe("validation-checkpoint");
  });

  it("uses only contracts for enabled capabilities", () => {
    const settings = resolveWebLab2TutorDevSettings({
      values: {
        [ALLOW_TUTOR_BUILD_DEV_KEY]: false,
        [ALLOW_TUTOR_PLAN_DEV_KEY]: true,
        [ALLOW_TUTOR_HELP_DEV_KEY]: true,
        [TUTOR_BUILD_CONTRACT_DEV_KEY]: "Do not use because Build is off.",
        [TUTOR_PLAN_CONTRACT_DEV_KEY]: "Plan with a short checklist.",
        [TUTOR_HELP_CONTRACT_DEV_KEY]: "Hint first.",
      },
      routeSupportContext: "standalone-project",
      hasValidationReviewConfig: false,
      allowTutorBuild: true,
      allowTutorPlan: true,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });

    expect(settings.runnerContracts.build).toBe("");
    expect(settings.runnerContracts.plan).toBe("Plan with a short checklist.");
    expect(settings.runnerContracts.help).toBe("Hint first.");
  });

  it("lets presets emulate standalone and guided routing profiles", () => {
    const standalone = resolveWebLab2TutorDevSettings({
      values: { [TUTOR_POLICY_PRESET_DEV_KEY]: "standalone-project" },
      routeSupportContext: "curriculum-level",
      hasValidationReviewConfig: false,
      allowTutorBuild: true,
      allowTutorPlan: true,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });
    const guided = resolveWebLab2TutorDevSettings({
      values: { [TUTOR_POLICY_PRESET_DEV_KEY]: "guided-level" },
      routeSupportContext: "standalone-project",
      hasValidationReviewConfig: false,
      allowTutorBuild: true,
      allowTutorPlan: true,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });

    expect(standalone.policy.supportContext).toBe("standalone-project");
    expect(standalone.policy.routingProfile).toBe("open-ended-project");
    expect(standalone.policy.pedagogy.mode).toBe("curriculum-socratic");
    expect(guided.policy.supportContext).toBe("curriculum-level");
    expect(guided.policy.routingProfile).toBe("guided-level");
  });

  it("uses validation checkpoint only as a routing profile without creating validation config", () => {
    const withoutReviewConfig = resolveWebLab2TutorDevSettings({
      values: { [TUTOR_POLICY_PRESET_DEV_KEY]: "validation-checkpoint" },
      routeSupportContext: "standalone-project",
      hasValidationReviewConfig: false,
      allowTutorBuild: true,
      allowTutorPlan: true,
      allowTutorHelp: true,
      tutorBuildContract: "",
      tutorPlanContract: "",
      tutorHelpContract: "",
    });

    expect(withoutReviewConfig.policy.routingProfile).toBe("validation-checkpoint");
    expect(withoutReviewConfig.policy.capabilities.validationReview).toBe(false);
  });
});
