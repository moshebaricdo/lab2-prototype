import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./SuccessAlert.module.scss";

interface SuccessAlertProps {
  message: string;
  onClose: () => void;
}

export function SuccessAlert({ message, onClose }: SuccessAlertProps) {
  return (
    <div className={styles.root} data-name="Alert">
      <div className={styles.row}>
        <div className={styles.content}>
          <div className={styles.icon}>
            <FontAwesomeIcon icon={faCheckCircle} className="leading-[1.25]" />
          </div>
          <p className={styles.message}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close alert"
          data-name="Close Icon Button"
        >
          <div className={styles.closeIcon}>
            <FontAwesomeIcon icon={faXmark} className="leading-[1.25]" />
          </div>
        </button>
      </div>
    </div>
  );
}
