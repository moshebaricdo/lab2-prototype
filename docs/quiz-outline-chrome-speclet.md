# Quiz outline chrome — CSS speclet

Handoff for porting the builder outline look (question rows, intro row, page groups) into production. **Values and roles, not components.** Bind the custom properties to whatever the prod design system calls them. Skip anything marked prototype-only.

This is the visual contract as of 2026-10-30. Interaction details (dnd, save, dialogs) stay out unless they change layout.

---

## How to read this

- Numbers are **px**.
- `--outline-*` names below are **roles**, not required token names.
- Radius is written as **block** (10) vs **item** (6). If prod’s scale is different, keep the *one-step* relationship: items sit one step tighter than pages.
- Do not track “are there pages?” on the intro. Change **question** radius by nesting instead.

---

## Token roles

Map these once, then ignore prototype names.

| Role | Use | Prototype | Fallback |
|------|-----|-----------|----------|
| `--outline-surface` | Card / header fill | `--background-neutral-primary` | white / primary surface |
| `--outline-well` | Open page body, dashed slots | `--background-neutral-secondary` | secondary / tinted fill |
| `--outline-stroke` | Default 1px border | `--border-neutral-primary` | primary border |
| `--outline-stroke-muted` | Dashed add-slots | `--border-neutral-secondary` | quieter border |
| `--outline-stroke-selected` | Drop target | `--border-selected-primary` | selected / focus-adjacent |
| `--outline-well-selected` | Drop target fill | `--background-brand-light` | selected wash |
| `--outline-text` | Titles, names | `--text-neutral-primary` | primary text |
| `--outline-text-muted` | Stems, counts, dot | `--text-neutral-tertiary` | muted text |
| `--outline-text-faint` | Empty-page hint | `--text-neutral-quaternary` | placeholder / faint |
| `--outline-icon` | Leading type / intro icon | `--text-neutral-quaternary` | faint icon |
| `--outline-radius-block` | Intro, page, root question, Add page slot | `--shape-lg` | **10px** |
| `--outline-radius-item` | Nested question, nested Create question | `--shape-sm` | **6px** |

Type (map to prod body styles of similar density):

| Role | Weight | Approx size |
|------|--------|-------------|
| Title / internal name / “Page N” | semibold | body-sm (~13–14px) |
| Stem peek / “N questions” | regular | same size as title |
| Empty-page hint | regular | one step smaller |

Icon buttons in these headers are **24×24** (extra-small). Trailing controls sit in a **6px** gap.

---

## Invariants (layout, not chrome)

1. The outline is **either** flat (no pages; questions at the root) **or** fully paged (every question lives in a page). Once a page exists, questions never sit beside pages.
2. **Intro radius never changes.** It always uses `--outline-radius-block`, whether or not pages exist.
3. **Question radius follows nesting:** root = block (10); inside a page = item (6). Create-question slots follow the same rule.
4. **Connectors are always centered** in their row. Do not inset ticks to the type-icon column.
5. Collapsed intro, page header, and question rows share one **header recipe** (height, padding, trailing 24px actions) so they line up as siblings.

---

## Shared recipes

### Header row (intro, question, page header)

```
box-sizing: border-box
display: flex
align-items: center
gap: 12px                    /* leading cluster ↔ trailing actions */
min-height: 46px
padding: 10px 10px 10px 12px /* T R B L */
```

Left cluster (`flex: 1`, `min-width: 0`, `gap: 10px`):

- Leading glyph slot **16×22**, color `--outline-icon` (intro / question only; pages have no leading glyph).
- Preview cluster: title · dot · muted peek, `gap: 6px`, `min-width: 0`. Peek truncates with ellipsis. Title does not wrap.

Trailing actions: `flex-shrink: 0`, `gap: 6px`.

### Dot divider

Same mark between **name / stem** (intro + question) and **Page N / count**.

```
width: 2px
height: 2px
border-radius: 50%
background: var(--outline-text-muted)
flex-shrink: 0
```

Hide the dot if the muted peek is empty.

### Connector ticks

A 1px vertical rule, color `--outline-stroke`, **horizontally centered** in a full-width row.

| Between | Tick height |
|---------|-------------|
| Intro ↔ page / root question, page ↔ page, last block ↔ Add page | **16px** |
| Question ↔ question, question ↔ Create question (inside a page or at root) | **8px** |

Drop-target on a tick: hide the rule, fill the row with `--outline-well-selected` and a 1px selected stroke.

