import type { ReactNode } from "react";
import { ScrollArea } from "../../../ui/scroll-area";
import { MarkdownInstructions } from "../MarkdownInstructions";
import styles from "./InstructionsPanel.module.scss";

interface InstructionsPanelProps {
  children?: ReactNode;
}

export function InstructionsPanel({ children }: InstructionsPanelProps) {
  return (
    <ScrollArea className={styles.root} viewportClassName={styles.viewport}>
      <div className={styles.inner}>
        {children ?? (
          <MarkdownInstructions
            markdown={[
              "# Instructions",
              "Use this panel for the task instructions, helpful hints, and checkpoints for the current lab.",
            ].join("\n\n")}
          />
        )}
      </div>
    </ScrollArea>
  );
}
