# Assessment Checks

## AI Review Requirements

- [Make one intentional style refinement] The student makes at least one intentional refinement beyond the starter styles so there is evidence that they experimented with the page's interactive polish.

## Local Fallback Checks

```validation-checks
[
  {
    "id": "strong-focus-visible-style",
    "label": "Interactive elements have a strong focus style",
    "targetFile": "style.css",
    "matcher": {
      "type": "regex",
      "value": ":focus-visible\\s*\\{[\\s\\S]*outline:\\s*(2|3|4)px",
      "flags": "i"
    },
    "passDetail": "The stylesheet includes a stronger focus-visible outline.",
    "failDetail": "Improve keyboard focus so links and buttons have a clear visible outline."
  },
  {
    "id": "link-visited-state",
    "label": "Links include a visited state",
    "targetFile": "style.css",
    "matcher": {
      "type": "includes",
      "value": ":visited"
    },
    "passDetail": "The stylesheet includes a visited link state.",
    "failDetail": "Add or refine a visited state for links where it makes sense."
  }
]
```
