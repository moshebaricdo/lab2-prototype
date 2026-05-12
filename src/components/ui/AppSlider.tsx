import { forwardRef, type CSSProperties, type InputHTMLAttributes } from "react";
import { AppButton } from "./AppButton";
import styles from "./AppSlider.module.scss";

type NativeRangeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "min" | "max" | "step" | "size" | "onChange"
>;

interface AppSliderProps extends NativeRangeProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  size?: "m" | "s";
  label?: string;
  showLabel?: boolean;
  /** Shows generated tick marks for each step when the step count is reasonable. */
  showStepper?: boolean;
  /** Shows minus/plus controls that change the value by one step. */
  showControlButtons?: boolean;
  /** Shows the current value between min/max labels. */
  showValueLabel?: boolean;
  /** Shows the current value in the top label row, matching DSCO's user input value. */
  showInputValue?: boolean;
  tone?: "black" | "brand" | "aqua" | "white";
  type?: "range" | "centered";
  valueLabel?: string;
  minLabel?: string;
  maxLabel?: string;
  stepperLabels?: string[];
  formatValue?: (value: number) => string;
  decrementAriaLabel?: string;
  incrementAriaLabel?: string;
  onValueChange: (value: number) => void;
}

function percentFromValue(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function fillBounds(value: number, min: number, max: number, type: "range" | "centered") {
  const percent = percentFromValue(value, min, max);
  if (type === "range") {
    return { percent, start: 0, end: percent };
  }
  const center = percentFromValue(0, min, max);
  return {
    percent,
    start: Math.min(center, percent),
    end: Math.max(center, percent),
  };
}

function clampValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function alignToStep(value: number, min: number, step: number) {
  const stepsFromMin = Math.round((value - min) / step);
  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return Number((min + stepsFromMin * step).toFixed(decimals));
}

function buildStepValues(min: number, max: number, step: number) {
  if (step <= 0) return [];
  const count = Math.floor((max - min) / step);
  if (count < 1 || count > 24) return [];
  return Array.from({ length: count + 1 }, (_, index) =>
    clampValue(alignToStep(min + index * step, min, step), min, max),
  );
}

function defaultFormatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export const AppSlider = forwardRef<HTMLInputElement, AppSliderProps>(
  (
    {
      value,
      min,
      max,
      step = 1,
      size = "m",
      label,
      showLabel = Boolean(label),
      showStepper = false,
      showControlButtons = false,
      showValueLabel,
      showInputValue = false,
      tone = "black",
      type = "range",
      valueLabel,
      minLabel,
      maxLabel,
      stepperLabels,
      formatValue,
      decrementAriaLabel = "Decrease value",
      incrementAriaLabel = "Increase value",
      onValueChange,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const { percent, start, end } = fillBounds(value, min, max, type);
    const resolvedValueLabel =
      valueLabel ?? formatValue?.(value) ?? defaultFormatValue(value);
    const shouldShowValueLabel = showValueLabel === true;
    const showLabels = Boolean(shouldShowValueLabel || minLabel || maxLabel);
    const showTopRow = showLabel || showInputValue;
    const stepValues = showStepper ? buildStepValues(min, max, step) : [];
    const stepperHasLabels = stepValues.some((_, index) => stepperLabels?.[index]);
    const { "aria-label": ariaLabel, ...inputProps } = props;
    const inputAriaLabel = ariaLabel ?? label;
    const setNextValue = (nextValue: number) => {
      onValueChange(clampValue(alignToStep(nextValue, min, step), min, max));
    };

    return (
      <div
        className={[
          styles.root,
          size === "s" ? styles.sizeS : "",
          styles[`tone${tone[0].toUpperCase()}${tone.slice(1)}`],
          type === "centered" ? styles.centered : "",
          showControlButtons ? styles.withControls : "",
          disabled ? styles.disabled : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          "--slider-percent": `${percent}%`,
          "--slider-fill-start": `${start}%`,
          "--slider-fill-end": `${end}%`,
        } as CSSProperties}
      >
        {showTopRow ? (
          <div className={styles.labelRow}>
            <div className={styles.labelTrack}>
              <span className={styles.label}>{showLabel ? label : null}</span>
              {showInputValue ? (
                <span className={styles.inputValue}>{resolvedValueLabel}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={styles.controlRow}>
          {showControlButtons ? (
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="minus"
              disabled={disabled || value <= min}
              onClick={() => setNextValue(value - step)}
              aria-label={decrementAriaLabel}
              className={styles.controlButton}
            />
          ) : null}
          <div className={styles.trackWrap}>
            <input
              ref={ref}
              type="range"
              className={styles.input}
              value={value}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              onChange={(event) => onValueChange(Number(event.target.value))}
              aria-label={inputAriaLabel}
              {...inputProps}
            />
          </div>
          {showControlButtons ? (
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              iconName="plus"
              disabled={disabled || value >= max}
              onClick={() => setNextValue(value + step)}
              aria-label={incrementAriaLabel}
              className={styles.controlButton}
            />
          ) : null}
        </div>
        {stepValues.length > 0 ? (
          <div className={styles.stepperRow}>
            {showControlButtons ? <span className={styles.sideSpacer} /> : null}
            <div className={styles.stepper} aria-hidden="true">
              {stepValues.map((stepValue, index) => (
                <span
                  key={stepValue}
                  className={[
                    styles.stepItem,
                    stepValue <= value ? styles.stepMarkActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      "--step-position": `${percentFromValue(stepValue, min, max)}%`,
                    } as CSSProperties
                  }
                >
                  <span className={styles.stepMark} />
                  {stepperHasLabels ? (
                    <span className={styles.stepLabel}>
                      {stepperLabels?.[index] ?? ""}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
            {showControlButtons ? <span className={styles.sideSpacer} /> : null}
          </div>
        ) : null}
        {showLabels ? (
          <div className={styles.labelsRow}>
            {showControlButtons ? <span className={styles.sideSpacer} /> : null}
            <div className={styles.labels}>
              <span className={styles.edgeLabel}>{minLabel}</span>
              {shouldShowValueLabel ? (
                <span className={styles.valueLabel}>{resolvedValueLabel}</span>
              ) : null}
              <span className={styles.edgeLabel}>{maxLabel}</span>
            </div>
            {showControlButtons ? <span className={styles.sideSpacer} /> : null}
          </div>
        ) : null}
      </div>
    );
  },
);

AppSlider.displayName = "AppSlider";
