# Color theming (Code.org + CodeAI)

Canonical guide for brand themes, token layers, the color sandbox, and active-state styling. Read this before changing colors, tokens, `globals.css` theme blocks, or sandbox runtime behavior.

Related docs:

- `scripts/tokenMigrationMap.md` — legacy rename table (Code.org → canonical names)
- `src/ARCHITECTURE.md` — Color Sandbox section (tooling overview)
- `.cursor/rules/design-system.mdc` — component authoring rules (`--ds-*`, typography)

---

## Brands and modes

| Control | Storage | Applied on |
|---|---|---|
| Brand theme (`codeOrg` \| `codeAi`) | `sessionStorage` `lab2:brand-theme` | `document.documentElement.dataset.brandTheme` |
| CodeAI active-state variant (`neutral` \| `info` \| `pink` \| `purple` \| `success` \| `successLight` \| `darkBlue`) | `sessionStorage` `lab2:codeai-active-chrome` | `document.documentElement.dataset.codeaiActiveChrome` (CodeAI only) |
| Light/dark mode | `sessionStorage` `lab2:theme` | `.dark` class on `Lab2Shell` `themeScope` (below `TopNavigation`) |

Code.org is the default production palette (teal chrome + purple actions). CodeAI uses the committed `codeAiColorSystem.json` palette. Typography overrides for CodeAI live in `globals.css` under `:root[data-brand-theme="codeAi"]`.

**Dark mode is scoped**, not global: lab content inside `Lab2Shell`’s `themeScope` gets `.dark`; the top nav stays on brand-stable light tokens.

---

## Token cascade (read this before debugging “wrong color”)

Later layers override earlier ones at the same selector specificity:

```
1. src/styles/tokens.css          ← generated; primitive + semantic hex values
2. src/styles/globals.css         ← semantic aliases, typography, theme experiments
3. Component *.module.scss        ← palette-family token usage (`brand-teal`, etc.)
4. Sandbox runtime <style> tag    ← opt-in preview only (`Apply to app`)
```

### What each layer owns

| Layer | Owns | Does **not** own |
|---|---|---|
| **`tokens.css`** (via `scripts/generate-tokens.mjs`) | Resolved `--ds-*` hex values; CodeAI `brand-teal`/`brand-aqua` → `brand-purple` generator aliases | UI intent (which family = “active state”); sandbox drafts |
| **`globals.css`** | Shorthand aliases (`--accent`, `--ring`); CodeAI typography; **CodeAI active-chrome experiment** (remaps `brand-teal`/`brand-aqua` on CodeAI only) | Replacing committed semantic hexes |
| **Components** | Which palette-family token to use (`brand-teal` for chrome, `brand-purple` for CTAs) | Brand-specific overrides per theme (avoid `:global([data-brand-theme=…])` unless unavoidable) |
| **Sandbox runtime** (`colorSandboxRuntime.ts`) | Live preview of draft primitive → semantic mappings | Compatibility alias layers; active-state remaps; committed file writes |

**Rule:** Sandbox preview injects **resolved semantic values only**. It must not re-emit generator alias layers (`brand-teal` → `brand-purple`) or theme experiments from `globals.css` — those style tags load later and would override the experiment.

---

## Code.org vs CodeAI palette roles

| UI role | Component token family | Code.org resolves to | CodeAI resolves to |
|---|---|---|---|
| Chrome / nav / active / focus / selection | `brand-teal` (or `brand-aqua` for legacy AI highlights) | Teal primitives | **Neutral inverse** (via `globals.css` active-chrome remap; not purple) |
| Primary actions / CTAs | `brand-purple` | Purple | Purple |
| Top navigation background | `brand-teal` default; CodeAI override in `TopNavigation.module.scss` | Teal | Purple (explicit override) |

Do **not** bulk-replace `brand-teal` → `brand-purple` in components. That collapses Code.org’s two-color model.

### CodeAI active-state chrome experiment

Defined in `globals.css` under `:root[data-brand-theme="codeAi"][data-codeai-active-chrome="…"]` (light **and** `.dark`):

