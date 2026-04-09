import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-regular-svg-icons";
import { useState } from "react";
import { AppButton } from "../ui/AppButton";
import styles from "./ActionRow.module.scss";

interface ActionRowProps {
  onCopy?: () => void;
  onDownload?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}

export function ActionRow({
  onCopy,
  onDownload,
  onThumbsUp,
  onThumbsDown,
}: ActionRowProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleThumbsUp = () => {
    setFeedback(feedback === "up" ? null : "up");
    onThumbsUp?.();
  };

  const handleThumbsDown = () => {
    setFeedback(feedback === "down" ? null : "down");
    onThumbsDown?.();
  };

  return (
    <div className={styles.root} data-name="Action Row">
      <div className={styles.leftActions}>
        <AppButton
          variant="tertiary"
          tone="gray"
          size="xs"
          icon={<FontAwesomeIcon icon={faCopy} />}
          onClick={onCopy}
          aria-label="Copy response"
        />
        <AppButton
          variant="tertiary"
          tone="gray"
          size="xs"
          icon={<FontAwesomeIcon icon={faDownload} />}
          onClick={onDownload}
          aria-label="Download response"
        />
      </div>

      <div className={styles.rightActions}>
        <p className={styles.prompt}>Was this helpful?</p>
        <div className={styles.feedbackActions}>
          <AppButton
            variant="tertiary"
            tone={feedback === "up" ? "black" : "gray"}
            size="xs"
            icon={<FontAwesomeIcon icon={faThumbsUp} />}
            onClick={handleThumbsUp}
            className={feedback === "up" ? styles.feedbackActive : ""}
            aria-label="Mark response helpful"
          />
          <AppButton
            variant="tertiary"
            tone={feedback === "down" ? "black" : "gray"}
            size="xs"
            icon={<FontAwesomeIcon icon={faThumbsDown} />}
            onClick={handleThumbsDown}
            className={feedback === "down" ? styles.feedbackActive : ""}
            aria-label="Mark response not helpful"
          />
        </div>
      </div>
    </div>
  );
}
