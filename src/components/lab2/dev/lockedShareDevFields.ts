import type { DevPanelField } from "./types";

/** Controls that stay on a locked-level share. Empty means hide the Dev tab. */
export function lockedShareDevFields(
  fields: DevPanelField[] | undefined,
): DevPanelField[] | undefined {
  const kept = fields?.filter((field) => field.lockedShare);
  return kept?.length ? kept : undefined;
}
