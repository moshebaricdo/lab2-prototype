import type {
  AppButtonProps,
  ButtonSize,
  ButtonTone,
  ButtonVariant,
  FaIconName,
} from "../../ui/AppButton";

export type DevPanelFieldType =
  | "text"
  | "textarea"
  | "number"
  | "slider"
  | "boolean"
  | "select"
  | "file"
  | "action";

export type DevPanelFieldValues = Record<string, unknown>;

export interface DevPanelUploadedFile {
  name: string;
  path: string;
  type: string;
  size: number;
  content: string;
}

export interface DevPanelFieldBase {
  key: string;
  label: string;
  description?: string;
  group?: string;
  /** URL-backed by default. Use session for values that should not be share-linked. */
  storage?: "url" | "session";
  /** Hide fields that only apply when another control is enabled. */
  visibleWhen?: (values: DevPanelFieldValues) => boolean;
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

export interface DevPanelFileField extends DevPanelFieldBase {
  type: "file";
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
  buttonLabel?: string;
  maxFiles?: number;
  maxTotalSizeBytes?: number;
}

export interface DevPanelActionField extends DevPanelFieldBase {
  type: "action";
  buttonLabel?: string;
  iconName?: FaIconName;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
  onAction: AppButtonProps["onClick"];
}

export type DevPanelField =
  | DevPanelTextField
  | DevPanelTextareaField
  | DevPanelNumberField
  | DevPanelSliderField
  | DevPanelBooleanField
  | DevPanelSelectField
  | DevPanelFileField
  | DevPanelActionField;
