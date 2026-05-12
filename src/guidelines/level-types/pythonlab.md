# Python Lab

## Summary

Python Lab is a Lab2-powered coding environment for Python. It shares the same shell (header, sidebar/resource panel) as Web Lab 2 but uses a simplified workspace layout tailored for Python scripting with Pyodide-backed console output.

## Key Differences from Web Lab 2

| Concern | Web Lab 2 | Python Lab |
|---|---|---|
| View modes | Code / Preview / Split (segmented control) | Code + Console only (no segmented control) |
| Preview panel | Browser-style preview | None — replaced by a CONSOLE pane |
| File tree | Multi-file with folders, context menus | Shared file manager, resizable/collapsible like Web Lab 2, with Python-focused file creation |
| Run button | N/A | "Run" button executes the selected Python file with Pyodide |
| Console | None | Monospace stdout/stderr/error output area below the editor or in a resizable right-side split |
| Validation | Not currently shown | Deterministic Validation tab checks code against level requirements |
| AI Tutor | Can answer and propose file edits | Guidance-only Python Tutor can read files but does not modify them |
| Instructions drawer | Shown by default | Shown on the guided route; hidden on the blank standalone route |
| Version history tab | Functional file snapshots | Functional file snapshots, read-only history viewing, and restore/save controls |

## Workspace Layout

```text
┌──────────────────────────────────────────────┐
│  [main.py x]       WORKSPACE   [Console only]│  ← header
├──────────────────────────────────────────────┤
│ Files │                                      │
│ main.py│   1  FOCUS_OPTIONS = [              │  ← editor pane
│ README│                                      │
│       │                                      │
├──────────────────────────────────────────────┤
│ ▶ Run          CONSOLE                       │  ← console divider
├──────────────────────────────────────────────┤
│ Here is a quick coding plan for today:       │  ← console output
└──────────────────────────────────────────────┘
```

The console header includes controls to run code, clear output, and toggle between the default bottom console and a vertical right-side console. The editor/console divider remains resizable in both orientations.

## Routes

- `/levels/pythonlab` — default Python Lab workspace with a guided check-in planner project
- `/levels/pythonlab-blank` — standalone blank Python project with no starter files, instructions drawer hidden, and collapsible sidebar enabled

## Component Structure

- Page: `src/pages/pythonlab/PythonLabLevelPage.tsx`
- Blank page wrapper: `src/pages/pythonlab/PythonLabBlankProjectLevelPage.tsx`
- Workspace: `src/components/ide/pythonlab/views/PythonWorkspace.tsx`
- Runtime: `src/components/ide/pythonlab/runtime/pythonRunner.ts`
- Shared editor: `src/components/ide/shared/CodeEditor.tsx` (same as Web Lab 2)
- Shared file manager: `src/components/ide/shared/FileManager.tsx` (same as Web Lab 2)
- Shared create-file modal: `src/components/ide/shared/CreateFileModal.tsx`
- Shared version banner: `src/components/ide/shared/VersionBanner.tsx`
- Validation tab: `src/components/lab2/resource-panel/views/ValidationPanel.tsx`
- Mock data: `src/data/pythonlab/projects/default` (`main.py` and `README.md`)

## Sidebar Config

The Python Lab page uses the standard `Lab2Shell` with `Sidebar` and includes validation, functional version history, instructions drawer, collapsible sidebar, and dev panel support. Version history is powered by `useVersionHistoryState`; selecting an older snapshot shows that file tree in read-only mode until the student returns to Current Version. The blank standalone route disables the instructions drawer and validation by default, then starts the resource panel collapsed while keeping the rail available.

AI Tutor is functional by default in Python Lab, with a dev-panel mode switch for scripted mock responses. Functional Python Tutor uses the shared Tutor harness in a guidance-only mode: it receives the current editable file tree as read-only context and can answer questions, explain concepts, and help debug runtime errors, but it does not expose Build/Plan controls or file-change proposal actions.

Validation tests are configured from the Python Lab dev panel as one test per line:

```text
Description | includes | exact text
Description | regex | pattern
Description | regex | pattern | optional-target-file.py
```

The Validation tab reads the current in-memory project files and runs the configured matchers when the student clicks **Validate**. Results reset to Skip when the student edits code or the test configuration changes.

## Runtime

`PythonWorkspace` runs the selected file through the Pyodide wrapper in `pythonRunner.ts`. The runner starts a web worker, streams stdout/stderr back into the console, and supports interactive `input()` by showing a terminal-style prompt row while Python waits for the next line. Local dev and preview set cross-origin isolation headers in `vite.config.ts` so `SharedArrayBuffer` can be used for worker stdin; deployed hosting must send the same COOP/COEP headers for terminal input to work in production.
