import { useCallback, useEffect, useRef, useState } from "react";
import { FaIcon } from "../../ui/icons/FaIcon";
import { Tooltip } from "@moshebaricdo/cads-react";
import type { AgentSpecialist } from "../../../types/agentLab";
import { AgentLibraryMenu } from "./AgentLibraryMenu";
import styles from "./AgentRosterStrip.module.scss";

interface AgentRosterStripProps {
  specialists: AgentSpecialist[];
  activeId: string;
  /** Runtime unlock state — overrides the authored `unlocked` flag. */
  unlockedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  /** Opens the agent detail/configuration modal for the active agent. */
  onOpenDetails?: () => void;
  /** Recall a saved agent from the backpack into the roster. */
  onRecallSaved?: (specialist: AgentSpecialist, backpackItemId: string) => void;
  /** Add a course agent back onto this project's roster. */
  onAddProvided?: (agentId: string) => void;
  /** Authored agents available on this level (excludes Tutor). */
  providedAgents?: AgentSpecialist[];
  projectSpecialistIds?: ReadonlySet<string>;
  activeSavedBackpackItemIds?: ReadonlySet<string>;
  /** Start the create-new-agent flow (name, glyph, accent). */
  onCreateAgent?: () => void;
  /** Show the trailing + library menu. */
  showAgentLibrary?: boolean;
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
 * messages themselves (the "Read" node); the active chip’s ⓘ opens that
 * agent’s detail modal — inspection now, configuration as students progress.
 */
export function AgentRosterStrip({
  specialists,
  activeId,
  unlockedIds,
  onSelect,
  onOpenDetails,
  onRecallSaved,
  onAddProvided,
  providedAgents = [],
  projectSpecialistIds,
  activeSavedBackpackItemIds,
  onCreateAgent,
  showAgentLibrary = false,
  disabled = false,
}: AgentRosterStripProps) {
  const visibleSpecialists = specialists.filter((specialist) =>
    unlockedIds.has(specialist.id),
  );
  const active =
    visibleSpecialists.find((s) => s.id === activeId) ??
    visibleSpecialists.find((s) => s.id === "tutor") ??
    visibleSpecialists[0];
  const scrollRowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLElement>());
  const [showScrollStartFade, setShowScrollStartFade] = useState(false);
  const [showScrollEndFade, setShowScrollEndFade] = useState(false);

  const tutorEntry = visibleSpecialists.find((s) => s.id === "tutor");
  const specialistEntries = visibleSpecialists.filter((s) => s.id !== "tutor");

  const registerChipRef = useCallback(
    (id: string, node: HTMLElement | null) => {
      if (node) chipRefs.current.set(id, node);
      else chipRefs.current.delete(id);
    },
    [],
  );

  const updateScrollFades = useCallback(() => {
    const scrollRow = scrollRowRef.current;
    if (!scrollRow) {
      setShowScrollStartFade(false);
      setShowScrollEndFade(false);
      return;
    }

    const maxScrollLeft = scrollRow.scrollWidth - scrollRow.clientWidth;
    setShowScrollStartFade(maxScrollLeft > 1 && scrollRow.scrollLeft > 1);
    setShowScrollEndFade(
      maxScrollLeft > 1 && scrollRow.scrollLeft < maxScrollLeft - 1,
    );
  }, []);

  useEffect(() => {
    const scrollRow = scrollRowRef.current;
    if (!scrollRow) return undefined;

    updateScrollFades();
    scrollRow.addEventListener("scroll", updateScrollFades, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollFades);
    resizeObserver.observe(scrollRow);

    return () => {
      scrollRow.removeEventListener("scroll", updateScrollFades);
      resizeObserver.disconnect();
    };
  }, [specialistEntries.length, visibleSpecialists, updateScrollFades]);

