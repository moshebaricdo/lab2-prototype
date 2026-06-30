import { useTheme } from "../../hooks/useTheme";
import { ClassSectionsPanel } from "./ClassSectionsPanel";
import { DashboardSidebar } from "./DashboardSidebar";
import { TeacherDashboardNav } from "./TeacherDashboardNav";
import styles from "./TeacherDashboardPage.module.scss";

export default function TeacherDashboardPage() {
  const { theme } = useTheme();

  return (
    <div
      className={`${styles.page}${theme === "dark" ? " dark" : ""}`}
      data-theme={theme}
    >
      <TeacherDashboardNav />
      <main className={styles.main}>
        <div className={styles.layout}>
          <ClassSectionsPanel />
          <DashboardSidebar />
        </div>
      </main>
    </div>
  );
}
