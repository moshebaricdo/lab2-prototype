# Assessment Checks

## AI Review Requirements

- The loader loop advances the `i` index on every iteration so the browser does not freeze.
- Crates that fit are pushed into `shipCargo` and counted toward `currentWeight`.
- Running the loader sequence updates the ship cargo list, current weight, and status message to show a successful load up to the 800-ton limit.

## Local Fallback Checks

```validation-checks
[
  {
    "id": "loop-increments-index",
    "label": "Loader loop increments the index",
    "targetFile": "script.js",
    "matcher": {
      "type": "regex",
      "value": "i\\s*(\\+\\+|\\+=\\s*1|=\\s*i\\s*\\+\\s*1)"
    },
    "passDetail": "The loop advances the index so it can finish.",
    "failDetail": "Increment i inside the while loop so the loader does not run forever."
  },
  {
    "id": "cargo-pushes-current-crate",
    "label": "Fitting crates are added to ship cargo",
    "targetFile": "script.js",
    "matcher": {
      "type": "includes",
      "value": "shipCargo.push(crate)"
    },
    "passDetail": "The script pushes fitting crates into shipCargo.",
    "failDetail": "Push the current crate into shipCargo when it fits."
  },
  {
    "id": "screen-updates-after-loop",
    "label": "Screen updates after loading",
    "targetFile": "script.js",
    "matcher": {
      "type": "includes",
      "value": "updateScreen()"
    },
    "passDetail": "The page refreshes the cargo display after the loop.",
    "failDetail": "Call updateScreen after the loading loop finishes."
  }
]
```
