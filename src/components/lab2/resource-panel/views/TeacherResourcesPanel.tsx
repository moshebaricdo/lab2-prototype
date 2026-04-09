import { ScrollArea } from "../../ui/scroll-area";
import styles from "./TeacherResourcesPanel.module.scss";

export function TeacherResourcesPanel() {
  return (
    <ScrollArea className={styles.root}>
      <div className={styles.card}>
        <p className={styles.title}>Teacher Resources</p>
        <p className={styles.body}>
          Supplemental classroom materials and guided prompts will appear here.
        </p>
      </div>
    </ScrollArea>
  );
}
