import indexHtml from "./files/index.html?raw";
import stylesCss from "./files/styles.css?raw";

function escapeStyleCloseTag(css: string) {
  return css.replace(/<\/style/gi, "<\\/style");
}

const defaultProjectPreviewSrcDoc = indexHtml.replace(
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']styles\.css["'])[^>]*>/i,
  `<style data-preview-source="styles.css">\n${escapeStyleCloseTag(stylesCss)}\n</style>`,
);

export function DefaultProjectPreview() {
  return (
    <iframe
      title="Default project preview"
      srcDoc={defaultProjectPreviewSrcDoc}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        background: "var(--ds-background-neutral-white-fixed)",
      }}
    />
  );
}

