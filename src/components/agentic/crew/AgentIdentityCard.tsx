import * as Popover from "@radix-ui/react-popover";
import { useId, useState, type ReactNode } from "react";
import { AppTextArea, AppTextField } from "../../ui/AppTextField";
import { FaIcon } from "../../ui/icons/FaIcon";
import dropdownStyles from "../../ui/AppDropdown.module.scss";
import {
  AGENT_ACCENT_LABELS,
  AGENT_ACCENT_OPTIONS,
  CURATED_AGENT_ICON_OPTIONS,
} from "../../../lib/backpack/agentBackpack";
import type { FaIconName } from "../../../icons/faProRegularCodepoints";
import type { AgentAccent } from "../../../types/agentLab";
import styles from "./AgentIdentityCard.module.scss";

interface AgentIdentityCardProps {
  mode: "view" | "edit";
  role: string;
  tagline: string;
  icon: FaIconName;
  accent: AgentAccent;
  onRoleChange?: (value: string) => void;
  onTaglineChange?: (value: string) => void;
  onIconChange?: (value: FaIconName) => void;
  onAccentChange?: (value: AgentAccent) => void;
}

function iconLabel(icon: FaIconName): string {
  return (
    CURATED_AGENT_ICON_OPTIONS.find((option) => option.icon === icon)?.label ??
    icon
  );
}

function IdentityField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.fieldShell}>
      <label className={styles.fieldLabel} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function IdentityMenuField({
  label,
  ariaLabel,
  value,
  leftIcon,
  children,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  leftIcon?: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <IdentityField label={label}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={[
              dropdownStyles.field,
              dropdownStyles.toneGray,
              dropdownStyles.fullWidth,
              open ? dropdownStyles.fieldOpen : "",
              styles.menuField,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className={dropdownStyles.fieldLabel}>
              {leftIcon ? (
                <span className={dropdownStyles.fieldIcon} aria-hidden="true">
                  {leftIcon}
                </span>
              ) : null}
              <span className={dropdownStyles.fieldLabelText}>{value}</span>
            </span>
            <FaIcon
              name={open ? "chevron-up" : "chevron-down"}
              size="s"
              className={dropdownStyles.chevron}
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={dropdownStyles.content}
            align="end"
            side="bottom"
            sideOffset={4}
          >
            <div
              className={[
                dropdownStyles.actionMenu,
                dropdownStyles.menuSizeS,
                styles.menuList,
              ]
                .filter(Boolean)
                .join(" ")}
              role="menu"
            >
              {children(() => setOpen(false))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </IdentityField>
  );
}

function MenuOption({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={[
        dropdownStyles.actionItem,
        selected ? dropdownStyles.checkedItem : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-dropdown-focusable="true"
      onClick={onSelect}
    >
      {icon ? (
        <span className={dropdownStyles.itemIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={dropdownStyles.itemLabel}>{label}</span>
      {selected ? (
        <FaIcon name="check" size="xs" className={styles.menuItemCheck} />
      ) : null}
    </button>
  );
}

/**
 * Condensed agent identity — name, description, icon, and accent.
 */
export function AgentIdentityCard({
  mode,
  role,
  tagline,
  icon,
  accent,
  onRoleChange,
  onTaglineChange,
  onIconChange,
  onAccentChange,
}: AgentIdentityCardProps) {
  const nameFieldId = useId();
  const descriptionFieldId = useId();

  if (mode === "view") {
    return (
      <div className={styles.viewBody}>
        <div className={styles.viewAvatar} data-accent={accent} aria-hidden="true">
          <FaIcon name={icon} size="inherit" />
        </div>
        <div className={styles.viewText}>
          <p className={styles.viewName}>{role}</p>
          {tagline ? <p className={styles.viewDescription}>{tagline}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editBody}>
      <div className={styles.topRow}>
        <IdentityField label="Name" htmlFor={nameFieldId}>
          <AppTextField
            id={nameFieldId}
            value={role}
            onChange={(event) => onRoleChange?.(event.target.value)}
            placeholder="e.g. Style helper"
            size="s"
            tone="gray"
            fullWidth
            controlClassName={styles.identityControl}
            aria-label="Agent name"
          />
        </IdentityField>

        <IdentityMenuField
          label="Color"
          ariaLabel="Agent color"
          value={AGENT_ACCENT_LABELS[accent]}
          leftIcon={<span className={styles.accentDot} data-accent={accent} />}
        >
          {(close) =>
            AGENT_ACCENT_OPTIONS.map((option) => (
              <MenuOption
                key={option}
                label={AGENT_ACCENT_LABELS[option]}
                icon={<span className={styles.accentDot} data-accent={option} />}
                selected={option === accent}
                onSelect={() => {
                  onAccentChange?.(option);
                  close();
                }}
              />
            ))
          }
        </IdentityMenuField>

        <IdentityMenuField
          label="Icon"
          ariaLabel="Agent icon"
          value={iconLabel(icon)}
          leftIcon={<FaIcon name={icon} size="xs" />}
        >
          {(close) =>
            CURATED_AGENT_ICON_OPTIONS.map((option) => (
              <MenuOption
                key={option.icon}
                label={option.label}
                icon={<FaIcon name={option.icon} size="xs" />}
                selected={option.icon === icon}
                onSelect={() => {
                  onIconChange?.(option.icon);
                  close();
                }}
              />
            ))
          }
        </IdentityMenuField>
      </div>

      <IdentityField label="Description" htmlFor={descriptionFieldId}>
        <AppTextArea
          id={descriptionFieldId}
          rows={2}
          value={tagline}
          onChange={(event) => onTaglineChange?.(event.target.value)}
          size="s"
          tone="gray"
          fullWidth
          placeholder="One line on what this agent does."
          aria-label="Agent description"
        />
      </IdentityField>
    </div>
  );
}