- Switchable variants set `--ds-codeai-active-chrome*` source tokens: **neutral** (black/white inverse), **info** (info blue), **pink** (accent pink), **purple** (action purple), **success** (success green), **successLight** (success extra-light fill, purple-90 text in light / white in dark, solid success border on segmented controls via `--ds-codeai-active-chrome-active-border`), **darkBlue** (brand purple step 90 in light / step 10 in dark — mode-split selectors).
- Dark-mode Lab2 tab rail overrides (via `--ds-codeai-active-chrome-tab-rail-icon` / `--ds-codeai-active-chrome-tab-rail-accent` in `Sidebar.module.scss`): **info**, **pink**, **purple**, and **success** use white active icons; **successLight** uses success step 10 (`#D3F3D6`) for both icon and accent line in dark, and success primary border + purple-90 icon in light.
- A shared remap block wires those variables into all `brand-teal-*` and `brand-aqua-*` tokens on CodeAI only.
- `--accent`, `--ring`, `--sidebar-accent`, etc. follow the same remap.
- Variant is chosen in **GlobalNavMenu → Active state** (visible only when Brand = CodeAI) and persisted via `useTheme()` (`lab2:codeai-active-chrome`).

Components keep using `brand-teal-*` for chrome; CodeAI appearance changes in one place (`globals.css`). To add or tweak variants, edit the variant blocks in `globals.css` — not individual components.

**Text on filled active chrome:** use `var(--ds-text-on-active-chrome, var(--ds-text-neutral-white-fixed))` when an active state has a solid `brand-teal` background (segmented control, filter pills, etc.) so contrast tracks the experiment on CodeAI.

---

## Token pipeline (committed source of truth)

```
pages/design-system/tokens/     ← bundled JSON sources
  codeOrgPrimitives.json + semanticsLight.json + semanticsDark.json
  codeAiColorSystem.json

scripts/colorSystemToCss.mjs    ← ColorSystem → flat --ds-* map
scripts/generate-tokens.mjs     ← writes src/styles/tokens.css
```

Regenerate after changing committed JSON:

```bash
node scripts/generate-tokens.mjs
```

CodeAI blocks in `tokens.css` include generator-only aliases (`brand-teal-*` → `brand-purple-*`). Code.org blocks use `:root` + `.dark` without `data-brand-theme`.

**Caution:** `generate-tokens.mjs` regenerates the Code.org `:root`/`.dark` blocks from `tokens/semantic/*.tokens.json` (or a Desktop fallback path) when those files exist. If they resolve to a different token export than what produced the committed blocks, the Code.org section will be rewritten wholesale — diff `tokens.css` after regenerating and revert unintended Code.org changes.

### Disabled state tokens

CodeAI models disabled as a **state** (like `selected`), not a role inside each base family. Per-color tokens live under the `state` subgroup as `disabled` families (`disabled` / `disabled-2` / `disabled-3` for background/text/borders, all displaying "disabled"):

- `--ds-background-disabled-<color>`, `--ds-borders-disabled-<color>`, `--ds-text-disabled-<color>` for `neutral`, `brand`, `error`, `warning`, `success`, `info`, `pink`, `orange` (step 20 light / step 80 dark).
- `--ds-text-disabled-neutral-inverse` — the single inverse for the whole family: label color for **solid-fill** disabled elements of any color (pairs with `background-disabled-<color>`); outline disabled elements use `text-disabled-<color>`. There are no per-color inverse tokens — they would all resolve to the same white (light) / black (dark) value.
- Selected and focused state tokens also live under the flat `state` subgroup, including `*-selected-primary-inverse` and `borders-focused-*` for inverse-state outlines.

The legacy `*-neutral-disabled` roles were removed from the CodeAI system. Code.org still ships the legacy names; `globals.css` bridges them by aliasing `--ds-*-disabled-neutral` → the legacy `--ds-*-neutral-disabled` at `:root`, so components always use the state-group form. Code.org has no per-color disabled tokens yet — non-neutral disabled tokens resolve only under CodeAI.

The CSS exporter treats `state` as a **flat** subgroup, so exported names match generated names (`background-disabled-neutral`, `background-selected-primary`, `background-selected-strong` — no `state-` segment). Note this also changed the exported `selected` names, which previously exported as `background-state-selected-*`; the selected emphasized state follows Figma's `strong` naming (renamed from `hover` in the sandbox baseline v7 sync).

---

## Semantic resolution (sandbox + generator)

