# Assessment Checks

## AI Review Requirements

- [Fix the Next button] Clicking Next hides the first photo and shows the next `#photo2` image.

## Local Fallback Checks

```validation-checks
[
  {
    "id": "second-photo-selector",
    "label": "Second photo selector matches the HTML",
    "targetFile": "script.js",
    "matcher": {
      "type": "regex",
      "value": "querySelector\\([\"']#photo2[\"']\\)"
    },
    "passDetail": "The script now targets #photo2, which exists in the HTML.",
    "failDetail": "The HTML uses #photo2. Update the JavaScript selector so it matches."
  }
]
```
