import { FaIcon } from "../../ui/icons/FaIcon";
import { Tooltip } from "../../ui/Tooltip";
import type { AgentSpecialist } from "../../../types/agentLab";
import styles from "./AgentRosterStrip.module.scss";

interface AgentRosterStripProps {
  specialists: AgentSpecialist[];
  activeId: string;
  /** Runtime unlock state — overrides the authored `unlocked` flag. */
  unlockedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  /** Opens the agent detail/configuration modal for the active agent. */
  onOpenDetails?: () => void;
  /** Disable switching while a request is running or a proposal is pending. */
  disabled?: boolean;
}

/**
 * Slim specialist switcher docked between the conversation and the composer —
 * the same zone real agentic tools use for model/agent pickers. Keeping it out
 * of the panel header leaves the instructions drawer and any future pinned
 * instruction step undisturbed.
 *
 * Agents are tools, not characters (curricular guideline): functional glyphs,
 * job labels, soft accent tints. Per-turn context transparency lives on the
 * messages themselves (the "Read" node); ⓘ opens the agent detail modal —
 * inspection now, configuration as students progress.
 */
export function AgentRosterStrip({
  specialists,
  activeId,
  unlockedIds,
  onSelect,
  onOpenDetails,
  disabled = false,
}: AgentRosterStripProps) {
  const active = specialists.find((s) => s.id === activeId) ?? specialists[0];

  return (
    <div className={styles.root}>
      <div role="tablist" aria-label="Specialist agents" style={{ display: "contents" }}>
        {specialists.map((specialist) => {
          const isActive = specialist.id === active.id;
          const isUnlocked = unlockedIds.has(specialist.id);
          const chip = (
            <button
              key={specialist.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-accent={specialist.accent}
              className={[
                styles.chip,
                isActive ? styles.chipActive : "",
                !isUnlocked ? styles.chipLocked : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled || !isUnlocked}
              onClick={() => onSelect(specialist.id)}
            >
              <FaIcon name={specialist.iconName} size="xs" />
              {isActive && <span>{specialist.role}</span>}
              {!isUnlocked && (
                <FaIcon name="lock" size="inherit" className={styles.lockGlyph} />
              )}
            </button>
          );
          if (isActive) return chip;
          return (
            <Tooltip
              key={specialist.id}
              content={
                isUnlocked
                  ? specialist.role
                  : `${specialist.role} — ${specialist.lockedHint ?? "locked"}`
              }
              position="top"
              sideOffset={6}
            >
              {chip}
            </Tooltip>
          );
        })}
      </div>

      <span className={styles.spacer} />

      {onOpenDetails && (
        <Tooltip content={`About the ${active.role}`} position="top" sideOffset={6}>
          <button
            type="button"
            className={styles.infoButton}
            aria-label={`About the ${active.role}`}
            onClick={onOpenDetails}
          >
            <FaIcon name="circle-info" size="xs" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
