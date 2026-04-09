/**
 * Extracts all icon name → Unicode codepoint mappings directly from the
 * Font Awesome Pro OTF font file. No dependency on @fortawesome npm packages.
 *
 * Run: npm run generate:fa-codepoints
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const FONT_PATH = path.join(
  root,
  "src/assets/fonts/font-awesome-7-pro-solid-900.otf",
);

const font = opentype.loadSync(FONT_PATH);
const glyphs = font.glyphs;
const out = {};

for (let i = 0; i < glyphs.length; i++) {
  const glyph = glyphs.get(i);
  if (!glyph.name || !glyph.unicode) continue;

  const name = glyph.name;
  const hex = glyph.unicode.toString(16).toLowerCase();

  // Skip non-icon glyphs (control chars, basic ASCII, .notdef, etc.)
  if (glyph.unicode < 0x21) continue;
  if (name === ".notdef" || name === ".null" || name === "nonmarkingreturn")
    continue;

  out[name] = hex;
}

const sorted = Object.keys(out)
  .sort()
  .reduce((acc, k) => {
    acc[k] = out[k];
    return acc;
  }, {});

const lines = Object.entries(sorted).map(
  ([name, hex]) => `  ${JSON.stringify(name)}: "${hex}",`,
);

const header = `/**
 * Unicode codepoints (hex, no "0x") for every glyph in the Font Awesome 7 Pro Solid font.
 * Auto-generated from src/assets/fonts/font-awesome-7-pro-solid-900.otf
 * Regenerate: \`npm run generate:fa-codepoints\`
 */
`;

const body = `export const FA_PRO_SOLID_CODEPOINTS = {
${lines.join("\n")}
} as const;

export type FaIconName = keyof typeof FA_PRO_SOLID_CODEPOINTS;

export function getFaCodepoint(name: FaIconName): string {
  return FA_PRO_SOLID_CODEPOINTS[name];
}
`;

fs.writeFileSync(
  path.join(root, "src/icons/faProRegularCodepoints.ts"),
  header + body,
);

console.log(
  `Wrote ${lines.length} icons to src/icons/faProRegularCodepoints.ts`,
);
