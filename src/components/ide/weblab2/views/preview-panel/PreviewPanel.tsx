import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import emptyStatePreview from "../../../../../assets/empty-states/empty-state-preview.svg";
import { ResizableHandle } from "../../../../ui/ResizableHandle";
import { EmptyState } from "../../../shared/EmptyState";
import { DesignInspectorPanel } from "./DesignInspectorPanel";
import { FilePreviewFrame, type LivePreviewDesignEdit } from "./FilePreviewFrame";
import { PreviewToolbar } from "./PreviewToolbar";
import { ReactPreviewFrame } from "./ReactPreviewFrame";
import type {
  PreviewDesignElementDescriptor,
  PreviewDesignStylePatch,
  PreviewMode,
  WebLabPreviewConfig,
} from "./types";
import styles from "./PreviewPanel.module.scss";

const DEFAULT_MOBILE_PREVIEW_WIDTH = 375;
const MIN_MOBILE_PREVIEW_WIDTH = 240;
const FLOATING_TOOLBAR_EDGE_THRESHOLD = 260;
const FLOATING_TOOLBAR_ESTIMATED_HEIGHT = 56;
const FLOATING_TOOLBAR_MORPHED_ESTIMATED_HEIGHT = 180;
const FLOATING_TOOLBAR_MARGIN = 12;

interface PreviewPanelProps {
  hasContent?: boolean;
  preview: WebLabPreviewConfig;
}