### Card shell

```
overflow: hidden            /* intro + question; page needs overflow visible for the deck */
border: 1px solid var(--outline-stroke)
background: var(--outline-surface)
```

---

## Intro

Pinned first block when the intro screen is on. Not draggable. No tabs.

| | |
|--|--|
| Radius | always `--outline-radius-block` (10) |
| Collapsed row | shared header recipe |
| Leading | wave (or equivalent) 16×22 |
| Preview | **Intro Screen** · dot · first line of content (fallback copy if empty) |
| Trailing | outlined secondary 24px icon: **pencil** collapsed, **chevron-up** expanded |
| Expanded header | same row, surface fill, 1px `--outline-stroke` under the header |
| Body | surface fill, `padding: 8px 10px 10px`, stack `gap: 8px` |
| Footer | surface fill, `padding: 10px 8px 10px 10px`, 1px stroke on top; destructive remove on the left, cancel/save on the right |

Do not restyle intro when pages appear. It should already match page-card radius and header padding.

---

## Question

| | |
|--|--|
| Radius | **block (10)** at the root; **item (6)** when nested in a page |
| Collapsed row | shared header recipe |
| Leading | type icon 16×22; on hover / keyboard-in-actions, swap to a grip (same slot). Expanded: keep the type icon (no grip). |
| Preview | internal name (ellipsis, max ~42% width) · dot · stem peek |
| Trailing | hover-only destructive trash (24px text/error); dirty → 24×24 warning tag; outlined secondary 24px **pencil** collapsed / **chevron-up** expanded |
| Expand | pencil only (row click does not expand). Collapsed row is the drag handle. |
| Placeholder while dragging | 0.35 opacity, dashed stroke |
| Drag overlay | keep grip, hide actions; muted stroke + medium shadow; **no** selected stroke |

Expanded chrome (port only if prod’s editor shell should match):

- Header bar: surface + 1px stroke under it
- Tab strip: well fill, inset 10px left/right, 1px stroke as a baseline
- Editor: surface, `padding: 10px`
- Footer: surface, `padding: 10px 8px 10px 10px`, 1px stroke on top

After collapse, ignore row hover until the pointer leaves (so grip/trash don’t stick).

---

## Page

A **group**, not a question. Full-width card. No author-facing page name — **Page {n}**.

### Card

```
border: 1px solid var(--outline-stroke)
border-radius: var(--outline-radius-block)   /* 10 */
background: var(--outline-surface)
```

Open: header radius `10px 10px 0 0`. Closed: full 10px.

### Header (both states)

Shared header recipe (`10px 10px 10px 12px`, `gap: 12px`, min-height 46).

Left (flex 1, `gap: 6px`): **Page N** (semibold) · dot · **N question(s)** (regular, muted). This whole cluster is a large hit target for toggle but **not** in the tab order.

Right (`gap: 6px`), both 24×24:

1. Overflow — tertiary, icon-only, ellipsis. Menu: add above/below, move up/down, delete. Not rename. Pages are not draggable.
2. Collapse — outlined secondary, icon-only. **chevron-up** when open, **chevron-down** when closed. This is the tab-stop.

Keep a **1px bottom border on the header in both states** (transparent when closed, `--outline-stroke` when open) so the bar does not shift 1px on expand.

### Open body (well)

```
padding: 8px
border-radius: 0 0 10px 10px
background: var(--outline-well)
```

Nested questions and the Create-question slot live here, item radius (6). 8px ticks between them, centered.

### Closed deck

Only when collapsed **and** the page has at least one question. Two extra card-edges tucked under the header (empty pages: no deck). **No hover spread.**

```
/* two layers, behind the card, same stroke + surface + 10px radius */
layer 1: inset 6px left/right,  translateY(6px),  height 16px
layer 2: inset 12px left/right, translateY(11px), height 16px
```

The host needs a stacking context (`isolation: isolate`) and `margin-bottom: ~10px` so the deck isn’t clipped by the next sibling. Reduce-motion: no transform transition.

Drop-target: card stroke → selected; header wash → `--outline-well-selected`.

### Empty page

Inside the well: centered stack, `gap: 12px`. Title (semibold) + hint (smaller, faint) + contained primary **Create question** (same create menu as the slot). Rely on the well’s 8px padding; keep top/bottom visually even.

---

## Add slots

Same dashed language. Radius follows the same nesting rule as questions.

### Create question (full-width slot)

