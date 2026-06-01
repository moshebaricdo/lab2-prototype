# Assessment Checks

## AI Review Requirements

- [Create a new feature] The page includes at least one new structural feature beyond the blank starter (such as navigation, a hero section, cards, or a footer), and the student used AI Tutor to help build or refine it.

## Local Fallback Checks

```validation-checks
[
  {
    "id": "html-has-structural-content",
    "label": "HTML includes a page feature",
    "targetFile": "index.html",
    "matcher": {
      "type": "regex",
      "value": "<body[^>]*>[\\s\\S]*<(header|nav|main|section|article|footer|div|h1|h2|p|ul|ol|button|a\\s)",
      "flags": "i"
    },
    "passDetail": "The HTML includes new structural content beyond an empty page.",
    "failDetail": "Add a page feature in HTML (for example navigation, a hero, cards, or a footer)."
  },
  {
    "id": "stylesheet-linked",
    "label": "Stylesheet is linked",
    "targetFile": "index.html",
    "matcher": {
      "type": "regex",
      "value": "<link[^>]+href=[\"']style\\.css[\"']",
      "flags": "i"
    },
    "passDetail": "index.html links to style.css.",
    "failDetail": "Link style.css from index.html so your feature can be styled."
  }
]
```
