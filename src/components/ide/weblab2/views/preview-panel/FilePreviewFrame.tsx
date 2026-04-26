import { useEffect, useState } from "react";
import styles from "./PreviewPanel.module.scss";

interface FilePreviewFrameProps {
  srcDoc: string;
  reloadKey: number;
}

export function FilePreviewFrame({ srcDoc, reloadKey }: FilePreviewFrameProps) {
  const [visibleSrcDoc, setVisibleSrcDoc] = useState(srcDoc);
  const [loadingSrcDoc, setLoadingSrcDoc] = useState<string | null>(null);

  useEffect(() => {
    if (srcDoc === visibleSrcDoc || srcDoc === loadingSrcDoc) return;
    setLoadingSrcDoc(srcDoc);
  }, [loadingSrcDoc, srcDoc, visibleSrcDoc]);

  return (
    <div className={styles.iframeStack}>
      <iframe
        key={`visible-${reloadKey}`}
        title="Project preview"
        srcDoc={visibleSrcDoc}
        className={styles.previewIframe}
        sandbox="allow-scripts"
      />
      {loadingSrcDoc ? (
        <iframe
          title="Project preview loading"
          srcDoc={loadingSrcDoc}
          className={`${styles.previewIframe} ${styles.previewIframeLoading}`}
          sandbox="allow-scripts"
          onLoad={() => {
            setVisibleSrcDoc(loadingSrcDoc);
            setLoadingSrcDoc(null);
          }}
        />
      ) : null}
    </div>
  );
}

