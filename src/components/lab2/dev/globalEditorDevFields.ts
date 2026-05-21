import type { DevPanelField } from "./types";
import { EDITOR_READ_ONLY_STORAGE_KEY } from "../../../hooks/useEditorReadOnly";
import { INITIAL_OPEN_FILES_DEV_KEY } from "../../../lib/editor/initialOpenFiles";

/**
 * Dev panel fields that apply to every workspace-style level (Web Lab 2,
 * Python Lab, etc.). Spread these into a level's local field array so the
 * toggles show up alongside workspace controls without per-level wiring.
 *
 * Includes initial open files and the global read-only editor toggle.
 */
export const globalEditorDevFields: DevPanelField[] = [
  {
    key: INITIAL_OPEN_FILES_DEV_KEY,
    label: "Initial open files",
    description:
      "One file path per line (for example, index.html or styles.css). Files open in listed order; the first match is selected.",
    type: "textarea",
    rows: 4,
    markdownPreview: false,
    group: "Workspace",
  },
  {
    key: EDITOR_READ_ONLY_STORAGE_KEY,
    label: "Read only",
    description: "Lock editing in the code editor. This setting is encoded in share links.",
    type: "boolean",
    group: "Workspace",
  },
];
