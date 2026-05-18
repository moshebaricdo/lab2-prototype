import type { ComponentProps } from "react";
import { AppButton } from "../../ui/AppButton";
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
  showTeacherResourcesTab: boolean;
  showRubricTab: boolean;
  showResourcesTab: boolean;
  showDevTab: boolean;
  devPanelHasOverrides?: boolean;
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
  onSelectTab,
}: Omit<SidebarTabConfig, "visible"> & {
  active: boolean;
  disabled: boolean;
  showOverrideDot?: boolean;
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
  showTeacherResourcesTab,
  showRubricTab,
  showResourcesTab,
  showDevTab,
  devPanelHasOverrides = false,
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
              <AppButton
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
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            onClick={onToggleSettings}
            iconName="gear"
            aria-pressed={isSettingsOpen}
          />
        </Tooltip>
        <div className={styles.bottomActionDivider} aria-hidden="true" />
        <div className={styles.bottomActionGroup}>
          <Tooltip content="AI Usage Disclaimer" position="right">
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="triangle-exclamation"
            />
          </Tooltip>
          <Tooltip content="Copyright" position="right">
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="copyright"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
