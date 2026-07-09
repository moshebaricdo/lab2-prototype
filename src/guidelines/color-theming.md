# Color & Theming (CodeAI)

Single-brand token cascade for the Lab2 prototype. CodeAI is the only theme; light/dark mode remains.

## Runtime theme

| Concern | Storage | DOM |
|---|---|---|
| Light / dark | `sessionStorage` `lab2:theme` | `.dark` + `data-theme` on `Lab2Shell` `themeScope` (and sandbox page root) |

Default mode is **light**. Brand switchers and `data-brand-theme` / active-chrome experiments have been removed.

## Token cascade

```
1. tokens.css                     ← generated --ds-* hexes (:root / .dark)
2. globals.css                    ← typography, radii, spacing, shadows, Tailwind aliases
3. Component *.module.scss        ← use --ds-* directly (not mapped aliases)
4. Optional sandbox runtime <style>  ← Apply to app preview only
```

| Layer | Owns | Does not own |
|---|---|---|
| **`tokens.css`** (via `scripts/generate-tokens.mjs`) | Resolved `--ds-*` hex from `codeAiColorSystem.json` | UI intent |
| **`globals.css`** | Fonts, type scale, radii, spacing, shadows; shorthand aliases for Tailwind `@theme` only | Replacing semantic hexes |
| **Components** | Which token role to use (`brand` for actions, `selected` for active chrome) | Brand-specific overrides |

**Rule:** Sandbox preview injects **resolved semantic values only** into `:root` / `.dark`.

## Selected vs brand (CADS pattern)

| UI role | Token family | Example |
|---|---|---|
| Primary actions / CTAs / header | `brand` (collapsed; purple under the hood) | `--ds-background-brand-primary` |
| Selected / active chrome (segmented, chips, checkbox, tabs, menu items) | `state/selected` | `--ds-background-selected-primary` |
| Focus rings | `state/focused` via outline mixin | `--ds-border-focused-primary` |

Do **not** paint selected surfaces with brand fills. Reuse the Segmented Button selected recipe everywhere.

## Naming contract (generator ↔ Figma ↔ exporter)

One structure across all three:

- Brand family collapsed: `background-brand-primary` (not `background-brand-purple-primary`)
- Borders singular: `border-*` (sandbox surface id remains `borders`)
- Flat `state` / `sentiment`: `background-selected-primary`, `background-error-primary`
- Accents keep subgroup: `background-accent-pink-primary`
- Alphas under neutral: `background-neutral-alpha-5`

Shared implementation: `semanticTokenCssName` in `colorSystemData.ts` (used by exporter + mirrored in `scripts/colorSystemToCss.mjs`).

## Token pipeline

```
src/pages/design-system/tokens/codeAiColorSystem.json   → committed source
scripts/colorSystemToCss.mjs                            → flat --ds-* map
scripts/generate-tokens.mjs                             → src/styles/tokens.css
```

Regenerate:

```bash
node scripts/generate-tokens.mjs
```

Syntax highlighting (`--ds-syntax-*`) is hand-maintained in the generator until a CodeAI syntax palette exists.

## Non-color tokens (`globals.css`)

From CADS Figma (`typography`, `spacing-shape`, effect styles):

- **Typography:** Space Grotesk (H1–H2) / Geist (body + H3–H6) / Google Sans Code; heading + body size/leading ramps; legacy `--text-h1` etc. alias the new tokens
- **Radii:** `--radius-sm` 6 / `--radius-md` 8 / `--radius-lg` 10 / `--radius-round` 999
- **Spacing:** `--space-xxs`…`--space-xxxl` (forward-use; no layout retrofit)
- **Shadows:** `--shadow-sm` / `--shadow-md` / `--shadow-lg`
- **Focus:** `focus-ring` mixin = 2px outline + 2px offset (Figma focus shadow is design-only)

## Color sandbox

Route `/design-system/colors`. Single CodeAI document in `localStorage` (`lab2:color-sandbox:doc`). Light/dark via shared `useTheme()`. Export CSS and optional **Apply to app** remain. Bump `COLOR_SANDBOX_CODEAI_BASELINE_VERSION` when `codeAiColorSystem.json` changes.

## Authoring checklist

1. Use `--ds-*` in component SCSS — never `--foreground` / `--accent` / etc.
2. Use `brand` for actions; `selected` for active chrome; `focused` for focus rings.
3. Prefer typography / radius / shadow tokens from `globals.css` over raw px.
4. After editing `codeAiColorSystem.json`, regenerate tokens and bump the sandbox baseline version.