Semantics can reference:

1. **Primitive steps** — Figma alias (`brand/teal/50`) → stored in `SemanticToken.ref`
2. **Other semantics** — DTCG alias (`{text.neutral.primary}`) → stored in `SemanticToken.semanticRef`

`semanticHex()` in `colorSystemData.ts` resolves both (with cycle detection). The same logic is mirrored in `scripts/colorSystemToCss.mjs`.

**Persisted sandbox drafts** in `localStorage` may lack `semanticRef` on older saves. `mergeSemanticRefs()` backfills from the bundled built-in system before runtime preview or sandbox load.

**Failure mode:** unresolved semantic refs used to fall back to `#000000`, which broke Code.org dark-mode tokens like `text.brand.teal.primary` → `{text.neutral.primary}` (white) when **Apply to app** was enabled.

---

## Color sandbox

| Item | Detail |
|---|---|
| Route | `/design-system/colors` (`ColorSandboxPage.tsx`) |
| Draft storage | `localStorage` `lab2:color-sandbox:doc` (per brand) |
| CodeAI baseline version | `localStorage` `lab2:color-sandbox:doc-version` — bump `COLOR_SANDBOX_CODEAI_BASELINE_VERSION` in `colorSandboxStorage.ts` when `codeAiColorSystem.json` changes so stale CodeAI drafts are discarded |
| Apply to app flag | `localStorage` `lab2:color-sandbox:apply-runtime` |
| Read-only flag | `sessionStorage` `lab2:color-sandbox:read-only` — defaults **on** for deployed hosts and **off** on localhost (`defaultColorSandboxReadOnly()` in `colorSandboxStorage.ts`); toggled via the lock button in the toolbar |
| Runtime bridge | `lib/colorSandbox/colorSandboxRuntime.ts` (initialized in `ThemeProvider`) |
| Shared theme state | Sandbox toolbar + global nav menu (`GlobalNavMenu`) + `Lab2Shell` via `useTheme()` |

Workflow: edit primitives/semantics in sandbox → optionally preview with **Apply to app** → **Export CSS** (one click downloads prod-shaped `primitiveColors.css` + `colors.css`, built by `src/pages/design-system/colorSystemCssExport.ts`). Semantic values reference primitives via `var(--…)`; light block is `:root, [data-theme='Light']`, dark is `[data-theme='Dark']`. Names derive from current sandbox display names (subgroup + family), with `neutral`/`sentiment` flat.

**New stepped primitive families** are pre-seeded with the prod ramp (`5`, `10`, `20`, … `95`) at `UNSET_PRIMITIVE_HEX` (`#00000000`) so authors only pick hex values per step. Unset steps show checkerboard in the canvas and are omitted from `primitiveColors.css` export until filled. Extra in-between steps can be added via the step spectrum insert slots in either the **family inspector** (overview — existing steps shown without a selected chip) or the **step inspector** (select mode — active step highlighted). Use the family inspector **Stepped ramp (5–95)** checkbox to switch a family between stepped and unstepped; toggling preserves existing step labels and hex values (e.g. a stepped family unchecked becomes unstepped with its numeric labels kept as freeform names). **Unstepped families** (`stepped: false`, e.g. `neutral/base` with `white`, `black`, `true-black`) use the family-level **Add token** field instead of the ramp picker.

### Token rationale comments

The sandbox is the source of truth for the inline rationale comments in the exported `colors.css`. Comments live on each `SemanticToken` (`comments: { light?, dark? }` in `colorSystemData.ts`) and are edited per theme in the semantic-token inspector (a small dot marks commented chips). Comments bundled with `codeAiColorSystem.json` are **codified**; comments only present in the localStorage draft are **session** comments (the inspector badge distinguishes the two by comparing against the bundled baseline). Both kinds are emitted by the exporter — there is no hardcoded comment map. To codify session comments, re-export, update `codeAiColorSystem.json`, and bump `COLOR_SANDBOX_CODEAI_BASELINE_VERSION`.

### Read-only mode

On deployed hosts the sandbox loads **read-only** so eng/other teams can explore without accidentally changing values; on localhost it loads editable. The lock control is the first button in the native React Flow canvas controls (bottom-left); click to toggle (persisted per session). Read-only keeps all inspectors and info panels (including comments) visible but hides edit affordances (rename/hex/alpha inputs, add/delete/duplicate, drag-and-drop, scratch tools, Apply to app, Reset); Brand, Mode, and **Export CSS** remain available, and the canvas pans on drag.

