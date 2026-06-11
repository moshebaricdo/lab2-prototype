import type { BackpackItem } from "../../types/backpack";
import { isAgentBackpackItem } from "./agentBackpack";
import { canImportBackpackItemToLab } from "./backpackImportAllowlist";

function imageSrcFromBackpackItem(item: BackpackItem): string | undefined {
  if (item.thumbnailSrc?.startsWith("data:image/")) {
    return item.thumbnailSrc;
  }
  if (item.content.startsWith("data:image/")) {
    return item.content;
  }
  return undefined;
}

export function importBackpackItemToSketch(
  item: BackpackItem,
  addImage: (src: string) => void,
): true | string {
  if (isAgentBackpackItem(item)) {
    return "Agents cannot be added to the sketch canvas.";
  }
  if (!canImportBackpackItemToLab(item, "sketch-lab")) {
    return "Not supported in this lab";
  }

  const src = imageSrcFromBackpackItem(item);
  if (!src) {
    return "This image could not be loaded onto the canvas.";
  }

  addImage(src);
  return true;
}
