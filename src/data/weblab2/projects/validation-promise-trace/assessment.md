# Assessment Checks

## AI Review Requirements

- [Label and explain what each step is doing] Each numbered Promise comment includes both a Promise state label and a separate explanation phrase beyond the state word, describing what the code is doing at that step.

## Local Fallback Checks

```validation-checks
[
  {
    "id": "first-promise-state-comment",
    "label": "Comment 1 identifies a Promise state",
    "targetFile": "script.js",
    "matcher": {
      "type": "regex",
      "value": "//\\s*1\\.\\s*(Pending|Fulfilled|Rejected)",
      "flags": "i"
    },
    "passDetail": "Comment 1 names a Promise state.",
    "failDetail": "Add the Promise state next to comment 1."
  },
  {
    "id": "all-four-numbered-comments-addressed",
    "label": "All four numbered comments are addressed",
    "targetFile": "script.js",
    "matcher": {
      "type": "regex",
      "value": "//\\s*1\\.\\s*(Pending|Fulfilled|Rejected)[\\s\\S]+//\\s*2\\.\\s*(Pending|Fulfilled|Rejected)[\\s\\S]+//\\s*3\\.\\s*(Pending|Fulfilled|Rejected)[\\s\\S]+//\\s*4\\.\\s*(Pending|Fulfilled|Rejected)",
      "flags": "i"
    },
    "passDetail": "All four numbered comment locations still appear in the script.",
    "failDetail": "Make sure comments 1 through 4 each include a state and explanation."
  }
]
```
