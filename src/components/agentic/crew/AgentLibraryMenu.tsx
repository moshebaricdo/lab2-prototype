import * as PopoverPrimitive from "@radix-ui/react-popover";
import { type CSSProperties, useMemo, useState } from "react";
import { AppIconButton } from "../../ui/AppIconButton";
import { FaIcon } from "../../ui/icons/FaIcon";
import { useBackpack } from "../../../hooks/BackpackContext";
import { deserializeAgentBackpackItem } from "../../../lib/backpack/agentBackpack";
import type { AgentSpecialist } from "../../../types/agentLab";
import dropdownStyles from "../../ui/AppDropdown.module.scss";
import styles from "./AgentLibraryMenu.module.scss";

interface AgentLibraryMenuProps {
  disabled?: boolean;
  /** Authored agents available on this level (excludes Tutor). */
  providedAgents: AgentSpecialist[];
  /** Specialist ids currently on the project roster. */
  projectSpecialistIds: ReadonlySet<string>;
  /** Backpack item ids for saved agents already added to this project. */
  activeSavedBackpackItemIds: ReadonlySet<string>;
  onAddProvided: (agentId: string) => void;
  onSelectAgent: (agentId: string) => void;
  onRecallSaved: (specialist: AgentSpecialist, backpackItemId: string) => void;
  onCreateNew: () => void;
}

function AgentMenuRow({
  specialist,
  added,
  disabled,
  onClick,
}: {
  specialist: AgentSpecialist;
  added: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={[
        dropdownStyles.actionItem,
        added ? styles.rowAdded : "",
        disabled ? styles.rowDisabled : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={onClick}
    >
      <span className={styles.itemGlyph} aria-hidden="true">
        <FaIcon name={specialist.iconName} size="xs" />
      </span>
      <span className={styles.rowLabel}>{specialist.role}</span>
      {added ? (
        <span className={styles.addedBadge}>
          <FaIcon name="check" size="inherit" className={styles.addedIcon} />
          Added
        </span>
      ) : null}
    </button>
  );
}

/**
 * Popover menu anchored to the roster strip’s trailing `+`. Lists course
 * agents and saved backpack agents (with Added state), then create-new.
 */
export function AgentLibraryMenu({
  disabled = false,
  providedAgents,
  projectSpecialistIds,
  activeSavedBackpackItemIds,
  onAddProvided,
  onSelectAgent,
  onRecallSaved,
  onCreateNew,
}: AgentLibraryMenuProps) {
  const { items } = useBackpack();
  const [open, setOpen] = useState(false);

  const savedEntries = useMemo(() => {
    const result: Array<{ itemId: string; specialist: AgentSpecialist }> = [];
    for (const item of items) {
      const specialist = deserializeAgentBackpackItem(item);
      if (specialist) result.push({ itemId: item.id, specialist });
    }
    return result;
  }, [items]);

  const close = () => setOpen(false);

  const handleProvidedClick = (agent: AgentSpecialist) => {
    if (projectSpecialistIds.has(agent.id)) {
      onSelectAgent(agent.id);
    } else {
      onAddProvided(agent.id);
    }
    close();
  };

  const handleSavedClick = (
    specialist: AgentSpecialist,
    backpackItemId: string,
  ) => {
    onRecallSaved(specialist, backpackItemId);
    close();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <AppIconButton
          variant="secondary"
          tone="gray"
          size="xs"
          iconName="plus"
          className={styles.trigger}
          aria-label="Add agents to this project"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={dropdownStyles.content}
          align="end"
          side="top"
          sideOffset={6}
          style={{ "--app-dropdown-menu-width": "240px" } as CSSProperties}
        >
          <div
            className={`${dropdownStyles.menuSizeXs} ${styles.menu}`}
            role="menu"
            aria-label="Add agents"
          >
            {providedAgents.length > 0 ? (
              <>
                <p className={styles.sectionLabel}>Lab Agents</p>
                <div className={styles.scrollList}>
                  {providedAgents.map((agent) => (
                    <AgentMenuRow
                      key={agent.id}
                      specialist={agent}
                      added={projectSpecialistIds.has(agent.id)}
                      onClick={() => handleProvidedClick(agent)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {savedEntries.length > 0 ? (
              <>
                {providedAgents.length > 0 ? (
                  <div className={styles.menuDivider} role="separator" />
                ) : null}
                <p className={styles.sectionLabel}>My Agents</p>
                <div className={styles.scrollList}>
                  {savedEntries.map(({ itemId, specialist }) => (
                    <AgentMenuRow
                      key={itemId}
                      specialist={specialist}
                      added={activeSavedBackpackItemIds.has(itemId)}
                      onClick={() => handleSavedClick(specialist, itemId)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {providedAgents.length === 0 && savedEntries.length === 0 ? (
              <p className={styles.emptyHint}>
                No agents to add yet. Create one below.
              </p>
            ) : null}

            <div className={styles.menuDivider} role="separator" />
            <div className={styles.menuFooter}>
              <button
                type="button"
                role="menuitem"
                className={dropdownStyles.actionItem}
                onClick={() => {
                  onCreateNew();
                  close();
                }}
              >
                <span className={dropdownStyles.itemIcon} aria-hidden="true">
                  <FaIcon name="plus" size="xs" />
                </span>
                <span className={dropdownStyles.itemLabel}>Create new agent</span>
              </button>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
