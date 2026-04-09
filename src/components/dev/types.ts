export type DevPanelFieldType =
  | "text"
  | "textarea"
  | "number"
  | "slider"
  | "boolean"
  | "select";

export interface DevPanelFieldBase {
  key: string;
  label: string;
  group?: string;
}

export interface DevPanelTextField extends DevPanelFieldBase {
  type: "text";
}

export interface DevPanelTextareaField extends DevPanelFieldBase {
  type: "textarea";
  rows?: number;
}

export interface DevPanelNumberField extends DevPanelFieldBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface DevPanelSliderField extends DevPanelFieldBase {
  type: "slider";
  min: number;
  max: number;
  step?: number;
}

export interface DevPanelBooleanField extends DevPanelFieldBase {
  type: "boolean";
}

export interface DevPanelSelectField extends DevPanelFieldBase {
  type: "select";
  options: { label: string; value: string }[];
  /** When "number", the selected string value is coerced to a number before writing. */
  valueType?: "string" | "number";
}

export type DevPanelField =
  | DevPanelTextField
  | DevPanelTextareaField
  | DevPanelNumberField
  | DevPanelSliderField
  | DevPanelBooleanField
  | DevPanelSelectField;
