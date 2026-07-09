import type { ComponentProps } from "react";
import { AppIconButton } from "../../ui/AppIconButton";
import { Tooltip } from "../../ui/Tooltip";
import { AiTutorIcon } from "../../ui/icons/AiTutorIcon";
import { FaIcon } from "../../ui/icons/FaIcon";
import type { SidebarProps, SidebarTab } from "./Sidebar.types";
import styles from "./Sidebar.module.scss";

type FaIconName = ComponentProps<typeof FaIcon>["name"];
type FaIconSize = ComponentProps<typeof FaIcon>["size"];

interface SidebarTabConfig {
  tab: SidebarTab;
  tooltip: string;
  iconName: FaIconName;
  iconSize?: FaIconSize;
  visible: boolean;
}

interface SidebarTabRailProps {
  collapsible: boolean;
  compact: boolean;
  isCollapsed: boolean;
  isSettingsOpen: boolean;
  showInstructionsTab: boolean;
  showValidationTab: boolean;
  showAiTutorTab: boolean;
  showHistoryTab: boolean;
  showBackpackTab: boolean;
  showTeacherResourcesTab: boolean;
  showRubricTab: boolean;
  showResourcesTab: boolean;
  showBuilderTab: boolean;
  showDevTab: boolean;
  devPanelHasOverrides?: boolean;
  showAiTutorTabNotification?: boolean;
  showAiTutorTabNotificationPulse?: boolean;
  annotations?: SidebarProps["annotations"];
  isTabActive: (tab: SidebarTab) => boolean;
  isTabDisabled: (tab: SidebarTab) => boolean;
  onSelectTab: (tab: SidebarTab) => void;
  onToggleCollapse: () => void;
  onToggleSettings: () => void;
}

