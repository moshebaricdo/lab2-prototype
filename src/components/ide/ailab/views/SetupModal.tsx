import { useEffect, useState } from "react";
import { Modal, Tag, Tooltip } from "@moshebari/cads-react";
import decisionTreeCover from "../../../../data/ailab/algorithms/covers/decisionTree.png";
import knnCover from "../../../../data/ailab/algorithms/covers/knn.png";
import { recommendedAlgorithmFor } from "../../../../lib/aiLab";
import type { AiLabAlgorithmId, AiLabDataset } from "../../../../types/aiLab";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./SetupModal.module.scss";

interface AlgorithmChoice {
  id: AiLabAlgorithmId;
  name: string;
  icon: "sitemap" | "chart-scatter";
  description: string;
  suggestedTooltip: string;
  cover?: string;
}

const ALGORITHM_CHOICES: AlgorithmChoice[] = [
  {
    id: "decisionTree",
    name: "Decision Tree",
    icon: "sitemap",
    description:
      "Asks a short series of questions about your columns to sort rows into groups.",
    suggestedTooltip:
      "Suggested for this dataset because it works well with categories and yes/no traits.",
    cover: decisionTreeCover,
  },
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    icon: "chart-scatter",
    description:
      "Finds the closest matching rows in your dataset and lets them vote on the prediction.",
    suggestedTooltip:
      "Suggested for this dataset because it works well when comparing numerical measurements.",
    cover: knnCover,
  },
];

function AlgorithmCover({ choice }: { choice: AlgorithmChoice }) {
  if (choice.cover) {
    return <img className={styles.cover} src={choice.cover} alt="" />;
  }
  return (
    <span className={styles.placeholder} aria-hidden>
      <FaIcon name={choice.icon} size="inherit" />
    </span>
  );
}

function AlgorithmTile({
  choice,
  selected,
  suggested,
  onSelect,
}: {
  choice: AlgorithmChoice;
  selected: boolean;
  suggested: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
      onClick={onSelect}
    >
      <span className={styles.media}>
        <AlgorithmCover choice={choice} />
        {selected ? <span className={styles.selectedWash} aria-hidden /> : null}
        {selected ? (
          <span className={styles.selectedMark} aria-hidden>
            <FaIcon name="check" size="inherit" />
          </span>
        ) : null}
      </span>
      <span className={styles.caption}>
        <span className={styles.captionHeader}>
          <span className={styles.captionName}>{choice.name}</span>
          {suggested ? (
            <Tooltip title={choice.suggestedTooltip} placement="top">
              <span className={styles.suggestedTag}>
                <Tag size="small" color="brand" label="Suggested" />
              </span>
            </Tooltip>
          ) : null}
        </span>
        <span className={styles.captionDescription}>{choice.description}</span>
      </span>
    </button>
  );
}

export interface SetupModalProps {
  open: boolean;
  dataset?: AiLabDataset;
  selectedAlgorithm?: AiLabAlgorithmId;
  hasModel?: boolean;
  required?: boolean;
  primaryActionLabel?: string;
  onSelectAlgorithm: (algorithm: AiLabAlgorithmId) => void;
  onClose: () => void;
}

export function SetupModal({
  open,
  dataset,
  selectedAlgorithm,
  hasModel = false,
  required = false,
  primaryActionLabel,
  onSelectAlgorithm,
  onClose,
}: SetupModalProps) {
  const recommended = recommendedAlgorithmFor(dataset);
  const [pendingAlgorithm, setPendingAlgorithm] = useState<AiLabAlgorithmId>(
    selectedAlgorithm ?? recommended,
  );

  useEffect(() => {
    if (!open) return;
    setPendingAlgorithm(selectedAlgorithm ?? recommended);
  }, [open, selectedAlgorithm, recommended]);

  const apply = () => {
    if (!pendingAlgorithm) return;
    onSelectAlgorithm(pendingAlgorithm);
  };

  const description = selectedAlgorithm
    ? "Change which algorithm to train your model on."
    : "Pick which algorithm you want to train your data on. You can change this later.";

  return (
    <Modal
      open={open}
      title="Choose an algorithm"
      maxWidth={640}
      isDismissable={!required}
      hasSecondaryAction={!required}
      primaryActionLabel={
        primaryActionLabel ?? (required ? "Continue" : "Apply")
      }
      secondaryActionLabel="Cancel"
      onPrimaryAction={apply}
      onSecondaryAction={required ? undefined : onClose}
      onClose={required ? undefined : onClose}
    >
      <div className={styles.body}>
        <p className={styles.lead}>{description}</p>
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label="Algorithms"
        >
          {ALGORITHM_CHOICES.map((choice) => (
            <AlgorithmTile
              key={choice.id}
              choice={choice}
              selected={pendingAlgorithm === choice.id}
              suggested={recommended === choice.id}
              onSelect={() => setPendingAlgorithm(choice.id)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
