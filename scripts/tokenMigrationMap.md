# Token migration map (CodeAI)

Historical rename table for the Code.org → CodeAI rebrand. Generator, Figma, and exporter now share one naming contract via `semanticTokenCssName` / `semanticExportVarName`.

## Structural renames

| Old (Code.org / dual-brand) | New (CodeAI) |
|---|---|
| `--ds-borders-*` | `--ds-border-*` |
| `--ds-*-brand-purple-*` | `--ds-*-brand-*` (family collapsed) |
| `--ds-*-brand-teal-*` / `--ds-*-brand-aqua-*` | `--ds-*-selected-*` (active chrome) or `--ds-*-brand-*` (actions) |
| `--ds-background-pink-*` / `--ds-background-orange-*` | `--ds-background-accent-pink-*` / `--ds-background-accent-orange-*` |
| `--ds-background-alpha-*` | `--ds-background-neutral-alpha-*` |
| `--ds-*-extra-light` | `--ds-*-light` (or `mid` where appropriate) |
| `--ds-background-neutral-lab` | `--ds-background-neutral-primary` |
| `--ds-text-neutral-inverse` | `--ds-text-neutral-primary-inverse` |
| `--elevation-sm` | `--shadow-lg` |

## Role guidance

| UI role | Token family |
|---|---|
| Primary buttons, links, global header | `brand` |
| Segmented / chip / checkbox / tab / menu selected | `selected` |
| Focus rings | `focused` (+ outline mixin) |

## Regenerating

```bash
node scripts/generate-tokens.mjs
```

Source: `src/pages/design-system/tokens/codeAiColorSystem.json` → `src/styles/tokens.css` (`:root` / `.dark` only).
