import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import { countChangedLines, validateTutorPatchResponse } from "./editValidator";

function stylePolishFiles(): FileItem[] {
  return [{
    name: "Project",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><main><nav><a class="nav-link" href="#features">Features</a></nav></main></body></html>',
      },
      {
        name: "style.css",
        type: "css",
        content: ".nav-link { text-decoration: none; }\n.nav-link:hover { color: blue; }\n",
      },
    ],
  }];
}

describe("countChangedLines", () => {
  it("counts inserted lines without marking shifted lines as changed", () => {
    const before = [
      "<main>",
      "  <h1>Planet Facts</h1>",
      "  <p>Earth is rocky.</p>",
      "</main>",
    ].join("\n");
    const after = [
      "<main>",
      "  <h1>Planet Facts</h1>",
      "  <button>Show Mars</button>",
      "  <p>Earth is rocky.</p>",
      "</main>",
    ].join("\n");

    expect(countChangedLines(before, after)).toEqual({
      linesAdded: 1,
      linesRemoved: 0,
    });
  });

  it("does not count a trailing newline as a changed blank line", () => {
    expect(countChangedLines("", "const ready = true;\n")).toEqual({
      linesAdded: 1,
      linesRemoved: 0,
    });
  });

  it("counts replacements as an addition and removal", () => {
    expect(countChangedLines("color: red;\n", "color: blue;\n")).toEqual({
      linesAdded: 1,
      linesRemoved: 1,
    });
  });
});

describe("validateTutorPatchResponse style polish intent", () => {
  const styleRequest =
    "Make the nav bar links feel interactive: add hover underline that animates, and a strong focus-visible outline.";

  it("rejects JavaScript behavior for CSS style-polish requests", () => {
    const result = validateTutorPatchResponse(
      {
        message: "I added JavaScript hover effects for the nav links.",
        changes: [{
          fileName: "script.js",
          status: "new",
          content: "document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('mouseenter', () => link.classList.add('glow')));\n",
        }],
      },
      stylePolishFiles(),
      styleRequest,
    );

    expect(result.ok).toBe(false);
    if ("errors" in result) {
      expect(result.errors.join(" ")).toContain("CSS/style polish");
    }
  });

  it("accepts CSS-only hover and focus polish", () => {
    const result = validateTutorPatchResponse(
      {
        message: "I polished the nav link hover and focus styles in CSS.",
        changes: [{
          fileName: "style.css",
          status: "modified",
          edits: [{
            search: ".nav-link { text-decoration: none; }\n.nav-link:hover { color: blue; }\n",
            replace: ".nav-link { text-decoration: none; text-underline-offset: 6px; transition: color 180ms ease, text-decoration-color 180ms ease; }\n.nav-link:hover { color: blue; text-decoration: underline; }\n.nav-link:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }\n",
          }],
        }],
      },
      stylePolishFiles(),
      styleRequest,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.changes).toEqual([
        expect.objectContaining({
          fileName: "style.css",
          status: "modified",
        }),
      ]);
    }
  });
});
