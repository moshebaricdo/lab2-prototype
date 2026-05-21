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

function logPreviewFrame(event: string, details: Record<string, unknown> = {}) {
  console.info("[FilePreviewFrame]", event, details);
}

function stopPreviewIframe(iframe: HTMLIFrameElement | null) {
  if (!iframe) {
    logPreviewFrame("stop skipped; iframe missing");
    return;
  }
  logPreviewFrame("stopping iframe", {
    src: iframe.getAttribute("src"),
    srcdocLength: iframe.getAttribute("srcdoc")?.length ?? 0,
  });
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
    const nextUrl = URL.createObjectURL(new Blob([srcDoc], { type: "text/html" }));
    logPreviewFrame("created preview URL", {
      reloadKey,
      srcDocLength: srcDoc.length,
      previewUrl: nextUrl,
    });
    return nextUrl;
  }, [reloadKey, srcDoc]);

  useEffect(() => {
    logPreviewFrame("mounted URL", {
      reloadKey,
      previewUrl,
    });
    return () => {
      logPreviewFrame("revoking preview URL", {
        reloadKey,
        previewUrl,
      });
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useLayoutEffect(() => () => {
    logPreviewFrame("layout cleanup");
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
    logPreviewFrame("posting control state", {
      reloadKey,
      previewUrl,
      designModeActive,
      networkBlocked,
      iframeSrc: visibleIframeRef.current?.getAttribute("src"),
    });
    postDesignModeState(visibleIframeRef.current);
    postDebugControlState(visibleIframeRef.current);
  }, [postDebugControlState, postDesignModeState, previewUrl, reloadKey]);

  useEffect(() => {
    postDebugControlState(visibleIframeRef.current);
  }, [postDebugControlState]);

  useEffect(() => {
    if (!liveDesignEdit) return;
    logPreviewFrame("posting live design edit", {
      reloadKey,
      previewUrl,
      serial: liveDesignEdit.serial,
      reset: Boolean(liveDesignEdit.reset),
      targetSelector: liveDesignEdit.targetSelector,
    });
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
          logPreviewFrame("iframe load", {
            reloadKey,
            previewUrl,
            iframeSrc: visibleIframeRef.current?.getAttribute("src"),
          });
          postDesignModeState(visibleIframeRef.current);
          postDebugControlState(visibleIframeRef.current);
        }}
        onError={() => {
          logPreviewFrame("iframe error", {
            reloadKey,
            previewUrl,
            iframeSrc: visibleIframeRef.current?.getAttribute("src"),
          });
        }}
      />
    </div>
  );
}
