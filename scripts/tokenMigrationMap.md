# Token migration map (Code.org legacy → canonical names)

Applied during CodeAI theme migration. For **how the full theming stack works** (cascade layers, sandbox boundaries, CodeAI active-chrome experiment, semantic resolution), read **`src/guidelines/color-theming.md`** first.

Code.org base tokens in `tokens.css` are unchanged; component styles reference palette-family tokens (`brand-teal`, `brand-purple`, `brand-aqua`, etc.) that resolve to brand-specific values via `data-brand-theme` + `globals.css` remaps.

## Code.org vs CodeAI brand roles

| UI role | Code.org token family | CodeAI effective appearance |
|---|---|---|
| Chrome / nav / active / focus / selection | `brand-teal` | Neutral inverse (via `globals.css` active-chrome remap of `brand-teal-*`) |
| Primary actions / CTAs | `brand-purple` | `brand-purple` |
| AI / diff highlights (legacy) | `brand-aqua` | Neutral inverse (same remap as teal on CodeAI) |

`tokens.css` CodeAI blocks alias `brand-teal-*` and `brand-aqua-*` to `brand-purple-*` at generation time. **`globals.css` then remaps those families again on CodeAI** for the active-state experiment — components should still author against `brand-teal` for chrome.

`globals.css` keeps the historical Code.org split: `--primary` → purple (actions), `--accent` / `--ring` / `--sidebar-accent` → teal (interactive chrome). On CodeAI, `--accent` / `--ring` follow the active-chrome experiment variables.

## Renames from legacy Code.org names

| Legacy token family | Canonical replacement | Notes |
|---|---|---|
| `--ds-*-accent-strawberry-*` | `--ds-*-brand-pink-*` | Pink is a brand family in CodeAI |
| `--ds-*-accent-orange-*` | `--ds-*-brand-orange-*` | Orange is a brand family in CodeAI |
| `--ds-text-neutral-inverse` | `--ds-text-neutral-primary-inverse` | Renamed neutral role; Code.org base also emits `primary-inverse` as an alias of `inverse` |
| `--ds-borders-neutral-light` | `--ds-borders-neutral-secondary` | CodeAI uses secondary, not light |
| `--ds-borders-neutral-strong` | `--ds-borders-neutral-secondary` | Gray control borders (buttons, dropdowns, fields); Code.org base also emits `secondary` as an alias of `strong` |
| `--ds-background-neutral-lab` | `--ds-background-neutral-primary` | Lab surface → primary |

Do **not** bulk-replace `brand-teal` → `brand-purple` in component styles; that collapses Code.org's two-color brand model. Use `brand-teal` for interactive chrome and `brand-purple` for actions.

Syntax tokens (`--ds-syntax-*`) remain Code.org-only until a CodeAI syntax palette is defined.
