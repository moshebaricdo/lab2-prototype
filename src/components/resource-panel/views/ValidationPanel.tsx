import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faXmarkCircle,
  faCircleMinus,
  faSpinner,
  faClipboardCheck,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ValidationPanel.module.scss";

interface ValidationTest {
  id: string;
  description: string;
  status: "pass" | "fail" | "skip";
}

const defaultTests: ValidationTest[] = [
  {
    id: "1",
    description: "Painter moves and paints at least 5 times",
    status: "pass",
  },
  {
    id: "2",
    description: "Painter paints (1,0) to (5,0)",
    status: "fail",
  },
  {
    id: "3",
    description: "Painter ends at (6, 3)",
    status: "skip",
  },
];

export function ValidationPanel() {
  const [isValidating, setIsValidating] = useState(false);
  const [tests] = useState<ValidationTest[]>(defaultTests);

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
    }, 1000);
  };

  const handleStopValidation = () => {
    setIsValidating(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.table}>
          <div className={styles.headerRow}>
            <div className={styles.headerCell}>Test</div>
            <div className={`${styles.headerCell} ${styles.headerCellResult}`}>Result</div>
          </div>

          {tests.map((test) => (
            <div key={test.id} className={styles.row}>
              <p className={styles.description}>{test.description}</p>
              <div className={styles.resultCell}>
                {isValidating ? (
                  <FontAwesomeIcon icon={faSpinner} className={`${styles.spinner} animate-spin`} />
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={
                        test.status === "pass"
                          ? faCheckCircle
                          : test.status === "fail"
                            ? faXmarkCircle
                            : faCircleMinus
                      }
                      className={`${styles.icon} ${
                        test.status === "pass"
                          ? styles.pass
                          : test.status === "fail"
                            ? styles.fail
                            : styles.skip
                      }`}
                    />
                    <p className={styles.statusText}>
                      {test.status === "pass"
                        ? "Pass"
                        : test.status === "fail"
                          ? "Fail"
                          : "Skip"}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={isValidating ? handleStopValidation : handleValidate}
          className={styles.validateButton}
        >
          <span className={styles.buttonIcon}>
            <FontAwesomeIcon icon={isValidating ? faStop : faClipboardCheck} />
          </span>
          <span>{isValidating ? "Stop validation" : "Validate"}</span>
        </button>
      </div>
    </div>
  );
}
