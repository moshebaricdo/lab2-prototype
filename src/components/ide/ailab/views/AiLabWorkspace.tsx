import { Button, Dialog, Tabs, Tooltip } from "@moshebari/cads-react";
import { useState } from "react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabSection } from "../../../../types/aiLab";
import { AlgorithmPicker } from "./AlgorithmPicker";
import { DatasetViews } from "./DatasetViews";
import { TrainPanel } from "./TrainPanel";
import { TestPanel } from "./TestPanel";
import styles from "./AiLabWorkspace.module.scss";

const SECTION_LABELS: Record<Exclude<AiLabSection, "algorithm">, string> = {
  dataset: "Dataset",
  train: "Train",
  test: "Test",
};

const ALGORITHM_NAMES = {
  knn: "K-Nearest Neighbors",
  decisionTree: "Decision Tree",
} as const;

interface AiLabWorkspaceProps {
  lab: AiLabController;
}

export function AiLabWorkspace({ lab }: AiLabWorkspaceProps) {
  const config = lab.config;
  const [confirmReset, setConfirmReset] = useState(false);
  const showRail = lab.section !== "algorithm";

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {lab.selectedAlgorithm ? (
            <Tooltip
              title={
                config.algorithmLock
                  ? "Algorithm is set for this level"
                  : "Start over from algorithm selection"
              }
              placement="bottom"
            >
              <span>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="extraSmall"
                  disabled={Boolean(config.algorithmLock)}
                  onClick={() => setConfirmReset(true)}
                >
                  {ALGORITHM_NAMES[lab.selectedAlgorithm]}
                </Button>
              </span>
            </Tooltip>
          ) : null}
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.workspaceLabel}>Workspace</span>
        </div>
        <div className={styles.headerRight}>
          {showRail ? (
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="arrow-rotate-left"
              onClick={() => setConfirmReset(true)}
            >
              Start over
            </Button>
          ) : null}
        </div>
      </header>

      {showRail ? <SectionRail lab={lab} /> : null}

      <div className={styles.body}>
        {lab.section === "algorithm" ? (
          <AlgorithmPicker
            selectedAlgorithm={lab.selectedAlgorithm}
            onSelect={lab.selectAlgorithm}
          />
        ) : null}
        {lab.section === "dataset" ? (
          <section className={styles.panel}>
            <DatasetViews lab={lab} />
          </section>
        ) : null}
        {lab.section === "train" ? <TrainPanel lab={lab} /> : null}
        {lab.section === "test" ? <TestPanel lab={lab} /> : null}
      </div>

      <Dialog
        type="iconTop"
        topIconName="arrow-rotate-left"
        open={confirmReset}
        title="Start over?"
        description="Training and try-it-out values will be reset. The dataset stays the same."
        primaryActionLabel="Start over"
        secondaryActionLabel="Cancel"
        isDismissable
        onPrimaryAction={() => {
          setConfirmReset(false);
          lab.startOver();
        }}
        onSecondaryAction={() => setConfirmReset(false)}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}

function SectionRail({ lab }: { lab: AiLabController }) {
  return (
    <div className={styles.tabBar}>
      <Tabs
        type="secondary"
        size="medium"
        aria-label="AI Lab sections"
        value={lab.section}
        onChange={(value) => {
          const section = value as AiLabSection;
          if (lab.canVisit(section)) lab.setSection(section);
        }}
        items={lab.visibleSections.map((section) => ({
          value: section,
          label: SECTION_LABELS[section],
          disabled: !lab.canVisit(section),
        }))}
      />
    </div>
  );
}