function sidebarTabButtonClassName({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) {
  return [styles.tabButton, active ? styles.tabActive : "", disabled ? styles.tabDisabled : ""]
    .filter(Boolean)
    .join(" ");
}

function sidebarTabIconClassName(active: boolean) {
  return [styles.tabIcon, active ? styles.tabIconActive : ""]
    .filter(Boolean)
    .join(" ");
}

function sidebarRailClassName({
  collapsed,
  compact,
}: {
  collapsed: boolean;
  compact: boolean;
}) {
  return [
    styles.tabRail,
    compact ? styles.tabRailCompact : "",
    collapsed ? styles.tabRailCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function SidebarTabButton({
  tab,
  tooltip,
  iconName,
  iconSize = "l",
  active,
  disabled,
  showOverrideDot = false,
  showNotificationBadge = false,
  showNotificationBadgePulse = false,
  onSelectTab,
}: Omit<SidebarTabConfig, "visible"> & {
  active: boolean;
  disabled: boolean;
  showOverrideDot?: boolean;
  showNotificationBadge?: boolean;
  showNotificationBadgePulse?: boolean;
  onSelectTab: (tab: SidebarTab) => void;
}) {
  return (
    <Tooltip content={tooltip} position="right">
      <button
        type="button"
        onClick={() => onSelectTab(tab)}
        disabled={disabled}
        className={sidebarTabButtonClassName({ active, disabled })}
      >
        {tab === "ai-tutor" ? (
          <AiTutorIcon
            className={`${styles.tabIcon} ${styles.aiTutorTabIcon} ${
              active ? styles.tabIconActive : ""
            }`}
            color="currentColor"
          />
        ) : (
          <FaIcon
            name={iconName}
            size={iconSize}
            className={sidebarTabIconClassName(active)}
          />
        )}
        {active && (
          <>
            <div className={styles.tabActiveAccent} />
            <div className={styles.tabActiveMask} />
          </>
        )}
        {showOverrideDot && <span className={styles.devOverrideDot} />}
        {showNotificationBadge && (
          <span
            className={[
              styles.tabNotificationBadge,
              showNotificationBadgePulse ? styles.tabNotificationBadgePulsing : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            <span className={styles.tabNotificationDot} />
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export function SidebarTabRail({
  collapsible,
  compact,
  isCollapsed,
  isSettingsOpen,
  showInstructionsTab,
  showValidationTab,
  showAiTutorTab,
  showHistoryTab,
  showBackpackTab,
  showTeacherResourcesTab,
  showRubricTab,
  showResourcesTab,
  showBuilderTab,
  showDevTab,
  devPanelHasOverrides = false,
  showAiTutorTabNotification = false,
  showAiTutorTabNotificationPulse = false,
  annotations,
  isTabActive,
  isTabDisabled,
  onSelectTab,
  onToggleCollapse,
  onToggleSettings,
}: SidebarTabRailProps) {
  const tabs: SidebarTabConfig[] = [
    {
      tab: "instructions",
      tooltip: "Instructions",
      iconName: "circle-info",
      iconSize: "m",
      visible: showInstructionsTab,
    },
    {
      tab: "checklist",
      tooltip: "Validation",
      iconName: "clipboard-check",
      iconSize: "m",
      visible: showValidationTab,
    },
    {
      tab: "ai-tutor",
      tooltip: "AI Tutor",
      iconName: "comment",
      visible: showAiTutorTab,
    },
    {
      tab: "history",
      tooltip: "Version History",
      iconName: "clock-rotate-left",
      visible: showHistoryTab,
    },
    {
      tab: "backpack",
      tooltip: "Backpack",
      iconName: "backpack",
      visible: showBackpackTab,
    },
    {
      tab: "classroom",
      tooltip: "Teacher Resources",
      iconName: "person-chalkboard",
      visible: showTeacherResourcesTab,
    },
    {
      tab: "rubric",
      tooltip: "Rubric",
      iconName: "clipboard-list",
      visible: showRubricTab,
    },
    {
      tab: "resources",
      tooltip: "Resources",
      iconName: "compass",
      visible: showResourcesTab,
    },
    {
      tab: "builder-bank",
      tooltip: "Question bank",
      iconName: "clipboard-question",
      iconSize: "m",
      visible: showBuilderTab,
    },
    {
      tab: "builder-settings",
      tooltip: "Assessment settings",
      iconName: "wrench",
      iconSize: "m",
      visible: showBuilderTab,
    },
    {
      tab: "dev",
      tooltip: "Dev Panel",
      iconName: "pen-to-square",
      visible: showDevTab,
    },
  ];

  return (
    <div className={sidebarRailClassName({ collapsed: isCollapsed, compact })}>
      <div className={styles.railTopSpacer}>
        {collapsible && (
          <Tooltip
            content={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            position="right"
          >
            <button
              type="button"
              className={styles.railCollapseButton}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FaIcon
                name={
                  isCollapsed ? "arrow-right-from-line" : "arrow-left-from-line"
                }
                size="s"
                className={`${styles.tabIcon} ${styles.railCollapseIcon}`}
              />
            </button>
          </Tooltip>
        )}
      </div>

      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => {
          const active = isTabActive(tab.tab);

          return (
            <SidebarTabButton
              key={tab.tab}
              {...tab}
              active={active}
              disabled={isTabDisabled(tab.tab)}
              showOverrideDot={
                tab.tab === "dev" && devPanelHasOverrides && !active
              }
              showNotificationBadge={
                tab.tab === "ai-tutor" && showAiTutorTabNotification && !active
              }
              showNotificationBadgePulse={
                tab.tab === "ai-tutor" &&
                showAiTutorTabNotificationPulse &&
                showAiTutorTabNotification &&
                !active
              }
              onSelectTab={onSelectTab}
            />
          );
        })}

      <div className="flex-1" />

      <div className={styles.bottomButtons}>
        {annotations && (
          <>
            <Tooltip
              content={annotations.isActive ? "Exit annotation mode" : "Annotate"}
              position="right"
            >
              <AppIconButton
                variant={annotations.isActive ? "primary" : "tertiary"}
                tone={annotations.isActive ? "purple" : "gray"}
                size="xs"
                iconName="thumbtack"
                onClick={() => annotations.setIsActive(!annotations.isActive)}
                aria-label={
                  annotations.isActive
                    ? "Exit annotation mode"
                    : "Start annotation mode"
                }
              />
            </Tooltip>
            <div className={styles.bottomActionDivider} aria-hidden="true" />
          </>
        )}
        <Tooltip content="Settings" position="right">
          <AppIconButton
            variant="tertiary"
            tone="gray"
            size="xs"
            onClick={onToggleSettings}
            iconName="gear"
            aria-label="Settings"
            aria-pressed={isSettingsOpen}
          />
        </Tooltip>
        <div className={styles.bottomActionDivider} aria-hidden="true" />
        <div className={styles.bottomActionGroup}>
          <Tooltip content="AI Usage Disclaimer" position="right">
            <AppIconButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="triangle-exclamation"
              aria-label="AI Usage Disclaimer"
            />
          </Tooltip>
          <Tooltip content="Copyright" position="right">
            <AppIconButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="copyright"
              aria-label="Copyright"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
