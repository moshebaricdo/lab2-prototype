# Drag and Drop

## Purpose

Prototype drag-and-drop assessment levels on the Lab2 shell with two configurations:

- **Parsons problem** — order code or text blocks into the correct sequence (optional distractors stay in the bank).
- **Categorization** — drag items into labeled buckets.

Submit feedback, sounds, teacher reveal, and Continue navigation align with multi-choice and match demos. Optional **code reference panel** layout matches other assessment types.

## Routes

Bubble navigation and demos are listed in `src/pages/levelTypeLinks.ts` (`dragDropLevelLinks`):

- `/levels/drag-drop-parsons` — Parsons ordering (JavaScript loop blocks + distractors)
- `/levels/drag-drop-categorization` — HTTP methods sorted into read/write buckets
- `/levels/drag-drop-categorization-long-text` — temporary long-label categorization stress test
- `/levels/drag-drop-parsons-code-ref` — Parsons with side-by-side code panel

## Key Files

- `src/components/assessment/drag-drop/views/DragDropWorkspace.tsx` (+ `.module.scss`)
- `src/pages/drag-drop/*LevelPage.tsx`
- `src/data/assessment/dragDrop.ts` — payload types and demo fixtures
- `src/components/assessment/shared/AssessmentCodeRefLayout.tsx` — split code panel when `codePanel` is set
- `src/components/assessment/shared/AssessmentStemSection.tsx`
- `src/components/assessment/shared/AssessmentBottomRow.tsx`

## Stem model

Same as multi-choice and free-response:

- `stem.question` — optional plain heading
- `stem.description` — optional markdown supplemental or description-only prompt

## Student UX (Parsons)

- Blocks start shuffled in the **option bank**.
- Students drag blocks into ordered **solution** slots (one per correct line).
- When `correctIndents` is provided in the payload, empty solution slots are uniform (full-width); students set indent depth in a single drag. Depth tracks the dragged card's left edge relative to the slot (snapped to indent steps): align the card to the slot's left for top level, nudge it right one indent-width per level. The hovered slot previews the projected depth live (a teal drop zone that shifts to the target indent, labelled "Top level" / "Indent N") before the card is dropped. The first line is always top level. Depth is scored alongside order.
- Distractors can remain in the bank.
- **Clear all** resets bank and slots.
- **Submit** when every solution slot is filled.

## Student UX (Categorization)

- Items start in the source **option bank** below the buckets (section label is always **Option bank**; horizontal wrap — short labels hug content; longer labels wrap within a ~280px max width).
- Students drag each item up into a **bucket** drop zone.
- When every item has been placed, the bank shows an empty dashed-border area (no icon).
- Buckets use a responsive grid; items inside a bucket wrap horizontally with the same hug-width / max-width behavior.
- Each bucket has a **label** (required) and optional **description** for category context.
- **Submit** when every item is assigned to a bucket.

## Interaction modes (drag, click, keyboard)

Mirrors the match definition-bank pattern so every action works three ways:

- **Pointer drag** — `@dnd-kit` `PointerSensor`. A floating `DragOverlay` mirrors the card (handle + body) and drop animation is disabled so cards never snap back or resize on drop. Focus is dropped after a pointer drag so no stray focus ring lingers. Dragging a placed item back over the bank shows a single-card dashed return slot (not a container outline); the slot is suppressed while dragging out of the bank.
- **Click to place** — click a card to select it, then click an empty slot/bucket (or vice versa). Click a placed card to pick it up again.
- **Keyboard** — Tab to a card or target. `Enter`/`Space` selects and places. `Backspace`/`Delete` returns a placed block to the bank. `Escape` cancels a selection. Parsons supports `Arrow` roving between the solution and bank columns (same model as match). With nesting enabled, pointer drag sets indent depth from the dragged card's left edge relative to the slot (previewed live); click-to-place defaults to top level, and `Shift`+`Left`/`Right` adjusts the depth of a placed block. Selected cards/targets use the teal selected styling; targets and cards expose `aria-label` / `aria-pressed`, and each layout is a labeled `role="group"`.

## Student UX (submit and feedback)

- **Sounds:** success when fully correct; error when any placement is wrong.
- **All correct** — per-slot/per-item success styling; **Nice work!** and **Continue**.
- **Any incorrect** — error styling on wrong slots/items; **Try again** until fully correct.
- **Teacher tools:** **Reveal answer** shows the keyed order or bucket mapping inline; Submit disabled while revealed.

## Code reference panel

When `codePanel` is provided (top-level on the page or via `DragDropCodeRefPayload`):

- Workspace uses `AssessmentCodeRefLayout` — resizable split with read-only code files on the right.
- `codePanel.files` supports one or multiple tabbed files (see `CodePanelConfig` in `src/data/assessment/codePanel.ts`).

## Data shape

`DragDropLevelPayload` (`src/data/assessment/dragDrop.ts`):

- `level.type: "DragDrop"`
- `level.question.mode: "parsons" | "categorization"`
- Parsons: `blocks`, `correctOrder`, optional `correctIndents` (parallel depth per line — enables nested drop targets when set), optional `distractorIds`, optional `bankLabel` (payload only — UI bank section is always labeled **Option bank**), optional `solutionLabel`
- Categorization: `buckets` (each with `id`, `label`, optional `description`), `items` (each with `correctBucketIds`); optional `bankLabel` is payload-only (UI uses **Option bank**)
- Blocks reuse `MultiChoiceAnswerContentBlock` for text/code/image bodies

## Levelgroup embedding

`LevelGroupQuestionBlock` supports `kind: "dragDrop"` with compact `LevelGroupDragDropQuestion` data mapped via `levelGroupDragDropToPayload`. See `levelgroup.md`.

## Known gaps

- No persistence of drag state across reloads.
- No API submission or scoring persistence.
- Categorization keyboard navigation relies on Tab order (no 2D arrow roving across the bucket grid); Parsons has arrow roving.
