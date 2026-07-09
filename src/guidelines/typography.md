# Typography (CADS)

Source of truth: [CodeAI Design System — Typography](https://www.figma.com/design/DGekOeToRVifvFAhfqpeC1/CodeAI-Design-System--CADS-?node-id=15722-18149) (60 local text styles + Typography variable collection).

## How to use type in this repo

1. **JSX content / copy** — prefer [`AppText`](../components/ui/AppText.tsx):

```tsx
<AppText variant="heading-h3" weight="semibold" as="h3">Title</AppText>
<AppText variant="body-2" weight="regular">Paragraph</AppText>
<AppText variant="overline-2">Section</AppText>
<AppText variant="label-3">Field label</AppText>
<AppText variant="mono-3" weight="regular">code</AppText>
```

2. **SCSS chrome** (buttons, fields, dense UI) — `@include` mixins from [`_typography.scss`](../styles/_typography.scss) (also forwarded from `_mixins.scss`):

```scss
@use "../../styles/_typography.scss" as *;

.title {
  @include type-heading-h4-semibold;
}
```

3. **Do not** compose raw `font-size` + unitless `line-height` when a CADS style exists. Prefer mixins / `AppText` so family, weight, size, line-height, and letter-spacing stay 1:1 with Figma.

## Catalog (summary)

| Category | Variants | Family | Notes |
|---|---|---|---|
| Heading H1–H2 | bold / semibold / regular | Space Grotesk | Semi Bold → **Medium (500)**; tracking −1% |
| Heading H3–H6 | bold / semibold / regular | Geist | Semi Bold = 600 |
| Body 1–5 | bold / semibold / regular | Geist | 18→10px with paired px leadings |
| Overline 1–3 | fixed semibold | Geist | UPPERCASE; tracking +8% |
| Label 1–4 | fixed semibold | Geist | 16→10px |
| Link 1–5 | fixed semibold + underline | Geist | Prefer `AppLink` for interactive links |
| Mono 1–5 | bold / semibold / regular | Google Sans Code | Labs only |

Body 4 / Label 3 / Link 4 / Mono 4 all weights share `18px` line-height (`--leading-body-xs`).

## Tokens (`globals.css`)

- Sizes: `--text-heading-xxl`…`xs`, `--text-body-lg`…`xxs`
- Leadings: `--leading-heading-*`, `--leading-body-*` (`--leading-body-xs-semibold` aliases `--leading-body-xs`)
- Tracking: `--tracking-heading-display`, `--tracking-overline`, `--tracking-none`
- Weights: `--font-weight-bold|semibold|medium|normal`
- Families: `--font-heading|body|mono`

Legacy aliases (`--text-h1`, `--text-base`, `--text-label`, …) remain for migration; new code should use heading/body names or mixins.

## Sandbox

Route: `/design-system/typography` — catalog of all 60 styles in the color-sandbox frame (brand header + inspector sidebar). Select a style to inspect specs and `AppText` / mixin usage; double-click a specimen to edit sample text in place. Header links Color ↔ Typography; logo returns to `/levels`. Export CSS is a non-functional placeholder for now.

## Related

- Color tokens stay in `tokens.css` / color sandbox — typography does not own color.
- Interactive links: [`AppLink`](../components/ui/AppLink.tsx) (hover underline behavior) vs `AppText variant="link-*"` (always underlined specimen style).