export function PreviewPanel({
  hasContent = true,
  preview,
}: PreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [designModeSweepKey, setDesignModeSweepKey] = useState(0);
  const [liveDesignEdit, setLiveDesignEdit] = useState<LivePreviewDesignEdit | null>(null);
  const [isDesignToolbarMorphed, setIsDesignToolbarMorphed] = useState(false);
  const [designToolbarHeight, setDesignToolbarHeight] = useState(0);
  const [selectedElement, setSelectedElement] =
    useState<PreviewDesignElementDescriptor | null>(null);
  const [mobilePreviewWidth, setMobilePreviewWidth] = useState(
    DEFAULT_MOBILE_PREVIEW_WIDTH,
  );
  const previewCenterRef = useRef<HTMLDivElement>(null);
  const isPreviewEmpty = !hasContent || (preview.kind === "file" && !preview.srcDoc);
  const showDesignTools =
    preview.kind === "file" ? preview.showDesignTools ?? true : false;
  const supportsDesignMode =
    showDesignTools && preview.kind === "file" && Boolean(preview.srcDoc);
  const designModeDisabled =
    isPreviewEmpty ||
    !supportsDesignMode ||
    (preview.kind === "file" && Boolean(preview.designModeDisabled));
  const canEditDesign =
    showDesignTools &&
    preview.kind === "file" &&
    Boolean(preview.canEditDesign && preview.onApplyDesignEdit);
  const designDisabledReason =
    preview.kind === "file" ? preview.designDisabledReason : "Design mode is available for file previews.";

  const getAvailablePreviewWidth = useCallback(
    () =>
      previewCenterRef.current?.getBoundingClientRect().width ??
      DEFAULT_MOBILE_PREVIEW_WIDTH,
    [],
  );

  const clampMobilePreviewWidth = useCallback((width: number) => {
    const availableWidth = getAvailablePreviewWidth();
    return Math.max(
      Math.min(MIN_MOBILE_PREVIEW_WIDTH, availableWidth),
      Math.min(width, availableWidth),
    );
  }, [getAvailablePreviewWidth]);

  useEffect(() => {
    if (previewMode !== "mobile") return undefined;

    const handleWindowResize = () => {
      setMobilePreviewWidth((current) => clampMobilePreviewWidth(current));
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [clampMobilePreviewWidth, previewMode]);

  useEffect(() => {
    if (!designModeDisabled) return;
    setIsDesignMode(false);
    setSelectedElement(null);
    setIsDesignToolbarMorphed(false);
  }, [designModeDisabled]);

  useEffect(() => {
    if (!isDesignMode) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsDesignToolbarMorphed(false);
      if (selectedElement) {
        setSelectedElement(null);
        return;
      }
      setIsDesignMode(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesignMode, selectedElement]);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: unknown;
        element?: PreviewDesignElementDescriptor;
      } | null;
      if (!data || typeof data.type !== "string") return;

      if (data.type === "weblab-preview:element-hover") {
        return;
      }

      if (data.type === "weblab-preview:element-select") {
        if (isDesignMode && data.element) {
          setSelectedElement((current) => {
            const currentKey = current?.selectionSelector ?? current?.selector;
            const nextKey = data.element?.selectionSelector ?? data.element?.selector;

            if (current && currentKey && currentKey === nextKey) {
              return {
                ...data.element,
                // Keep the toolbar anchored to the first-click geometry while
                // live style edits update computed styles and selected overlays.
                rect: current.rect,
              };
            }

            return data.element ?? current;
          });
        }
        return;
      }

      if (data.type === "weblab-preview:element-clear") {
        setSelectedElement(null);
        setIsDesignToolbarMorphed(false);
        return;
      }

      if (data.type === "weblab-preview:design-escape") {
        setIsDesignMode(false);
        setSelectedElement(null);
        setIsDesignToolbarMorphed(false);
      }
    };

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, [isDesignMode]);

  const resizeMobilePreview = useCallback(
    (edge: "left" | "right", delta: number) => {
      setMobilePreviewWidth((currentWidth) => {
        // The mobile frame is centered, so width changes move each edge by half.
        // Double the drag delta to keep the active handle under the cursor.
        const centeredDelta = delta * 2;
        const nextWidth =
          edge === "left"
            ? currentWidth - centeredDelta
            : currentWidth + centeredDelta;
        const clampedWidth = clampMobilePreviewWidth(nextWidth);
        const availableWidth = getAvailablePreviewWidth();

        if (clampedWidth >= availableWidth - 1) {
          setPreviewMode("desktop");
        }

        return clampedWidth;
      });
    },
    [clampMobilePreviewWidth, getAvailablePreviewWidth],
  );

  const handlePreviewModeChange = useCallback(
    (mode: PreviewMode) => {
      if (mode === "mobile") {
        setMobilePreviewWidth(
          clampMobilePreviewWidth(DEFAULT_MOBILE_PREVIEW_WIDTH),
        );
      }
      setPreviewMode(mode);
    },
    [clampMobilePreviewWidth],
  );

  const handleCloseFullscreen = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFullscreen(false);
      setIsClosing(false);
    }, 200);
  };

  const fileNavigation =
    preview.kind === "file"
      ? {
          path: preview.path,
          htmlFiles: preview.htmlFiles,
          onPathChange: preview.onPathChange,
        }
      : undefined;

  const handleToggleDesignMode = () => {
    if (designModeDisabled) return;
    setIsDesignMode((current) => {
      if (current) {
        setSelectedElement(null);
        setIsDesignToolbarMorphed(false);
      } else {
        setDesignModeSweepKey((key) => key + 1);
      }
      return !current;
    });
  };

  const handleApplyDesignStyle = (styles: PreviewDesignStylePatch) => {
    if (preview.kind !== "file" || !selectedElement?.selector) return;
    setLiveDesignEdit((current) => ({
      serial: (current?.serial ?? 0) + 1,
      targetSelector: selectedElement.selector,
      styles,
    }));
    preview.onApplyDesignEdit?.({
      targetSelector: selectedElement.selector,
      elementId: selectedElement.id || undefined,
      styles,
    });
    setSelectedElement((current) =>
      current
        ? {
            ...current,
            computedStyles: {
              ...current.computedStyles,
              ...styles,
            },
          }
        : current,
    );
  };

  const handleResetDesignStyles = () => {
    if (preview.kind !== "file" || !selectedElement?.selector) return;
    setLiveDesignEdit((current) => ({
      serial: (current?.serial ?? 0) + 1,
      targetSelector: selectedElement.selector,
      styles: {},
      reset: true,
    }));
    preview.onApplyDesignEdit?.({
      targetSelector: selectedElement.selector,
      elementId: selectedElement.id || undefined,
      styles: {},
      reset: true,
    });
  };

  const handleAddPreviewElementToTutor = (element: PreviewDesignElementDescriptor) => {
    if (preview.kind !== "file") return;
    preview.onAddPreviewElementToTutor?.(element);
  };

  const getFloatingToolbarStyle = (): CSSProperties | undefined => {
    if (!selectedElement) return undefined;
    const previewRect = previewCenterRef.current?.getBoundingClientRect();
    const availableWidth = previewRect?.width ?? DEFAULT_MOBILE_PREVIEW_WIDTH;
    const availableHeight =
      previewRect?.height ?? Math.max(selectedElement.rect.bottom + FLOATING_TOOLBAR_ESTIMATED_HEIGHT, 240);
    const estimatedToolbarHeight = isDesignToolbarMorphed
      ? FLOATING_TOOLBAR_MORPHED_ESTIMATED_HEIGHT
      : FLOATING_TOOLBAR_ESTIMATED_HEIGHT;
    const toolbarHeight = Math.max(designToolbarHeight || estimatedToolbarHeight, FLOATING_TOOLBAR_ESTIMATED_HEIGHT);
    const maxToolbarHeight = Math.max(120, availableHeight - FLOATING_TOOLBAR_MARGIN * 2);
    const centerX = selectedElement.rect.left + selectedElement.rect.width / 2;
    const preferredBelowTop = selectedElement.rect.bottom + 10;
    const primaryBelowBottom = preferredBelowTop + FLOATING_TOOLBAR_ESTIMATED_HEIGHT;
    const hasRoomForPrimaryBelow =
      availableHeight - selectedElement.rect.bottom >= FLOATING_TOOLBAR_ESTIMATED_HEIGHT + FLOATING_TOOLBAR_MARGIN * 2;
    const hasRoomAbove =
      selectedElement.rect.top >= toolbarHeight + FLOATING_TOOLBAR_MARGIN * 2;
    const hasRoomBelow =
      availableHeight - selectedElement.rect.bottom >= toolbarHeight + FLOATING_TOOLBAR_MARGIN * 2;
    const shouldAnchorFromBottomEdge =
      isDesignToolbarMorphed && hasRoomForPrimaryBelow && !hasRoomBelow;
    const shouldPlaceBelow = hasRoomBelow || (!hasRoomAbove && !shouldAnchorFromBottomEdge);
    const verticalStyle = shouldAnchorFromBottomEdge
      ? {
          bottom: Math.max(
            FLOATING_TOOLBAR_MARGIN,
            availableHeight - Math.min(primaryBelowBottom, availableHeight - FLOATING_TOOLBAR_MARGIN),
          ),
          maxHeight: maxToolbarHeight,
        }
      : shouldPlaceBelow
        ? {
            top: Math.min(
              preferredBelowTop,
              availableHeight - toolbarHeight - FLOATING_TOOLBAR_MARGIN,
            ),
            maxHeight: maxToolbarHeight,
          }
        : {
            bottom: Math.max(FLOATING_TOOLBAR_MARGIN, availableHeight - selectedElement.rect.top + 10),
            maxHeight: maxToolbarHeight,
          };

    if (centerX < FLOATING_TOOLBAR_EDGE_THRESHOLD) {
      return { left: FLOATING_TOOLBAR_MARGIN, ...verticalStyle };
    }

    if (availableWidth - centerX < FLOATING_TOOLBAR_EDGE_THRESHOLD) {
      return { right: FLOATING_TOOLBAR_MARGIN, ...verticalStyle };
    }

    return { left: centerX, ...verticalStyle, transform: "translateX(-50%)" };
  };

  const getFloatingToolbarPopupPlacement = () => {
    if (!selectedElement) return "below" as const;
    const previewRect = previewCenterRef.current?.getBoundingClientRect();
    const availableHeight =
      previewRect?.height ?? Math.max(selectedElement.rect.bottom + FLOATING_TOOLBAR_ESTIMATED_HEIGHT, 240);
    const estimatedToolbarHeight = isDesignToolbarMorphed
      ? FLOATING_TOOLBAR_MORPHED_ESTIMATED_HEIGHT
      : FLOATING_TOOLBAR_ESTIMATED_HEIGHT;
    const hasRoomAbove =
      selectedElement.rect.top >= estimatedToolbarHeight + FLOATING_TOOLBAR_MARGIN * 2;
    const hasRoomBelow =
      availableHeight - selectedElement.rect.bottom >= estimatedToolbarHeight + FLOATING_TOOLBAR_MARGIN * 2;
    return hasRoomBelow || !hasRoomAbove ? "below" : "above";
  };

  const renderControls = (isInFullscreen: boolean) => (
    <PreviewToolbar
      previewMode={previewMode}
      onPreviewModeChange={handlePreviewModeChange}
      fileNavigation={fileNavigation}
      isDesignMode={isDesignMode}
      onToggleDesignMode={handleToggleDesignMode}
      showDesignModeControl={showDesignTools}
      designModeDisabled={designModeDisabled}
      designModeDisabledReason={designDisabledReason}
      suppressDesignModeTooltip={isPreviewEmpty}
      previewModeDisabled={isPreviewEmpty}
      isFullscreen={isInFullscreen}
      onToggleFullscreen={
        isInFullscreen ? handleCloseFullscreen : () => setIsFullscreen(true)
      }
      onReload={() => setReloadKey((current) => current + 1)}
    />
  );

  const renderPreviewEmptyState = (description: string) => (
    <div className={styles.previewEmptyStateOffset}>
      <EmptyState
        type="preview"
        heading="Nothing to preview"
        description={description}
        imageSrc={emptyStatePreview}
      />
    </div>
  );

  const renderPreviewSurface = () => {
    if (!hasContent) {
      return renderPreviewEmptyState(
        "Your project preview will appear here once you've created or opened a page with content.",
      );
    }

    if (preview.kind === "file") {
      if (!preview.srcDoc) {
        return renderPreviewEmptyState(
          "Create an HTML file in this project to preview it here.",
        );
      }

      return (
        <FilePreviewFrame
          srcDoc={preview.srcDoc}
          reloadKey={reloadKey}
          designModeActive={isDesignMode}
          selectedSelector={selectedElement?.selectionSelector ?? selectedElement?.selector ?? ""}
          liveDesignEdit={liveDesignEdit}
        />
      );
    }

    return <ReactPreviewFrame key={reloadKey}>{preview.content}</ReactPreviewFrame>;
  };

  const renderPreviewContent = () => (
    <div className={styles.previewBody}>
      <div className={styles.previewCenter} ref={previewCenterRef}>
        <div
          className={`${styles.previewFrame} ${
            previewMode === "mobile" ? styles.mobileFrame : ""
          } ${
            isPreviewEmpty ? styles.previewFrameEmpty : ""
          }`}
          style={
            previewMode === "mobile"
              ? { width: `${mobilePreviewWidth}px` }
              : undefined
          }
        >
          {previewMode === "mobile" ? (
            <ResizableHandle
              className={styles.mobileResizeHandleLeft}
              onResize={(delta) => resizeMobilePreview("left", delta)}
            />
          ) : null}
          {renderPreviewSurface()}
          {showDesignTools && isDesignMode && preview.kind === "file" ? (
            <div
              key={designModeSweepKey}
              className={styles.designModeSweep}
              aria-hidden
            />
          ) : null}
          {showDesignTools && preview.kind === "file" ? (
            <DesignInspectorPanel
              isActive={isDesignMode}
              selectedElement={selectedElement}
              style={getFloatingToolbarStyle()}
              popupPlacement={getFloatingToolbarPopupPlacement()}
              canEdit={canEditDesign}
              disabledReason={preview.designDisabledReason}
              onApplyStyle={handleApplyDesignStyle}
              onResetStyles={handleResetDesignStyles}
              onMorphStateChange={setIsDesignToolbarMorphed}
              onHeightChange={setDesignToolbarHeight}
              onAddToTutor={handleAddPreviewElementToTutor}
              onClearSelection={() => setSelectedElement(null)}
            />
          ) : null}
          {previewMode === "mobile" ? (
            <ResizableHandle
              className={styles.mobileResizeHandleRight}
              onResize={(delta) => resizeMobilePreview("right", delta)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.root}>
        {renderControls(false)}
        {renderPreviewContent()}
      </div>

      {isFullscreen ? (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${isClosing ? styles.scaleDown : styles.scaleUp}`}>
            {renderControls(true)}
            {renderPreviewContent()}
          </div>
        </div>
      ) : null}
    </>
  );
}

