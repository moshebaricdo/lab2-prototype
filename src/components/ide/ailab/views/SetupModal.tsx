import { useEffect, useState } from "react";
import { Modal, Radio } from "@moshebari/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabAlgorithmId } from "../../../../types/aiLab";
import styles from "./SetupModal.module.scss";

const ALGORITHM_CHOICES: {
  id: AiLabAlgorithmId;
  name: string;
  description: string;
}[] = [
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    description: "Closest past rows vote.",
  },
  {
    id: "decisionTree",
    name: "Decision Tree",
    description: "Asks a short series of questions.",
  },
];

interface SetupModalProps {
  lab: AiLabController;
  open: boolean;
  required: boolean;
  onClose: () => void;
}

export function SetupModal({ lab, open, required, onClose }: SetupModalProps) {
  const showDataset = lab.canPickDataset;
  const showAlgorithm = !lab.config.algorithmLock;
  const [pendingDatasetId, setPendingDatasetId] = useState(lab.datasetId);
  const [pendingAlgorithm, setPendingAlgorithm] = useState(
    lab.selectedAlgorithm,
  );

  useEffect(() => {
    if (!open) return;
    setPendingDatasetId(lab.datasetId);
    setPendingAlgorithm(lab.selectedAlgorithm);
  }, [lab.datasetId, lab.selectedAlgorithm, open]);

  const datasetReady = !showDataset || Boolean(pendingDatasetId);
  const algorithmReady = !showAlgorithm || Boolean(pendingAlgorithm);
  const canApply = datasetReady && algorithmReady;

  const apply = () => {
    if (!canApply) return;
    if (showDataset && pendingDatasetId && pendingDatasetId !== lab.datasetId) {
      lab.selectDataset(pendingDatasetId);
    }
    if (
      showAlgorithm &&
      pendingAlgorithm &&
      pendingAlgorithm !== lab.selectedAlgorithm
    ) {
      lab.selectAlgorithm(pendingAlgorithm, { advance: false });
    }
    onClose();
  };

  const title = required ? "Set up this lab" : "Dataset and algorithm";
  const description = required
    ? "Choose what you will train on. You can change this later from the header."
    : lab.model
      ? "Changing the dataset or algorithm clears the trained model."
      : "Your sheet and training setup stay unless you change the dataset.";

  return (
    <Modal
      open={open}
      title={title}
      maxWidth={520}
      isDismissable={!required}
      hasSecondaryAction={!required}
      primaryActionLabel={required ? "Start" : "Apply"}
      secondaryActionLabel="Cancel"
      onPrimaryAction={apply}
      onSecondaryAction={required ? undefined : onClose}
      onClose={required ? undefined : onClose}
    >
      <div className={styles.body}>
        <p className={styles.lead}>{description}</p>
        {showDataset ? (
          <fieldset className={styles.section} aria-label="Dataset">
            <legend className={styles.legend}>Dataset</legend>
            <div className={styles.list}>
              {lab.availableDatasets.map((dataset) => {
                const selected = pendingDatasetId === dataset.id;
                return (
                  <label
                    key={dataset.id}
                    className={`${styles.choice} ${
                      selected ? styles.choiceSelected : ""
                    }`}
                  >
                    <Radio
                      name="ai-lab-setup-dataset"
                      value={dataset.id}
                      checked={selected}
                      onChange={() => setPendingDatasetId(dataset.id)}
                    />
                    <span className={styles.choiceCopy}>
                      <span className={styles.choiceTitle}>{dataset.name}</span>
                      <span className={styles.choiceMeta}>
                        {dataset.rows.length} rows · {dataset.columns.length}{" "}
                        columns
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {showAlgorithm ? (
          <fieldset className={styles.section} aria-label="Algorithm">
            <legend className={styles.legend}>Algorithm</legend>
            <div className={styles.algorithmRow}>
              {ALGORITHM_CHOICES.map((choice) => {
                const selected = pendingAlgorithm === choice.id;
                return (
                  <label
                    key={choice.id}
                    className={`${styles.choice} ${
                      selected ? styles.choiceSelected : ""
                    }`}
                  >
                    <Radio
                      name="ai-lab-setup-algorithm"
                      value={choice.id}
                      checked={selected}
                      onChange={() => setPendingAlgorithm(choice.id)}
                    />
                    <span className={styles.choiceCopy}>
                      <span className={styles.choiceTitle}>{choice.name}</span>
                      <span className={styles.choiceMeta}>
                        {choice.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}
      </div>
    </Modal>
  );
}
