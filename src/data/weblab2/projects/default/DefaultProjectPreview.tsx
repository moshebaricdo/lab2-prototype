import indexHtml from "./files/index.html?raw";
import stylesCss from "./files/styles.css?raw";

function escapeStyleCloseTag(css: string) {
  return css.replace(/<\/style/gi, "<\\/style");
}

const defaultProjectPreviewSrcDoc = indexHtml.replace(
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']styles\.css["'])[^>]*>/i,
  `<style data-preview-source="styles.css">\n${escapeStyleCloseTag(stylesCss)}\n</style>`,
);

const PREVIEW_IFRAME_SANDBOX = "allow-scripts allow-forms";

export function DefaultProjectPreview() {
  return (
    <iframe
      title="Default project preview"
      srcDoc={defaultProjectPreviewSrcDoc}
      sandbox={PREVIEW_IFRAME_SANDBOX}
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        background: "var(--ds-background-neutral-white-fixed)",
      }}
    />
  );
}

