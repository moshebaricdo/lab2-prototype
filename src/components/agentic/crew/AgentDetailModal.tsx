import { useCallback, useEffect, useId, useState } from "react";
import { Dialog } from "../../ui/Dialog";
import { AppButton } from "../../ui/AppButton";
import { AppCheckbox } from "../../ui/AppCheckbox";
import { AppActionDropdown } from "../../ui/AppDropdown";
import { AppTextArea } from "../../ui/AppTextField";
import { AppSlider } from "../../ui/AppSlider";
import { FaIcon } from "../../ui/icons/FaIcon";
import {
  AGENT_EFFORT_DESCRIPTIONS,
  AGENT_EFFORT_LABELS,
} from "../../../lib/backpack/agentBackpack";
import type {
  AgentAccent,
  AgentCustomization,
  AgentEffort,
  AgentSpecialist,
} from "../../../types/agentLab";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import { AgentIdentityCard } from "./AgentIdentityCard";
import {
  agentPacksProjectCode,
  formatWriteScopeNote,
  isScopedToAllProjectFiles,
  pathsMatch,
  samePathSets,
} from "./agentContext";
import styles from "./AgentDetailModal.module.scss";

interface AgentDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** The agent as currently configured (authored + customization). */
  specialist: AgentSpecialist;
  /** The authored baseline, for Reset. */
  baseSpecialist: AgentSpecialist;
  /** Every project file path a student could scope in (Advanced). */
  allProjectFiles: string[];
  /** Path of the project plan when one exists in the tree. */
  planPath?: string;
  /** When false, level-instructions packer is hidden (standalone projects). */
  hasLevelInstructions?: boolean;
  /** When true, the agent modal exposes toggles + standing-instruction editing. */
  allowCustomization?: boolean;
  /** When true, name/glyph/accent/description can be edited (saved agents). */
  allowIdentityEdit?: boolean;
  /** Create flow — full configuration before saving to backpack. */
  mode?: "default" | "create";
  /** When true, save-to-backpack appears in the overflow menu. */
  allowAgentLibrary?: boolean;
  onSave?: (customization: AgentCustomization, effective: AgentSpecialist) => void;
  /** Persist a newly configured agent to backpack + roster. */
  onCreate?: (specialist: AgentSpecialist) => void;
  /** Save the effective agent snapshot to the backpack (no secondary dialog). */
  onSaveToBackpack?: (specialist: AgentSpecialist) => void;
  /** When true, this agent can be removed from the project roster (not Tutor). */
  canRemoveFromProject?: boolean;
  onRemoveFromProject?: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const inputId = useId();

  return (
    <div className={styles.toggleRow}>
      <label className={styles.toggleText} htmlFor={inputId}>
        <span className={styles.toggleLabel}>{label}</span>
        <span className={styles.toggleDescription}>{description}</span>
      </label>
      <span
        className={[
          styles.switch,
          checked ? styles.switchOn : "",
          disabled ? styles.switchDisabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.switchThumb} aria-hidden="true" />
      </span>
    </div>
  );
}

function ToolRow({
  label,
  enabled,
  detail,
}: {
  label: string;
  enabled: boolean;
  detail?: string;
}) {
  return (
    <li className={styles.toolRow}>
      <span className={styles.toolRowLabel}>{label}</span>
      <span className={enabled ? styles.contextRowOn : styles.contextRowOff}>
        {detail ?? (enabled ? "On" : "Off")}
      </span>
    </li>
  );
}

function ContextRow({
  iconName,
  label,
  state,
}: {
  iconName: "book-open" | "file-lines" | "file-code" | "comment";
  label: string;
  state: { present: boolean; note?: string };
}) {
  return (
    <li className={styles.contextRow}>
      <FaIcon name={iconName} size="xs" className={styles.contextRowIcon} />
      <span className={styles.contextRowLabel}>{label}</span>
      <span
        className={
          state.present ? styles.contextRowOn : styles.contextRowOff
        }
      >
        {state.note ?? (state.present ? "Packed" : "Not packed")}
      </span>
    </li>
  );
}

/**
 * Agent detail + configuration (V4 spec, Track 2e). Student-facing knobs are
 * tools (edit scope, runtime read), model effort, context packers, and the
 * core prompt.
 */
