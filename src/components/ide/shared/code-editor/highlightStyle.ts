import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * CodeMirror highlight style → dedicated `--ds-syntax-*` tokens.
 * Syntax colors are their own palette (not semantic UI roles); see
 * `scripts/generate-tokens.mjs` SYNTAX_LIGHT / SYNTAX_DARK.
 */
export const dsHighlightStyle = HighlightStyle.define([
  {
    tag: tags.comment,
    color: "var(--ds-syntax-comment)",
    fontStyle: "italic",
  },
  {
    tag: [tags.tagName, tags.standard(tags.tagName)],
    color: "var(--ds-syntax-tag)",
    fontWeight: "var(--font-weight-medium)",
  },
  {
    tag: tags.attributeName,
    color: "var(--ds-syntax-attribute)",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.attributeValue],
    color: "var(--ds-syntax-string)",
  },
  {
    tag: [
      tags.keyword,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.operatorKeyword,
    ],
    color: "var(--ds-syntax-keyword)",
    fontWeight: "var(--font-weight-medium)",
  },
  { tag: tags.number, color: "var(--ds-syntax-number)" },
  {
    tag: [
      tags.punctuation,
      tags.bracket,
      tags.separator,
      tags.operator,
      tags.angleBracket,
    ],
    color: "var(--ds-syntax-punctuation)",
  },
  {
    tag: [
      tags.className,
      tags.definition(tags.className),
      tags.labelName,
      tags.typeName,
    ],
    color: "var(--ds-syntax-selector)",
    fontWeight: "var(--font-weight-medium)",
  },
  {
    tag: [tags.propertyName, tags.definition(tags.propertyName)],
    color: "var(--ds-syntax-property)",
  },
  {
    tag: tags.literal,
    color: "var(--ds-syntax-value)",
  },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName), tags.variableName],
    color: "var(--ds-syntax-value)",
  },
  {
    tag: tags.meta,
    color: "var(--ds-syntax-comment)",
  },
  {
    tag: tags.link,
    color: "var(--ds-syntax-value)",
    textDecoration: "underline",
  },
  {
    tag: tags.heading,
    color: "var(--ds-syntax-keyword)",
    fontWeight: "var(--font-weight-semibold)",
  },
  {
    tag: tags.invalid,
    color: "var(--ds-syntax-property)",
  },
]);
