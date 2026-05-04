import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../../types/file";
import {
  applyPreviewDesignEdit,
  previewDesignEditMarkers,
} from "./previewDesignEdits";

function project(children: FileItem[]): FileItem[] {
  return [{ name: "My Project", type: "folder", children }];
}

function file(name: string, type: FileItem["type"], content: string): FileItem {
  return { name, type, content };
}

function contentFor(files: FileItem[], name: string) {
  const root = files[0];
  return root.children?.find((item) => item.name === name)?.content ?? "";
}

describe("applyPreviewDesignEdit", () => {
  it("updates the first linked local stylesheet with a managed id rule", () => {
    const files = project([
      file("index.html", "html", '<html><head><link rel="stylesheet" href="style.css"></head><body><section id="hero"></section></body></html>'),
      file("style.css", "css", ".hero { padding: 1rem; }\n"),
    ]);

    const result = applyPreviewDesignEdit(files, "index.html", {
      targetSelector: "#hero",
      elementId: "hero",
      styles: {
        backgroundColor: "#ffffff",
        color: "#111111",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.editedPath).toBe("style.css");
    expect(contentFor(result.fileStructure, "style.css")).toContain(".hero { padding: 1rem; }");
    expect(contentFor(result.fileStructure, "style.css")).toContain(previewDesignEditMarkers.managedBlockStart);
    expect(contentFor(result.fileStructure, "style.css")).toContain("#hero {\n  background-color: #ffffff;\n  color: #111111;\n}");
  });

  it("updates an existing managed block without removing unrelated css", () => {
    const files = project([
      file("index.html", "html", '<link rel="stylesheet" href="style.css"><div id="hero"></div>'),
      file(
        "style.css",
        "css",
        [
          ".card { border-radius: 8px; }",
          "",
          previewDesignEditMarkers.managedBlockStart,
          "#hero {",
          "  color: #111111;",
          "}",
          previewDesignEditMarkers.managedBlockEnd,
          "",
        ].join("\n"),
      ),
    ]);

    const result = applyPreviewDesignEdit(files, "index.html", {
      targetSelector: "#hero",
      elementId: "hero",
      styles: {
        fontWeight: "700",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const css = contentFor(result.fileStructure, "style.css");
    expect(css).toContain(".card { border-radius: 8px; }");
    expect(css).toContain("color: #111111;");
    expect(css).toContain("font-weight: 700;");
  });

  it("adds an inline managed style block when no local stylesheet exists", () => {
    const files = project([
      file("index.html", "html", '<html><head><title>Demo</title></head><body><section id="hero"></section></body></html>'),
    ]);

    const result = applyPreviewDesignEdit(files, "index.html", {
      targetSelector: "#hero",
      elementId: "hero",
      styles: {
        fontSize: "24px",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const html = contentFor(result.fileStructure, "index.html");
    expect(result.editedPath).toBe("index.html");
    expect(html).toContain('<style data-weblab-design-mode="true">');
    expect(html.indexOf('<style data-weblab-design-mode="true">')).toBeLessThan(html.indexOf("</head>"));
    expect(html).toContain("#hero {\n  font-size: 24px;\n}");
  });

  it("supports generated selectors for elements without ids", () => {
    const result = applyPreviewDesignEdit(project([file("index.html", "html", "<main></main>")]), "index.html", {
      targetSelector: "main",
      styles: {
        color: "#111111",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(contentFor(result.fileStructure, "index.html")).toContain("main {\n  color: #111111;\n}");
  });

  it("writes side-specific border widths", () => {
    const result = applyPreviewDesignEdit(project([file("index.html", "html", "<main></main>")]), "index.html", {
      targetSelector: "main",
      styles: {
        border: "0 solid #111111",
        borderTopWidth: "2px",
        borderRightWidth: "4px",
        borderBottomWidth: "6px",
        borderLeftWidth: "8px",
        borderColor: "#111111",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const html = contentFor(result.fileStructure, "index.html");
    expect(html).toContain("border-top-width: 2px;");
    expect(html).toContain("border-right-width: 4px;");
    expect(html).toContain("border-bottom-width: 6px;");
    expect(html).toContain("border-left-width: 8px;");
  });

  it("writes grid row and column gaps separately", () => {
    const result = applyPreviewDesignEdit(project([file("index.html", "html", "<main></main>")]), "index.html", {
      targetSelector: "main",
      styles: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gridTemplateRows: "repeat(2, auto)",
        rowGap: "12px",
        columnGap: "24px",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const html = contentFor(result.fileStructure, "index.html");
    expect(html).toContain("display: grid;");
    expect(html).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(html).toContain("grid-template-rows: repeat(2, auto);");
    expect(html).toContain("row-gap: 12px;");
    expect(html).toContain("column-gap: 24px;");
  });

  it("rejects style edits without a target selector", () => {
    const result = applyPreviewDesignEdit(project([file("index.html", "html", "<main></main>")]), "index.html", {
      targetSelector: "",
      styles: {
        color: "#111111",
      },
    });

    expect(result.ok).toBe(false);
  });
});
