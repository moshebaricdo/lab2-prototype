import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { PreviewDesignStylePatch } from "./types";
import styles from "./PreviewPanel.module.scss";

const PREVIEW_IFRAME_SANDBOX = "allow-scripts allow-forms";
const PREVIEW_DEBUG_CONTROL_MESSAGE_TYPE = "weblab-preview:debug-control";

function stopPreviewIframe(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  iframe.removeAttribute("srcdoc");
  iframe.src = "about:blank";
}

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
  const previewUrl = useMemo(() => {
    return URL.createObjectURL(new Blob([srcDoc], { type: "text/html" }));
  }, [reloadKey, srcDoc]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useLayoutEffect(() => () => {
    stopPreviewIframe(visibleIframeRef.current);
  }, []);

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
    postDesignModeState(visibleIframeRef.current);
    postDebugControlState(visibleIframeRef.current);
  }, [postDebugControlState, postDesignModeState, previewUrl, reloadKey]);

  useEffect(() => {
    postDebugControlState(visibleIframeRef.current);
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
  }, [liveDesignEdit]);

  return (
    <div className={styles.iframeStack}>
      <iframe
        ref={visibleIframeRef}
        key={`visible-${reloadKey}-${previewUrl}`}
        title="Project preview"
        src={previewUrl}
        className={styles.previewIframe}
        sandbox={PREVIEW_IFRAME_SANDBOX}
        onLoad={() => {
          postDesignModeState(visibleIframeRef.current);
          postDebugControlState(visibleIframeRef.current);
        }}
      />
    </div>
  );
}
