# CodeAI semantic variables proposal (draft)

**Status:** Proposal for discussion — not adopted.  
**Scope:** CodeAI theme.

**Path shape:** `{surface}/{subgroup}/{family}/{role}` → `--ds-{surface}-{subgroup}-{family}-{role}`

**Ramp roles:** `extra-light`, `light`, `primary`, `strong` — `primary` is the default / reference (~level 50) step of a family.

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
- **`state/selected` not `brand/selected`.** Selected is a UI state, not a brand hue: cross-hue, mode-inverted, and its background/text/borders tokens are a **coupled set** used together. Keeps `brand` pure and leaves room for future states (`hover`, `pressed`, …).
- **`accent/orange`, `accent/pink`** — named by hue because accents are role-less (the hue is the identity). Abstraction only pays off for role-ful, rebrand-prone tokens like `brand`.

### Grammar invariants

The second name segment is a **flat namespace** of eight: `neutral, brand, accent, state, error, warning, success, info`.

1. **Global uniqueness** — nothing new (subgroup or sentiment family) may reuse a name already in that set.
2. **Variable depth** — the second segment does not signal depth. Subgroups are followed by a family (`accent-orange-…`, `state-selected-…`); collapsed/self-evident families are followed directly by a role (`brand-primary`, `neutral-primary`, `error-primary`).

If a real second brand hue is ever introduced, `brand` re-expands to named families — a deliberate, additive change.

Primitive refs and light/dark values are defined per token in the brand semantic source.

---

## All tokens (99)

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
--ds-borders-neutral-primary
--ds-borders-neutral-secondary
--ds-borders-neutral-solid
--ds-borders-neutral-disabled
--ds-borders-brand-primary
--ds-borders-brand-light
--ds-borders-brand-strong
--ds-borders-state-selected-primary
--ds-borders-error-primary
--ds-borders-error-light
--ds-borders-error-strong
--ds-borders-warning-primary
--ds-borders-warning-light
--ds-borders-warning-strong
--ds-borders-success-primary
--ds-borders-success-light
--ds-borders-success-strong
--ds-borders-info-primary
--ds-borders-info-light
--ds-borders-info-strong
```
