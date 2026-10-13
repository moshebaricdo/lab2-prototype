/**
 * Shared Lab2 settings registry.
 *
 * Groups describe what a setting changes. A lab opts into fields; empty groups
 * are omitted. Every visible group shows a heading, including labs with one
 * field per group.
 *
 * If a lab grows past a comfortable scroll, add tabs inside the modal. Do not
 * add a side rail.
 */

export type LabSettingsProfileId =
  | "simple"
  | "chat"
  | "sketch"
  | "music"
  | "sprite"
  | "web"
  | "python";

export type LabSettingsGroupId = "general" | "editor" | "appearance" | "workspace";

export interface LabSettingsOption {
  value: string;
  label: string;
}

export interface LabSettingsField {
  key: string;
  label: string;
  group: LabSettingsGroupId;
  /** Dropdowns list options. Toggles store "On" / "Off". */
  control?: "dropdown" | "toggle";
  options?: LabSettingsOption[];
  defaultValue: string;
  helperText?: string;
  /** Live controls. Other fields stay local stubs. */
  binding?: "theme" | "pythonConsoleLayout";
}

export interface LabSettingsGroup {
  id: LabSettingsGroupId;
  label: string;
  fields: LabSettingsField[];
}

const GROUP_ORDER: LabSettingsGroupId[] = [
  "general",
  "appearance",
  "editor",
  "workspace",
];

const GROUP_LABELS: Record<LabSettingsGroupId, string> = {
  general: "General",
  editor: "Editor",
  appearance: "Appearance",
  workspace: "Workspace",
};

const languageField: LabSettingsField = {
  key: "language",
  label: "Language",
  group: "general",
  options: [{ value: "English", label: "English" }],
  defaultValue: "English",
};

const themeField: LabSettingsField = {
  key: "theme",
  label: "Theme",
  group: "appearance",
  options: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ],
  defaultValue: "light",
  binding: "theme",
};

const editorFontField: LabSettingsField = {
  key: "editorFontSize",
  label: "Text editor font size",
  group: "editor",
  options: [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
  ],
  defaultValue: "Small",
};

const consoleFontField: LabSettingsField = {
  key: "consoleFontSize",
  label: "Console font size",
  group: "editor",
  options: [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
  ],
  defaultValue: "Small",
};

const autocompleteField: LabSettingsField = {
  key: "autocomplete",
  label: "Autocomplete",
  group: "editor",
  control: "toggle",
  defaultValue: "Off",
  helperText: "Predicts and suggests the next part of the code you’re writing.",
};

const blockColorField: LabSettingsField = {
  key: "blockColorTheme",
  label: "Block color theme",
  group: "appearance",
  options: [
    { value: "Modern theme", label: "Modern theme" },
    { value: "Classic theme", label: "Classic theme" },
  ],
  defaultValue: "Modern theme",
};

const layoutField: LabSettingsField = {
  key: "layout",
  label: "Layout",
  group: "workspace",
  options: [
    { value: "Horizontal", label: "Horizontal" },
    { value: "Vertical", label: "Vertical" },
  ],
  defaultValue: "Horizontal",
  binding: "pythonConsoleLayout",
};

const PROFILE_FIELDS: Record<LabSettingsProfileId, LabSettingsField[]> = {
  simple: [languageField, themeField],
  chat: [languageField, themeField],
  sketch: [languageField, themeField],
  music: [languageField, themeField, blockColorField],
  sprite: [languageField, themeField, blockColorField],
  web: [languageField, editorFontField, autocompleteField, themeField],
  python: [
    languageField,
    editorFontField,
    consoleFontField,
    autocompleteField,
    themeField,
    layoutField,
  ],
};

export function labSettingsProfileFromPath(pathname: string): LabSettingsProfileId {
  if (pathname.includes("/pythonlab")) return "python";
  if (pathname.includes("/weblab")) return "web";
  if (pathname.includes("/sketchlab")) return "sketch";
  if (pathname.includes("/aichatlab")) return "chat";
  if (pathname.includes("/musiclab") || pathname.includes("/music-lab")) return "music";
  if (pathname.includes("/spritelab") || pathname.includes("/sprite-lab")) return "sprite";
  return "simple";
}

export function groupLabSettings(profile: LabSettingsProfileId): LabSettingsGroup[] {
  const fields = PROFILE_FIELDS[profile];
  return GROUP_ORDER.flatMap((id) => {
    const groupFields = fields.filter((field) => field.group === id);
    if (groupFields.length === 0) return [];
    return [{ id, label: GROUP_LABELS[id], fields: groupFields }];
  });
}
