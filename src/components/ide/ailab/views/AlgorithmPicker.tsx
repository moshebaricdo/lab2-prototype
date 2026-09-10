import { Radio } from "@moshebaricdo/cads-react";
import { AppText } from "../../../ui/AppText";
import type { AiLabAlgorithmId } from "../../../../types/aiLab";
import styles from "./AiLabWorkspace.module.scss";

const CHOICES: {
  id: AiLabAlgorithmId;
  name: string;
  description: string;
}[] = [
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    description: "Uses similar rows in the dataset to make a prediction.",
  },
  {
    id: "decisionTree",
    name: "Decision Tree",
    description: "Builds a tree of questions about the selected features.",
  },
];

interface AlgorithmPickerProps {
  selectedAlgorithm: AiLabAlgorithmId | undefined;
  onSelect: (algorithm: AiLabAlgorithmId) => void;
}

export function AlgorithmPicker({
  selectedAlgorithm,
  onSelect,
}: AlgorithmPickerProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionPad}>
        <AppText variant="heading-h4" weight="semibold" as="h2">
          Choose an algorithm
        </AppText>
        <p className={styles.muted}>
          Both algorithms use the same taco-truck dataset. You can start over
          later to try the other one.
        </p>
        <fieldset className={styles.algorithmGrid} aria-label="Algorithm">
          {CHOICES.map((choice) => {
            const selected = selectedAlgorithm === choice.id;
            return (
              <label
                key={choice.id}
                className={`${styles.algorithmCard} ${
                  selected ? styles.algorithmCardSelected : ""
                }`}
              >
                <Radio
                  name="ai-lab-algorithm"
                  value={choice.id}
                  checked={selected}
                  onChange={() => onSelect(choice.id)}
                />
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
      </div>
    </section>
  );
}
