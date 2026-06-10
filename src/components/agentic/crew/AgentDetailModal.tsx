import { useEffect, useState } from "react";
import { Dialog } from "../../ui/Dialog";
import { AppButton } from "../../ui/AppButton";
import { AppCheckbox } from "../../ui/AppCheckbox";
import { FaIcon } from "../../ui/icons/FaIcon";
import type {
  AgentCustomization,
  AgentSpecialist,
} from "../../../types/agentLab";
import styles from "./AgentDetailModal.module.scss";

interface AgentDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** The agent as currently configured (authored + customization). */
  specialist: AgentSpecialist;
  /** The authored baseline, for Reset. */
  baseSpecialist: AgentSpecialist;
  /** Every project file path a student could scope in. */
  allProjectFiles: string[];
  /** When true, the configuration section is editable. */
  allowCustomization?: boolean;
  /** True when a tutor API key is set — edits take effect on live runs. */
  liveMode?: boolean;
  onSave?: (customization: AgentCustomization) => void;
}

/**
 * Agent detail: what this agent is, what's in its context window, and — when
 * the level allows it — the student's controls for reconfiguring it. The
 * customization fields are the real thing, not a mock: the instructions
 * textarea feeds the live system prompt and the file checklist feeds the live
 * context filter. Configuring an agent IS the curriculum endgame of this
 * direction, and this modal is where that capability progressively unlocks.
 */
export function AgentDetailModal({
  open,
  onClose,
  specialist,
  baseSpecialist,
  allProjectFiles,
  allowCustomization = false,
  liveMode = false,
  onSave,
}: AgentDetailModalProps) {
  const [contract, setContract] = useState(specialist.contract);
  const [filePaths, setFilePaths] = useState<string[]>(
    specialist.contextScope.filePaths,
  );

  useEffect(() => {
    if (!open) return;
    setContract(specialist.contract);
    setFilePaths(specialist.contextScope.filePaths);
  }, [open, specialist]);

  const toggleFile = (path: string) => {
    setFilePaths((current) =>
      current.includes(path)
        ? current.filter((p) => p !== path)
        : [...current, path],
    );
  };

  const isDirty =
    contract !== specialist.contract ||
    filePaths.length !== specialist.contextScope.filePaths.length ||
    filePaths.some((p) => !specialist.contextScope.filePaths.includes(p));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={specialist.role}
      size="m"
      decorativeIcon={
        <span className={styles.headerIcon} data-accent={specialist.accent}>
          <FaIcon name={specialist.iconName} size="s" />
        </span>
      }
      footer={
        allowCustomization ? (
          <div className={styles.footer}>
            <span className={styles.footerNote}>
              {liveMode
                ? "Changes apply to this agent's next run."
                : "Changes apply on live runs — add an API key in Lab Settings."}
            </span>
            <AppButton
              variant="secondary"
              tone="gray"
              size="s"
              onClick={() => {
                setContract(baseSpecialist.contract);
                setFilePaths(baseSpecialist.contextScope.filePaths);
                onSave?.({});
              }}
            >
              Reset
            </AppButton>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              disabled={!isDirty}
              onClick={() => {
                onSave?.({ contract, filePaths });
                onClose();
              }}
            >
              Save
            </AppButton>
          </div>
        ) : undefined
      }
    >
      <div className={styles.body}>
        <p className={styles.tagline}>{specialist.tagline}</p>

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>Context window</h3>
          <div className={styles.fixedChips}>
            {specialist.contextScope.includesInstructions && (
              <span className={styles.fixedChip}>
                <FaIcon name="book-open" size="inherit" />
                Level instructions
              </span>
            )}
            {specialist.contextScope.artifactPaths.map((path) => (
              <span key={path} className={styles.fixedChip}>
                <FaIcon name="file-lines" size="inherit" />
                {path}
              </span>
            ))}
          </div>
          {allowCustomization ? (
            <div className={styles.fileChecklist}>
              {allProjectFiles.map((path) => (
                <label key={path} className={styles.fileRow}>
                  <AppCheckbox
                    checkboxSize="s"
                    checked={filePaths.includes(path)}
                    onChange={() => toggleFile(path)}
                  />
                  <span>{path}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className={styles.fixedChips}>
              {specialist.contextScope.filePaths.map((path) => (
                <span key={path} className={styles.fixedChip}>
                  <FaIcon name="file-code" size="inherit" />
                  {path}
                </span>
              ))}
            </div>
          )}
          <p className={styles.hint}>
            Less context, sharper agent — only scope in what this job needs.
          </p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>Standing instructions</h3>
          {allowCustomization ? (
            <textarea
              className={styles.contractInput}
              rows={4}
              value={contract}
              onChange={(event) => setContract(event.target.value)}
              aria-label={`Standing instructions for the ${specialist.role}`}
            />
          ) : (
            <p className={styles.contractText}>{specialist.contract}</p>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>Won&apos;t</h3>
          <p className={styles.limitLine}>
            <FaIcon name="ban" size="inherit" className={styles.limitIcon} />
            <span>{specialist.cannotDo.join(" · ")}</span>
          </p>
        </section>
      </div>
    </Dialog>
  );
}
