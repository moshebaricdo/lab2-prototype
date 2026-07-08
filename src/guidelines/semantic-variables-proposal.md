# CodeAI semantic variables proposal (draft)

**Status:** Proposal for discussion — not adopted.  
**Scope:** CodeAI theme.

**Path shape:** `{surface}/{subgroup}/{family}/{role}` → `--ds-{surface}-{subgroup}-{family}-{role}`

**Ramp roles:** `light`, `mid`, `primary`, `strong` — `primary` is the reference step of a family (canonical 50 where contrast allows; see value-mapping decisions below).

## Subgroups

Conceptual grouping (Figma / docs). Not every subgroup appears in the variable name — see collapse rule below.

| Subgroup | Families | Nature |
|----------|----------|--------|
| `neutral` | grays (ordinal ladder), `alpha` | emphasis / surfaces |
| `brand` | one brand hue (unnamed) | brand color |
| `accent` | `orange`, `pink` | decorative hues (no designated role) |
| `sentiment` | `error`, `warning`, `success`, `info` | status hues |
| `state` | `selected` | interaction states (may cross hues / invert per mode) |

## Naming rules

- **`primary` = reference ramp step.** Neutrals keep the ordinal ladder (`primary`, `secondary`, `tertiary`…); chromatic families keep `primary` as the identity step. No family is named `primary`, so there is no `primary-primary` collision.
- **Collapse rule — the family segment is omitted when a subgroup has a single, self-evident family.** So `brand` (one brand hue) and `neutral` grays collapse to `--ds-…-brand-primary` / `--ds-…-neutral-primary`. `accent` keeps hue names (two families to disambiguate); `state` keeps `selected`.
- **Sentiment is flat.** `error / warning / success / info` are self-identifying, so the `sentiment` subgroup is not in the name. `accent` stays in the name because `orange` alone doesn't signal "decorative."
- **`state/selected` not `brand/selected`.** Selected is a UI state, not a brand hue: cross-hue, mode-inverted, and its background/text/border tokens are a **coupled set** used together. Keeps `brand` pure and leaves room for future states (`hover`, `pressed`, …).
- **`accent/orange`, `accent/pink`** — named by hue because accents are role-less (the hue is the identity). Abstraction only pays off for role-ful, rebrand-prone tokens like `brand`.

### Grammar invariants

The second name segment is a **flat namespace** of eight: `neutral, brand, accent, state, error, warning, success, info`.

1. **Global uniqueness** — nothing new (subgroup or sentiment family) may reuse a name already in that set.
2. **Variable depth** — the second segment does not signal depth. Subgroups are followed by a family (`accent-orange-…`, `state-selected-…`); collapsed/self-evident families are followed directly by a role (`brand-primary`, `neutral-primary`, `error-primary`).

If a real second brand hue is ever introduced, `brand` re-expands to named families — a deliberate, additive change.

Primitive refs and light/dark values are defined per token in the brand semantic source.

---

## Value-mapping decisions (from sandbox export)

These are deliberate choices, not accidents. Do not "normalize" them away.

### Ramp roles

Chromatic ramps use `light` (~step 5–10), `mid` (~step 30), `primary`, `strong`. `mid` replaces the old `extra-light`/`light` pair's middle ground for tinted fills and mid-weight borders.

### `primary` steps vary per family — by contrast requirement, not aesthetics

The rule: **each token uses the most brand-canonical step that satisfies its function's contrast bar.** This intentionally produces different step numbers across families and surfaces:

| Family | Background `primary` | Why |
|--------|---------------------|-----|
| error, pink, brand | step 50 | ramps tuned so white text passes 4.5:1 at 50 |
| success, info | step 70 | white text fails at their 50; labels on fills must never flip to black (design decision) |
| warning | step 50 | **exception: warning fills take `text-neutral-black-fixed`**, never white (white = ~1.7:1, black = ~11:1) |
| orange | step 50 | **intentional accessibility exception.** Orange exists almost solely for the **Run button**, where the hue is deeply entrenched for young learners and matches Blockly's "run" block color. Darkening turned to mud; changing hue was a non-starter. White text is ~3.1:1 — accepted for this one association-critical control. Do not extend orange fills to new text-bearing surfaces. |

### Backgrounds assume white labels

Any filled `background/{family}/primary` or `strong` is paired with `text-neutral-white-fixed` (warning and orange excepted, above). Palette edits must preserve ≥4.5:1 for white on every filled background **resting** token. **Hover states are exempt:** contrast is enforced on the resting state only; a transient hover value may dip below 4.5:1.

### `strong` = hover/emphasis, defined relatively and mode-inverted

