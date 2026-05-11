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
import {
  useLevelShareMode,
  type ShareModeConfig,
} from "../../hooks/useLevelShareMode";
import { AnnotationOverlay } from "./dev/AnnotationOverlay";
import { Dialog } from "../ui/Dialog";
import { AppButton } from "../ui/AppButton";
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
  const annotationsResult = useAnnotations();
  const urlShareMode = useLevelShareMode();
  const shareModeConfig = props.shareModeConfig ?? { mode: urlShareMode };
  const shareMode = shareModeConfig.mode;
  const isShareMode = shareMode !== "off";
  const isLockedShareMode = shareMode === "locked";
  const isFlowShareMode = shareMode === "flow";
  const flowCompletion = shareModeConfig.flowCompletion;
  const [isFlowCompletionOpen, setIsFlowCompletionOpen] = useState(false);

  const shouldShowTopNavigationContinue =
    isLockedShareMode
      ? false
      : isFlowShareMode
        ? Boolean(topNavigationProps?.showContinueButton && flowCompletion)
        : topNavigationProps?.showContinueButton;
  const resolvedTopNavigationProps = {
    ...topNavigationProps,
    disableLogoLink: isShareMode || topNavigationProps?.disableLogoLink,
    hideProgression: isLockedShareMode || topNavigationProps?.hideProgression,
    disableProgressionLinks:
      isFlowShareMode || topNavigationProps?.disableProgressionLinks,
    showContinueButton: shouldShowTopNavigationContinue,
    onContinue:
      isFlowShareMode && shouldShowTopNavigationContinue
        ? () => setIsFlowCompletionOpen(true)
        : topNavigationProps?.onContinue,
  };
  const flowCompletionDialog = (
    <Dialog
      open={isFlowCompletionOpen}
      onClose={() => setIsFlowCompletionOpen(false)}
      title={flowCompletion?.title ?? "Task complete"}
      footer={
        <AppButton
          variant="primary"
          tone="purple"
          size="s"
          onClick={() => setIsFlowCompletionOpen(false)}
        >
          {flowCompletion?.buttonLabel ?? "Close"}
        </AppButton>
      }
    >
      <p>
        {flowCompletion?.message ??
          "Thanks, you have completed this shared level."}
      </p>
    </Dialog>
  );

  if (props.hideResourcePanel === true) {
    return (
      <div className={styles.root}>
        <TopNavigation {...resolvedTopNavigationProps} />
        <div className={styles.body}>
          {children}
        </div>
        {!isShareMode && <AnnotationOverlay annotations={annotationsResult} />}
        {flowCompletionDialog}
      </div>
    );
  }

  const { onResize } = props;
  const sidebarProps = isShareMode
    ? {
        ...props.sidebarProps,
        showContinueButton: isLockedShareMode
          ? false
          : isFlowShareMode
            ? Boolean(flowCompletion && props.sidebarProps.showContinueButton !== false)
            : props.sidebarProps.showContinueButton,
        onContinue:
          isFlowShareMode && flowCompletion
            ? () => setIsFlowCompletionOpen(true)
            : props.sidebarProps.onContinue,
        devPanelFields: undefined,
        devPanelOverrideResult: undefined,
        devPanelSessionValues: undefined,
        onDevPanelSessionValueChange: undefined,
        onDevPanelSessionValueReset: undefined,
      }
    : props.sidebarProps;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    Boolean(
      sidebarProps.collapsible &&
        (sidebarProps.defaultCollapsed ?? sidebarProps.collapsible),
    ),
  );
  const resizeDisabled =
    (Boolean(sidebarProps.collapsible) && sidebarCollapsed) ||
    sidebarProps.surfaceVariant === "card";

  return (
    <div
      className={[
        styles.root,
        sidebarProps.surfaceVariant === "card" ? styles.rootFloatingSurface : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TopNavigation {...resolvedTopNavigationProps} />
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
      {!isShareMode && <AnnotationOverlay annotations={annotationsResult} />}
      {flowCompletionDialog}
    </div>
  );
}
