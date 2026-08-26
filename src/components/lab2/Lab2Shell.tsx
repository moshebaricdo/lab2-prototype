import type { ReactNode } from "react";
import { useState } from "react";
import {
  Sidebar,
  type SidebarProps,
} from "./resource-panel";
import {
  TopNavigation,
  type TopNavigationProps,
} from "../ui/header/TopNavigation";
import { ResizableHandle } from "../ui/ResizableHandle";
import { useAnnotations } from "../../hooks/useAnnotations";
import { useTheme } from "../../hooks/useTheme";
import {
  allowsLockedProgressionNavigation,
  isLockedShareMode,
  useLevelShareMode,
  type ShareModeConfig,
} from "../../hooks/useLevelShareMode";
import {
  isProgressionLevelLinks,
  mapLevelLinksWithShareMode,
} from "../../lib/levelShareLinks";
import { Dialog } from "@moshebaricdo/cads-react";
import { AnnotationOverlay } from "./dev/AnnotationOverlay";
import { BackpackProvider } from "../../hooks/BackpackContext";
import { BackpackSeedEffect } from "./BackpackSeedEffect";
import { BackpackSaveToasts } from "./BackpackSaveToasts";
import { CadsLabProvider } from "./CadsLabProvider";
import styles from "./Lab2Shell.module.scss";

type Lab2ShellProps =
  | {
      children: ReactNode;
      topNavigationProps?: TopNavigationProps;
      /** Hides prototype-authoring chrome while preserving the level UI. */
      shareModeConfig?: ShareModeConfig;
      /** No resource panel (e.g. bubble choice levels). */
      hideResourcePanel: true;
    }
  | {
      children: ReactNode;
      onResize: (delta: number) => void;
      sidebarProps: SidebarProps;
      topNavigationProps?: TopNavigationProps;
      /** Hides prototype-authoring chrome while preserving the level UI. */
      shareModeConfig?: ShareModeConfig;
      hideResourcePanel?: false;
    };

export function Lab2Shell(props: Lab2ShellProps) {
  const { children, topNavigationProps } = props;
  const { theme } = useTheme();
  const annotationsResult = useAnnotations();
  const urlShareMode = useLevelShareMode();
  const shareModeConfig = props.shareModeConfig ?? { mode: urlShareMode };
  const shareMode = shareModeConfig.mode;
  const isShareMode = shareMode !== "off";
  const isLockedShareModeActive = isLockedShareMode(shareMode);
  const isFlowShareMode = shareMode === "flow";
  const flowCompletion = shareModeConfig.flowCompletion;
  const [isFlowCompletionOpen, setIsFlowCompletionOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    props.hideResourcePanel === true
      ? false
      : Boolean(
          props.sidebarProps.collapsible &&
            (props.sidebarProps.defaultCollapsed ?? props.sidebarProps.collapsible),
        ),
  );

  const hasProgressionLevelLinks = isProgressionLevelLinks(
    topNavigationProps?.levelLinks,
  );
  const allowLockedShareProgressionNavigation = allowsLockedProgressionNavigation(
    shareMode,
    hasProgressionLevelLinks,
  );
  const resolveFlowContinueHandler = (onContinue?: () => void) => {
    if (!isFlowShareMode) return onContinue;
    return () => {
      if (onContinue) {
        onContinue();
        return;
      }
      setIsFlowCompletionOpen(true);
    };
  };
  const shouldShowTopNavigationContinue = isLockedShareModeActive
    ? false
    : topNavigationProps?.showContinueButton;
  const sharedProgressionLevelLinks =
    hasProgressionLevelLinks && topNavigationProps?.levelLinks
      ? isFlowShareMode
        ? mapLevelLinksWithShareMode(topNavigationProps.levelLinks, "flow")
        : allowLockedShareProgressionNavigation
          ? mapLevelLinksWithShareMode(
              topNavigationProps.levelLinks,
              shareMode === "locked-progression" ? "locked-progression" : "locked",
            )
          : topNavigationProps.levelLinks
      : topNavigationProps?.levelLinks;
  const resolvedTopNavigationProps = {
    ...topNavigationProps,
    levelLinks: sharedProgressionLevelLinks,
    disableLogoLink: isShareMode || topNavigationProps?.disableLogoLink,
    hideProgression:
      (isLockedShareModeActive && !allowLockedShareProgressionNavigation) ||
      topNavigationProps?.hideProgression,
    disableProgressionLinks: topNavigationProps?.disableProgressionLinks,
    showContinueButton: shouldShowTopNavigationContinue,
    onContinue: resolveFlowContinueHandler(topNavigationProps?.onContinue),
  };
  const flowCompletionDialog = (
    <Dialog
      open={isFlowCompletionOpen}
      onClose={() => setIsFlowCompletionOpen(false)}
      title={flowCompletion?.title ?? "Task complete"}
      description={
        flowCompletion?.message ??
        "Thanks, you have completed this shared level."
      }
      primaryActionLabel={flowCompletion?.buttonLabel ?? "Close"}
      onPrimaryAction={() => setIsFlowCompletionOpen(false)}
      hasSecondaryAction={false}
    />
  );
  const themeScopeClassName = [
    styles.themeScope,
    theme === "dark" ? "dark" : "",
    props.hideResourcePanel !== true &&
    props.sidebarProps.surfaceVariant === "card"
      ? styles.themeScopeFloatingSurface
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (props.hideResourcePanel === true) {
    return (
      <CadsLabProvider>
        <div className={styles.root}>
          <TopNavigation {...resolvedTopNavigationProps} />
          <div className={themeScopeClassName} data-theme={theme}>
            <div className={styles.body}>{children}</div>
            {!isShareMode && (
              <AnnotationOverlay annotations={annotationsResult} />
            )}
            {flowCompletionDialog}
          </div>
        </div>
      </CadsLabProvider>
    );
  }

  const { onResize } = props;
  const sidebarProps = isShareMode
    ? {
        ...props.sidebarProps,
        showContinueButton: isLockedShareModeActive
          ? false
          : props.sidebarProps.showContinueButton,
        onContinue: resolveFlowContinueHandler(props.sidebarProps.onContinue),
        devPanelFields: undefined,
        devPanelOverrideResult: undefined,
        devPanelSessionValues: undefined,
        onDevPanelSessionValueChange: undefined,
        onDevPanelSessionValueReset: undefined,
      }
    : props.sidebarProps;
  const resizeDisabled =
    (Boolean(sidebarProps.collapsible) && sidebarCollapsed) ||
    sidebarProps.surfaceVariant === "card";

  return (
    <CadsLabProvider>
      <BackpackProvider>
        <BackpackSeedEffect
          items={sidebarProps.backpackSeedItemsIfEmpty}
          ensureItems={sidebarProps.backpackEnsureSeedItems}
        />
        <BackpackSaveToasts />
        <div className={styles.root}>
          <TopNavigation {...resolvedTopNavigationProps} />
          <div className={themeScopeClassName} data-theme={theme}>
            <div className={styles.body}>
              <Sidebar
                {...sidebarProps}
                annotations={isShareMode ? undefined : annotationsResult}
                onCollapsedChange={(collapsed) => {
                  setSidebarCollapsed(collapsed);
                  sidebarProps.onCollapsedChange?.(collapsed);
                }}
              />
              {!resizeDisabled && <ResizableHandle onResize={onResize} />}
              {children}
            </div>
            {!isShareMode && (
              <AnnotationOverlay annotations={annotationsResult} />
            )}
            {flowCompletionDialog}
          </div>
        </div>
      </BackpackProvider>
    </CadsLabProvider>
  );
}
