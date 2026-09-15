import { Button } from "@moshebari/cads-react";
import { predictionStatement } from "../../../../lib/aiLab";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import { DatasetViews } from "./DatasetViews";
import styles from "./AiLabWorkspace.module.scss";

interface TrainPanelProps {
  lab: AiLabController;
}

export function TrainPanel({ lab }: TrainPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionPad}>
        <p className={styles.statement}>
          {predictionStatement(
            lab.config.dataset.columns,
            lab.labelColumn,
            lab.selectedFeatures,
          )}
        </p>
        <p className={styles.muted}>
          Click a column, then choose it as the label or add it as a feature.
        </p>
      </div>
      <DatasetViews lab={lab} trainingActions />
      <div className={styles.footer}>
        {lab.model ? (
          <Button
            size="medium"
            variant="outlined"
            color="secondary"
            onClick={() => lab.setSection("test")}
          >
            Open Test
          </Button>
        ) : null}
        <Button
          size="medium"
          variant="contained"
          color="primary"
          disabled={!lab.canTrain}
          onClick={lab.train}
        >
          {lab.model ? "Train again" : "Train model"}
        </Button>
      </div>
    </section>
  );
}
