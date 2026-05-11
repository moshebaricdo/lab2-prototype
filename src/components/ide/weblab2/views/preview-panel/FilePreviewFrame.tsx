import { useCallback, useEffect, useRef, useState } from "react";
import type { PreviewDesignStylePatch } from "./types";
import styles from "./PreviewPanel.module.scss";

const PREVIEW_IFRAME_SANDBOX = "allow-scripts allow-forms";
const PREVIEW_DEBUG_CONTROL_MESSAGE_TYPE = "weblab-preview:debug-control";

export interface LivePreviewDesignEdit {
  serial: number;
  targetSelector: string;
  styles: PreviewDesignStylePatch;
  reset?: boolean;
}

interface FilePreviewFrameProps {
  srcDoc: string;
  reloadKey: number;
  designModeActive?: boolean;
  selectedSelector?: string;
  liveDesignEdit?: LivePreviewDesignEdit | null;
  networkBlocked?: boolean;
}

export function FilePreviewFrame({
  srcDoc,
  reloadKey,
  designModeActive = false,
  selectedSelector = "",
  liveDesignEdit = null,
  networkBlocked = false,
}: FilePreviewFrameProps) {
  const visibleIframeRef = useRef<HTMLIFrameElement>(null);
  const loadingIframeRef = useRef<HTMLIFrameElement>(null);
  const suppressedDesignEditSerialRef = useRef<number | null>(null);
  const [visibleSrcDoc, setVisibleSrcDoc] = useState(srcDoc);
  const [loadingSrcDoc, setLoadingSrcDoc] = useState<string | null>(null);

  const postDesignModeState = useCallback((iframe: HTMLIFrameElement | null) => {
    iframe?.contentWindow?.postMessage({
      type: "weblab-preview:design-mode",
      active: designModeActive,
      selectedSelector,
    }, "*");
  }, [designModeActive, selectedSelector]);

  const postDebugControlState = useCallback((iframe: HTMLIFrameElement | null) => {
    iframe?.contentWindow?.postMessage({
      type: PREVIEW_DEBUG_CONTROL_MESSAGE_TYPE,
      networkBlocked,
    }, "*");
  }, [networkBlocked]);

  useEffect(() => {
    if (srcDoc === visibleSrcDoc || srcDoc === loadingSrcDoc) return;
    if (
      designModeActive &&
      liveDesignEdit &&
      !liveDesignEdit.reset &&
      suppressedDesignEditSerialRef.current !== liveDesignEdit.serial
    ) {
      suppressedDesignEditSerialRef.current = liveDesignEdit.serial;
      return;
    }
    setLoadingSrcDoc(srcDoc);
  }, [designModeActive, liveDesignEdit, loadingSrcDoc, srcDoc, visibleSrcDoc]);

  useEffect(() => {
    postDesignModeState(visibleIframeRef.current);
    postDesignModeState(loadingIframeRef.current);
    postDebugControlState(visibleIframeRef.current);
    postDebugControlState(loadingIframeRef.current);
  }, [postDebugControlState, postDesignModeState, visibleSrcDoc, loadingSrcDoc, reloadKey]);

  useEffect(() => {
    postDebugControlState(visibleIframeRef.current);
    postDebugControlState(loadingIframeRef.current);
  }, [postDebugControlState]);

  useEffect(() => {
    if (!liveDesignEdit) return;
    const message = {
      type: "weblab-preview:apply-design-edit",
      targetSelector: liveDesignEdit.targetSelector,
      styles: liveDesignEdit.styles,
      reset: liveDesignEdit.reset,
    };
    visibleIframeRef.current?.contentWindow?.postMessage(message, "*");
    loadingIframeRef.current?.contentWindow?.postMessage(message, "*");
  }, [liveDesignEdit]);

  return (
    <div className={styles.iframeStack}>
      <iframe
        ref={visibleIframeRef}
        key={`visible-${reloadKey}`}
        title="Project preview"
        srcDoc={visibleSrcDoc}
        className={styles.previewIframe}
        sandbox={PREVIEW_IFRAME_SANDBOX}
        onLoad={() => {
          postDesignModeState(visibleIframeRef.current);
          postDebugControlState(visibleIframeRef.current);
        }}
      />
      {loadingSrcDoc ? (
        <iframe
          ref={loadingIframeRef}
          title="Project preview loading"
          srcDoc={loadingSrcDoc}
          className={`${styles.previewIframe} ${styles.previewIframeLoading}`}
          sandbox={PREVIEW_IFRAME_SANDBOX}
          onLoad={() => {
            postDesignModeState(loadingIframeRef.current);
            postDebugControlState(loadingIframeRef.current);
            setVisibleSrcDoc(loadingSrcDoc);
            setLoadingSrcDoc(null);
          }}
        />
      ) : null}
    </div>
  );
}

