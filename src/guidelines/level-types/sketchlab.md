# Sketch Lab

## Summary

Sketch Lab is a whiteboarding / diagramming lab type built on a customized
[ReactFlow](https://reactflow.dev) (`@xyflow/react`) canvas. Students place
shape, text, and image nodes, connect them with customizable lines, and style
every element through a contextual property panel. It lives alongside Web Lab 2,
Python Lab, and AI Chat Lab inside the standard `Lab2Shell` (resource panel +
workspace).

## Routes

| Route | Name | Export |
| --- | --- | --- |
| `/levels/sketchlab` | Sketch Lab Level | `SketchLabLevelPage` |
| `/levels/sketchlab-blank` | Standalone Project (Blank) | `SketchLabBlankProjectLevelPage` |
| `/levels/progression-backpack-labs-sketch` | Backpack Across Labs · Sketch | `BackpackCrossLabSketchLevelPage` |

Registered in `src/App.tsx`, listed under **Lab environments** in
`src/pages/LevelsIndexPage.tsx`, and linked via `sketchLabLevelLinks` in
`src/pages/levelTypeLinks.ts`. The level-type icon (`diagram-project`, solid) is
resolved in `src/lib/levelTypeIcon.ts`.

## Workspace Layout

```text
SketchLabWorkspace (main, fills space beside the sidebar)
├── SketchLabHeader            Save sketch icon menu (device / backpack) · WORKSPACE · Start over
└── canvasWrap (position: relative)
    ├── ReactFlow              dotted-grid canvas, Background + Controls
    │   ├── ShapeNode          rectangle / triangle / circle / diamond
    │   ├── TextNode           free text label
    │   ├── ImageNode          image + alt text
    │   └── LineNode           standalone line (color/thickness/style/shape/arrowheads)
    ├── NodePalette            floating left rail — select/grab tools, then add shape/text/image/line
    └── PropertyPanel          floating right panel — morphs by selection
```

The property panel renders one of several states based on the current selection,
matching the Figma toolbar permutations:

- **Shape** — Appearance (Background, Border), Typography (Size, Alignment,
  Color), Rotation, Actions
- **Line** — Color, Thickness, Style, Shape, Arrowheads, Actions
- **Text** — Size, Alignment, Color, Rotation, Actions
- **Image** — Rotation, Alt Text, Actions
- **Multi-select** — header shows `N items selected`; Group items appears first,
  followed by an Actions section with Duplicate all, Send all to front/back, and Delete all
- **Group** — Shapes / Lines / Text / Transform sections (shown when the group
  contains those node kinds); Actions include Send to front/back before Ungroup
  (`object-ungroup`)

## Component Structure

- Page: `src/pages/sketchlab/SketchLabLevelPage.tsx`
- Workspace: `src/components/ide/sketchlab/views/SketchLabWorkspace.tsx`
- Canvas chrome: `SketchLabHeader.tsx`, `NodePalette.tsx`
- Nodes: `views/nodes/SketchNodes.tsx` (`sketchNodeTypes`, includes `LineNode`)
- Line geometry: `sketchLabLineGeometry.ts` (attachments, path building, legacy edge migration)
- Property panel: `views/panel/PropertyPanel.tsx` + `PropertyControls.tsx`
- Canvas state: `src/hooks/useSketchLabState.ts`
- Inline-edit bridge: `views/SketchLabActionsContext.tsx`
- PNG export: `src/components/ide/sketchlab/exportSketchToPng.ts`
- Options / token resolvers: `src/components/ide/sketchlab/sketchLabOptions.ts`
- Grouping helpers: `src/components/ide/sketchlab/sketchLabGrouping.ts`
- Icons: `src/components/ide/sketchlab/sketchLabIcons.tsx`
- Types: `src/types/sketchLab.ts`
- Seed data: `src/data/sketchlab/index.ts`

## State & Persistence

`useSketchLabState` wraps ReactFlow's `useNodesState` and owns the controlled
`nodes` array plus all mutators (add, update, duplicate, layer, delete, connect,
reset). **Lines are nodes** (`type: "line"`), not React Flow edges — each line has
start/end endpoint handles and optional attachments to shape/text/image handles.
Selection is derived from `node.selected`. The canvas is persisted to
`sessionStorage` under `sketchlab:<route>:canvas` (mirrors `useFileWorkspaceState`).
Legacy saved canvases that still include an `edges` array are migrated into line
nodes on load. Because nodes are controlled, custom node components write text
edits back through `SketchLabActionsContext` rather than ReactFlow's internal store.

Connections use `ConnectionMode.Loose` so handles can act as both source and target.
Dragging between two shapes creates a new line node; dragging between a line
endpoint and a shape attaches that endpoint. The palette line tool adds a standalone
line to the canvas.

The left toolbar starts with **Select** (default — drag empty canvas to
marquee-select; Shift+click toggles individual nodes in or out of the selection)
and **Hand Tool** (drag empty canvas to pan). **⌘/Ctrl+G** groups the current multi-selection (two or more ungrouped
nodes). Grouped items move together via a parent `group` node; selecting the
group wrapper or all group members opens the **Group** property panel, while
selecting a single member opens that member's own panel so its properties can
override group-level styling. Ungroup from the group panel action row. The group
boundary is hidden by default, appears as a neutral dashed outline on hover, and
switches to a solid brand outline when selected.

Selected shape, text, and image nodes resize from the selection outline: drag any
edge to resize horizontally or vertically, or drag a corner to resize diagonally.
Line nodes keep their start/end endpoint knobs as the resize/connection affordance.

Line nodes always show **start/end endpoint handles** (larger than shape handles).
Select a line to bring it above overlapping shapes. Drag an endpoint to connect;
drag away from a shape to detach and reposition. Dragging the whole line clears
attachments so the segment moves freely.

## Icons (placeholders)

Many Sketch Lab glyphs (line weights, line styles, line shapes, node-handle
toggles) are custom icons from our custom FontAwesome kit, which is **not in this
repo yet**. Until it lands, every Sketch Lab icon resolves to a stock FA7 Pro
glyph in `sketchLabIcons.tsx`. When the kit is added, update only the
`name`/`family` values in that map — all call sites use semantic `SketchIconKey`s,
so nothing else changes. Placeholder entries are flagged `PLACEHOLDER`.

## Styling

SCSS modules + CADS Foundations tokens (`--background-*`, `--text-*`, `--border-*`,
`--shape-*`, `--font-family-main`). Preset swatch colors resolve through
`--sketch-palette-*` tokens in `sketchLabPalette.scss` (light + dark variants for
backgrounds; theme-aware neutrals for borders and text/lines). See
`getPaletteSwatches` / `resolveColor` in `sketchLabOptions.ts`. ReactFlow's base
stylesheet (`@xyflow/react/dist/style.css`) is imported once in
`SketchLabWorkspace.tsx`; canvas zoom controls live in `SketchCanvasControls.tsx`
(CADS `Button` text / tertiary / extraSmall / iconOnly). Background dots and
connection handles are themed in `SketchLabWorkspace.module.scss` /
`SketchNodes.module.scss`. Workspace chrome uses `@moshebaricdo/cads-react` (`Button`,
`Dropdown`, `Tooltip`, `Slider`, `TextInput`). Color/size/rotation property menus
still use a local `MenuField` (Radix popover + `AppDropdown.module.scss`) because
CADS `Dropdown` cannot host swatch grids, custom number rows, or in-menu sliders.

## Known Gaps

- AI Tutor runs in mock mode (no functional Sketch Tutor harness yet).
- **Save sketch** (floppy-disk icon button) opens a menu: **Save to device** (downloads a full-resolution `sketch.png`) or **Save to backpack** (a compact `sketch.jpg`, `type: "image"`, `sourceLab: "sketch-lab"`). Both render the canvas via `exportSketchImage` in `exportSketchToPng.ts` (`getNodesBounds` + `html-to-image`), framed to the bounding box of **every** node so the artifact always captures the full creation regardless of the live pan/zoom. Connection handles, line endpoint knobs, and selection rings are filtered out, and `skipFonts` is set to avoid cross-origin webfont embedding errors (export uses the system fallback font). The backpack capture is downscaled (`maxDimension` 1600, JPEG quality) so the data URL fits the `localStorage` quota; `persistBackpackItems` now swallows quota/write failures and raises the standard save-error alert instead of crashing. Because saved sketches are real images, they re-import onto the canvas via the images-only backpack allow-list. Empty-canvas saves are a no-op. SVG export is still not implemented.
- Custom FontAwesome icons are placeholders (see above).
- No validation harness integration.
