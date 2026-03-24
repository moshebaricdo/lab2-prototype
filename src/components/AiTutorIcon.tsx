import svgPaths from "../imports/svg-oc64z9syjk";

interface AiTutorIconProps {
  className?: string;
  color?: string;
}

export function AiTutorIcon({ 
  className = "w-5 h-5", 
  color = "#69788a" 
}: AiTutorIconProps) {
  return (
    <div 
      className={`${className} flex items-center justify-center shrink-0`}
      style={{ "--fill-0": color } as React.CSSProperties}
    >
      <svg 
        className="block size-full" 
        fill="none" 
        preserveAspectRatio="xMidYMid meet" 
        viewBox="0 0 25 25"
      >
        <path 
          d={svgPaths.p118eff80} 
          fill="var(--fill-0, #69788A)" 
        />
      </svg>
    </div>
  );
}
