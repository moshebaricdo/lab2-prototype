import { useState } from "react";
import { Button } from "@moshebaricdo/cads-react";
import styles from "./ActionRow.module.scss";

interface ActionRowProps {
  onCopy?: () => void;
  onDownload?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  showDownload?: boolean;
  showFeedback?: boolean;
}

export function ActionRow({
  onCopy,
  onDownload,
  onThumbsUp,
  onThumbsDown,
  showDownload = true,
  showFeedback = true,
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
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="copy"
          onClick={onCopy}
          aria-label="Copy response"
        />
        {showDownload && (
          <Button
            variant="text"
            color="tertiary"
            size="extraSmall"
            iconOnly
            startIconName="download"
            onClick={onDownload}
            aria-label="Download response"
          />
        )}
      </div>

      {showFeedback && (
        <div className={styles.rightActions}>
          <p className={styles.prompt}>Was this helpful?</p>
          <div className={styles.feedbackActions}>
            <Button
              variant="text"
              color={feedback === "up" ? "secondary" : "tertiary"}
              size="extraSmall"
              iconOnly
              startIconName="thumbs-up"
              onClick={handleThumbsUp}
              className={feedback === "up" ? styles.feedbackActive : ""}
              aria-label="Mark response helpful"
            />
            <Button
              variant="text"
              color={feedback === "down" ? "secondary" : "tertiary"}
              size="extraSmall"
              iconOnly
              startIconName="thumbs-down"
              onClick={handleThumbsDown}
              className={feedback === "down" ? styles.feedbackActive : ""}
              aria-label="Mark response not helpful"
            />
          </div>
        </div>
      )}
    </div>
  );
}
