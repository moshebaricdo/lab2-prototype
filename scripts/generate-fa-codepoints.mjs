/**
 * Regenerates src/icons/faProRegularCodepoints.ts from @fortawesome icon packages.
 * Codepoints match FA Solid webfont. Run: npm run generate:fa-codepoints
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as solid from "@fortawesome/free-solid-svg-icons";
import * as brands from "@fortawesome/free-brands-svg-icons";
import * as regular from "@fortawesome/free-regular-svg-icons";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const out = {};

function add(pack) {
  for (const key of Object.keys(pack)) {
    const def = pack[key];
    if (
      def &&
      typeof def === "object" &&
      def.iconName &&
      def.icon &&
      Array.isArray(def.icon) &&
      def.icon[3]
    ) {
      out[def.iconName] = def.icon[3];
    }
  }
}

add(solid);
add(brands);
add(regular);

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
 * Unicode codepoints (hex, no "0x") for Font Awesome 7 Pro Solid webfont.
 * Generated from @fortawesome/free-solid-svg-icons, free-regular-svg-icons, and free-brands-svg-icons
 * metadata (same codepoints FA uses across styles). Regenerate: \`npm run generate:fa-codepoints\`.
 */
`;

const body = `export const FA_PRO_REGULAR_CODEPOINTS = {
${lines.join("\n")}
} as const;

export type FaIconName = keyof typeof FA_PRO_REGULAR_CODEPOINTS;

export function getFaProRegularCodepoint(name: FaIconName): string {
  return FA_PRO_REGULAR_CODEPOINTS[name];
}
`;

fs.writeFileSync(
  path.join(root, "src/icons/faProRegularCodepoints.ts"),
  header + body,
);

console.log(`Wrote ${lines.length} icons to src/icons/faProRegularCodepoints.ts`);
