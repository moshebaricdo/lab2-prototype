import { Button } from "@moshebaricdo/cads-react";
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
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName={isPreview ? "pen-to-square" : "check"}
              onClick={() => onViewModeChange(isPreview ? "source" : "preview")}
            >
              {isPreview ? "Edit" : "Done"}
            </Button>
          ) : null}
          {showBuildPlan ? (
            <Button
              variant="contained"
              color="primary"
              size="extraSmall"
              startIconName="wand-magic-sparkles"
              loading={buildPlanRunning}
              onClick={onBuildPlan}
              disabled={buildPlanDisabled || buildPlanRunning}
            >
              Build plan
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
