import { Button, Dialog, Radio, Tabs } from "@moshebaricdo/cads-react";
import { useState } from "react";
import { AppText } from "../../../ui/AppText";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabAlgorithmId, AiLabSection } from "../../../../types/aiLab";
import { GuidedExplorePanel } from "./GuidedDatasetPanel";
import { GuidedTestPanel } from "./GuidedTestPanel";
import styles from "./AiLabGuidedWorkspace.module.scss";

const SECTION_LABELS: Record<Exclude<AiLabSection, "algorithm">, string> = {
  dataset: "Data",
  train: "Train",
  test: "Test",
};

const ALGORITHM_NAMES = {
  knn: "K-Nearest Neighbors",
  decisionTree: "Decision Tree",
} as const;

const ALGORITHM_CHOICES: {
  id: AiLabAlgorithmId;
  name: string;
  description: string;
}[] = [
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    description: "Looks at the closest past orders and lets them vote.",
  },
  {
    id: "decisionTree",
    name: "Decision Tree",
    description: "Asks a short series of questions about the columns you pick.",
  },
];

interface AiLabGuidedWorkspaceProps {
  lab: AiLabController;
}

export function AiLabGuidedWorkspace({ lab }: AiLabGuidedWorkspaceProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [algorithmModalOpen, setAlgorithmModalOpen] = useState(false);
  const [pendingAlgorithm, setPendingAlgorithm] = useState<AiLabAlgorithmId | undefined>();
  const showRail = lab.section !== "algorithm";

  const openAlgorithmModal = () => {
    setPendingAlgorithm(lab.selectedAlgorithm);
    setAlgorithmModalOpen(true);
  };

  const closeAlgorithmModal = () => {
    setAlgorithmModalOpen(false);
    setPendingAlgorithm(undefined);
  };

  const confirmAlgorithm = () => {
    if (pendingAlgorithm && pendingAlgorithm !== lab.selectedAlgorithm) {
      lab.selectAlgorithm(pendingAlgorithm, { advance: false });
    }
    closeAlgorithmModal();
  };

  return (
    <div className={styles.root}>
      {showRail ? (
        <header className={styles.header}>
          <div className={styles.headerTabs}>
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
          <div className={styles.headerActions}>
            {lab.selectedAlgorithm ? (
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                endIconName="chevron-down"
                aria-haspopup="dialog"
                aria-expanded={algorithmModalOpen}
                onClick={openAlgorithmModal}
              >
                {ALGORITHM_NAMES[lab.selectedAlgorithm]}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="arrow-rotate-left"
              onClick={() => setConfirmReset(true)}
            >
              Start over
            </Button>
          </div>
        </header>
      ) : null}

      <div className={styles.body}>
        {lab.section === "algorithm" ? (
          <GuidedAlgorithmPicker lab={lab} />
        ) : null}
        {lab.section === "dataset" || lab.section === "train" ? (
          <GuidedExplorePanel lab={lab} />
        ) : null}
        {lab.section === "test" ? <GuidedTestPanel lab={lab} /> : null}
      </div>

      <Dialog
        type="customContent"
        open={algorithmModalOpen}
        isDismissable
        onClose={closeAlgorithmModal}
      >
        <div className={styles.switchModal}>
          <div>
            <h2 className={styles.switchTitle}>Switch algorithm?</h2>
            <p className={styles.muted}>
              {lab.model
                ? "This clears the trained model. The dataset, label, and features stay."
                : "Your dataset stays the same. You can train again after you switch."}
            </p>
          </div>
          <AlgorithmChoiceList
            name="ai-lab-guided-switch-algorithm"
            selected={pendingAlgorithm ?? lab.selectedAlgorithm}
            onSelect={setPendingAlgorithm}
          />
          <div className={styles.switchActions}>
            <Button
              size="medium"
              variant="outlined"
              color="secondary"
              onClick={closeAlgorithmModal}
            >
              Cancel
            </Button>
            <Button
              size="medium"
              variant="contained"
              color="primary"
              disabled={!pendingAlgorithm}
              onClick={confirmAlgorithm}
            >
              {pendingAlgorithm && pendingAlgorithm !== lab.selectedAlgorithm
                ? "Switch algorithm"
                : "Keep this algorithm"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        type="iconTop"
        topIconName="arrow-rotate-left"
        open={confirmReset}
        title="Start over?"
        description="Training, algorithm, and try-it-out values will reset. The dataset stays the same."
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

function GuidedAlgorithmPicker({ lab }: { lab: AiLabController }) {
  return (
    <section className={`${styles.panel} ${styles.picker}`}>
      <div className={styles.pickerInner}>
        <AppText variant="heading-h4" weight="semibold" as="h2">
          Choose an algorithm
        </AppText>
        <p className={styles.muted}>
          Both options use {lab.config.dataset.name}. You can switch later
          without losing the dataset.
        </p>
        <AlgorithmChoiceList
          name="ai-lab-guided-algorithm"
          selected={lab.selectedAlgorithm}
          onSelect={(algorithm) =>
            lab.selectAlgorithm(algorithm, { advance: false })
          }
        />
        <div className={styles.pickerActions}>
          <Button
            size="medium"
            variant="contained"
            color="primary"
            disabled={!lab.selectedAlgorithm}
            onClick={() => lab.setSection("dataset")}
          >
            Explore the dataset
          </Button>
        </div>
      </div>
    </section>
  );
}

function AlgorithmChoiceList({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: AiLabAlgorithmId | undefined;
  onSelect: (algorithm: AiLabAlgorithmId) => void;
}) {
  return (
    <fieldset className={styles.algorithmGrid} aria-label="Algorithm">
      {ALGORITHM_CHOICES.map((choice) => {
        const isSelected = selected === choice.id;
        return (
          <label
            key={choice.id}
            className={`${styles.algorithmCard} ${
              isSelected ? styles.algorithmCardSelected : ""
            }`}
          >
            <Radio
              name={name}
              value={choice.id}
              checked={isSelected}
              onChange={() => onSelect(choice.id)}
            />
            <AlgorithmGlyph algorithm={choice.id} />
            <span>
              <span className={styles.algorithmTitle}>{choice.name}</span>
              <span className={styles.algorithmDescription}>
                {choice.description}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function AlgorithmGlyph({ algorithm }: { algorithm: AiLabAlgorithmId }) {
  if (algorithm === "knn") {
    return (
      <span className={styles.algorithmGlyph} aria-hidden>
        <span className={styles.knnGlyph}>
          <span className={styles.knnDot} style={{ left: 4, top: 16 }} />
          <span className={styles.knnDot} style={{ left: 16, top: 6 }} />
          <span className={styles.knnDot} style={{ left: 22, top: 18 }} />
          <span
            className={`${styles.knnDot} ${styles.knnDotQuery}`}
            style={{ left: 30, top: 10 }}
          />
        </span>
      </span>
    );
  }

  return (
    <span className={styles.algorithmGlyph} aria-hidden>
      <span className={styles.treeGlyph}>
        <span className={`${styles.treeNode} ${styles.treeNodeRoot}`} />
        <span className={styles.treeNode} />
        <span className={styles.treeNode} />
      </span>
    </span>
  );
}