- **Light mode:** hover **darkens** — `strong` = resting +2 steps (50→70, or 70→90 where primary is 70).
- **Dark mode:** hover **lightens** — `strong` = resting −1 step. The inverse direction per mode is intentional (hover moves *away* from the surface in both modes).
- The perceived invariant is the *magnitude* of the shift, not the destination step; never pin all hovers to a shared absolute step (that's what caused the old 70→40 "green lurch").
- Accepted consequence: some dark-mode hover values fall below 4.5:1 with white text (see hover exemption above).

### Borders keep the canonical 50

`border/{family}/primary` stays at step 50 even where the background moved to 70. Borders are bound by the 3:1 non-text bar (WCAG 1.4.11), not 4.5:1 — and only when functional (input outlines, focus). Decorative borders (`light`, `mid` on tinted containers) are exempt. Note success-50 and warning-50 do **not** pass 3:1 on white; functional borders in those hues must use `strong`.

### Text `primary` vs `primary-fixed`

`text/{family}/primary` is adaptive: chromatic in light mode → **white** in dark mode (labels on dark surfaces stay white). `primary-fixed` stays chromatic in both modes — its dark value may sit a step lighter than 50 for contrast (e.g. error-fixed dark = 40). `-fixed` is a semantic contract ("doesn't flip to white"), not a synonym for the primitive 50; components must not reach into primitives to bypass it.

### Brand is mode-stable

`background/brand/primary` holds step 50 in both modes (white text ~7:1). The brand hue does not invert or lighten in dark mode.

### `state/selected` — the coupled, mode-inverted set

| Token | Light | Dark |
|-------|-------|------|
| `background/state/selected/primary` | brand step 80 (dark navy-purple) | seafoam (success step 5) |
| `text/state/selected/primary` | seafoam | brand step 95 (navy) |
| `border/state/selected/*` | matches background | matches background |
| `…/selected/strong` | brand step 95 | success step 20 |

These three surfaces are a **set** — always used together, never mixed with other text/border tokens. Contrast is ~9.5:1 light / ~11.7:1 dark. This is the one place semantics deliberately cross hue families and invert per mode; it lives under `state`, not `brand`, for exactly that reason.

### Level 50s that fell out of product use

Where `primary` moved to 70 (success, info), the guideline-canonical 50 remains **primitive-only**. No "true-primary" semantic exists; if a real use case appears (data-viz, decorative), add a token named for that intent.

---

## All tokens (99)

> Note: this list predates the `extra-light`/`light` → `light`/`mid` role rename and the selected-state additions from the sandbox export; treat the export as the source of truth for roles and values, this list for structure and naming.

### Background (53)

```
--ds-background-neutral-primary
--ds-background-neutral-primary-inverse
--ds-background-neutral-secondary
--ds-background-neutral-tertiary
--ds-background-neutral-quaternary
--ds-background-neutral-quinary
--ds-background-neutral-senary
--ds-background-neutral-septenary
--ds-background-neutral-octonary
--ds-background-neutral-disabled
--ds-background-neutral-white-fixed
--ds-background-neutral-black-fixed
--ds-background-neutral-true-base
--ds-background-alpha-5
--ds-background-alpha-10
--ds-background-alpha-20
--ds-background-alpha-30
--ds-background-alpha-40
--ds-background-alpha-50
--ds-background-alpha-60
--ds-background-alpha-70
--ds-background-alpha-80
--ds-background-alpha-90
--ds-background-alpha-95
--ds-background-brand-extra-light
--ds-background-brand-light
--ds-background-brand-primary
--ds-background-brand-strong
--ds-background-accent-orange-extra-light
--ds-background-accent-orange-light
--ds-background-accent-orange-primary
--ds-background-accent-orange-strong
--ds-background-accent-pink-extra-light
--ds-background-accent-pink-light
--ds-background-accent-pink-primary
--ds-background-accent-pink-strong
--ds-background-state-selected-primary
--ds-background-error-extra-light
--ds-background-error-light
--ds-background-error-primary
--ds-background-error-strong
--ds-background-warning-extra-light
--ds-background-warning-light
--ds-background-warning-primary
--ds-background-warning-strong
--ds-background-success-extra-light
--ds-background-success-light
--ds-background-success-primary
--ds-background-success-strong
--ds-background-info-extra-light
--ds-background-info-light
--ds-background-info-primary
--ds-background-info-strong
```

### Text (26)

```
--ds-text-neutral-primary
--ds-text-neutral-secondary
--ds-text-neutral-tertiary
--ds-text-neutral-quaternary
--ds-text-neutral-disabled
--ds-text-neutral-disabled-inverse
--ds-text-neutral-placeholder
--ds-text-neutral-primary-inverse
--ds-text-neutral-white-fixed
--ds-text-neutral-black-fixed
--ds-text-brand-primary
--ds-text-brand-secondary
--ds-text-brand-primary-fixed
--ds-text-state-selected-primary
--ds-text-error-primary
--ds-text-error-secondary
--ds-text-error-primary-fixed
--ds-text-warning-primary
--ds-text-warning-secondary
--ds-text-warning-primary-fixed
--ds-text-success-primary
--ds-text-success-secondary
--ds-text-success-primary-fixed
--ds-text-info-primary
--ds-text-info-secondary
--ds-text-info-primary-fixed
```

### Borders (20)

```
--ds-border-neutral-primary
--ds-border-neutral-secondary
--ds-border-neutral-solid
--ds-border-neutral-disabled
--ds-border-brand-primary
--ds-border-brand-light
--ds-border-brand-strong
--ds-border-state-selected-primary
--ds-border-error-primary
--ds-border-error-light
--ds-border-error-strong
--ds-border-warning-primary
--ds-border-warning-light
--ds-border-warning-strong
--ds-border-success-primary
--ds-border-success-light
--ds-border-success-strong
--ds-border-info-primary
--ds-border-info-light
--ds-border-info-strong
```
