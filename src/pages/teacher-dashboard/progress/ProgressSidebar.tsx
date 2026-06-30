import { useState } from "react";
import { AppNativeSelect } from "../../../components/ui/AppDropdown";
import { FaIcon } from "../../../components/ui/icons/FaIcon";
import {
  ACTIVE_NAV_ID,
  CLASS_SECTION_OPTIONS,
  NAV_SECTIONS,
} from "./progressData";
import styles from "./ProgressSidebar.module.scss";

export function ProgressSidebar() {
  const [classSection, setClassSection] = useState(
    CLASS_SECTION_OPTIONS[0].value,
  );

  return (
    <nav className={styles.root} aria-label="Class section navigation">
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Class Sections</p>
        <AppNativeSelect
          value={classSection}
          onValueChange={setClassSection}
          options={CLASS_SECTION_OPTIONS}
          placeholder=""
          size="m"
          tone="gray"
          fullWidth
          className={styles.classSelect}
        />
      </div>

      {NAV_SECTIONS.map((navSection) => (
        <div key={navSection.id} className={styles.section}>
          <p className={styles.sectionLabel}>{navSection.label}</p>
          <ul className={styles.navList}>
            {navSection.items.map((item) => {
              const active = item.id === ACTIVE_NAV_ID;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.navItem}${active ? ` ${styles.navItemActive}` : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <FaIcon
                      name={item.iconName}
                      size="s"
                      className={styles.navIcon}
                    />
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