  useEffect(() => {
    const scrollRow = scrollRowRef.current;
    const chip = chipRefs.current.get(activeId);
    if (!scrollRow || !chip || !scrollRow.contains(chip)) return;

    const scrollRect = scrollRow.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const edgeInset = 4;

    if (chipRect.left < scrollRect.left) {
      scrollRow.scrollLeft -= scrollRect.left - chipRect.left + edgeInset;
    } else if (chipRect.right > scrollRect.right) {
      scrollRow.scrollLeft += chipRect.right - scrollRect.right + edgeInset;
    }

    updateScrollFades();
  }, [activeId, specialistEntries.length, visibleSpecialists, updateScrollFades]);

  const renderChip = (specialist: AgentSpecialist) => {
    const isActive = specialist.id === active?.id;

    const chipContent = (
      <>
        <FaIcon name={specialist.iconName} size="xs" />
        {isActive ? (
          <span className={styles.chipLabel}>{specialist.role}</span>
        ) : null}
      </>
    );

    const attachRef = (node: HTMLElement | null) => {
      registerChipRef(specialist.id, node);
    };

    if (isActive && onOpenDetails) {
      return (
        <div
          key={specialist.id}
          ref={attachRef}
          data-accent={specialist.accent}
          className={[
            styles.chip,
            styles.chipActive,
            styles.chipCompound,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            role="tab"
            aria-selected
            className={styles.chipSelect}
            disabled={disabled}
            onClick={() => onSelect(specialist.id)}
          >
            {chipContent}
          </button>
          <Tooltip
            title={`About the ${specialist.role}`}
            placement="top"
          >
            <button
              type="button"
              className={styles.chipInfo}
              aria-label={`About the ${specialist.role}`}
              onClick={onOpenDetails}
            >
              <FaIcon name="circle-info" size="inherit" />
            </button>
          </Tooltip>
        </div>
      );
    }

    const chip = (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        data-accent={specialist.accent}
        className={[
          styles.chip,
          isActive ? styles.chipActive : styles.chipCollapsed,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        onClick={() => onSelect(specialist.id)}
      >
        {chipContent}
      </button>
    );
    if (isActive) {
      return (
        <span key={specialist.id} className={styles.chipWrap} ref={attachRef}>
          {chip}
        </span>
      );
    }
    return (
      <Tooltip
        key={specialist.id}
        title={specialist.role}
        placement="top"
      >
        <span className={styles.chipWrap} ref={attachRef}>
          {chip}
        </span>
      </Tooltip>
    );
  };

  return (
    <div className={styles.root}>
      <div role="tablist" aria-label="Specialist agents" className={styles.tablist}>
        {tutorEntry ? (
          <div className={styles.tutorAnchor}>{renderChip(tutorEntry)}</div>
        ) : null}

        {tutorEntry && specialistEntries.length > 0 ? (
          <span className={styles.tutorDivider} aria-hidden />
        ) : null}

        {specialistEntries.length > 0 ? (
          <div
            className={[
              styles.scrollViewport,
              showScrollStartFade ? styles.scrollViewportStartFadeVisible : "",
              showScrollEndFade ? styles.scrollViewportEndFadeVisible : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div ref={scrollRowRef} className={styles.scrollRow}>
              {specialistEntries.map(renderChip)}
            </div>
          </div>
        ) : null}
      </div>

      {showAgentLibrary &&
      onRecallSaved &&
      onAddProvided &&
      onCreateAgent &&
      projectSpecialistIds &&
      activeSavedBackpackItemIds ? (
        <div className={styles.actionsAnchor}>
          <AgentLibraryMenu
            disabled={disabled}
            providedAgents={providedAgents}
            projectSpecialistIds={projectSpecialistIds}
            activeSavedBackpackItemIds={activeSavedBackpackItemIds}
            onAddProvided={onAddProvided}
            onSelectAgent={onSelect}
            onRecallSaved={onRecallSaved}
            onCreateNew={onCreateAgent}
          />
        </div>
      ) : null}
    </div>
  );
}
