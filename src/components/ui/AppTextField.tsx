import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { FaIcon, type FaIconSize } from "./icons/FaIcon";
import type { FaIconName } from "../../icons/faProRegularCodepoints";
import styles from "./AppTextField.module.scss";

type AppTextFieldSize = "l" | "m" | "s";
type AppTextFieldTone = "black" | "gray" | "white";
type AppTextFieldAppearance = "field" | "bare";

const SIZE_CLASS: Record<AppTextFieldSize, string> = {
  l: styles.sizeL,
  m: "",
  s: styles.sizeS,
};

const TONE_CLASS: Record<AppTextFieldTone, string> = {
  black: "",
  gray: styles.toneGray,
  white: styles.toneWhite,
};

const HELPER_ICON_SIZE: Record<AppTextFieldSize, FaIconSize> = {
  l: "m",
  m: "s",
  s: "xs",
};

interface AppTextControlBaseProps {
  label?: ReactNode;
  helperText?: ReactNode;
  helperIconName?: FaIconName;
  errorText?: ReactNode;
  size?: AppTextFieldSize;
  tone?: AppTextFieldTone;
  fullWidth?: boolean;
  appearance?: AppTextFieldAppearance;
  controlClassName?: string;
}

interface AppTextFieldProps
  extends AppTextControlBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {}

interface AppTextAreaProps
  extends AppTextControlBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {}

function isAriaInvalid(value: AppTextFieldProps["aria-invalid"]) {
  return value === true || value === "true";
}

function mergeDescribedBy(...ids: Array<string | undefined>) {
  return ids.filter(Boolean).join(" ") || undefined;
}

function renderHelper({
  describedById,
  errorText,
  helperIconName,
  helperText,
  size,
}: {
  describedById?: string;
  errorText?: ReactNode;
  helperIconName?: FaIconName;
  helperText?: ReactNode;
  size: AppTextFieldSize;
}) {
  const message = errorText ?? helperText;
  if (!message) return null;

  const iconName = errorText ? "circle-exclamation" : helperIconName;

  return (
    <div
      id={describedById}
      className={styles.helper}
      role={errorText ? "alert" : undefined}
    >
      {iconName ? (
        <span className={styles.helperIcon}>
          <FaIcon name={iconName} size={HELPER_ICON_SIZE[size]} />
        </span>
      ) : null}
      <span className={styles.helperText}>{message}</span>
    </div>
  );
}

function getRootClassName({
  appearance,
  className,
  disabled,
  fullWidth,
  invalid,
  readOnly,
  size,
  tone,
}: {
  appearance: AppTextFieldAppearance;
  className: string;
  disabled?: boolean;
  fullWidth: boolean;
  invalid: boolean;
  readOnly?: boolean;
  size: AppTextFieldSize;
  tone: AppTextFieldTone;
}) {
  return [
    appearance === "bare" ? styles.bareRoot : styles.root,
    SIZE_CLASS[size],
    TONE_CLASS[tone],
    fullWidth ? "" : styles.widthAuto,
    invalid ? styles.invalid : "",
    disabled ? styles.disabled : "",
    readOnly ? styles.readOnly : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function getControlClassName({
  appearance,
  className,
  type,
}: {
  appearance: AppTextFieldAppearance;
  className: string;
  type: "input" | "textarea";
}) {
  return [
    styles.control,
    type === "input" ? styles.input : styles.textarea,
    appearance === "bare" ? styles.bareControl : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export const AppTextField = forwardRef<HTMLInputElement, AppTextFieldProps>(
  (
    {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      appearance = "field",
      className = "",
      controlClassName = "",
      disabled,
      errorText,
      fullWidth = true,
      helperIconName,
      helperText,
      id,
      label,
      readOnly,
      size = "m",
      tone = "black",
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const controlId = id ?? (label ? generatedId : undefined);
    const helperId = useId();
    const hasHelper = Boolean(errorText ?? helperText);
    const invalid = Boolean(errorText) || isAriaInvalid(ariaInvalid);

    return (
      <div
        className={getRootClassName({
          appearance,
          className,
          disabled,
          fullWidth,
          invalid,
          readOnly,
          size,
          tone,
        })}
      >
        {label ? (
          <label className={styles.label} htmlFor={controlId}>
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={controlId}
          type={type}
          className={getControlClassName({
            appearance,
            className: controlClassName,
            type: "input",
          })}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={mergeDescribedBy(
            ariaDescribedBy,
            hasHelper ? helperId : undefined,
          )}
          {...props}
        />
        {renderHelper({
          describedById: hasHelper ? helperId : undefined,
          errorText,
          helperIconName,
          helperText,
          size,
        })}
      </div>
    );
  },
);

AppTextField.displayName = "AppTextField";

export const AppTextArea = forwardRef<HTMLTextAreaElement, AppTextAreaProps>(
  (
    {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      appearance = "field",
      className = "",
      controlClassName = "",
      disabled,
      errorText,
      fullWidth = true,
      helperIconName,
      helperText,
      id,
      label,
      readOnly,
      size = "m",
      tone = "black",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const controlId = id ?? (label ? generatedId : undefined);
    const helperId = useId();
    const hasHelper = Boolean(errorText ?? helperText);
    const invalid = Boolean(errorText) || isAriaInvalid(ariaInvalid);

    return (
      <div
        className={getRootClassName({
          appearance,
          className,
          disabled,
          fullWidth,
          invalid,
          readOnly,
          size,
          tone,
        })}
      >
        {label ? (
          <label className={styles.label} htmlFor={controlId}>
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={controlId}
          className={getControlClassName({
            appearance,
            className: controlClassName,
            type: "textarea",
          })}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={mergeDescribedBy(
            ariaDescribedBy,
            hasHelper ? helperId : undefined,
          )}
          {...props}
        />
        {renderHelper({
          describedById: hasHelper ? helperId : undefined,
          errorText,
          helperIconName,
          helperText,
          size,
        })}
      </div>
    );
  },
);

AppTextArea.displayName = "AppTextArea";

export type {
  AppTextAreaProps,
  AppTextFieldAppearance,
  AppTextFieldProps,
  AppTextFieldSize,
  AppTextFieldTone,
};
