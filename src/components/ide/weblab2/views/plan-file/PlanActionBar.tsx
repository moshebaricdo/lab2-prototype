import { AppButton } from "../../../../ui/AppButton";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import styles from "./PlanActionBar.module.scss";

export type PlanViewMode = "preview" | "source";

interface PlanActionBarProps {
  viewMode: PlanViewMode;
  fileName: string;
  isBuilt?: boolean;
  statusText?: string;
  onViewModeChange: (viewMode: PlanViewMode) => void;
  onBuildPlan?: () => void;
  showEditPlan?: boolean;
  showBuildPlan?: boolean;
  buildPlanDisabled?: boolean;
  buildPlanRunning?: boolean;
}

export function PlanActionBar({
  viewMode,
  fileName,
  isBuilt = false,
  statusText,
  onViewModeChange,
  onBuildPlan,
  showEditPlan = true,
  showBuildPlan = true,
  buildPlanDisabled = false,
  buildPlanRunning = false,
}: PlanActionBarProps) {
  const isPreview = viewMode === "preview";
  const showControls = showEditPlan || showBuildPlan;

  return (
    <div className={styles.root}>
      <div className={styles.planField}>
        <span className={styles.title}>{fileName}</span>
        {isBuilt ? (
          <span className={styles.completedTag}>
            <FaIcon name="check" size="xs" className={styles.completedTagIcon} />
            Built
          </span>
        ) : null}
        {statusText ? <span className={styles.text}>{statusText}</span> : null}
      </div>
      {showControls ? (
        <div className={styles.controls}>
          {showEditPlan ? (
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName={isPreview ? "pen-to-square" : "check"}
              onClick={() => onViewModeChange(isPreview ? "source" : "preview")}
            >
              {isPreview ? "Edit" : "Done"}
            </AppButton>
          ) : null}
          {showBuildPlan ? (
            <AppButton
              variant="primary"
              tone="purple"
              size="xs"
              icon={buildPlanRunning ? (
                <FaIcon name="spinner" size="xs" className={styles.spinner} />
              ) : undefined}
              iconName={buildPlanRunning ? undefined : "wand-magic-sparkles"}
              onClick={onBuildPlan}
              disabled={buildPlanDisabled || buildPlanRunning}
            >
              Build plan
            </AppButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