### Scratch layer (swatches + text)

The sandbox canvas also hosts a lightweight **scratch layer** for quickly laying colors and text over each other and checking contrast. Add a **Swatch** or **Text** node from the top toolbar; nodes are free-positioned React Flow nodes (`scratchSwatch` / `scratchText`) rendered on the same canvas as the color collections.

| Item | Detail |
|---|---|
| Node model + storage | `src/lib/colorSandbox/scratchLayer.ts` |
| Node components | `src/pages/design-system/ColorScratchNodes.tsx` (`scratchNodeTypes`, `ScratchActionsProvider`) |
| Selection toolbar | `src/pages/design-system/ColorScratchToolbar.tsx` (fill, optional swatch border, + WCAG a11y) |
| Storage | `localStorage` `lab2:color-sandbox:scratch` — **per brand**, **shared across light/dark** |

Behavior notes:

- Scratch nodes persist between light/dark but are scoped per brand (they reload on brand switch and do **not** carry over between Code.org and CodeAI).
- The toolbar exposes **Select** and **Hand tool** canvas tools. Select allows scratch-node selection and movement; Hand tool only pans the canvas and suppresses scratch/collection hit-testing. Selection is React Flow native; **shift+click** multi-selects elements. Collection nodes are `selectable:false`/`draggable:false` so only scratch nodes participate. Selecting a collection element clears scratch selection and vice-versa (only one inspector/toolbar shows at a time).
- The toolbar intentionally surfaces **only** fill color (swatch background / text color, with an optional palette drawn from the current primitives), optional **border color** for swatches (no border by default; pick a color to add one), and accessibility info: a single swatch shows black/white text contrast; two selected elements show the contrast ratio between their fills (via `contrastRatio`/`surfaceColorContrastChecks` in `colorSystemData.ts`); larger selections hide the accessibility section. Multi-selection fill controls are grouped by current color, and the inspector body scrolls internally within a fixed height cap for large selections. Connection handles and the rest of the styling controls are deliberately not shown.
- Reused canvas ops: delete (toolbar or Delete/Backspace when not editing text), duplicate, bring to front, send to back. Z-order is scratch-array order (rendered above collection cards).

---

## Authoring checklist

1. Use `--ds-*` palette-family tokens in SCSS modules (never mapped aliases like `--foreground`).
2. Use `brand-teal` for interactive chrome; `brand-purple` for primary actions.
3. Put brand-wide experiments/remaps in `globals.css`, not per-component `:global([data-brand-theme=…])` overrides.
4. Do not hand-edit `tokens.css`; regenerate from JSON/scripts.
5. Do not add legacy alias emission to sandbox runtime — keep alias/experiment layers in `tokens.css` + `globals.css`.
6. After token pipeline changes, run `npm run typecheck` and `npm run build`.

---

## Key files

| File | Purpose |
|---|---|
| `src/styles/tokens.css` | Generated semantic + primitive CSS variables |
| `src/styles/globals.css` | Aliases, typography, CodeAI active-chrome experiment |
| `src/pages/design-system/colorSystemData.ts` | ColorSystem model, parsing, `semanticHex`, `mergeSemanticRefs` |
| `src/lib/colorSandbox/colorSandboxRuntime.ts` | Apply-to-app CSS injection |
| `src/lib/colorSandbox/colorSandboxStorage.ts` | Draft persistence + built-in merge |
| `src/lib/colorSandbox/scratchLayer.ts` | Scratch swatch/text model + per-brand persistence |
| `src/pages/design-system/ColorScratchNodes.tsx` | Scratch node components + actions context |
| `src/pages/design-system/ColorScratchToolbar.tsx` | Scratch selection toolbar (fill + a11y) |
| `src/hooks/useTheme.tsx` | Brand + mode state |
| `src/components/lab2/Lab2Shell.tsx` | Applies `.dark` on `themeScope` |
| `scripts/generate-tokens.mjs` | Token generator entrypoint |
| `scripts/tokenMigrationMap.md` | Legacy name renames |
