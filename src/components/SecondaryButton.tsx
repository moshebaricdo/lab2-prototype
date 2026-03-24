import { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children?: ReactNode;
}

export function SecondaryButton({ icon, children, className = '', disabled, ...props }: SecondaryButtonProps) {
  const hasText = !!children;
  
  return (
    <button
      className={`
        ${hasText ? 'min-w-[24px] px-[8px] py-[2px] gap-[4px]' : 'h-[24px] w-[24px] p-[4px]'}
        rounded-[4px] bg-white
        flex items-center justify-center
        relative
        transition-colors
        ${disabled 
          ? 'cursor-not-allowed' 
          : 'hover:bg-[#dfe3e9] active:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2'
        }
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <div 
        aria-hidden="true" 
        className={`absolute border border-solid inset-0 pointer-events-none rounded-[4px] ${
          disabled ? 'border-[#d4dae1]' : 'border-[#b7c1cb]'
        }`} 
      />
      <div className={`flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center w-[16px] ${
        disabled ? 'text-[#d4dae1]' : 'text-[#292f36]'
      }`}>
        <div className="leading-[1.25] [&_svg]:w-[14px] [&_svg]:h-[14px]">
          {icon}
        </div>
      </div>
      {children && (
        <p className={`basis-0 font-semibold grow leading-[19.68px] min-h-px min-w-px not-italic relative shrink-0 text-[12px] text-center ${
          disabled ? 'text-[#d4dae1]' : 'text-[#292f36]'
        }`}>
          {children}
        </p>
      )}
    </button>
  );
}
