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
    ├── NodePalette            floating left rail — grab/select tools, then add shape/text/image/line
    └── PropertyPanel          floating right panel — morphs by selection
```

The property panel renders one of four states based on the current selection,
matching the Figma toolbar permutations:

- **Shape** — Appearance (Background, Border), Typography (Size, Alignment,
  Color), Rotation, Actions
- **Line** — Color, Thickness, Style, Shape, Arrowheads, Actions
- **Text** — Size, Alignment, Color, Rotation, Actions
- **Image** — Rotation, Alt Text, Actions

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

The left toolbar starts with **Grab** (default — drag empty canvas to pan) and
**Select** (drag empty canvas to marquee-select; Shift+click to add to selection).
Grouping and multi-select property editing are not implemented yet, but select
mode wires up React Flow's `selectionOnDrag` for that path.

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

SCSS modules + `--ds-*` tokens only. Preset swatch colors resolve through
`--sketch-palette-*` tokens in `sketchLabPalette.scss` (light + dark variants for
backgrounds; theme-aware neutrals for borders and text/lines). See
`getPaletteSwatches` / `resolveColor` in `sketchLabOptions.ts`. ReactFlow's base
stylesheet (`@xyflow/react/dist/style.css`) is imported once in
`SketchLabWorkspace.tsx`; canvas zoom controls live in `SketchCanvasControls.tsx`
(AppButton tertiary gray xs). Background dots and connection handles are themed in
`SketchLabWorkspace.module.scss` / `SketchNodes.module.scss`.

## Known Gaps

- AI Tutor runs in mock mode (no functional Sketch Tutor harness yet).
- **Save sketch** (floppy-disk icon button) opens a menu: **Save to device** (downloads a full-resolution `sketch.png`) or **Save to backpack** (a compact `sketch.jpg`, `type: "image"`, `sourceLab: "sketch-lab"`). Both render the canvas via `exportSketchImage` in `exportSketchToPng.ts` (`getNodesBounds` + `html-to-image`), framed to the bounding box of **every** node so the artifact always captures the full creation regardless of the live pan/zoom. Connection handles, line endpoint knobs, and selection rings are filtered out, and `skipFonts` is set to avoid cross-origin webfont embedding errors (export uses the system fallback font). The backpack capture is downscaled (`maxDimension` 1600, JPEG quality) so the data URL fits the `localStorage` quota; `persistBackpackItems` now swallows quota/write failures and raises the standard save-error alert instead of crashing. Because saved sketches are real images, they re-import onto the canvas via the images-only backpack allow-list. Empty-canvas saves are a no-op. SVG export is still not implemented.
- Custom FontAwesome icons are placeholders (see above).
- No validation harness integration.
