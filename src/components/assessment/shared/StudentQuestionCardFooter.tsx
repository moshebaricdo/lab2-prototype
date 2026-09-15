import type { ReactNode } from "react";
import { Button } from "@moshebari/cads-react";
import type { StudentIncorrectFooterLayout } from "../../../lib/assessmentBuilder";
import styles from "./StudentQuestionCardFooter.module.scss";

interface StudentQuestionCardFooterProps {
  leftExtra?: ReactNode;
  resultTag?: ReactNode;
  /** Sitting chip / timer — left of Try again or the primary in `submitWrap`. */
  submitLeading?: ReactNode;
  retry?: Pick<
    StudentIncorrectFooterLayout,
    "retryVariant" | "retryPlacement"
  > & {
    onClick: () => void;
    disabled?: boolean;
  };
  /** Right-side primary when Try again is not the only action. */
  primary?: {
    label: string;
    endIconName?: "arrow-right";
    onClick?: () => void;
    disabled?: boolean;
  };
}

function RetryButton({
  retry,
}: {
  retry: NonNullable<StudentQuestionCardFooterProps["retry"]>;
}) {
  const isPrimary = retry.retryVariant === "primary";
  return (
    <Button
      variant={isPrimary ? "contained" : "outlined"}
      color={isPrimary ? "primary" : "secondary"}
      size="small"
      disabled={retry.disabled}
      onClick={retry.onClick}
    >
      Try again
    </Button>
  );
}

/**
 * Single-question card action row (Figma `optionWrap` + `submitWrap`).
 * Primary always sits on the right.
 */
export function StudentQuestionCardFooter({
  leftExtra,
  resultTag,
  submitLeading,
  retry,
  primary,
}: StudentQuestionCardFooterProps) {
  const retryOnLeft = retry?.retryPlacement === "left";
  const retryOnRight = retry?.retryPlacement === "right";
  const leftCluster =
    retryOnLeft || resultTag ? (
      <div className={styles.optionWrap}>
        {retryOnLeft && retry ? <RetryButton retry={retry} /> : null}
        {resultTag}
      </div>
    ) : null;

  return (
    <footer className={styles.footer}>
      <div className={styles.optionSide}>
        {leftExtra}
        {leftCluster}
      </div>
      <div className={styles.submitWrap}>
        {submitLeading}
        {retryOnRight && retry ? <RetryButton retry={retry} /> : null}
        {!retryOnRight && primary ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            endIconName={primary.endIconName}
            disabled={primary.disabled}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
        ) : null}
      </div>
    </footer>
  );
}