At the end of a populated page, and at the root when the quiz is flat and non-empty.

```
display: flex
justify-content: center
width: 100%
padding: 8px 0
border: 1px dashed var(--outline-stroke-muted)
border-radius: <block 10 at root, item 6 in a page>
background: var(--outline-well)
```

Control inside: extra-small outlined secondary, plus + label + chevron-down. Menu is create-types only (bank adds stay on the rail).

Drop-target: solid selected stroke, `--outline-well-selected` fill.

### Add page (hugging slot)

After a 16px centered tick, at the end of a non-empty outline (not on a fully empty quiz).

```
width: fit-content
margin-inline: auto
padding: 8px
border: 1px dashed var(--outline-stroke-muted)
border-radius: var(--outline-radius-block)   /* 10 */
background: var(--outline-well)
```

Control inside: extra-small outlined secondary, plus + **Add page**.

---

## Radius cheat sheet

| Surface | Radius |
|---------|--------|
| Intro card | 10 |
| Page card, page header, page well corners, page deck layers | 10 |
| Question at root (no pages) | 10 |
| Question inside a page | 6 |
| Create question at root | 10 |
| Create question inside a page | 6 |
| Add page slot | 10 |

---

## Numbers only (no selectors)

Apply these on whatever already wraps each surface. Do not introduce a new outline class tree.

| Token | Value |
|-------|-------|
| Header padding | `10px 10px 10px 12px` |
| Header min-height | `46px` |
| Header gap (cluster ↔ actions) | `12px` |
| Leading cluster gap (icon ↔ preview) | `10px` |
| Preview gap (title · dot · peek) | `6px` |
| Trailing actions gap | `6px` |
| Icon slot | `16×22` |
| Icon buttons | `24×24` extra-small |
| Dot | `2×2`, circle, muted text color |
| Block radius | `10px` |
| Item radius | `6px` |
| Page well padding | `8px` |
| Add-slot padding | `8px` (hugging Add page) / `8px 0` (full-width Create question) |
| Block tick | `16px` tall, `1px` wide, centered |
| Item tick | `8px` tall, `1px` wide, centered |

---

## Reconciling in code-dot-org

Prod already has this outline. Patch existing modules; do not rebuild the prototype’s file/class split.

| Surface | Exists at | Likely edit |
|---------|-----------|-------------|
| Shared collapsed row (intro + question) | `apps/src/quiz/builder/BuilderCard.tsx` + `builder-card.module.scss` | Padding `10px 10px 10px 12px`, min-height 46, preview gap 10, **2px CSS dot** between name and peek (replace the FA `circle` on pages; intro/question currently have no dot). Radius **item (6)** on questions. |
| Intro | `IntroScreenCard.tsx` (uses BuilderCard) | Same row metrics as questions. Radius **block (10)** — pass a radius/size on BuilderCard; do not restyle when pages exist. |
| Pages | `QuizBuilderWorkspace.tsx` + `quiz-builder-workspace.module.scss` (`.page` / `.pageHeader`) | Turn the box into a **header card**: surface fill, 10px radius, header uses the shared padding, questions sit in an 8px well (secondary fill). Replace `.pageHeaderDot` (4px FA circle) with the 2px CSS dot. |
| Create question slot | `.addQuestionRow` (already dashed, `8px 0`, item radius) | Keep. Nested in a page → stay at 6px radius. |
| Add page | `.addPageButton` (text button, no slot) | Wrap in a hugging dashed well: secondary fill, muted dashed stroke, 8px padding, 10px radius, centered. |
| Ticks | none | 16px centered ticks between intro / pages / Add page; 8px between questions. |

**Do not invent in this pass unless product already has it:** page overflow menu (add above/below, move, delete), page-as-stored-entity, dnd, DialKit, or the unused collapse variants. Prod pages are derived from `question.page`, not a separate list.

**Collapse + deck** are optional UI on top of the header card (chevron-up / chevron-down, extra-small outlined secondary, to the right of any overflow). Skip the kebab if there is no page-actions menu yet.

Prod tokens already match the prototype names (`--background-neutral-*`, `--border-neutral-*`, `--shape-sm` / `--shape-lg`). Prefer those over new `--outline-*` aliases.

---

## Leave in the prototype

Do not port: `/experiments/quiz-page-collapse` variants (pill / closed / summary / deckAnchored), `/experiments/quiz-intro` DialKit playground, or any leftover “match pages on the intro” flag. Shipped page treatment is the **header card** described above.
