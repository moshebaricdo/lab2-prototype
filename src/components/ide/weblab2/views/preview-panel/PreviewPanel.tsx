import { useState } from "react";
import { EmptyState } from "../../../shared/EmptyState";
import { FilePreviewFrame } from "./FilePreviewFrame";
import { PreviewToolbar } from "./PreviewToolbar";
import { ReactPreviewFrame } from "./ReactPreviewFrame";
import type { PreviewMode, WebLabPreviewConfig } from "./types";
import styles from "./PreviewPanel.module.scss";

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

  const renderControls = (isInFullscreen: boolean) => (
    <PreviewToolbar
      previewMode={previewMode}
      onPreviewModeChange={setPreviewMode}
      fileNavigation={fileNavigation}
      isFullscreen={isInFullscreen}
      onToggleFullscreen={isInFullscreen ? handleCloseFullscreen : () => setIsFullscreen(true)}
      onReload={() => setReloadKey((current) => current + 1)}
    />
  );

  const renderPreviewSurface = () => {
    if (!hasContent) {
      return (
        <EmptyState
          type="preview"
          heading="Nothing to preview"
          description="Your project preview will appear here once you've created or opened a page with content."
        />
      );
    }

    if (preview.kind === "file") {
      if (!preview.srcDoc) {
        return (
          <EmptyState
            type="preview"
            heading="Page not found"
            description="Choose an HTML file from this project to preview it."
          />
        );
      }

      return <FilePreviewFrame srcDoc={preview.srcDoc} reloadKey={reloadKey} />;
    }

    return <ReactPreviewFrame key={reloadKey}>{preview.content}</ReactPreviewFrame>;
  };

  const renderPreviewContent = () => (
    <div className={styles.previewBody}>
      <div className={styles.previewCenter}>
        <div
          className={`${styles.previewFrame} ${
            previewMode === "mobile" ? styles.mobileFrame : ""
          }`}
        >
          {renderPreviewSurface()}
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

