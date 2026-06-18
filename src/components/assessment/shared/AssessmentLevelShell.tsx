import type { ReactNode } from "react";
import styles from "./AssessmentLevelShell.module.scss";

export type AssessmentLevelShellVariant =
  | "standalone"
  | "embedded"
  | "embeddedFlat";

export interface AssessmentLevelShellProps {
  children: ReactNode;
  /**
   * - `standalone` — full Lab2 page with centered card (default)
   * - `embedded` — inside levelgroup or code-ref without outer card
   * - `embeddedFlat` — scroll/stepped group: no card wrapper, full width
   */
  variant?: AssessmentLevelShellVariant;
  className?: string;
}

export function assessmentLevelShellVariant(
  embedded?: boolean,
  embeddedFlatInParent?: boolean,
): AssessmentLevelShellVariant {
  if (!embedded) return "standalone";
  if (embeddedFlatInParent) return "embeddedFlat";
  return "embedded";
}

/**
 * Shared outer chrome for assessment level workspaces: scrollable main area
 * and optional centered card. Task UI (stem + interaction + footer) goes inside.
 */
export function AssessmentLevelShell({
  children,
  variant = "standalone",
  className,
}: AssessmentLevelShellProps) {
  const embedded = variant === "embedded" || variant === "embeddedFlat";
  const flat = variant === "embeddedFlat";

  return (
    <main
      className={[
        embedded ? styles.workspaceEmbedded : styles.workspace,
        flat ? styles.workspaceEmbeddedFlat : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {flat ? children : <div className={styles.card}>{children}</div>}
    </main>
  );
}
