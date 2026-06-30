import { useTheme } from "../../../hooks/useTheme";
import { TeacherDashboardNav } from "../TeacherDashboardNav";
import { ProgressIconKey } from "./ProgressIconKey";
import { ProgressSidebar } from "./ProgressSidebar";
import { ProgressTable } from "./ProgressTable";
import { ACTIVE_UNIT_LABEL } from "./progressData";
import styles from "./TeacherProgressPage.module.scss";

export default function TeacherProgressPage() {
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.page}${theme === "dark" ? " dark" : ""}`}
      data-theme={theme}
    >
      <TeacherDashboardNav />
      <div className={styles.body}>
        <ProgressSidebar />
        <main className={styles.main}>
          <p className={styles.eyebrow}>{ACTIVE_UNIT_LABEL}</p>
          <h1 className={styles.title}>Progress</h1>
          <ProgressIconKey />
          <ProgressTable />
        </main>
      </div>
    </div>
  );
}
