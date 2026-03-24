import svgPaths from "./svg-g2tus43zbw";

export default function AiSupportIndicator() {
  return (
    <div className="relative size-full" data-name="AI Support Indicator">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 53 24">
        <g id="AI Support Indicator">
          <rect fill="var(--fill-0, #F0F2F5)" height="24" rx="4" width="52.1755" />
          <path d={svgPaths.p638c3f0} fill="var(--fill-0, #69788A)" id="icon" />
          <g clipPath="url(#clip0_20_1990)" id="Dial">
            <path d={svgPaths.p37b77280} fill="var(--fill-0, #C6CED6)" id="Track" />
            <path d={svgPaths.p3c038200} fill="var(--fill-0, #29DDD6)" id="Fill" />
            <path d={svgPaths.p21f40a00} fill="var(--fill-0, #768699)" id="Knob" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_20_1990">
            <rect fill="white" height="12.6097" transform="translate(24 5.69515)" width="20.1755" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}