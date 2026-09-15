import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  SegmentedButton,
  Tooltip,
} from "@moshebaricdo/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { predictionStatement } from "../../../../lib/aiLab";
import styles from "./AiLabGuidedWorkspace.module.scss";

const K_OPTIONS = [
  { value: "1", label: "k = 1" },
  { value: "3", label: "k = 3" },
  { value: "5", label: "k = 5" },
];

interface GuidedTrainingBarProps {
  lab: AiLabController;
}

export function GuidedTrainingBar({ lab }: GuidedTrainingBarProps) {
  const [isTraining, setIsTraining] = useState(false);
  const columns = lab.config.dataset.columns;
  const labelOptions = columns
    .filter((column) =>
      lab.config.classificationOnly ? column.type === "categorical" : true,
    )
    .map((column) => ({ value: column.id, label: column.name }));
  const featureColumns = columns.filter(
    (column) => column.id !== lab.labelColumn,
  );
  const accuracy = lab.model ? Math.round(lab.model.accuracy * 100) : undefined;

  const runTrain = () => {
    if (!lab.canTrain || isTraining) return;
    setIsTraining(true);
    window.setTimeout(() => {
      lab.train();
      setIsTraining(false);
    }, 450);
  };

  return (
    <div className={styles.builder}>
      <div className={styles.builderTop}>
        <p className={styles.statement}>
          {predictionStatement(columns, lab.labelColumn, lab.selectedFeatures)}
        </p>
        <Button
          size="extraSmall"
          variant="outlined"
          color="secondary"
          onClick={() => lab.setTrainingSetupOpen(false)}
        >
          Hide setup
        </Button>
      </div>
      <div className={styles.builderRow}>
        {lab.config.hideLabelSelect ? null : (
          <Dropdown
            role="input"
            size="small"
            color="secondary"
            width="auto"
            label="Predict"
            placeholder="Choose a label"
            value={lab.labelColumn ?? ""}
            options={labelOptions}
            onChange={(value) => lab.setLabelColumn(String(value))}
          />
        )}
        <div className={styles.featureBlock}>
          <p className={styles.muted}>Based on</p>
          <div className={styles.featureList}>
            {featureColumns.map((column) => (
              <label key={column.id} className={styles.featureItem}>
                <Checkbox
                  size="small"
                  checked={lab.selectedFeatures.includes(column.id)}
                  onChange={() => lab.toggleFeature(column.id)}
                />
                <span>{column.name}</span>
              </label>
            ))}
          </div>
        </div>
        {lab.selectedAlgorithm === "knn" ? (
          <SegmentedButton
            size="extraSmall"
            aria-label="Number of neighbors"
            value={String(lab.knnK)}
            onChange={(value) => lab.setKnnK(Number(value))}
            options={K_OPTIONS}
          />
        ) : (
          <p className={styles.builderHint}>Up to three questions.</p>
        )}
        <Tooltip
          title={lab.trainBlockedReason ?? "Train using the current statement"}
          placement="top"
        >
          <span>
            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={!lab.canTrain || isTraining}
              onClick={runTrain}
            >
              {isTraining
                ? "Training…"
                : lab.model
                  ? "Train again"
                  : "Train model"}
            </Button>
          </span>
        </Tooltip>
      </div>
      {lab.model ? (
        <div className={styles.builderResult}>
          <Alert sentiment="success" size="small">
            Trained. {accuracy}% accuracy on the current sheet.
          </Alert>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => lab.setSection("test")}
          >
            Open Test
          </Button>
        </div>
      ) : null}
    </div>
  );
}
