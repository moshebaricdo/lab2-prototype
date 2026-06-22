import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PreviewDesignStylePatch } from "./types";
import styles from "./PreviewPanel.module.scss";

const PREVIEW_IFRAME_SANDBOX = "allow-scripts allow-forms";
const PREVIEW_DEBUG_CONTROL_MESSAGE_TYPE = "weblab-preview:debug-control";

type PreviewSlot = 0 | 1;

function stopPreviewIframe(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  iframe.removeAttribute("srcdoc");
  iframe.src = "about:blank";
}

function usePreviewBlobUrl(html: string | null): string | null {
  const url = useMemo(() => {
    if (!html) return null;
    return URL.createObjectURL(new Blob([html], { type: "text/html" }));
  }, [html]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
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
  const iframeRef0 = useRef<HTMLIFrameElement>(null);
  const iframeRef1 = useRef<HTMLIFrameElement>(null);
  const iframeRefs = [iframeRef0, iframeRef1] as const;
  const suppressedDesignEditSerialRef = useRef<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<PreviewSlot>(0);
  const [slotDocs, setSlotDocs] = useState<[string | null, string | null]>(() => [srcDoc, null]);

  const slot0Url = usePreviewBlobUrl(slotDocs[0]);
  const slot1Url = usePreviewBlobUrl(slotDocs[1]);

  useEffect(() => {
    setActiveSlot(0);
    setSlotDocs([srcDoc, null]);
    suppressedDesignEditSerialRef.current = null;
  }, [reloadKey]);

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

  const postControlStateToAll = useCallback(() => {
    iframeRefs.forEach((ref) => {
      postDesignModeState(ref.current);
      postDebugControlState(ref.current);
    });
  }, [postDebugControlState, postDesignModeState]);

  useEffect(() => {
    if (
      designModeActive &&
      liveDesignEdit &&
      !liveDesignEdit.reset &&
      suppressedDesignEditSerialRef.current !== liveDesignEdit.serial
    ) {
      suppressedDesignEditSerialRef.current = liveDesignEdit.serial;
      return;
    }

    setSlotDocs((current) => {
      const activeDoc = current[activeSlot];
      const inactiveSlot = (1 - activeSlot) as PreviewSlot;
      const inactiveDoc = current[inactiveSlot];

      if (srcDoc === activeDoc || srcDoc === inactiveDoc) {
        return current;
      }

      const next: [string | null, string | null] = [...current];
      next[inactiveSlot] = srcDoc;
      return next;
    });
  }, [activeSlot, designModeActive, liveDesignEdit, srcDoc]);

  useEffect(() => {
    postControlStateToAll();
  }, [activeSlot, postControlStateToAll, reloadKey, slot0Url, slot1Url]);

  useEffect(() => {
    iframeRefs.forEach((ref) => postDebugControlState(ref.current));
  }, [networkBlocked, postDebugControlState]);

  useEffect(() => {
    if (!liveDesignEdit) return;
    const message = {
      type: "weblab-preview:apply-design-edit",
      targetSelector: liveDesignEdit.targetSelector,
      styles: liveDesignEdit.styles,
      reset: liveDesignEdit.reset,
    };
    iframeRefs.forEach((ref) => {
      ref.current?.contentWindow?.postMessage(message, "*");
    });
  }, [liveDesignEdit]);

  useLayoutEffect(() => () => {
    iframeRefs.forEach((ref) => stopPreviewIframe(ref.current));
  }, []);

  const handleSlotLoad = useCallback((slot: PreviewSlot) => {
    postDesignModeState(iframeRefs[slot].current);
    postDebugControlState(iframeRefs[slot].current);

    if (slot === activeSlot) return;

    setActiveSlot(slot);
    setSlotDocs((current) => {
      const loaded = current[slot];
      if (!loaded) return current;
      const next: [string | null, string | null] = [null, null];
      next[slot] = loaded;
      return next;
    });
  }, [activeSlot, postDebugControlState, postDesignModeState]);

  return (
    <div className={styles.iframeStack}>
      {([0, 1] as const).map((slot) => {
        const doc = slotDocs[slot];
        const url = slot === 0 ? slot0Url : slot1Url;
        if (!doc || !url) return null;

        const isActive = slot === activeSlot;
        return (
          <iframe
            key={`preview-slot-${slot}-${reloadKey}`}
            ref={iframeRefs[slot]}
            title={isActive ? "Project preview" : "Project preview loading"}
            src={url}
            className={
              isActive
                ? styles.previewIframe
                : `${styles.previewIframe} ${styles.previewIframeLoading}`
            }
            sandbox={PREVIEW_IFRAME_SANDBOX}
            onLoad={() => handleSlotLoad(slot)}
          />
        );
      })}
    </div>
  );
}
