import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import styles from "./SavedTag.module.scss";

export function SavedTag() {
  return (
    <div className={styles.root} data-name="Tag">
      <span className={styles.icon}>
        <FontAwesomeIcon icon={faCheck} className="leading-[1.25]" />
      </span>
      <p className={styles.label}>Saved</p>
    </div>
  );
}
