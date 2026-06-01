import type { FaBrandIconName } from "../../icons/faBrandsCodepoints";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import type { FaIconFamily } from "./icons/FaIcon";
import {
  getFileTypeIconConfigForPath,
  type FileTypeIconConfig,
} from "../../lib/fileTypeIcons";

function basename(pathOrName: string): string {
  const i = pathOrName.lastIndexOf("/");
  return i >= 0 ? pathOrName.slice(i + 1) : pathOrName;
}

/** Uppercase extension label for the chip subtitle (e.g. HTML, PDF). */
export function fileExtensionLabelFromName(pathOrName: string): string {
  const name = basename(pathOrName);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) {
    return "FILE";
  }
  return name.slice(dot + 1).toUpperCase();
}

export type FileChipIconConfig = FileTypeIconConfig;

/** Icon for a file based on its name / extension. */
export function getFileChipIconConfig(pathOrName: string): FileChipIconConfig {
  return getFileTypeIconConfigForPath(pathOrName);
}

/** @deprecated Use getFileChipIconConfig for brand-aware icons. */
export function faIconForFileName(pathOrName: string): FaIconName {
  return getFileChipIconConfig(pathOrName).name as FaIconName;
}

export function getFileChipIconFamily(pathOrName: string): FaIconFamily {
  return getFileChipIconConfig(pathOrName).family;
}

export function getFileChipIconProps(pathOrName: string): {
  iconName: FaIconName | FaBrandIconName;
  iconFamily: FaIconFamily;
} {
  const icon = getFileChipIconConfig(pathOrName);
  return { iconName: icon.name, iconFamily: icon.family };
}
