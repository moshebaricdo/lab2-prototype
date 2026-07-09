import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * Syntax highlight style mapping Lezer tags to design-system color tokens.
 *
 * Uses `*-fixed` brand color tokens so the editor reads consistently in both
 * light and dark themes (the editor surface uses fixed colors, not theme-mapped).
 */
export const dsHighlightStyle = HighlightStyle.define([
  {
    tag: tags.comment,
    color: "color-mix(in srgb, var(--ds-text-neutral-quaternary) 82%, transparent)",
    fontStyle: "italic",
  },
  {
    tag: [tags.tagName, tags.standard(tags.tagName)],
    color: "var(--ds-text-brand-primary-fixed)",
    fontWeight: "var(--font-weight-medium)",
  },
  {
    tag: tags.attributeName,
    color: "var(--ds-text-selected-primary)",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.attributeValue],
    color: "var(--ds-text-success-primary-fixed)",
  },
  {
    tag: tags.keyword,
    color: "var(--ds-text-brand-primary-fixed)",
    fontWeight: "var(--font-weight-medium)",
  },
  { tag: tags.number, color: "var(--ds-text-info-primary-fixed)" },
  {
    tag: [
      tags.punctuation,
      tags.bracket,
      tags.separator,
      tags.operator,
      tags.angleBracket,
    ],
    color: "color-mix(in srgb, var(--ds-text-neutral-secondary) 72%, transparent)",
  },
  {
    tag: [tags.className, tags.definition(tags.className), tags.labelName],
    color: "var(--ds-text-selected-primary)",
    fontWeight: "var(--font-weight-medium)",
  },
  {
    tag: [tags.propertyName, tags.definition(tags.propertyName)],
    color: "var(--ds-text-brand-secondary)",
  },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName), tags.variableName],
    color: "var(--ds-text-info-primary-fixed)",
  },
]);
