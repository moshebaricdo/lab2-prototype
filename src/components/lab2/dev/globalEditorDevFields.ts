import type { DevPanelField } from "./types";
import { EDITOR_READ_ONLY_STORAGE_KEY } from "../../../hooks/useEditorReadOnly";

/**
 * Dev panel fields that apply to every workspace-style level (Web Lab 2,
 * Python Lab, etc.). Spread these into a level's local field array so the
 * toggles show up alongside workspace controls without per-level wiring.
 */
export const globalEditorDevFields: DevPanelField[] = [
  {
    key: EDITOR_READ_ONLY_STORAGE_KEY,
    label: "Read only",
    description: "Lock editing in the code editor. This setting is encoded in share links.",
    type: "boolean",
    group: "Workspace",
  },
];
