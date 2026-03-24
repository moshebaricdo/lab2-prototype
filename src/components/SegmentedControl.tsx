import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * SegmentedControl - A reusable segmented button group component
 * 
 * @example
 * ```tsx
 * import { faCode, faEye, faColumns } from "@fortawesome/free-solid-svg-icons";
 * 
 * const options = [
 *   { value: "code", label: "Code", icon: faCode },
 *   { value: "preview", label: "Preview", icon: faEye },
 *   { value: "split", label: "Split View", icon: faColumns },
 * ];
 * 
 * <SegmentedControl
 *   options={options}
 *   value={currentValue}
 *   onChange={setValue}
 * />
 * ```
 */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon: IconDefinition;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0">
      {options.map((option, index) => {
        const isActive = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        // Determine border radius classes
        let roundedClass = "";
        if (isFirst && isLast) {
          roundedClass = "rounded-[4px]";
        } else if (isFirst) {
          roundedClass = "rounded-bl-[4px] rounded-tl-[4px]";
        } else if (isLast) {
          roundedClass = "rounded-br-[4px] rounded-tr-[4px]";
        } else {
          roundedClass = "rounded-[0px]";
        }

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`box-border content-stretch flex gap-[8px] items-center justify-center min-w-[24px] mr-[-1px] px-[8px] py-[2px] relative shrink-0 transition-colors ${roundedClass} ${
              isActive
                ? "bg-[#0093a4] hover:bg-[#007785]"
                : "bg-white hover:bg-[#dfe3e9]"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2`}
          >
            {/* Border overlay */}
            <div
              aria-hidden="true"
              className={`absolute border border-solid inset-0 pointer-events-none ${roundedClass} ${
                isActive ? "border-[#0093a4]" : "border-[#b7c1cb]"
              }`}
            />
            
            {/* Icon */}
            <div
              className={`flex flex-col justify-center leading-[0] relative shrink-0 text-[13px] text-center w-[16px] ${
                isActive ? "text-white" : "text-[#292f36]"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <FontAwesomeIcon icon={option.icon} className="leading-[1.25]" />
            </div>
            
            {/* Label */}
            <p
              className={`leading-[19.68px] not-italic relative shrink-0 text-[12px] text-nowrap whitespace-pre ${
                isActive ? "text-white" : "text-[#292f36]"
              }`}
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {option.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
