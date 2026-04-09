# Python Lab

## Summary

Python Lab is a Lab2-powered coding environment for Python. It shares the same shell (header, sidebar/resource panel) as Web Lab 2 but uses a simplified workspace layout tailored for single-file Python scripting with console output.

## Key Differences from Web Lab 2

| Concern | Web Lab 2 | Python Lab |
|---|---|---|
| View modes | Code / Preview / Split (segmented control) | Code + Console only (no segmented control) |
| Preview panel | Browser-style preview | None — replaced by a CONSOLE pane |
| File tree | Multi-file with folders, context menus | Simpler file list |
| Run button | N/A | Green "Run" button above console |
| Console | None | Monospace output area below the editor |
| Instructions drawer | Shown by default | Hidden |
| Version history tab | Shown | Hidden |

## Workspace Layout

```text
┌──────────────────────────────────────────────┐
│  [main.py x]       WORKSPACE   [Console only]│  ← header
├──────────────────────────────────────────────┤
│ Files │                                      │
│ main.py│   1  print("Hello world!")          │  ← editor pane
│       │                                      │
├──────────────────────────────────────────────┤
│ ▶ Run          CONSOLE                       │  ← console divider
├──────────────────────────────────────────────┤
│ Hello world!                                 │  ← console output
└──────────────────────────────────────────────┘
```

## Routes

- `/levels/pythonlab` — default Python Lab workspace

## Component Structure

- Page: `src/pages/PythonLabLevelPage.tsx`
- Workspace: `src/components/ide/pythonlab/views/PythonWorkspace.tsx`
- Shared editor: `src/components/ide/shared/CodeEditor.tsx` (same as Web Lab 2)
- Shared file manager: `src/components/ide/shared/FileManager.tsx` (same as Web Lab 2)
- Mock data: `src/data/pythonlab/mockData.ts`

## Sidebar Config

The Python Lab page uses the standard `Lab2Shell` with `Sidebar` and includes version history, instructions drawer, and dev panel support.