export function AgentDetailModal({
  open,
  onClose,
  specialist,
  baseSpecialist,
  allProjectFiles,
  planPath,
  hasLevelInstructions = false,
  allowCustomization = false,
  allowIdentityEdit = false,
  mode = "default",
  allowAgentLibrary = false,
  onSave,
  onCreate,
  onSaveToBackpack,
  canRemoveFromProject = false,
  onRemoveFromProject,
}: AgentDetailModalProps) {
  const isCreateMode = mode === "create";
  const canEditConfig = isCreateMode || allowCustomization || allowIdentityEdit;
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [role, setRole] = useState(specialist.role);
  const [tagline, setTagline] = useState(specialist.tagline);
  const [iconName, setIconName] = useState<FaIconName>(specialist.iconName);
  const [accent, setAccent] = useState<AgentAccent>(specialist.accent);
  const [contract, setContract] = useState(specialist.contract);
  const [canEdit, setCanEdit] = useState(
    specialist.capabilities.workspaceEdits,
  );
  const [readLivePreview, setReadLivePreview] = useState(
    specialist.capabilities.readLivePreview,
  );
  const [writablePaths, setWritablePaths] = useState<string[]>(
    specialist.writablePaths,
  );
  const [effort, setEffort] = useState<AgentEffort>(
    specialist.effort ?? "quick",
  );
  const [filePaths, setFilePaths] = useState<string[]>(
    specialist.contextScope.filePaths,
  );

  const resolveWritablePaths = useCallback(
    (next: AgentSpecialist) =>
      allProjectFiles.filter((path) =>
        next.writablePaths.some((selected) => pathsMatch(selected, path)),
      ),
    [allProjectFiles],
  );

  const syncFormFromSpecialist = useCallback(
    (next: AgentSpecialist) => {
      setRole(next.role);
      setTagline(next.tagline);
      setIconName(next.iconName);
      setAccent(next.accent);
      setContract(next.contract);
      setCanEdit(next.capabilities.workspaceEdits);
      setReadLivePreview(next.capabilities.readLivePreview);
      setWritablePaths(resolveWritablePaths(next));
      setEffort(next.effort ?? "quick");
      setFilePaths(
        allProjectFiles.filter((path) =>
          next.contextScope.filePaths.some((selected) =>
            pathsMatch(selected, path),
          ),
        ),
      );
    },
    [allProjectFiles, resolveWritablePaths],
  );

  useEffect(() => {
    if (!open) return;
    syncFormFromSpecialist(specialist);
    setIsEditing(isCreateMode);
  }, [open, specialist, syncFormFromSpecialist, isCreateMode]);

  const toggleFile = (path: string) => {
    setFilePaths((current) =>
      current.some((selected) => pathsMatch(selected, path))
        ? current.filter((selected) => !pathsMatch(selected, path))
        : [...current, path],
    );
  };

  const toggleWritablePath = (path: string) => {
    setWritablePaths((current) =>
      current.some((selected) => pathsMatch(selected, path))
        ? current.filter((selected) => !pathsMatch(selected, path))
        : [...current, path],
    );
  };

  const handleCanEditChange = (next: boolean) => {
    setCanEdit(next);
    if (next && writablePaths.length === 0 && allProjectFiles.length > 0) {
      const basePaths = resolveWritablePaths(baseSpecialist);
      setWritablePaths(
        basePaths.length > 0 ? basePaths : [...allProjectFiles],
      );
    }
  };

  const packsProjectCode = agentPacksProjectCode(baseSpecialist);
  const planInScope = specialist.contextScope.artifactPaths.length > 0;
  const showLevelInstructions =
    specialist.contextScope.includesInstructions && hasLevelInstructions;
  const isEditingConfig = canEditConfig && isEditing;
  const isEditingIdentity =
    isCreateMode || (allowIdentityEdit && isEditingConfig);
  const trimmedRole = role.trim();
  const identityValid = trimmedRole.length > 0;

  const displayedFilePaths = isEditingConfig
    ? filePaths
    : allProjectFiles.filter((path) =>
        specialist.contextScope.filePaths.some((selected) =>
          pathsMatch(selected, path),
        ),
      );
  const codeFileCount = displayedFilePaths.length;

  const savedFilePaths = allProjectFiles.filter((path) =>
    specialist.contextScope.filePaths.some((selected) =>
      pathsMatch(selected, path),
    ),
  );

  const filePathsDirty =
    packsProjectCode && !samePathSets(filePaths, savedFilePaths);

  const projectCodeNote = (() => {
    if (codeFileCount === 0) return "No files in this project";
    if (isScopedToAllProjectFiles(displayedFilePaths, allProjectFiles)) {
      return allProjectFiles.length === 1
        ? "All project files (1 file)"
        : `All project files (${allProjectFiles.length} files)`;
    }
    if (codeFileCount <= 3) return displayedFilePaths.join(", ");
    return `${codeFileCount} of ${allProjectFiles.length} project files`;
  })();
  const savedWritablePaths = resolveWritablePaths(specialist);
  const baseWritablePaths = resolveWritablePaths(baseSpecialist);

  const writablePathsDirty =
    canEdit && !samePathSets(writablePaths, savedWritablePaths);

  const displayedWritablePaths = isEditingConfig
    ? writablePaths
    : savedWritablePaths;

  const writeScopeNote = formatWriteScopeNote(
    displayedWritablePaths,
    allProjectFiles,
  );

  const identityDirty =
    role !== specialist.role ||
    tagline !== specialist.tagline ||
    iconName !== specialist.iconName ||
    accent !== specialist.accent;

  const isDirty =
    identityDirty ||
    contract !== specialist.contract ||
    canEdit !== specialist.capabilities.workspaceEdits ||
    readLivePreview !== specialist.capabilities.readLivePreview ||
    effort !== (specialist.effort ?? "quick") ||
    writablePathsDirty ||
    filePathsDirty;

  /** The agent as currently edited — the snapshot a backpack save persists. */
  const buildEffectiveSpecialist = (): AgentSpecialist => ({
    ...specialist,
    role: trimmedRole || specialist.role,
    tagline,
    iconName: iconName,
    accent,
    contract,
    effort,
    capabilities: {
      ...specialist.capabilities,
      workspaceEdits: canEdit,
      readLivePreview,
    },
    writablePaths: canEdit ? writablePaths : [],
    contextScope: { ...specialist.contextScope, filePaths },
  });

  const handleCancelEdit = () => {
    syncFormFromSpecialist(specialist);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const customization: AgentCustomization = {};
    if (contract !== baseSpecialist.contract) {
      customization.contract = contract;
    }
    if (canEdit !== baseSpecialist.capabilities.workspaceEdits) {
      customization.workspaceEdits = canEdit;
    }
    if (readLivePreview !== baseSpecialist.capabilities.readLivePreview) {
      customization.readLivePreview = readLivePreview;
    }
    if (effort !== (baseSpecialist.effort ?? "quick")) {
      customization.effort = effort;
    }
    if (allowIdentityEdit || isCreateMode) {
      customization.role = trimmedRole;
      customization.tagline = tagline;
      customization.iconName = iconName;
      customization.accent = accent;
    }
    if (
      canEdit &&
      !samePathSets(writablePaths, baseWritablePaths)
    ) {
      customization.writablePaths = writablePaths;
    }
    if (packsProjectCode) {
      if (filePaths.length === 0) {
        customization.seeProjectCode = false;
      } else if (!isScopedToAllProjectFiles(filePaths, allProjectFiles)) {
        customization.filePaths = filePaths;
      }
    }
    onSave?.(customization, buildEffectiveSpecialist());
    setIsEditing(false);
  };

  const handleCreate = () => {
    if (!identityValid) return;
    onCreate?.(buildEffectiveSpecialist());
  };

  const handleResetToDefaults = useCallback(() => {
    onSave?.({}, { ...baseSpecialist, id: specialist.id });
    syncFormFromSpecialist({ ...baseSpecialist, id: specialist.id });
    setIsEditing(false);
  }, [onSave, baseSpecialist, specialist.id, syncFormFromSpecialist]);

  const overflowItems = isCreateMode
    ? []
    : [
    ...(allowAgentLibrary && onSaveToBackpack
      ? [
          {
            id: "save-to-backpack",
            label: "Save to backpack",
            iconName: "backpack" as const,
            onSelect: () => {
              onSaveToBackpack(
                isEditing ? buildEffectiveSpecialist() : specialist,
              );
              onClose();
            },
          },
        ]
      : []),
    ...(canEditConfig && onSave && !isCreateMode
      ? [
          {
            id: "reset-defaults",
            label: "Reset to defaults",
            iconName: "rotate-left" as const,
            onSelect: handleResetToDefaults,
          },
        ]
      : []),
    ...(canRemoveFromProject && onRemoveFromProject
      ? [
          {
            id: "remove-agent",
            label: "Remove from project",
            iconName: "minus" as const,
            onSelect: () => {
              onRemoveFromProject();
              onClose();
            },
          },
        ]
      : []),
  ];

  const footer = (
    <div className={styles.footer}>
      {overflowItems.length > 0 ? (
        <AppActionDropdown
          align="start"
          side="top"
          sideOffset={4}
          size="s"
          listLabel="More actions"
          trigger={
            <AppButton
              variant="secondary"
              tone="gray"
              size="s"
              iconName="ellipsis-vertical"
              aria-label="More agent actions"
            />
          }
          items={overflowItems}
        />
      ) : null}
      <span className={styles.footerSpacer} />
      {isCreateMode ? (
        <>
          <AppButton
            variant="secondary"
            tone="gray"
            size="s"
            onClick={onClose}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            tone="purple"
            size="s"
            disabled={!identityValid}
            onClick={handleCreate}
          >
            Create
          </AppButton>
        </>
      ) : canEditConfig && isEditing ? (
        <>
          <AppButton
            variant="secondary"
            tone="gray"
            size="s"
            onClick={handleCancelEdit}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            tone="purple"
            size="s"
            disabled={!isDirty || !identityValid}
            onClick={handleSaveEdit}
          >
            Save
          </AppButton>
        </>
      ) : (
        <>
          {canEditConfig ? (
            <AppButton
              variant="secondary"
              tone="gray"
              size="s"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </AppButton>
          ) : null}
          <AppButton variant="primary" tone="purple" size="s" onClick={onClose}>
            Back to project
          </AppButton>
        </>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isCreateMode ? "Create new agent" : "About this agent"}
      size="m"
      footer={footer}
    >
      <div className={styles.body}>
        <section
          className={styles.card}
          aria-labelledby="agent-identity-heading"
        >
          <h2 id="agent-identity-heading" className={styles.cardTitle}>
            General
          </h2>
          <div className={styles.cardBody}>
            <AgentIdentityCard
              mode={isEditingIdentity ? "edit" : "view"}
              role={isEditingIdentity ? role : specialist.role}
              tagline={isEditingIdentity ? tagline : specialist.tagline}
              icon={isEditingIdentity ? iconName : specialist.iconName}
              accent={isEditingIdentity ? accent : specialist.accent}
              onRoleChange={setRole}
              onTaglineChange={setTagline}
              onIconChange={setIconName}
              onAccentChange={setAccent}
            />
          </div>
        </section>

        <section
          className={styles.card}
          aria-labelledby="agent-prompt-heading"
        >
          <h2 id="agent-prompt-heading" className={styles.cardTitle}>
            Core prompt
          </h2>
          <div className={styles.cardBody}>
            {isEditingConfig ? (
              <AppTextArea
                id="agent-core-prompt"
                rows={5}
                value={contract}
                onChange={(event) => setContract(event.target.value)}
                size="s"
                tone="gray"
                fullWidth
                helperText="Standing instructions this agent follows on every turn."
                aria-labelledby="agent-prompt-heading"
              />
            ) : (
              <p className={styles.contractText}>{specialist.contract}</p>
            )}
          </div>
        </section>

        <section
          className={styles.card}
          aria-labelledby="agent-tools-heading"
        >
          <h2 id="agent-tools-heading" className={styles.cardTitle}>
            Tools
          </h2>
          <div className={styles.cardBody}>
            {isEditingConfig ? (
              <>
                <div className={styles.toggleList}>
                  <ToggleRow
                    label="Edit files"
                    description="When on, it can propose changes for you to review. Off means explain-only."
                    checked={canEdit}
                    onChange={handleCanEditChange}
                  />
                  <ToggleRow
                    label="Read live preview & console"
                    description="When on, it can use the rendered page and any console errors when helping."
                    checked={readLivePreview}
                    onChange={setReadLivePreview}
                  />
                </div>
                {canEdit && allProjectFiles.length > 0 ? (
                  <div className={styles.writeScopePacker}>
                    <span className={styles.fieldLabel}>Write scope</span>
                    <p className={styles.filePackerHint}>
                      Which project files this agent may change. Proposed edits
                      always need your approval first.
                    </p>
                    <div className={styles.fileChecklist}>
                      {allProjectFiles.map((path) => (
                        <label key={path} className={styles.fileRow}>
                          <AppCheckbox
                            checkboxSize="s"
                            checked={writablePaths.some((selected) =>
                              pathsMatch(selected, path),
                            )}
                            onChange={() => toggleWritablePath(path)}
                          />
                          <span>{path}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                {canEdit && allProjectFiles.length === 0 ? (
                  <p className={styles.filePackerHint}>
                    No project files are available to assign yet.
                  </p>
                ) : null}
              </>
            ) : (
              <ul className={styles.toolList}>
                <ToolRow
                  label="Edit files"
                  enabled={specialist.capabilities.workspaceEdits}
                />
                <ToolRow
                  label="Read live preview & console"
                  enabled={specialist.capabilities.readLivePreview}
                />
                {specialist.capabilities.workspaceEdits ? (
                  <ToolRow
                    label="Write scope"
                    enabled
                    detail={writeScopeNote}
                  />
                ) : null}
              </ul>
            )}
          </div>
        </section>

        <section
          className={styles.card}
          aria-labelledby="agent-model-heading"
        >
          <h2 id="agent-model-heading" className={styles.cardTitle}>
            Model & reasoning
          </h2>
          <div className={styles.cardBody}>
            {isEditingConfig ? (
              <div className={styles.effortField}>
                <span className={styles.fieldLabel} id="agent-effort-label">
                  Effort
                </span>
                <AppSlider
                  value={effort === "careful" ? 1 : 0}
                  min={0}
                  max={1}
                  step={1}
                  size="s"
                  tone="brand"
                  minLabel="Quick"
                  maxLabel="Careful"
                  showStepper
                  stepperLabels={["Quick", "Careful"]}
                  aria-labelledby="agent-effort-label"
                  onValueChange={(value) =>
                    setEffort(value >= 1 ? "careful" : "quick")
                  }
                />
                <p className={styles.filePackerHint}>
                  {AGENT_EFFORT_DESCRIPTIONS[effort]}
                </p>
              </div>
            ) : (
              <p className={styles.effortSummary}>
                <span className={styles.effortValue}>
                  {AGENT_EFFORT_LABELS[specialist.effort ?? "quick"]}
                </span>
                {" — "}
                {AGENT_EFFORT_DESCRIPTIONS[specialist.effort ?? "quick"]}
              </p>
            )}
          </div>
        </section>

        <section
          className={styles.card}
          aria-labelledby="agent-context-heading"
        >
          <h2 id="agent-context-heading" className={styles.cardTitle}>
            Context in this project
          </h2>
          <div className={styles.cardBody}>
            <p className={styles.cardIntro}>
              What this agent can read from this project when it responds.
              {packsProjectCode
                ? " Fixed packers are set by the level; you can narrow which project files are included."
                : " Fixed packers are set by the level."}
            </p>

            <ul className={styles.contextList}>
              {showLevelInstructions ? (
                <ContextRow
                  iconName="book-open"
                  label="Level instructions"
                  state={{ present: true, note: "Packed" }}
                />
              ) : null}
              {planInScope && (
                <ContextRow
                  iconName="file-lines"
                  label="Project plan"
                  state={
                    planPath
                      ? { present: true, note: planPath }
                      : { present: false, note: "Not written yet" }
                  }
                />
              )}
              {!isEditingConfig && packsProjectCode && (
                <ContextRow
                  iconName="file-code"
                  label="Project code"
                  state={{
                    present: codeFileCount > 0,
                    note: projectCodeNote,
                  }}
                />
              )}
              <ContextRow
                iconName="comment"
                label="This conversation"
                state={{ present: true, note: "Always packed" }}
              />
            </ul>

            {isEditingConfig && packsProjectCode && allProjectFiles.length > 0 ? (
              <div className={styles.filePacker}>
                <span className={styles.fieldLabel}>Project files</span>
                <p className={styles.filePackerHint}>
                  All project files are included by default. Uncheck files to
                  narrow what this agent can read in this project.
                </p>
                <div className={styles.fileChecklist}>
                  {allProjectFiles.map((path) => (
                    <label key={path} className={styles.fileRow}>
                      <AppCheckbox
                        checkboxSize="s"
                        checked={filePaths.some((selected) =>
                          pathsMatch(selected, path),
                        )}
                        onChange={() => toggleFile(path)}
                      />
                      <span>{path}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {isEditingConfig && packsProjectCode && allProjectFiles.length === 0 ? (
              <p className={styles.filePackerHint}>
                No project files are available to pack yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </Dialog>
  );
}
