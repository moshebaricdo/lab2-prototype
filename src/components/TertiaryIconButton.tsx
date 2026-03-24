import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

interface TertiaryIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
}

export const TertiaryIconButton = forwardRef<
  HTMLButtonElement,
  TertiaryIconButtonProps
>(({ icon, className = "", disabled, ...props }, ref) => {
  // Filter out Figma-specific props that shouldn't be passed to DOM elements
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    ...domProps
  } = props as any;

  return (
    <button
      ref={ref}
      className={`
        w-7 h-7 flex items-center justify-center rounded
        transition-colors
        text-[13px]
        ${
          disabled
            ? "cursor-not-allowed text-[#d4dae1]"
            : "hover:bg-[#d4dae1] active:bg-[#d4dae1] active:text-[#576575] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-0 text-[#69788a]"
        }
        ${className}
      `}
      disabled={disabled}
      {...domProps}
    >
      {icon}
    </button>
  );
});

TertiaryIconButton.displayName = "TertiaryIconButton";