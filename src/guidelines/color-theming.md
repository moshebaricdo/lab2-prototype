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
| Primary actions / CTAs / header / links | `brand` | `--ds-background-brand-primary`, `--ds-text-brand-primary` |
| Selected **filled** chrome (segmented, chips, checkbox, menu items on selected fill) | `state/selected` | `--ds-background-selected-primary` + `--ds-text-selected-primary` |
| Active chrome **without** a selected fill (tab rail icons, light-tint callouts) | `brand` text | `--ds-text-brand-primary` |
| Focus rings | `state/focused` via outline mixin | `--ds-border-focused-primary` |

**`--ds-text-selected-primary` is for foreground on a selected fill** (dark selected background in light mode). Do not use it on white / unfilled / light-tint surfaces — use `--ds-text-brand-primary` instead.

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

- **Typography:** Space Grotesk (H1–H2) / Geist (body + H3–H6) / Google Sans Code; full CADS text styles via `AppText` + `_typography.scss` — see [`typography.md`](typography.md); sandbox `/design-system/typography`
- **Radii:** `--radius-sm` 6 / `--radius-md` 8 / `--radius-lg` 10 / `--radius-round` 999
- **Spacing:** `--space-xxs`…`--space-xxxl` (forward-use; no layout retrofit)
- **Shadows:** `--shadow-sm` / `--shadow-md` / `--shadow-lg`
- **Focus:** `focus-ring` mixin = 2px outline + 2px offset (Figma focus shadow is design-only)

## Syntax highlighting

`--ds-syntax-*` is a **separate** palette (hand-maintained in `scripts/generate-tokens.mjs`), not semantic UI roles. CodeMirror (`highlightStyle.ts`) and `.syntax-*` classes in `globals.css` consume these tokens. Colors sit near brand/accent hues for familiarity but prioritize contrast and role separation — do not remap syntax to `--ds-text-brand-*` / `--ds-text-selected-*`.

## Color sandbox

Route `/design-system/colors`. Single CodeAI document in `localStorage` (`lab2:color-sandbox:doc`). Light/dark via shared `useTheme()`. Export CSS and optional **Apply to app** remain. Bump `COLOR_SANDBOX_CODEAI_BASELINE_VERSION` when `codeAiColorSystem.json` changes.

## Standalone CADS packages

The Lab2 sandbox keeps its local `App*` atoms and committed `codeAiColorSystem.json` for exploration. Packaged CADS is published from **`moshebaricdo/cads`** to GitHub Packages:

| Package | Role |
|---|---|
| `@moshebaricdo/cads-variables` | Canonical variables document + generated `variables.css` / MUI theme |
| `@moshebaricdo/cads-react` | MUI-wrapped components + icons (`/icons` subpath) |

Installed here as `@moshebaricdo/cads-react` / `@moshebaricdo/cads-variables` `^0.1.2` from `https://npm.pkg.github.com`. Parity route: **`/design-system/cads`**. New prototypes may opt into the packages; do not big-bang replace `App*`.

**Foundations on Lab2 CADS surfaces:** `Lab2Shell` → `CadsLabProvider` loads `@moshebaricdo/cads-variables/variables.css`. Lab2 chrome (header, resource panel, IDE, assessment, dev panel) uses **unprefixed** Foundations names (`--background-neutral-primary`, `--shape-sm`, …). Color sandbox and teacher dashboard may still use generated `--ds-*` from `tokens.css`. Prefer Foundations names on any new CADS-backed surface.

**Dark mode:** `useTheme` sets `document.documentElement` `data-theme` and toggles the `.dark` class. CADS requires `.dark` (or `[data-theme='Dark']`) on an ancestor; portaled Dropdown/Tooltip menus render under `body`, so the html `.dark` class is what themes them.

When promoting a color-sandbox export to the platform SoT, copy/merge into `../cads/packages/variables/src/data/codeAiColorSystem.json` and run `pnpm generate:variables` in that repo (or `pnpm figma:sync`). The Lab2 `figma-color-sync` skill remains valid for sandbox-local sync; the cads `tooling/figma-sync` script is the long-term home.

## Authoring checklist

1. On CADS-migrated surfaces, use Foundations vars (unprefixed). Elsewhere use `--ds-*` — never `--foreground` / `--accent` / etc.
2. Use `brand` for actions; `selected` for active chrome; `focused` for focus rings.
3. Prefer CADS typography via `AppText` / `_typography.scss` mixins (see `typography.md`) over raw px or unitless line-heights.
4. After editing `codeAiColorSystem.json`, regenerate tokens and bump the sandbox baseline version.
